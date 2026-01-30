<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\Product;
use App\Models\ProductDocument;

class ProductDocumentController extends Controller
{
    /**
     * Liste des documents liés à un produit
     */
    public function index(Request $request, $productId)
    {
        $user = Auth::user();

        if (!$user || !$user->portal_client) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé.',
            ], 403);
        }

        $productExists = Product::query()->visible()->where('id', (string) $productId)->exists();
        if (!$productExists) {
            return response()->json([
                'success' => false,
                'message' => 'Produit introuvable.',
            ], 404);
        }

        $documents = ProductDocument::where('product_id', $productId)
            ->orderBy('created_at', 'desc')
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
