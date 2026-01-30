<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BackofficeProductResource;
use App\Models\Product;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        ApiQuery::applySearch($query, $request->query('search'), [
            'name',
            'sku',
            'model',
            'slug',
        ]);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }
        if ($request->filled('visibility')) {
            $query->where('visibility', $request->query('visibility'));
        }

        ApiQuery::applyIncludes($query, $request, ['category', 'brand', 'documents'], ['category']);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'name', 'sku', 'price', 'stock_quantity', 'id'], '-created_at');

        $products = $query->paginate(ApiQuery::perPage($request));

        return BackofficeProductResource::collection($products)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = Product::query();
        ApiQuery::applyIncludes($query, $request, ['category', 'brand', 'documents', 'images', 'variants', 'attributeValues']);

        $product = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new BackofficeProductResource($product),
        ]);
    }
}
