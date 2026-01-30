<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CurrencyResource;
use App\Models\Currency;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class CurrencyController extends Controller
{
    public function index(Request $request)
    {
        $query = Currency::query();

        ApiQuery::applySearch($query, $request->query('search'), ['code', 'name', 'symbol']);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'code', 'name'], 'code');

        $currencies = $query->paginate(ApiQuery::perPage($request));

        return CurrencyResource::collection($currencies)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $code)
    {
        $currency = Currency::query()->findOrFail($code);

        return response()->json([
            'success' => true,
            'data' => new CurrencyResource($currency),
        ]);
    }
}
