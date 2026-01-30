<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PriceHistoryResource;
use App\Models\PriceHistory;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class PriceHistoryController extends Controller
{
    public function index(Request $request)
    {
        $query = PriceHistory::query();

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->query('product_id'));
        }
        if ($request->filled('currency_code')) {
            $query->where('currency_code', $request->query('currency_code'));
        }

        ApiQuery::applyIncludes($query, $request, ['product', 'currency'], []);
        ApiQuery::applySort($query, $request->query('sort'), ['starts_at', 'ends_at', 'created_at', 'id'], '-starts_at');

        $history = $query->paginate(ApiQuery::perPage($request));

        return PriceHistoryResource::collection($history)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = PriceHistory::query();
        ApiQuery::applyIncludes($query, $request, ['product', 'currency'], ['product', 'currency']);

        $row = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new PriceHistoryResource($row),
        ]);
    }
}
