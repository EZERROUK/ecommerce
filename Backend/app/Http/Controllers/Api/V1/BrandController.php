<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $query = Brand::query();

        ApiQuery::applySearch($query, $request->query('search'), ['name', 'slug', 'id']);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'name', 'slug', 'id'], 'name');

        $brands = $query->paginate(ApiQuery::perPage($request));

        return BrandResource::collection($brands)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $brand = Brand::query()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new BrandResource($brand),
        ]);
    }
}
