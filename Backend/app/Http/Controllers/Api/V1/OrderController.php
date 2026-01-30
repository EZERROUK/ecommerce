<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::query();

        ApiQuery::applySearch($query, $request->query('search'), [
            'order_number',
            'status',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->query('client_id'));
        }

        ApiQuery::applyIncludes($query, $request, ['items', 'client', 'user', 'quote'], []);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'order_date', 'order_number', 'total_ttc', 'status', 'id'], '-created_at');

        $orders = $query->paginate(ApiQuery::perPage($request));

        return OrderResource::collection($orders)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = Order::query();
        ApiQuery::applyIncludes($query, $request, ['items', 'client', 'user', 'quote'], ['items']);

        $order = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
        ]);
    }
}
