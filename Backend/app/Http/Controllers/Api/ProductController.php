<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Liste des produits (catalogue)
     */
    public function index(Request $request)
    {
        $perPage = $request->integer('per_page', 20);
        $perPage = max(1, min(200, $perPage));

        $products = Product::query()
            ->visible()
            ->with(['category', 'documents', 'images'])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return ProductResource::collection($products)
            ->additional(['success' => true]);
    }

    /**
     * Détail d’un produit + documents + attributs
     */
    public function show($id)
    {
        $product = Product::query()
            ->visible()
            ->with([
                'category',
                'documents',
                'images',
                'attributeValues.attribute',
            ])
            ->findOrFail($id);

        return (new ProductResource($product))
            ->additional(['success' => true]);
    }

    /**
     * Détail d’un produit via slug (SEO-friendly)
     */
    public function showBySlug(string $slug)
    {
        $product = Product::query()
            ->visible()
            ->with([
                'category',
                'documents',
                'images',
                'attributeValues.attribute',
            ])
            ->where('slug', $slug)
            ->firstOrFail();

        return (new ProductResource($product))
            ->additional(['success' => true]);
    }
}
