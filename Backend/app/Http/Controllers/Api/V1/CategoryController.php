<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        ApiQuery::applySearch($query, $request->query('search'), ['name', 'slug']);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('visibility')) {
            $query->where('visibility', $request->query('visibility'));
        }
        if ($request->filled('parent_id')) {
            $query->where('parent_id', $request->query('parent_id'));
        }

        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'name', 'sort_order', 'id'], 'name');

        $categories = $query->paginate(ApiQuery::perPage($request));

        return CategoryResource::collection($categories)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $category = Category::query()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new CategoryResource($category),
        ]);
    }
}
