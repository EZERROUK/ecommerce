<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Http\Resources\ProductResource;
use Illuminate\Http\Request;

class CategoryProductController extends Controller
{
    /**
     * Produits d’une catégorie (avec pagination & tri)
     */
    public function index(Request $request, $categoryId)
    {
        $category = Category::query()->active()->public()->findOrFail($categoryId);

        $query = Product::query()
            ->visible()
            ->with(['category', 'documents'])
            ->where('category_id', $category->id);

        // Filtres basiques
        if ($request->has('search')) {
            $query->where('name', 'LIKE', "%{$request->search}%");
        }

        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Tri
        if ($request->sort === 'price_asc') {
            $query->orderBy('price', 'asc');
        } elseif ($request->sort === 'price_desc') {
            $query->orderBy('price', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $products = $query->paginate(20);

        return response()->json([
            'success' => true,
            'category' => $category->name,
            'products' => ProductResource::collection($products),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'total'        => $products->total(),
            ]
        ]);
    }
}
