<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryAttribute;
use App\Http\Requests\CategoryRequest;
use App\Http\Requests\SyncCategoryAttributesRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /* -----------------------------------------------------------------
     | ACTIVITY LOG (Spatie)
     ------------------------------------------------------------------*/
    private function logCategoryActivity(string $event, Category $category, string $description, array $properties = []): void
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
            // Ne jamais bloquer le métier si l'audit échoue
            Log::warning('Échec du journal d’activité (catégories)', [
                'event' => $event,
                'category_id' => $category->id ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function snapshotCategory(Category $category): array
    {
        return $category->only([
            'name',
            'slug',
            'parent_id',
            'icon',
            'description',
            'is_active',
            'sort_order',
            'meta_title',
            'meta_description',
            'image_path',
            'type',
            'visibility',
        ]);
    }

    private function snapshotAttribute(CategoryAttribute $attribute): array
    {
        $attribute->loadMissing('options');

        // si validation_rules est stocké en JSON string, on le met en array lisible
        $rules = $attribute->validation_rules;
        if (is_string($rules)) {
            $decoded = json_decode($rules, true);
            $rules = is_array($decoded) ? $decoded : $rules;
        }

        return [
            'id'              => $attribute->id,
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

    /* -----------------------------------------------------------------
     | LISTE
     ------------------------------------------------------------------*/
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search'    => ['nullable', 'string', 'max:255'],
            'parent_id' => ['nullable', 'string', 'max:20'], // "root" ou un id
            'status'    => ['nullable', 'in:active,inactive,all'],
            'per_page'  => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $perPage = $filters['per_page'] ?? 15;

        $query = Category::query()
            ->with([
                'parent',
                'children',
                'creator:id,name',
            ])
            ->withCount(['products']);

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('meta_title', 'like', "%{$search}%")
                    ->orWhere('meta_description', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['parent_id'])) {
            if ($filters['parent_id'] === 'root') {
                $query->whereNull('parent_id');
            } elseif (ctype_digit((string) $filters['parent_id'])) {
                $query->where('parent_id', (int) $filters['parent_id']);
            }
        }

        // ✅ Statut métier (is_active)
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            if ($filters['status'] === 'active') {
                $query->where('is_active', true);
            } elseif ($filters['status'] === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $categories = $query
            ->withTrashed()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->appends($request->all());

        $categories->getCollection()->transform(function (Category $category) {
            $category->image_url = $category->getImageUrl();
            return $category;
        });

        $parentCategories = $this->buildParentOptions();

        return Inertia::render('Categories/Index', [
            'categories'       => $categories,
            'filters'          => $request->only(['search', 'parent_id', 'status', 'per_page']),
            'parentCategories' => $parentCategories->map(fn ($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'level'          => $c->level,
                'indented_name'  => $c->indented_name,
                'full_name'      => $c->full_name,
                'has_children'   => $c->has_children,
            ]),
        ]);
    }

    /* -----------------------------------------------------------------
     | CREATE
     ------------------------------------------------------------------*/
    public function create(): Response
    {
        $availableParents = $this->buildParentOptions(true);

        return Inertia::render('Categories/Create', [
            'availableParents' => $availableParents->map(fn ($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'level'          => $c->level,
                'indented_name'  => $c->indented_name,
                'full_name'      => $c->full_name,
                'has_children'   => $c->has_children,
            ]),
            'parent' => null,
        ]);
    }

    /* -----------------------------------------------------------------
     | STORE
     ------------------------------------------------------------------*/
    public function store(CategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('categories', 'public');
        }

        try {
            $category = null;

            DB::transaction(function () use (&$validated, &$category) {
                $category = Category::create([
                    'name'             => $validated['name'],
                    'slug'             => $validated['slug'],
                    'parent_id'        => $validated['parent_id'] ?? null,
                    'icon'             => $validated['icon'] ?? null,
                    'description'      => $validated['description'] ?? null,
                    'is_active'        => $validated['is_active'] ?? true,
                    'sort_order'       => $validated['sort_order'] ?? 0,
                    'meta_title'       => $validated['meta_title'] ?? null,
                    'meta_description' => $validated['meta_description'] ?? null,
                    'image_path'       => $validated['image_path'] ?? null,
                    'type'             => $validated['type'] ?? 'default',
                    'visibility'       => $validated['visibility'] ?? 'public',
                    'created_by'       => Auth::id(),
                ]);

                $attributes = $validated['attributes'] ?? [];
                foreach ($attributes as $index => $attr) {
                    /** @var \App\Models\CategoryAttribute $attribute */
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
                            : ($attr['validation_rules'] ?? null),
                    ]);

                    if (in_array($attr['type'], ['select', 'multiselect'], true) && !empty($attr['options'])) {
                        foreach ($attr['options'] as $optIndex => $opt) {
                            $label = is_array($opt) ? ($opt['label'] ?? '') : (string)$opt;
                            if ($label === '') continue;

                            $value     = is_array($opt) ? ($opt['value'] ?? Str::slug($label)) : Str::slug((string)$opt);
                            $color     = is_array($opt) ? ($opt['color'] ?? null) : null;
                            $isActive  = is_array($opt) ? (bool)($opt['is_active'] ?? true) : true;
                            $sortOrder = is_array($opt) && array_key_exists('sort_order', $opt) ? (int)$opt['sort_order'] : $optIndex;

                            $attribute->options()->create([
                                'label'      => $label,
                                'value'      => $value,
                                'color'      => $color,
                                'is_active'  => $isActive,
                                'sort_order' => $sortOrder,
                            ]);
                        }
                    }
                }
            });

            if ($category) {
                $this->logCategoryActivity(
                    'created',
                    $category,
                    "Catégorie créée : {$category->name}",
                    [
                        'after' => $this->snapshotCategory($category->fresh()),
                        'attributes_count' => $category->attributes()->count(),
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::error('Échec de création de catégorie', ['error' => $e->getMessage()]);
            return back()->with('error', 'Une erreur est survenue lors de la création.')->withInput();
        }

        return redirect()->route('categories.index')->with('success', 'Catégorie créée avec succès.');
    }

    /* -----------------------------------------------------------------
     | EDIT
     | IMPORTANT: collision "attributes" => on utilise getRelation('attributes')
     ------------------------------------------------------------------*/
    public function edit(Category $category): Response
    {
        $category->load(['attributes.options']);
        $availableParents = $this->buildParentOptions(true, $category->id);

        // ✅ évite l’erreur Intelephense : $category->attributes (attributs internes Eloquent)
        $attrs = $category->getRelation('attributes');

        $attrs->transform(function ($attribute) {
            if (is_string($attribute->validation_rules)) {
                $attribute->validation_rules = json_decode($attribute->validation_rules, true) ?? [];
            }
            return $attribute;
        });

        return Inertia::render('Categories/Edit', [
            'category' => array_merge($category->toArray(), [
                'image_url'  => $category->getImageUrl(),
                // ✅ garantit que le front reçoit bien les attributs “relation”
                'attributes' => $attrs->toArray(),
            ]),
            'availableParents' => $availableParents->map(fn ($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'level'          => $c->level,
                'indented_name'  => $c->indented_name,
                'full_name'      => $c->full_name,
                'has_children'   => $c->has_children,
            ]),
        ]);
    }

    /* -----------------------------------------------------------------
     | UPDATE
     ------------------------------------------------------------------*/
    public function update(CategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $before = $this->snapshotCategory($category);

        // snapshot IDs attributs AVANT uniquement si on va les modifier
        $beforeAttrIds = [];
        if (array_key_exists('attributes', $validated)) {
            $beforeAttrIds = $category->attributes()->pluck('id')->all();
        }

        // Image
        if ($request->hasFile('image')) {
            if ($category->image_path && Storage::disk('public')->exists($category->image_path)) {
                Storage::disk('public')->delete($category->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('categories', 'public');
        } elseif ($request->boolean('remove_image') && $category->image_path) {
            if (Storage::disk('public')->exists($category->image_path)) {
                Storage::disk('public')->delete($category->image_path);
            }
            $validated['image_path'] = null;
        }

        try {
            DB::transaction(function () use ($category, $validated) {
                $category->update([
                    'name'             => $validated['name'],
                    'slug'             => $validated['slug'],
                    'parent_id'        => $validated['parent_id'] ?? null,
                    'icon'             => $validated['icon'] ?? null,
                    'description'      => $validated['description'] ?? null,
                    'is_active'        => $validated['is_active'] ?? true,
                    'sort_order'       => $validated['sort_order'] ?? 0,
                    'meta_title'       => $validated['meta_title'] ?? null,
                    'meta_description' => $validated['meta_description'] ?? null,
                    'image_path'       => array_key_exists('image_path', $validated) ? $validated['image_path'] : $category->image_path,
                    'type'             => $validated['type'] ?? ($category->type ?? 'default'),
                    'visibility'       => $validated['visibility'] ?? ($category->visibility ?? 'public'),
                ]);

                // Synchro attributs si envoyés
                if (array_key_exists('attributes', $validated)) {
                    $sentAttributes     = collect($validated['attributes'] ?? []);
                    $existingAttributes = $category->attributes()->with('options')->get();

                    // Supprimer ceux retirés
                    $sentIds = $sentAttributes->filter(fn ($attr) => isset($attr['id']))->pluck('id');
                    $existingAttributes->whereNotIn('id', $sentIds)->each(function ($attr) {
                        $attr->options()->delete();
                        $attr->delete();
                    });

                    foreach ($sentAttributes as $index => $attrData) {
                        if (!empty($attrData['id'])) {
                            $attribute = CategoryAttribute::with('options')->find($attrData['id']);
                            if ($attribute && (int)$attribute->category_id === (int)$category->id) {
                                $this->applyAttributeUpdate($attribute, $attrData, $index);
                            }
                        } else {
                            $this->createAttribute($category, $attrData, $index);
                        }
                    }
                }
            });

            $after = $this->snapshotCategory($category->fresh());

            $changedFields = [];
            foreach ($after as $k => $v) {
                if (($before[$k] ?? null) !== $v) {
                    $changedFields[] = $k;
                }
            }

            $props = [
                'before' => $before,
                'after'  => $after,
                'changed_fields' => $changedFields,
            ];

            if (array_key_exists('attributes', $validated)) {
                $afterAttrIds = $category->attributes()->pluck('id')->all();

                $props['attributes_update_summary'] = [
                    'before_count' => count($beforeAttrIds),
                    'after_count'  => count($afterAttrIds),
                    'created_ids'  => array_values(array_diff($afterAttrIds, $beforeAttrIds)),
                    'deleted_ids'  => array_values(array_diff($beforeAttrIds, $afterAttrIds)),
                ];
            }

            $this->logCategoryActivity(
                'updated',
                $category,
                "Catégorie mise à jour : {$category->name}",
                $props
            );
        } catch (\Throwable $e) {
            $context = [
                'category_id' => $category->id,
                'error'       => $e->getMessage(),
                'exception'   => get_class($e),
            ];

            if (config('app.debug')) {
                $context['trace'] = $e->getTraceAsString();
            }

            Log::error('Échec de mise à jour de catégorie', $context);
            return back()->with('error', 'Une erreur est survenue lors de la mise à jour.')->withInput();
        }

        return redirect()->route('categories.show', $category)->with('success', 'Catégorie mise à jour avec succès.');
    }

    /* -----------------------------------------------------------------
     | SHOW
     ------------------------------------------------------------------*/
    public function show(Category $category): Response
    {
        $category->load(['parent', 'children', 'attributes.options', 'creator:id,name']);

        $products = $category->products()
            ->with(['brand', 'currency'])
            ->where('is_active', true)
            ->paginate(12);

        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        return Inertia::render('Categories/Show', [
            'category' => array_merge($category->toArray(), [
                'image_url' => $category->getImageUrl(),
                'full_name' => $category->getFullName(),
                'depth'     => $category->getDepth(),
            ]),
            'products' => $products,
            'can' => [
                // ✅ policies
                'update' => Gate::allows('update', $category),
                'delete' => Gate::allows('delete', $category),
                'create' => Gate::allows('create', Category::class),

                // ✅ permission Spatie (pas Gate::allows('category_edit') sinon tu n’as pas de Gate/policy associée)
                'category_edit' => $user?->can('category_edit') ?? false,
            ],
        ]);
    }

    /* -----------------------------------------------------------------
     | TOGGLE STATUS (is_active) - comme Employees
     ------------------------------------------------------------------*/
    public function toggleStatus(Category $category): RedirectResponse
    {
        if ($category->trashed()) {
            return back()->with('error', 'Impossible de modifier le statut d’une catégorie supprimée. Restaure-la d’abord.');
        }

        $before = (bool) $category->is_active;

        $category->update([
            'is_active' => !$before,
        ]);

        $after = (bool) $category->fresh()->is_active;

        $this->logCategoryActivity(
            'status_toggled',
            $category,
            "Statut catégorie modifié : {$category->name} (" . ($before ? 'Actif' : 'Inactif') . " → " . ($after ? 'Actif' : 'Inactif') . ")",
            [
                'is_active_before' => $before,
                'is_active_after'  => $after,
            ]
        );

        return back()->with('success', 'Statut de la catégorie mis à jour.');
    }

    /* -----------------------------------------------------------------
     | DESTROY (soft delete) + passe inactive avant, comme Employees
     ------------------------------------------------------------------*/
    public function destroy(Category $category): RedirectResponse
    {
        if ($category->products()->count() > 0) {
            return back()->with('error', 'Impossible de supprimer une catégorie contenant des produits.');
        }
        if ($category->children()->count() > 0) {
            return back()->with('error', 'Impossible de supprimer une catégorie ayant des sous-catégories.');
        }

        $wasActive = (bool) $category->is_active;

        if ($category->is_active) {
            $category->is_active = false;
            $category->save();
        }

        $category->delete();

        $this->logCategoryActivity(
            'deleted',
            $category,
            "Catégorie supprimée (soft) : {$category->name}",
            [
                'was_active_before_delete' => $wasActive,
                'is_active_after' => (bool) $category->is_active,
            ]
        );

        return back()->with('success', 'Catégorie supprimée.');
    }

    public function restore($id): RedirectResponse
    {
        $category = Category::withTrashed()->findOrFail($id);
        $category->restore();

        $this->logCategoryActivity(
            'restored',
            $category,
            "Catégorie restaurée : {$category->name}"
        );

        return back()->with('success', 'Catégorie restaurée.');
    }

    public function forceDelete($id): RedirectResponse
    {
        $category = Category::withTrashed()->findOrFail($id);

        if ($category->products()->withTrashed()->count() > 0) {
            return back()->with('error', 'Impossible de supprimer définitivement une catégorie ayant des produits.');
        }

        $snapshot = $this->snapshotCategory($category);

        $imageDeleted = false;
        if ($category->image_path && Storage::disk('public')->exists($category->image_path)) {
            Storage::disk('public')->delete($category->image_path);
            $imageDeleted = true;
        }

        // log AVANT forceDelete
        $this->logCategoryActivity(
            'force_deleted',
            $category,
            "Catégorie supprimée définitivement : {$category->name}",
            [
                'snapshot' => $snapshot,
                'image_deleted' => $imageDeleted,
            ]
        );

        $category->forceDelete();

        return back()->with('success', 'Catégorie supprimée définitivement.');
    }

    /* -----------------------------------------------------------------
     | ATTRIBUTES (page)
     ------------------------------------------------------------------*/
    public function attributes(Category $category): Response
    {
        $attributes = $category->attributes()
            ->with('options')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Categories/Attributes', [
            'category'   => $category,
            'attributes' => $attributes,
        ]);
    }

    /* -----------------------------------------------------------------
     | STORE ATTRIBUTE (endpoint granulaire) + LOG
     ------------------------------------------------------------------*/
    public function storeAttribute(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'slug'                => 'nullable|string|max:255|unique:category_attributes,slug,NULL,id,category_id,' . $category->id,
            'type'                => 'required|in:text,textarea,number,decimal,boolean,select,multiselect,date,url,email,json',
            'description'         => 'nullable|string',
            'unit'                => 'nullable|string|max:20',
            'default_value'       => 'nullable|string',
            'validation_rules'    => 'nullable|array',
            'is_required'         => 'boolean',
            'is_filterable'       => 'boolean',
            'is_searchable'       => 'boolean',
            'show_in_listing'     => 'boolean',
            'sort_order'          => 'nullable|integer|min:0',
            'options'             => 'nullable|array',
            'options.*.label'     => 'required_with:options|string',
            'options.*.value'     => 'required_with:options|string',
            'options.*.color'     => 'nullable|string|max:20',
            'options.*.is_active' => 'sometimes|boolean',
            'options.*.sort_order'=> 'nullable|integer|min:0',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        try {
            $attribute = null;

            DB::transaction(function () use ($category, $validated, &$attribute) {
                $attribute = $category->attributes()->create($validated);

                if (in_array($validated['type'], ['select', 'multiselect'], true) && !empty($validated['options'])) {
                    foreach ($validated['options'] as $index => $option) {
                        $attribute->options()->create([
                            'label'      => $option['label'],
                            'value'      => $option['value'],
                            'color'      => $option['color'] ?? null,
                            'is_active'  => (bool)($option['is_active'] ?? true),
                            'sort_order' => array_key_exists('sort_order', $option) ? (int)$option['sort_order'] : $index,
                        ]);
                    }
                }
            });

            if ($attribute) {
                $this->logCategoryActivity(
                    'attribute_created',
                    $category,
                    "Attribut créé : {$attribute->name} (catégorie {$category->name})",
                    [
                        'attribute' => $this->snapshotAttribute($attribute->fresh(['options'])),
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::error('Échec de création d\'attribut', ['category_id' => $category->id, 'error' => $e->getMessage()]);
            return back()->with('error', "Erreur lors de la création de l'attribut.")->withInput();
        }

        return back()->with('success', 'Attribut créé avec succès.');
    }

    /* -----------------------------------------------------------------
     | UPDATE ATTRIBUTE (endpoint granulaire) + LOG
     ------------------------------------------------------------------*/
    public function updateAttribute(Request $request, Category $category, CategoryAttribute $attribute): RedirectResponse
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'slug'                => 'required|string|max:255|unique:category_attributes,slug,' . $attribute->id . ',id,category_id,' . $category->id,
            'type'                => 'required|in:text,textarea,number,decimal,boolean,select,multiselect,date,url,email,json',
            'description'         => 'nullable|string',
            'unit'                => 'nullable|string|max:20',
            'default_value'       => 'nullable|string',
            'validation_rules'    => 'nullable|array',
            'is_required'         => 'boolean',
            'is_filterable'       => 'boolean',
            'is_searchable'       => 'boolean',
            'show_in_listing'     => 'boolean',
            'sort_order'          => 'nullable|integer|min:0',
            'options'             => 'nullable|array',
            'options.*.label'     => 'required_with:options|string',
            'options.*.value'     => 'required_with:options|string',
            'options.*.color'     => 'nullable|string|max:20',
            'options.*.is_active' => 'sometimes|boolean',
            'options.*.sort_order'=> 'nullable|integer|min:0',
        ]);

        if ((int)$attribute->category_id !== (int)$category->id) {
            return back()->with('error', 'Attribut invalide pour cette catégorie.');
        }

        $before = $this->snapshotAttribute($attribute);

        try {
            DB::transaction(function () use ($attribute, $validated) {
                $attribute->update($validated);

                if (in_array($validated['type'], ['select', 'multiselect'], true)) {
                    $attribute->options()->delete();

                    if (!empty($validated['options'])) {
                        foreach ($validated['options'] as $index => $option) {
                            $attribute->options()->create([
                                'label'      => $option['label'],
                                'value'      => $option['value'],
                                'color'      => $option['color'] ?? null,
                                'is_active'  => (bool)($option['is_active'] ?? true),
                                'sort_order' => array_key_exists('sort_order', $option) ? (int)$option['sort_order'] : $index,
                            ]);
                        }
                    }
                } else {
                    $attribute->options()->delete();
                }
            });

            $after = $this->snapshotAttribute($attribute->fresh(['options']));

            $changed = [];
            foreach ($after as $k => $v) {
                if (($before[$k] ?? null) !== $v) {
                    $changed[] = $k;
                }
            }

            $this->logCategoryActivity(
                'attribute_updated',
                $category,
                "Attribut modifié : {$attribute->name} (catégorie {$category->name})",
                [
                    'attribute_id' => $attribute->id,
                    'changed_fields' => $changed,
                    'before' => $before,
                    'after'  => $after,
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Échec de mise à jour d\'attribut', ['attribute_id' => $attribute->id, 'error' => $e->getMessage()]);
            return back()->with('error', "Erreur lors de la mise à jour de l'attribut.")->withInput();
        }

        return back()->with('success', 'Attribut mis à jour avec succès.');
    }

    /* -----------------------------------------------------------------
     | SYNC ATTRIBUTES (bouton “Enregistrer les attributs”) + LOG
     ------------------------------------------------------------------*/
    public function syncAttributes(SyncCategoryAttributesRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();

        $beforeIds = $category->attributes()->pluck('id')->all();

        try {
            DB::transaction(function () use ($category, $validated) {
                $sentAttributes = collect($validated['attributes'] ?? []);
                $existing       = $category->attributes()->with('options')->get();

                // Supprimer ceux non envoyés
                $sentIds = $sentAttributes->filter(fn ($a) => !empty($a['id']))->pluck('id');
                $existing->whereNotIn('id', $sentIds)->each(function ($attr) {
                    $attr->options()->delete();
                    $attr->delete();
                });

                // Upsert
                foreach ($sentAttributes as $index => $attrData) {
                    if (!empty($attrData['id'])) {
                        $attribute = CategoryAttribute::with('options')->find($attrData['id']);
                        if ($attribute && (int)$attribute->category_id === (int)$category->id) {
                            $this->applyAttributeUpdate($attribute, $attrData, $index);
                        }
                    } else {
                        $this->createAttribute($category, $attrData, $index);
                    }
                }
            });

            $afterIds = $category->attributes()->pluck('id')->all();

            $this->logCategoryActivity(
                'attributes_synced',
                $category,
                "Attributs synchronisés : {$category->name}",
                [
                    'summary' => [
                        'before_count' => count($beforeIds),
                        'after_count'  => count($afterIds),
                        'created_ids'  => array_values(array_diff($afterIds, $beforeIds)),
                        'deleted_ids'  => array_values(array_diff($beforeIds, $afterIds)),
                    ],
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Échec de synchronisation des attributs', ['category_id' => $category->id, 'error' => $e->getMessage()]);
            return back()->with('error', 'Erreur lors de la mise à jour des attributs.');
        }

        return back()->with('success', 'Attributs mis à jour avec succès.');
    }

    /* -----------------------------------------------------------------
     | Helpers privés pour les attributs
     ------------------------------------------------------------------*/
    private function createAttribute(Category $category, array $attrData, int $index): void
    {
        $attribute = $category->attributes()->create([
            'name'            => $attrData['name'],
            'slug'            => $attrData['slug'] ?: Str::slug($attrData['name']),
            'type'            => $attrData['type'],
            'unit'            => $attrData['unit'] ?? null,
            'description'     => $attrData['description'] ?? null,
            'is_required'     => (bool)($attrData['is_required'] ?? false),
            'is_filterable'   => (bool)($attrData['is_filterable'] ?? false),
            'is_searchable'   => (bool)($attrData['is_searchable'] ?? false),
            'show_in_listing' => (bool)($attrData['show_in_listing'] ?? false),
            'is_active'       => (bool)($attrData['is_active'] ?? true),
            'sort_order'      => $attrData['sort_order'] ?? $index,
            'default_value'   => $attrData['default_value'] ?? null,
            'validation_rules'=> is_array($attrData['validation_rules'] ?? null)
                ? json_encode($attrData['validation_rules'])
                : null,
        ]);

        $this->syncAttributeOptions($attribute, $attrData);
    }

    private function applyAttributeUpdate(CategoryAttribute $attribute, array $attrData, int $index): void
    {
        $attribute->update([
            'name'            => $attrData['name'],
            'slug'            => $attrData['slug'] ?: Str::slug($attrData['name']),
            'type'            => $attrData['type'],
            'unit'            => $attrData['unit'] ?? null,
            'description'     => $attrData['description'] ?? null,
            'is_required'     => (bool)($attrData['is_required'] ?? false),
            'is_filterable'   => (bool)($attrData['is_filterable'] ?? false),
            'is_searchable'   => (bool)($attrData['is_searchable'] ?? false),
            'show_in_listing' => (bool)($attrData['show_in_listing'] ?? false),
            'is_active'       => (bool)($attrData['is_active'] ?? true),
            'sort_order'      => $attrData['sort_order'] ?? $index,
            'default_value'   => $attrData['default_value'] ?? null,
            'validation_rules'=> is_array($attrData['validation_rules'] ?? null)
                ? json_encode($attrData['validation_rules'])
                : null,
        ]);

        $this->syncAttributeOptions($attribute, $attrData);
    }

    private function syncAttributeOptions(CategoryAttribute $attribute, array $attrData): void
    {
        if (!in_array($attrData['type'], ['select', 'multiselect'], true)) {
            $attribute->options()->delete();
            return;
        }

        $sentOptions = collect($attrData['options'] ?? []);

        $sentIds = $sentOptions->filter(fn ($opt) => isset($opt['id']))->pluck('id');
        $attribute->options()->whereNotIn('id', $sentIds)->delete();

        foreach ($sentOptions as $index => $optData) {
            if (empty($optData['label'])) continue;

            $optionData = [
                'label'      => $optData['label'],
                'value'      => $optData['value'] ?: Str::slug($optData['label']),
                'color'      => $optData['color'] ?? null,
                'is_active'  => (bool)($optData['is_active'] ?? true),
                'sort_order' => $optData['sort_order'] ?? $index,
            ];

            if (!empty($optData['id'])) {
                $option = $attribute->options()->whereKey($optData['id'])->first();
                if ($option) {
                    $option->update($optionData);
                    continue;
                }
            }

            $attribute->options()->create($optionData);
        }
    }

    /* -----------------------------------------------------------------
     | Helpers privés (parents)
     ------------------------------------------------------------------*/
    private function buildParentOptions(bool $onlyActive = false, ?int $exceptId = null)
    {
        $query = Category::query()
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($onlyActive) {
            $query->where('is_active', true);
        }
        if ($exceptId) {
            $query->where('id', '<>', $exceptId);
        }

        $all      = $query->get(['id', 'name', 'parent_id']);
        $byParent = $all->groupBy('parent_id');
        $result   = collect();

        $walk = function ($parentId, $level) use (&$walk, $byParent, &$result, $exceptId) {
            $children = $byParent->get($parentId, collect());

            foreach ($children as $cat) {
                if ($exceptId && $this->isDescendantOf($exceptId, $cat->id)) {
                    continue;
                }

                $hasChildren        = ($byParent->get($cat->id, collect())->count() > 0);
                $fullName           = $this->computeFullName($cat, $byParent);
                $indented           = str_repeat('— ', $level) . $cat->name;

                $cat->level         = $level;
                $cat->indented_name = $indented;
                $cat->full_name     = $fullName;
                $cat->has_children  = $hasChildren;

                $result->push($cat);
                $walk($cat->id, $level + 1);
            }
        };

        $walk(null, 0);

        return $result;
    }

    private function computeFullName($cat, $byParent): string
    {
        $names   = [$cat->name];
        $current = $cat;

        $guard = 0;
        while ($current && $current->parent_id && $guard < 100) {
            $parent = $byParent->flatten()->firstWhere('id', $current->parent_id);
            if (!$parent) break;
            array_unshift($names, $parent->name);
            $current = $parent;
            $guard++;
        }

        return implode(' > ', $names);
    }

    private function isDescendantOf(int $categoryId, int $potentialParentId): bool
    {
        if ($categoryId === $potentialParentId) return true;

        $current = Category::find($potentialParentId);
        $guard   = 0;

        while ($current && $current->parent_id && $guard < 100) {
            if ((int)$current->parent_id === $categoryId) return true;
            $current = Category::find($current->parent_id);
            $guard++;
        }

        return false;
    }

    /* -----------------------------------------------------------------
     | API: attributs d’une catégorie (sans héritage)
     ------------------------------------------------------------------*/
    public function apiAttributes(Category $category): JsonResponse
    {
        $attrs = $category->attributes()
            ->where('is_active', true)
            ->with(['options' => fn ($q) => $q->active()->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'attributes' => $attrs,
        ]);
    }
}
