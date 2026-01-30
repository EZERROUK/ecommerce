<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    /**
     * Liste des commandes
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));

        $orders = Order::query()
            ->with(['items'])
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return OrderResource::collection($orders)
            ->additional(['success' => true]);
    }

    /**
     * Détail d’une commande
     */
    public function show(Request $request, $id)
    {
        $order = Order::query()
            ->with('items')
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
        ]);
    }
}
