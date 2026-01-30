<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\{Promotion, Category, Product};
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    /* -----------------------------------------------------------------
     | INDEX : filtres + pagination + flash
     |-----------------------------------------------------------------*/
    public function index(Request $request): Response
    {
        $query = Promotion::with(['actions', 'codes'])->latest();

        // Filtres
        if ($request->filled('search')) {
            $s = (string) $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%")
                  ->orWhereHas('codes', fn ($c) => $c->where('code', 'like', "%{$s}%"));
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        if ($request->filled('name')) {
            $name = $request->string('name')->toString();
            $query->where('name', 'like', "%{$name}%");
        }

        if ($request->filled('discount')) {
            $discountRaw = trim($request->string('discount')->toString());

            $query->whereHas('actions', function ($a) use ($discountRaw) {
                if (is_numeric($discountRaw)) {
                    $a->where('value', (float) $discountRaw);
                } else {
                    // fallback si l'utilisateur saisit quelque chose de non numérique
                    $a->whereRaw('CAST(value as CHAR) like ?', ["%{$discountRaw}%"]);
                }
            });
        }

        if ($request->filled('active')) {
            $active = $request->string('active')->toString();
            if ($active === '1')  $query->where('is_active', true);
            if ($active === '0')  $query->where('is_active', false);
        }

        $perPage = $request->integer('per_page', 15);

        $promos = $query
            ->paginate($perPage)
            ->appends($request->all());

        return Inertia::render('Promotions/Index', [
            'promotions' => $promos,
            'filters'    => $request->only(['search', 'name', 'discount', 'type', 'active']),
            'flash'      => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);
    }

    /* -----------------------------------------------------------------
     | CREATE : page (envoie catégories & produits pour le ciblage)
     |-----------------------------------------------------------------*/
    public function create(): Response
    {
        $categories = Category::select('id','name')->orderBy('name')->get();
        $products   = Product::select('id','name','sku')->orderBy('name')->get();

        return Inertia::render('Promotions/Create', [
            'categories' => $categories,
            'products'   => $products,
        ]);
    }

    /* -----------------------------------------------------------------
     | EDIT : page (envoie promo + catégories & produits pour le ciblage)
     |-----------------------------------------------------------------*/
    public function edit(Promotion $promotion): Response
    {
        $categories = Category::select('id','name')->orderBy('name')->get();
        $products   = Product::select('id','name','sku')->orderBy('name')->get();

        $promotion->load([
            'actions',
            'codes',
            'categories:id',
            'products:id',
        ]);

        $action = $promotion->actions->first();
        $code   = $promotion->codes->first();

        return Inertia::render('Promotions/Edit', [
            'categories' => $categories,
            'products'   => $products,
            'promotion'  => [
                'id'                     => $promotion->id,
                'name'                   => $promotion->name,
                'description'            => $promotion->description,
                'type'                   => $promotion->type,
                'apply_scope'            => $promotion->apply_scope,
                'priority'               => $promotion->priority,
                'is_active'              => (bool) $promotion->is_active,
                'is_exclusive'           => (bool) $promotion->is_exclusive,
                'starts_at'              => $promotion->starts_at?->format('Y-m-d\\TH:i'),
                'ends_at'                => $promotion->ends_at?->format('Y-m-d\\TH:i'),
                'days_of_week'           => $promotion->days_of_week,
                'min_subtotal'           => $promotion->min_subtotal,
                'min_quantity'           => $promotion->min_quantity,
                'stop_further_processing'=> (bool) ($promotion->stop_further_processing ?? false),

                'action_type'            => $action?->action_type,
                'value'                  => $action?->value,
                'code'                   => $code?->code,

                'category_ids'           => $promotion->categories->pluck('id')->values(),
                'product_ids'            => $promotion->products->pluck('id')->values(),
            ],
        ]);
    }

    /* -----------------------------------------------------------------
     | SHOW : page (détails)
     |-----------------------------------------------------------------*/
    public function show(Promotion $promotion): Response
    {
        $promotion->load([
            'actions',
            'codes',
            'categories:id,name',
            'products:id,name,sku',
        ]);

        $action = $promotion->actions->first();
        $code   = $promotion->codes->first();

        return Inertia::render('Promotions/Show', [
            'promotion' => [
                'id'                     => $promotion->id,
                'name'                   => $promotion->name,
                'description'            => $promotion->description,
                'type'                   => $promotion->type,
                'apply_scope'            => $promotion->apply_scope,
                'priority'               => $promotion->priority,
                'is_active'              => (bool) $promotion->is_active,
                'is_exclusive'           => (bool) $promotion->is_exclusive,
                'starts_at'              => $promotion->starts_at?->toIso8601String(),
                'ends_at'                => $promotion->ends_at?->toIso8601String(),
                'days_of_week'           => $promotion->days_of_week,
                'min_subtotal'           => $promotion->min_subtotal,
                'min_quantity'           => $promotion->min_quantity,
                'stop_further_processing'=> (bool) ($promotion->stop_further_processing ?? false),

                'action' => $action ? [
                    'action_type' => $action->action_type,
                    'value'       => $action->value,
                    'max_discount_amount' => $action->max_discount_amount,
                ] : null,
                'code'   => $code?->code,

                'categories' => $promotion->categories->map(fn ($c) => [
                    'id'   => $c->id,
                    'name' => $c->name,
                ])->values(),
                'products' => $promotion->products->map(fn ($p) => [
                    'id'   => (string) $p->id,
                    'name' => $p->name,
                    'sku'  => $p->sku,
                ])->values(),
            ],
        ]);
    }

    /* -----------------------------------------------------------------
     | STORE
     |-----------------------------------------------------------------*/
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',

            'type'        => 'required|in:order,category,product,bogo',
            'apply_scope' => 'required|in:order,category,product',
            'priority'    => 'nullable|integer|min:0',
            'is_exclusive'=> 'nullable|boolean',
            'is_active'   => 'nullable|boolean',

            // Validité
            'starts_at'   => 'nullable|date',
            'ends_at'     => 'nullable|date|after_or_equal:starts_at',
            'days_of_week'=> 'nullable|integer|min:0|max:127',

            // Conditions globales
            'min_subtotal'=> 'nullable|numeric|min:0',
            'min_quantity'=> 'nullable|integer|min:0',
            'stop_further_processing' => 'nullable|boolean',

            // Actions (obligatoires)
            'actions'                 => 'required|array|min:1',
            'actions.*.action_type'   => 'required|in:percent,fixed,bogo_free,bogo_percent',
            'actions.*.value'         => 'nullable|numeric',
            'actions.*.max_discount_amount' => 'nullable|numeric',

            // Code optionnel
            'code' => 'nullable|string|max:191',

            // Ciblage
            'category_ids'   => 'array',
            'category_ids.*' => 'integer',   // categories.id
            'product_ids'    => 'array',
            'product_ids.*'  => 'string',    // products.id (UUID)
        ]);

        // Création promo (hors actions / code / pivots)
        $promo = Promotion::create(collect($data)->except(['actions','code','category_ids','product_ids'])->toArray());

        // Actions
        foreach ($data['actions'] as $a) {
            $promo->actions()->create($a);
        }

        // Code (optionnel)
        if (!empty($data['code'])) {
            $promo->codes()->create([
                'code'            => $data['code'],
                'max_redemptions' => null,
                'max_per_user'    => null,
                'is_active'       => true,
            ]);
        }

        // Pivots ciblage
        if ($data['apply_scope'] === 'category') {
            $promo->categories()->sync($data['category_ids'] ?? []);
            $promo->products()->sync([]);
        } elseif ($data['apply_scope'] === 'product') {
            $promo->products()->sync($data['product_ids'] ?? []);
            $promo->categories()->sync([]);
        } else {
            $promo->categories()->sync([]);
            $promo->products()->sync([]);
        }

        return redirect()->route('promotions.index')->with('success', 'Promotion créée');
    }

    /* -----------------------------------------------------------------
     | UPDATE (toggle / édition)
     |-----------------------------------------------------------------*/
    public function update(Request $request, Promotion $promotion): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',

            'type'        => 'sometimes|required|in:order,category,product,bogo',
            'apply_scope' => 'sometimes|required|in:order,category,product',
            'priority'    => 'sometimes|integer|min:0',
            'is_exclusive'=> 'sometimes|boolean',
            'is_active'   => 'sometimes|boolean',

            'starts_at'   => 'sometimes|nullable|date',
            'ends_at'     => 'sometimes|nullable|date|after_or_equal:starts_at',
            'days_of_week'=> 'sometimes|nullable|integer|min:0|max:127',

            'min_subtotal'=> 'sometimes|nullable|numeric|min:0',
            'min_quantity'=> 'sometimes|nullable|integer|min:0',
            'stop_further_processing' => 'sometimes|boolean',

            'actions'                 => 'sometimes|array|min:1',
            'actions.*.action_type'   => 'required_with:actions|in:percent,fixed,bogo_free,bogo_percent',
            'actions.*.value'         => 'nullable|numeric',
            'actions.*.max_discount_amount' => 'nullable|numeric',

            'code' => 'sometimes|nullable|string|max:191',

            'category_ids'   => 'sometimes|array',
            'category_ids.*' => 'integer',
            'product_ids'    => 'sometimes|array',
            'product_ids.*'  => 'string',
        ]);

        // Colonnes simples
        $promotion->update(collect($data)->except(['actions','code','category_ids','product_ids'])->toArray());

        // Remplacer les actions si fournies
        if (array_key_exists('actions', $data)) {
            $promotion->actions()->delete();
            foreach ((array) $data['actions'] as $a) {
                $promotion->actions()->create($a);
            }
        }

        // Gérer le code si envoyé (créer / remplacer / supprimer)
        if (array_key_exists('code', $data)) {
            $promotion->codes()->delete();
            if (!empty($data['code'])) {
                $promotion->codes()->create([
                    'code'            => $data['code'],
                    'max_redemptions' => null,
                    'max_per_user'    => null,
                    'is_active'       => true,
                ]);
            }
        }

        // Pivots ciblage si modifiés (ou si le scope change)
        if (array_key_exists('apply_scope', $data) || array_key_exists('category_ids', $data) || array_key_exists('product_ids', $data)) {
            $scope = $data['apply_scope'] ?? $promotion->apply_scope;
            if ($scope === 'category') {
                $promotion->categories()->sync($data['category_ids'] ?? []);
                $promotion->products()->sync([]);
            } elseif ($scope === 'product') {
                $promotion->products()->sync($data['product_ids'] ?? []);
                $promotion->categories()->sync([]);
            } else {
                $promotion->categories()->sync([]);
                $promotion->products()->sync([]);
            }
        }

        return back()->with('success', 'Promotion mise à jour');
    }

    /* -----------------------------------------------------------------
     | DESTROY
     |-----------------------------------------------------------------*/
    public function destroy(Promotion $promotion): RedirectResponse
    {
        $promotion->delete();
        return back()->with('success', 'Promotion supprimée');
    }
}
