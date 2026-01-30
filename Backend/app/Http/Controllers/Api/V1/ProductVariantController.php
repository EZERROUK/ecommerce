<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductVariantResource;
use App\Models\ProductVariant;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductVariant::query();

        ApiQuery::applySearch($query, $request->query('search'), ['sku']);

        if ($request->filled('parent_product_id')) {
            $query->where('parent_product_id', $request->query('parent_product_id'));
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        ApiQuery::applyIncludes($query, $request, ['parentProduct', 'images'], []);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'sku', 'price', 'stock_quantity', 'id'], '-created_at');

        $variants = $query->paginate(ApiQuery::perPage($request));

        return ProductVariantResource::collection($variants)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = ProductVariant::query();
        ApiQuery::applyIncludes($query, $request, ['parentProduct', 'images'], ['parentProduct', 'images']);

        $variant = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new ProductVariantResource($variant),
        ]);
    }
}
