<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Http\Resources\ProductResource;
use Illuminate\Http\Request;

class ProductSearchController extends Controller
{
    public function search(Request $request)
    {
        $query = Product::query()
            ->visible()
            ->with(['category', 'documents', 'images', 'attributeValues.attribute']);

        // Recherche full-text simple
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'LIKE', "%{$request->search}%")
                  ->orWhere('description', 'LIKE', "%{$request->search}%");
            });
        }

        // Filtrer par catégorie
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        // Filtrer par prix
        if ($request->min_price) {
            $query->where('is_price_on_request', false);
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->max_price) {
            $query->where('is_price_on_request', false);
            $query->where('price', '<=', $request->max_price);
        }

        // Filtrer par attributs : attributes[ram]=16GB
        if ($request->attributes && is_array($request->attributes)) {
            foreach ($request->attributes as $key => $value) {
                $query->whereHas('attributeValues.attribute', function ($q) use ($key, $value) {
                    $q->where('slug', $key)
                      ->orWhere('name', $key);
                })->whereHas('attributeValues', function ($q) use ($key, $value) {
                    $q->where('value', $value);
                });
            }
        }

        // Tri
        if ($request->sort === 'price_asc') {
            $query->where('is_price_on_request', false);
            $query->orderBy('price', 'asc');
        } elseif ($request->sort === 'price_desc') {
            $query->where('is_price_on_request', false);
            $query->orderBy('price', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $results = $query->paginate(20);

        return response()->json([
            'success' => true,
            'results' => ProductResource::collection($results),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'last_page'    => $results->lastPage(),
                'total'        => $results->total()
            ]
        ]);
    }
}
