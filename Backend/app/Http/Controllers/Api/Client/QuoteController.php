<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuoteResource;
use App\Models\Quote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuoteController extends Controller
{
    /**
     * Liste des devis du client connecté
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));

        $quotes = Quote::query()
            ->with(['items'])
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return QuoteResource::collection($quotes)
            ->additional(['success' => true]);
    }

    /**
     * Détail d’un devis
     */
    public function show(Request $request, $id)
    {
        $quote = Quote::query()
            ->with('items')
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new QuoteResource($quote),
        ]);
    }
}
