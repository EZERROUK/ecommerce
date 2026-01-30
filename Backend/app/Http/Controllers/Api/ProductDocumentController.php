<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ProductDocumentController extends Controller
{
    /**
     * Liste des documents liés à un produit (PUBLIC).
     * Ne retourne pas de chemins internes (file_path).
     */
    public function index(string $productId): JsonResponse
    {
        $productExists = Product::query()
            ->visible()
            ->where('id', $productId)
            ->exists();

        if (!$productExists) {
            return response()->json([
                'success' => false,
                'message' => 'Produit introuvable.',
            ], 404);
        }

        $documents = ProductDocument::query()
            ->where('product_id', $productId)
            ->orderByDesc('created_at')
            ->get(['id', 'product_id', 'title', 'type', 'file_path', 'created_at']);

        return response()->json([
            'success' => true,
            'documents' => $documents->map(fn (ProductDocument $doc) => [
                'id' => $doc->id,
                'product_id' => $doc->product_id,
                'title' => $doc->title,
                'type' => $doc->type,
                'url' => $doc->file_path ? Storage::url($doc->file_path) : null,
                'created_at' => $doc->created_at,
            ]),
        ]);
    }
}
