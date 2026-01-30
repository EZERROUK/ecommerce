<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductReviewRequest;
use App\Http\Resources\ProductReviewResource;
use App\Models\Product;
use App\Models\ProductReview;

class ProductReviewController extends Controller
{
    /**
     * Liste des avis approuvés d’un produit (public).
     */
    public function index(string $id)
    {
        $product = Product::query()->visible()->findOrFail($id);

        $reviews = ProductReview::query()
            ->where('product_id', $product->id)
            ->where('status', ProductReview::STATUS_APPROVED)
            ->latest()
            ->get();

        return ProductReviewResource::collection($reviews)
            ->additional(['success' => true]);
    }

    /**
     * Soumettre un avis (public) → statut pending.
     */
    public function store(StoreProductReviewRequest $request, string $id)
    {
        $product = Product::query()->visible()->findOrFail($id);

        $payload = $request->validated();

        ProductReview::create([
            'product_id' => $product->id,
            'author_name' => $payload['author_name'],
            'author_email' => $payload['author_email'] ?? null,
            'rating' => (int) $payload['rating'],
            'comment' => $payload['comment'],
            'status' => ProductReview::STATUS_PENDING,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Merci ! Votre avis est en attente de validation.',
        ]);
    }
}
