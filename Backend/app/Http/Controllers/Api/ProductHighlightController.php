<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Http\Resources\ProductResource;
use Illuminate\Support\Facades\Cache;

class ProductHighlightController extends Controller
{
    /**
     * Nouveaux produits (dernières créations)
     */
    public function newProducts()
    {
        $payload = Cache::remember('api.product-highlights.new-products.v1', now()->addMinutes(2), function () {
            $products = Product::query()
                ->visible()
                ->with(['category', 'documents', 'images'])
                ->latest()
                ->take(10)
                ->get();

            return [
                'success' => true,
                'products' => ProductResource::collection($products)->resolve(),
            ];
        });

        return response()
            ->json($payload)
            ->setSharedMaxAge(120)
            ->setMaxAge(120);
    }

    /**
     * Meilleures ventes (top produits vendus)
     */
    public function bestSellers()
    {
        $payload = Cache::remember('api.product-highlights.best-sellers.v1', now()->addMinutes(2), function () {
            $products = Product::query()
                ->visible()
                ->with(['category', 'documents', 'images'])
                ->select('products.*')
                ->join('order_items', 'order_items.product_id', '=', 'products.id')
                ->groupBy('products.id')
                ->orderByRaw('SUM(order_items.quantity) DESC')
                ->take(10)
                ->get();

            return [
                'success' => true,
                'products' => ProductResource::collection($products)->resolve(),
            ];
        });

        return response()
            ->json($payload)
            ->setSharedMaxAge(120)
            ->setMaxAge(120);
    }

    /**
     * Produits recommandés selon la catégorie
     */
    public function recommended($productId)
    {
        $payload = Cache::remember("api.product-highlights.recommended.v1.product_id={$productId}", now()->addMinutes(2), function () use ($productId) {
            $product = Product::query()->visible()->findOrFail($productId);

            $recommended = Product::query()->visible()
                ->with(['category', 'documents', 'images'])
                ->where('category_id', $product->category_id)
                ->where('id', '!=', $product->id)
                ->take(8)
                ->get();

            return [
                'success' => true,
                'products' => ProductResource::collection($recommended)->resolve(),
            ];
        });

        return response()
            ->json($payload)
            ->setSharedMaxAge(120)
            ->setMaxAge(120);
    }
}
