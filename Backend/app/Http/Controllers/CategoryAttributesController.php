<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryAttribute;
use App\Http\Requests\SyncCategoryAttributesRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryAttributesController extends Controller
{
    /* -----------------------------------------------------------------
     | ACTIVITY LOG (Spatie) — Attributes
     | log_name: categories
     ------------------------------------------------------------------*/
    private function logCategoryAttributesActivity(string $event, Category $category, string $description, array $properties = []): void
    {
        try {
            activity('categories')
                ->causedBy(Auth::user())
                ->performedOn($category)
                ->event($event)
                ->withProperties(array_merge([
                    'action' => $event,
                    'category' => [
                        'id'   => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                    ],
                ], $properties))
                ->log($description);
        } catch (\Throwable $e) {
            Log::warning('Échec du journal d’activité (attributs de catégorie)', [
                'event'       => $event,
                'category_id' => $category->id ?? null,
                'error'       => $e->getMessage(),
            ]);
        }
    }

    private function snapshotAttribute(CategoryAttribute $attribute): array
    {
        $attribute->loadMissing('options');

        $rules = $attribute->validation_rules;
        if (is_string($rules)) {
            $decoded = json_decode($rules, true);
            $rules = is_array($decoded) ? $decoded : $rules;
        }

        return [
            'id'              => $attribute->id,
            'category_id'     => $attribute->category_id,
            'name'            => $attribute->name,
            'slug'            => $attribute->slug,
            'type'            => $attribute->type,
            'unit'            => $attribute->unit,
            'description'     => $attribute->description,
            'is_required'     => (bool) $attribute->is_required,
            'is_filterable'   => (bool) $attribute->is_filterable,
            'is_searchable'   => (bool) $attribute->is_searchable,
            'show_in_listing' => (bool) $attribute->show_in_listing,
            'is_active'       => (bool) $attribute->is_active,
            'sort_order'      => (int) ($attribute->sort_order ?? 0),
            'default_value'   => $attribute->default_value,
            'validation_rules'=> $rules,
            'options'         => $attribute->options
                ? $attribute->options->map(fn ($o) => [
                    'id'         => $o->id,
                    'label'      => $o->label,
                    'value'      => $o->value,
                    'color'      => $o->color,
                    'is_active'  => (bool) $o->is_active,
                    'sort_order' => (int) ($o->sort_order ?? 0),
                ])->values()->all()
                : [],
        ];
    }

    /**
     * (Optionnel) si tu veux chiffrer un diff (ex: valeurs sensibles)
     * Laisse $sensitiveKeys vide => aucun chiffrement.
     */
    private function encryptSensitiveDiff(array $before, array $after, array $sensitiveKeys = []): ?string
    {
        if (empty($sensitiveKeys)) return null;

        $b = [];
        $a = [];

        foreach ($sensitiveKeys as $k) {
            if (array_key_exists($k, $before)) $b[$k] = $before[$k];
            if (array_key_exists($k, $after))  $a[$k] = $after[$k];
        }

        if (empty($b) && empty($a)) return null;

        try {
            return Crypt::encryptString(json_encode(['before' => $b, 'after' => $a], JSON_UNESCAPED_UNICODE));
        } catch (\Throwable) {
            return null;
        }
    }

    public function edit(Category $category): Response
    {
        $category->load('attributes.options');

        // ✅ évite la collision Eloquent "attributes"
        $attrs = $category->getRelation('attributes')->map(function ($a) {
            if (is_string($a->validation_rules)) {
                $a->validation_rules = json_decode($a->validation_rules, true) ?? [];
            }
            return $a;
        });

        return Inertia::render('Categories/Attributes/Edit', [
            'category'   => ['id' => $category->id, 'name' => $category->name],
            'attributes' => $attrs,
        ]);
    }

    public function sync(SyncCategoryAttributesRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();

        // SNAPSHOT AVANT (pour log)
        $before = $category->attributes()->with('options')->orderBy('id')->get()
            ->map(fn (CategoryAttribute $a) => $this->snapshotAttribute($a))
            ->values()
            ->all();

        $beforeIds = collect($before)->pluck('id')->filter()->values()->all();

        try {
            DB::transaction(function () use ($category, $validated) {
                $sent     = collect($validated['attributes'] ?? []);
                $existing = $category->attributes()->with('options')->get();

                // delete missing
                $sentIds = $sent->pluck('id')->filter()->values();
                $existing->whereNotIn('id', $sentIds)->each(function ($attr) {
                    $attr->options()->delete();
                    $attr->delete();
                });

                // upsert
                foreach ($sent as $index => $attr) {
                    if (!empty($attr['id'])) {
                        $attribute = CategoryAttribute::with('options')->find($attr['id']);
                        if ($attribute && (int) $attribute->category_id === (int) $category->id) {
                            $this->applyAttributeUpdate($attribute, $attr, $index);
                        }
                    } else {
                        $this->createAttribute($category, $attr, $index);
                    }
                }
            });

            // SNAPSHOT APRÈS (pour log)
            $after = $category->attributes()->with('options')->orderBy('id')->get()
                ->map(fn (CategoryAttribute $a) => $this->snapshotAttribute($a))
                ->values()
                ->all();

            $afterIds = collect($after)->pluck('id')->filter()->values()->all();

            $createdIds = array_values(array_diff($afterIds, $beforeIds));
            $deletedIds = array_values(array_diff($beforeIds, $afterIds));

            $props = [
                'attributes_update_summary' => [
                    'before_count' => count($beforeIds),
                    'after_count'  => count($afterIds),
                    'created_ids'  => $createdIds,
                    'deleted_ids'  => $deletedIds,
                ],
                'before' => $before,
                'after'  => $after,
            ];

            // (optionnel) chiffrement (désactivé par défaut)
            $sensitiveKeys = []; // ex: ['default_value']
            $encrypted = $this->encryptSensitiveDiff(
                ['attributes' => $before],
                ['attributes' => $after],
                $sensitiveKeys
            );
            if ($encrypted) {
                $props['sensitive_encrypted'] = $encrypted;
            }

            $this->logCategoryAttributesActivity(
                'attributes_synced',
                $category,
                "Attributs synchronisés : {$category->name}",
                $props
            );

            return redirect()
                ->route('categories.show', $category->id)
                ->with('success', 'Attributs mis à jour avec succès.');
        } catch (\Throwable $e) {
            $context = [
                'category_id' => $category->id,
                'message'     => $e->getMessage(),
                'exception'   => get_class($e),
            ];

            if (config('app.debug')) {
                $context['trace'] = $e->getTraceAsString();
            }

            Log::error('Error syncing attributes', $context);

            return back()->withErrors([
                'error' => 'Une erreur est survenue lors de la mise à jour des attributs.',
            ]);
        }
    }

    // --- helpers attributs ---
    private function createAttribute(Category $category, array $attr, int $index): void
    {
        $attribute = $category->attributes()->create([
            'name'            => $attr['name'],
            'slug'            => $attr['slug'] ?: Str::slug($attr['name']),
            'type'            => $attr['type'],
            'unit'            => $attr['unit'] ?? null,
            'description'     => $attr['description'] ?? null,
            'is_required'     => (bool)($attr['is_required'] ?? false),
            'is_filterable'   => (bool)($attr['is_filterable'] ?? false),
            'is_searchable'   => (bool)($attr['is_searchable'] ?? false),
            'show_in_listing' => (bool)($attr['show_in_listing'] ?? false),
            'is_active'       => (bool)($attr['is_active'] ?? true),
            'sort_order'      => $attr['sort_order'] ?? $index,
            'default_value'   => $attr['default_value'] ?? null,
            'validation_rules'=> is_array($attr['validation_rules'] ?? null)
                ? json_encode($attr['validation_rules'])
                : null,
        ]);

        $this->syncOptions($attribute, $attr);
    }

    private function applyAttributeUpdate(CategoryAttribute $attribute, array $attr, int $index): void
    {
        $attribute->update([
            'name'            => $attr['name'],
            'slug'            => $attr['slug'] ?: Str::slug($attr['name']),
            'type'            => $attr['type'],
            'unit'            => $attr['unit'] ?? null,
            'description'     => $attr['description'] ?? null,
            'is_required'     => (bool)($attr['is_required'] ?? false),
            'is_filterable'   => (bool)($attr['is_filterable'] ?? false),
            'is_searchable'   => (bool)($attr['is_searchable'] ?? false),
            'show_in_listing' => (bool)($attr['show_in_listing'] ?? false),
            'is_active'       => (bool)($attr['is_active'] ?? true),
            'sort_order'      => $attr['sort_order'] ?? $index,
            'default_value'   => $attr['default_value'] ?? null,
            'validation_rules'=> is_array($attr['validation_rules'] ?? null)
                ? json_encode($attr['validation_rules'])
                : null,
        ]);

        $this->syncOptions($attribute, $attr);
    }

    private function syncOptions(CategoryAttribute $attribute, array $attr): void
    {
        if (!in_array($attr['type'], ['select', 'multiselect'], true)) {
            $attribute->options()->delete();
            return;
        }

        $sent = collect($attr['options'] ?? []);

        // delete missing
        $sentIds = $sent->pluck('id')->filter()->values();
        $attribute->options()->whereNotIn('id', $sentIds)->delete();

        // upsert
        foreach ($sent as $i => $opt) {
            if (empty($opt['label'])) continue;

            $payload = [
                'label'      => $opt['label'],
                'value'      => $opt['value'] ?: Str::slug($opt['label']),
                'color'      => $opt['color'] ?? null,
                'is_active'  => (bool)($opt['is_active'] ?? true),
                'sort_order' => $opt['sort_order'] ?? $i,
            ];

            if (!empty($opt['id'])) {
                $existing = $attribute->options()->whereKey($opt['id'])->first();
                if ($existing) {
                    $existing->update($payload);
                } else {
                    $attribute->options()->create($payload);
                }
            } else {
                $attribute->options()->create($payload);
            }
        }
    }
}
