<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockMovementReasonResource;
use App\Models\StockMovementReason;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class StockMovementReasonController extends Controller
{
    public function index(Request $request)
    {
        $query = StockMovementReason::query();

        ApiQuery::applySearch($query, $request->query('search'), ['name', 'type']);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'name', 'type', 'is_active', 'id'], 'name');

        $reasons = $query->paginate(ApiQuery::perPage($request));

        return StockMovementReasonResource::collection($reasons)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $reason = StockMovementReason::query()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new StockMovementReasonResource($reason),
        ]);
    }
}
