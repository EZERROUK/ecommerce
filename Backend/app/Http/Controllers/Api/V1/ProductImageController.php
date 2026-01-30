<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductImageResource;
use App\Models\ProductImage;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class ProductImageController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductImage::query();

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->query('product_id'));
        }

        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'is_primary', 'id'], '-created_at');

        $images = $query->paginate(ApiQuery::perPage($request));

        return ProductImageResource::collection($images)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $image = ProductImage::query()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new ProductImageResource($image),
        ]);
    }
}
