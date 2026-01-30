<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuoteResource;
use App\Models\Quote;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        $query = Quote::query();

        ApiQuery::applySearch($query, $request->query('search'), [
            'quote_number',
            'status',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->query('client_id'));
        }

        ApiQuery::applyIncludes($query, $request, ['items', 'client', 'user', 'statusHistories'], []);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'quote_date', 'quote_number', 'total_ttc', 'status', 'id'], '-created_at');

        $quotes = $query->paginate(ApiQuery::perPage($request));

        return QuoteResource::collection($quotes)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = Quote::query();
        ApiQuery::applyIncludes($query, $request, ['items', 'client', 'user', 'statusHistories'], ['items']);

        $quote = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new QuoteResource($quote),
        ]);
    }
}
