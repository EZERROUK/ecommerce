<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class CategoryFilterController extends Controller
{
    public function filters($categoryId): JsonResponse
    {
        $category = Category::query()->active()->public()->findOrFail($categoryId);

        // Charger les produits + attributs
        $products = Product::query()
            ->visible()
            ->with('attributes')
            ->where('category_id', $category->id)
            ->get();

        return response()->json([
            'success' => true,
            'filters' => [

                // Prix min/max
                'price_min' => $products->min('price'),
                'price_max' => $products->max('price'),

                // Marques (si tu utilises une colonne brand)
                'brands' => $products->pluck('brand')->filter()->unique()->values(),

                // Attributs dynamiques regroupés proprement
                'attributes' => $products
                    ->flatMap(function ($product) {
                        return collect($product->attributes)->map(function ($attr) {
                            return [
                                'name'  => $attr->name,
                                'value' => $attr->pivot->value
                            ];
                        });
                    })
                    ->groupBy('name')
                    ->map(function ($values) {
                        return collect($values)->pluck('value')->unique()->values();
                    }),
            ]
        ]);
    }
}
