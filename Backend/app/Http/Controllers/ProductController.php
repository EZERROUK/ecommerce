<?php

namespace App\Http\Controllers;

use App\Models\{
    Product,
    Brand,
    Category,
    Currency,
    TaxRate,
    ProductImage,
    ProductCompatibility,
    ProductDocument
};
use App\Http\Requests\ProductRequest;
use App\Services\ProductCompatibilityService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class ProductController extends Controller
{
    private function ensurePublicStorageAccessible(string $relativePath): void
    {
        $relativePath = ltrim($relativePath, '/');

        $publicTarget = public_path('storage/' . $relativePath);
        if (is_file($publicTarget)) {
            return;
        }

        try {
            $source = Storage::disk('public')->path($relativePath);
        } catch (\Throwable $e) {
            return;
        }

        if (!is_file($source)) {
            return;
        }

        $dir = dirname($publicTarget);
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }

        if (is_dir($dir)) {
            @copy($source, $publicTarget);
        }
    }

    public function index(Request $request): Response
    {
        $query = Product::query()
            ->withTrashed()
            ->with([
                'brand:id,name',
                'category:id,name',
                'currency:code,symbol',
                'createdBy:id,name',
            ]);

        // Recherche globale améliorée
        if ($search = trim($request->input('search'))) {
            foreach (preg_split('/\s+/', $search, -1, PREG_SPLIT_NO_EMPTY) as $term) {
                $like = "%{$term}%";
                $query->where(function ($q) use ($term, $like) {
                    $q->where('name', 'like', $like)
                        ->orWhere('description', 'like', $like)
                        ->orWhereHas('category', fn ($subQ) => $subQ->where('name', 'like', $like))
                        ->orWhereHas('brand', fn ($subQ) => $subQ->where('name', 'like', $like))
                        ->orWhereHas('createdBy', fn ($subQ) => $subQ->where('name', 'like', $like));

                    if (is_numeric($term)) {
                        $numericValue = (float) $term;
                        $intValue = (int) $term;

                        $q->orWhere('price', '=', $numericValue)
                            ->orWhere('stock_quantity', '=', $intValue)
                            ->orWhere('price', 'like', $like)
                            ->orWhereYear('created_at', '=', $intValue);
                    }

                    $this->addDateSearchConditions($q, $term);
                });
            }
        }

        // Filtres spécifiques
        if ($name = $request->input('name')) {
            $query->where('name', 'like', "%{$name}%");
        }
        if ($cat = $request->input('category')) {
            $cat = trim((string) $cat);

            // Dropdown => on reçoit un ID numérique (plus précis)
            if ($cat !== '' && is_numeric($cat)) {
                $query->where('category_id', (int) $cat);
            } else {
                // Fallback (ancien comportement) : filtre texte sur le nom de catégorie
                $query->whereHas('category', fn ($q) => $q->where('name', 'like', "%{$cat}%"));
            }
        }
        if ($status = $request->input('status')) {
            $status = Str::lower(trim((string) $status));

            if (in_array($status, ['actif', 'active', '1', 'true'], true)) {
                $query->where('is_active', 1);
            } elseif (in_array($status, ['inactif', 'inactive', '0', 'false'], true)) {
                $query->where('is_active', 0);
            }
        }

        // Filtres numériques prix
        $priceOperator = $request->input('price_operator');
        $price = $request->input('price');

        // Si un prix est fourni sans opérateur (ou un opérateur non supporté côté API), on considère "equals"
        if ((!$priceOperator || $priceOperator === 'contains') && $price !== null && $price !== '') {
            $priceOperator = 'equals';
        }

        $allowedPriceOps = ['equals', 'gt', 'gte', 'lt', 'lte', 'between'];
        if ($priceOperator && !in_array($priceOperator, $allowedPriceOps, true)) {
            $priceOperator = 'equals';
        }

        if ($priceOperator) {
            if ($priceOperator === 'between') {
                $minPrice = $request->input('price_min');
                $maxPrice = $request->input('price_max');

                if ($minPrice !== null && $minPrice !== '' && $maxPrice !== null && $maxPrice !== '') {
                    $query->whereBetween('price', [(float) $minPrice, (float) $maxPrice]);
                }
            } else {
                if ($price !== null && $price !== '') {
                    switch ($priceOperator) {
                        case 'gt':     $query->where('price', '>', (float) $price); break;
                        case 'gte':    $query->where('price', '>=', (float) $price); break;
                        case 'lt':     $query->where('price', '<', (float) $price); break;
                        case 'lte':    $query->where('price', '<=', (float) $price); break;
                        case 'equals':
                        default:       $query->where('price', '=', (float) $price); break;
                    }
                }
            }
        }

// Filtres numériques stock
        $stockOperator = $request->input('stock_operator');
        $stock = $request->input('stock');

        // Si un stock est fourni sans opérateur (ou un opérateur non supporté côté API), on considère "equals"
        if ((!$stockOperator || $stockOperator === 'contains') && $stock !== null && $stock !== '') {
            $stockOperator = 'equals';
        }

        $allowedStockOps = ['equals', 'gt', 'gte', 'lt', 'lte', 'between'];
        if ($stockOperator && !in_array($stockOperator, $allowedStockOps, true)) {
            $stockOperator = 'equals';
        }

        if ($stockOperator) {
            if ($stockOperator === 'between') {
                $minStock = $request->input('stock_min');
                $maxStock = $request->input('stock_max');

                if ($minStock !== null && $minStock !== '' && $maxStock !== null && $maxStock !== '') {
                    $query->whereBetween('stock_quantity', [(int) $minStock, (int) $maxStock]);
                }
            } else {
                if ($stock !== null && $stock !== '') {
                    switch ($stockOperator) {
                        case 'gt':     $query->where('stock_quantity', '>', (int) $stock); break;
                        case 'gte':    $query->where('stock_quantity', '>=', (int) $stock); break;
                        case 'lt':     $query->where('stock_quantity', '<', (int) $stock); break;
                        case 'lte':    $query->where('stock_quantity', '<=', (int) $stock); break;
                        case 'equals':
                        default:       $query->where('stock_quantity', '=', (int) $stock); break;
                    }
                }
            }
        }

// Filtres de date
        if ($startDate = $request->input('date_start')) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate = $request->input('date_end')) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $sort = $request->input('sort', 'created_at');
        $dir  = $request->input('dir', 'desc') === 'asc' ? 'asc' : 'desc';

        $sortColumn = match ($sort) {
            'name'           => 'name',
            'status'         => 'is_active',
            'created_at'     => 'created_at',
            'price'          => 'price',
            'stock_quantity' => 'stock_quantity',
            default          => 'created_at',
        };

        $query->orderBy($sortColumn, $dir);
        $per = (int) $request->input('per_page', 10);
        $products = $per === -1
            ? $query->paginate($query->count())->appends($request->query())
            : $query->paginate($per)->appends($request->query());

        return Inertia::render('Products/Index', [
            'categories' => Category::query()->select('id', 'name')->orderBy('name')->get(),
            'products' => $products,
            'filters'  => $request->only([
                'search', 'name', 'category', 'status',
                'price', 'price_operator', 'price_min', 'price_max',
                'stock', 'stock_operator', 'stock_min', 'stock_max',
                'date_start', 'date_end'
            ]),
            'sort'  => $request->input('sort', 'created_at'),
            'dir'   => $request->input('dir', 'desc'),
            'flash' => session()->only(['success', 'error']),
        ]);
    }

    private function addDateSearchConditions($query, string $term): void
    {
        $dateFormats = [
            '/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/' => 'd/m/Y',
            '/^(\d{1,2})-(\d{1,2})-(\d{4})$/'   => 'd-m-Y',
            '/^(\d{4})-(\d{1,2})-(\d{1,2})$/'   => 'Y-m-d',
            '/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/' => 'd.m.Y',
        ];

        foreach ($dateFormats as $pattern => $format) {
            if (preg_match($pattern, $term)) {
                try {
                    $date = Carbon::createFromFormat($format, $term);
                    if ($date) {
                        $formattedDate = $date->format('Y-m-d');
                        $query->orWhereDate('created_at', '=', $formattedDate)
                              ->orWhereDate('updated_at', '=', $formattedDate);
                        $query->orWhere(function ($subQuery) use ($date) {
                            $subQuery->whereYear('created_at', $date->year)
                                     ->whereMonth('created_at', $date->month)
                                     ->whereDay('created_at', $date->day);
                        });
                        break;
                    }
                } catch (\Exception $e) { /* ignore */ }
            }
        }

        if (preg_match('/^\d{4}$/', $term)) {
            $year = (int) $term;
            $query->orWhereYear('created_at', '=', $year)
                  ->orWhereYear('updated_at', '=', $year);
        }

        if (preg_match('/^(\d{1,2})[\/\-](\d{4})$/', $term, $matches)) {
            $month = (int) $matches[1];
            $year  = (int) $matches[2];
            $query->orWhere(function ($subQuery) use ($month, $year) {
                $subQuery->whereYear('created_at', $year)
                         ->whereMonth('created_at', $month);
            });
        }

        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})$/', $term, $matches)) {
            $day   = (int) $matches[1];
            $month = (int) $matches[2];
            if ($day <= 31 && $month <= 12) {
                $query->orWhere(function ($subQuery) use ($day, $month) {
                    $subQuery->whereMonth('created_at', $month)
                             ->whereDay('created_at', $day);
                });
            }
        }
    }

    public function create(): Response
    {
        // Construire la hiérarchie des catégories avec indicateur has_children
        $categories = $this->buildCategoryHierarchy();

        return Inertia::render('Products/Create', [
            'brands'     => Brand::orderBy('name')->get(['id', 'name']),
            'categories' => $categories,
            'currencies' => Currency::all(['code', 'symbol']),
            'taxRates'   => TaxRate::all(['id', 'name', 'rate']),
        ]);
    }

    public function store(ProductRequest $request, ProductCompatibilityService $compat): RedirectResponse
    {
        $validated = $request->validated();

        $product = Product::create([
            ...$validated,
            'id'         => (string) Str::uuid(),
            'slug'       => $validated['slug'] ?? Str::slug($validated['name']),
            'created_by' => $request->user()->id,
        ]);

        // Attributs personnalisés
        if (isset($validated['attributes'])) {
            foreach ($validated['attributes'] as $attributeSlug => $value) {
                if ($value !== null && $value !== '') {
                    $product->setCustomAttributeValue($attributeSlug, $value);
                }
            }
        }

        // Catégories multiples
        if (isset($validated['additional_categories'])) {
            $categories = collect($validated['additional_categories'])
                ->push($validated['category_id'])
                ->unique();

            foreach ($categories as $categoryId) {
                $product->categories()->attach($categoryId, [
                    'is_primary' => $categoryId == $validated['category_id'],
                ]);
            }
        }

        // Compatibilités
        $this->syncCompatFromRequest($request, $product, $compat);

        $this->syncImages($request, $product);
        $this->syncDocuments($request, $product);

        return to_route('products.index')->with('success', 'Produit créé.');
    }

    public function show(Product $product): Response
    {
        $product->load([
            'brand', 'category', 'currency', 'taxRate', 'images', 'categories',
            'documents',
            'attributeValues.attribute.options',
            'compatibleWith.category', 'isCompatibleWith.category',
            'createdBy:id,name',
        ]);

        $attributes = $product->getAttributesForCategory();
        $attributesMap = $attributes->pluck('current_value', 'slug')->toArray();

        $minAllowedPrice = $this->calculateMinPrice(
            (float) $product->price,
            $product->min_tolerance_type ?? null,
            $product->min_tolerance_value ?? null
        );
        if ($product->is_price_on_request) {
            $minAllowedPrice = null;
        }

        // Compat (fusion sortants + entrants, uniques)
        $all = collect();
        foreach ($product->compatibleWith as $p) {
            $all->push((object)[
                'id'        => $p->id,
                'name'      => $p->name,
                'category'  => $p->category?->name,
                'direction' => $p->pivot->direction,
                'note'      => $p->pivot->note,
            ]);
        }
        foreach ($product->isCompatibleWith as $p) {
            $all->push((object)[
                'id'        => $p->id,
                'name'      => $p->name,
                'category'  => $p->category?->name,
                'direction' => $p->pivot->direction,
                'note'      => $p->pivot->note,
            ]);
        }
        $allCompatibilities = $all->unique('id')->values();

        return Inertia::render('Products/Show', [
            'product' => array_merge($product->toArray(), [
                'attributes'           => $attributesMap,
                'image_url'            => $product->image_main ? asset('storage/'.$product->image_main) : null,
                'documents'            => $product->documents
                    ->whereNull('deleted_at')
                    ->values()
                    ->map(fn (ProductDocument $doc) => [
                        'id'    => $doc->id,
                        'title' => $doc->title,
                        'type'  => $doc->type,
                        'url'   => Storage::url($doc->file_path),
                    ])
                    ->toArray(),
                'formatted_price'      => $product->getFormattedPrice(),
                'has_discount'         => $product->hasDiscount(),
                'discount_percentage'  => $product->getDiscountPercentage(),
                'is_in_stock'          => $product->isInStock(),
                'is_low_stock'         => $product->isLowStock(),
                'is_available'         => $product->isAvailable(),
                'min_allowed_price'    => $minAllowedPrice,
                'created_by_name'      => $product->createdBy?->name,
            ]),
            'attributes'         => $attributes,
            'allCompatibilities' => $allCompatibilities,
        ]);
    }

    public function edit(Product $product): Response
    {
        $product->load([
            'brand', 'category', 'currency', 'taxRate', 'images', 'categories', 'documents',
            'attributeValues.attribute.options', 'compatibleWith', 'isCompatibleWith',
        ]);

        $categories = $this->buildCategoryHierarchy();
        $attributes = $product->getAttributesForCategory();

        $minAllowedPrice = $this->calculateMinPrice(
            (float) $product->price,
            $product->min_tolerance_type ?? null,
            $product->min_tolerance_value ?? null
        );
        if ($product->is_price_on_request) {
            $minAllowedPrice = null;
        }

        $compatibilities = $product->compatibleWith
            ->merge($product->isCompatibleWith)
            ->values()
            ->map(fn ($p) => [
                'compatible_with_id' => $p->id,
                'name'               => $p->name,
                'direction'          => $p->pivot->direction,
                'note'               => $p->pivot->note,
            ]);

        return Inertia::render('Products/Edit', [
            'brands'      => Brand::orderBy('name')->get(['id', 'name']),
            'product'     => array_merge($product->toArray(), [
                'attributes'        => $attributes->pluck('current_value', 'slug')->toArray(),
                'min_allowed_price' => $minAllowedPrice,
                'documents'         => $product->documents
                    ->whereNull('deleted_at')
                    ->values()
                    ->map(fn (ProductDocument $doc) => [
                        'id'    => $doc->id,
                        'title' => $doc->title,
                        'type'  => $doc->type,
                        'url'   => Storage::url($doc->file_path),
                    ])
                    ->toArray(),
            ]),
            'categories'  => $categories,
            'currencies'  => Currency::all(['code', 'symbol']),
            'taxRates'    => TaxRate::all(['id', 'name', 'rate']),
            'attributes'  => $attributes,
            'compatibilities' => $compatibilities,
        ]);
    }

    public function update(ProductRequest $request, Product $product, ProductCompatibilityService $compat): RedirectResponse
    {
        DB::transaction(function () use ($request, $product, $compat) {
            $validated = $request->validated();

            if (empty($validated['slug'])) {
                $validated['slug'] = Str::slug($validated['name']);
            }

            $product->update($validated);

            // Attributs personnalisés
            if (isset($validated['attributes'])) {
                $categoryAttributes = $product->category->attributes()->active()->get();

                foreach ($categoryAttributes as $attribute) {
                    $value = $validated['attributes'][$attribute->slug] ?? null;

                    if ($value !== null && $value !== '') {
                        $product->setCustomAttributeValue($attribute->slug, $value);
                    } else {
                        $product->attributeValues()
                            ->where('attribute_id', $attribute->id)
                            ->delete();
                    }
                }

                $validAttributeIds = $categoryAttributes->pluck('id')->toArray();
                $product->attributeValues()
                    ->whereNotIn('attribute_id', $validAttributeIds)
                    ->delete();
            }

            // Catégories multiples
            if (isset($validated['additional_categories'])) {
                $product->categories()->detach();

                $categories = collect($validated['additional_categories'])
                    ->push($validated['category_id'])
                    ->unique();

                foreach ($categories as $categoryId) {
                    $product->categories()->attach($categoryId, [
                        'is_primary' => $categoryId == $validated['category_id'],
                    ]);
                }
            }

            // Compatibilités (nouvelle logique)
            $this->syncCompatFromRequest($request, $product, $compat);

            $this->syncImages($request, $product);
            $this->syncDocuments($request, $product);
        });

        return to_route('products.show', $product)->with('success', 'Produit mis à jour.');
    }

    public function toggleStatus(Product $product): RedirectResponse
    {
        $product->update([
            'is_active' => (int) $product->is_active === 1 ? 0 : 1,
        ]);

        return back()->with('success', 'Statut du produit mis à jour.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        // Par cohérence avec Employees : une suppression force le produit à devenir inactif.
        if ((int) $product->is_active === 1) {
            $product->update(['is_active' => 0]);
        }

        $product->delete();

        return back()->with('success', 'Produit supprimé.');
    }

    public function restore($id): RedirectResponse
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();

        return back()->with('success', 'Produit restauré.');
    }

    public function forceDelete($id): RedirectResponse
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->forceDelete();

        return back()->with('success', 'Produit supprimé définitivement.');
    }


    protected function syncImages(ProductRequest $request, Product $product): void
    {
        if ($ids = $request->input('deleted_image_ids', [])) {
            ProductImage::whereIn('id', $ids)->delete();
        }
        if ($ids = $request->input('restored_image_ids', [])) {
            ProductImage::withTrashed()->whereIn('id', $ids)->restore();
        }

        ProductImage::where('product_id', $product->id)
            ->whereNull('deleted_at')
            ->update(['is_primary' => false]);

        $primaryIdx  = (int) $request->input('primary_image_index', 0);
        $globalIdx   = 0;
        $primaryPath = null;

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path      = $file->store("products/{$product->id}", 'public');
                $this->ensurePublicStorageAccessible($path);
                $isPrimary = $globalIdx === $primaryIdx;

                $product->images()->create([
                    'path'       => $path,
                    'is_primary' => $isPrimary,
                ]);

                if ($isPrimary) {
                    $primaryPath = $path;
                }
                $globalIdx++;
            }
        }

        $existing = $product->images()
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get();

        foreach ($existing as $img) {
            $isPrimary = $globalIdx === $primaryIdx;
            if ($isPrimary) {
                $img->update(['is_primary' => true]);
                $primaryPath = $img->path;
            }
            $globalIdx++;
        }

        if (!$primaryPath && $first = $existing->first()) {
            $first->update(['is_primary' => true]);
            $primaryPath = $first->path;
        }

        if ($primaryPath) {
            $product->updateQuietly(['image_main' => $primaryPath]);
        }
    }

    protected function syncDocuments(ProductRequest $request, Product $product): void
    {
        $updates = $request->input('updated_documents', []);
        if (is_array($updates) && count($updates) > 0) {
            foreach ($updates as $u) {
                if (!is_array($u)) {
                    continue;
                }

                $docId = (int) ($u['id'] ?? 0);
                if ($docId <= 0) {
                    continue;
                }

                $title = trim((string) ($u['title'] ?? ''));
                if ($title === '') {
                    $title = 'Document';
                }

                $type = trim((string) ($u['type'] ?? 'datasheet'));
                if ($type === '' || $type === 'other') {
                    $type = 'datasheet';
                }

                // Ne met à jour que les documents appartenant au produit, non supprimés.
                $product->documents()
                    ->where('id', $docId)
                    ->whereNull('deleted_at')
                    ->update([
                        'title' => $title,
                        'type' => $type,
                    ]);
            }
        }

        if ($ids = $request->input('deleted_document_ids', [])) {
            $product->documents()->whereIn('id', $ids)->delete();
        }

        $docs = $request->input('documents', []);
        if (!is_array($docs) || count($docs) === 0) {
            return;
        }

        foreach (array_values($docs) as $index => $docData) {
            $title = is_array($docData) ? trim((string) ($docData['title'] ?? '')) : '';
            if ($title === '') {
                $title = 'Document';
            }

            $type = is_array($docData) ? trim((string) ($docData['type'] ?? 'datasheet')) : 'datasheet';
            if ($type === '' || $type === 'other') {
                $type = 'datasheet';
            }

            $file = $request->file("documents.{$index}.file");
            if (!$file) {
                continue;
            }

            $path = $file->store("products/{$product->id}/documents", 'public');
            $this->ensurePublicStorageAccessible($path);

            $product->documents()->create([
                'title' => $title,
                'type' => $type,
                'file_path' => $path,
            ]);
        }
    }

    /**
     * Retourne les produits compatibles basés sur la hiérarchie des catégories
     * NOUVELLE LOGIQUE :
     * - Si la catégorie sélectionnée a un parent : retourne uniquement les produits de la catégorie parente
     * - Si la catégorie sélectionnée n'a pas de parent : retourne les produits des catégories enfants
     */
    public function compatibleList(Request $request)
    {
        $categoryId = $request->get('category_id');

        if (!$categoryId) {
            // Si aucune catégorie n'est spécifiée, retourner tous les produits actifs
            return Product::query()
                ->select('products.id', 'products.name', 'categories.name as category_name')
                ->join('categories', 'categories.id', '=', 'products.category_id')
                ->whereNull('products.deleted_at')
                ->where('products.is_active', true)
                ->orderBy('products.name')
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name . ' (' . $product->category_name . ')',
                    ];
                });
        }

        // Trouver la catégorie actuelle
        $currentCategory = Category::find($categoryId);

        if (!$currentCategory) {
            return response()->json([]);
        }

        $compatibleCategoryIds = [];

        if ($currentCategory->parent_id) {
            // Si la catégorie a un parent, on veut uniquement les produits de la catégorie parente
            $compatibleCategoryIds = [$currentCategory->parent_id];
        } else {
            // Si la catégorie n'a pas de parent (c'est une catégorie racine),
            // on veut les produits de toutes ses sous-catégories directes
            $compatibleCategoryIds = Category::where('parent_id', $currentCategory->id)
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();
        }

        // Si aucune catégorie compatible n'est trouvée, retourner un tableau vide
        if (empty($compatibleCategoryIds)) {
            return response()->json([]);
        }

        return Product::query()
            ->select('products.id', 'products.name', 'categories.name as category_name')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->whereIn('products.category_id', $compatibleCategoryIds)
            ->whereNull('products.deleted_at')
            ->where('products.is_active', true)
            ->orderBy('products.name')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name . ' (' . $product->category_name . ')',
                ];
            });
    }

    /** API interne: recherche de produits pour autocomplete (+ filtres parent/category) */
    public function apiSearch(Request $request)
    {
        $q = (string) $request->get('q', '');
        $categoryId = $request->get('category_id');
        $parentCategoryId = $request->get('parent_category_id');

        $query = Product::query()
            ->select(['id', 'name', 'sku', 'category_id'])
            ->when($q, fn($qq)=>$qq->where(fn($w)=>
                $w->where('name','like',"%{$q}%")
                  ->orWhere('sku','like',"%{$q}%")
            ))
            ->when($categoryId, fn($qq)=>$qq->where('category_id', $categoryId))
            ->when($parentCategoryId, function ($qq) use ($parentCategoryId) {
                $qq->whereHas('category', fn($c)=>$c->where('parent_id', $parentCategoryId));
            })
            ->limit(20);

        return response()->json($query->get());
    }

    /**
     * Construit la hiérarchie des catégories avec indicateur has_children
     */
    private function buildCategoryHierarchy()
    {
        $categories = Category::active()
            ->orderBy('level')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'parent_id', 'level']);

        // Calculer has_children pour chaque catégorie
        $parentIds = $categories->whereNotNull('parent_id')->pluck('parent_id')->unique();

        return $categories->map(function ($category) use ($parentIds, $categories) {
            $hasChildren  = $parentIds->contains($category->id);
            $indentedName = str_repeat('— ', $category->level) . $category->name;

            // Construire le nom complet (breadcrumb)
            $fullName = $this->buildFullCategoryName($category, $categories);

            return [
                'id'            => $category->id,
                'name'          => $category->name,
                'slug'          => $category->slug,
                'parent_id'     => $category->parent_id,
                'level'         => $category->level,
                'indented_name' => $indentedName,
                'full_name'     => $fullName,
                'has_children'  => $hasChildren,
            ];
        });
    }

    /**
     * Construit le nom complet d'une catégorie (breadcrumb)
     */
    private function buildFullCategoryName($category, $allCategories): string
    {
        $names   = [$category->name];
        $current = $category;

        while ($current->parent_id) {
            $parent = $allCategories->firstWhere('id', $current->parent_id);
            if (!$parent) break;

            array_unshift($names, $parent->name);
            $current = $parent;
        }

        return implode(' > ', $names);
    }

    /**
     * Helper : applique la tolérance et retourne le prix plancher.
     * $type: 'percent'|'percentage' ou 'amount'
     */
    private function applyTolerance(float $price, string $type, float $value): float
    {
        if ($type === 'percentage' || $type === 'percent') {
            return max(0, round($price * (1 - ($value / 100)), 2));
        }
        if ($type === 'amount') {
            return max(0, round($price - $value, 2));
        }
        return $price;
    }

    /**
     * Helper : calcule le prix minimum autorisé à partir du prix et de la tolérance.
     * Retourne null si pas de tolérance définie.
     */
    private function calculateMinPrice(float $price, ?string $type, $value): ?float
    {
        if (!$type || $value === null || $value === '') {
            return null;
        }
        return $this->applyTolerance($price, $type, (float) $value);
    }

    /**
     * Applique la synchro des compatibilités à partir du payload request.
     * - Si `compatibilities` (avec direction/note) est fourni, on respecte chaque entrée.
     * - Sinon, on utilise `compatibility_product_ids` en bidirectionnel simple.
     */
    private function syncCompatFromRequest(Request $request, Product $product, ProductCompatibilityService $svc): void
    {
        $detailed = collect($request->input('compatibilities', []))
            ->filter(fn ($e) => !empty($e['compatible_with_id']))
            ->map(function ($e) {
                return [
                    'id'        => (string) $e['compatible_with_id'],
                    'direction' => $e['direction'] ?? 'bidirectional',
                    'note'      => $e['note'] ?? null,
                ];
            })
            ->values();

        if ($detailed->isNotEmpty()) {
            // Supprimer (soft-delete) tous les liens existants avec ce produit qui ne sont pas dans la nouvelle liste
            $targetIds = $detailed->pluck('id')->unique()->all();

            $existing = DB::table('product_compatibilities')
                ->where(function ($q) use ($product) {
                    $q->where('product_id', $product->id)
                      ->orWhere('compatible_with_id', $product->id);
                })
                ->whereNull('deleted_at')
                ->get();

            foreach ($existing as $row) {
                $otherId = $row->product_id === $product->id ? $row->compatible_with_id : $row->product_id;
                if (!in_array($otherId, $targetIds, true)) {
                    // supprime des deux côtés
                    if ($other = Product::find($otherId)) {
                        $svc->unlink($product, $other, true);
                    }
                }
            }

            // Appliquer chaque entrée (respect direction/note)
            foreach ($detailed as $e) {
                $other = Product::find($e['id']);
                if (!$other) continue;

                $svc->link($product, $other, $e['direction'], $e['note']);
            }

            return;
        }

        // Fallback : liste simple d'IDs => bidirectionnel
        $ids = $request->input('compatibility_product_ids', []);
        $svc->syncProducts($product, is_array($ids) ? $ids : []);
    }
}
