<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockMovementResource;
use App\Models\StockMovement;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = StockMovement::query();

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->query('product_id'));
        }
        if ($request->filled('provider_id')) {
            $query->where('provider_id', $request->query('provider_id'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        ApiQuery::applyIncludes($query, $request, ['product', 'provider', 'user', 'movementReason', 'currency'], ['product', 'provider']);
        ApiQuery::applySort($query, $request->query('sort'), ['movement_date', 'created_at', 'quantity', 'id'], '-movement_date');

        $movements = $query->paginate(ApiQuery::perPage($request));

        return StockMovementResource::collection($movements)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = StockMovement::query();
        ApiQuery::applyIncludes($query, $request, ['product', 'provider', 'user', 'movementReason', 'currency', 'attachments'], ['product', 'provider']);

        $movement = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new StockMovementResource($movement),
        ]);
    }
}
