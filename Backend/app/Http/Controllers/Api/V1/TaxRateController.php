<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaxRateResource;
use App\Models\TaxRate;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class TaxRateController extends Controller
{
    public function index(Request $request)
    {
        $query = TaxRate::query();

        ApiQuery::applySearch($query, $request->query('search'), ['name']);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'name', 'rate', 'id'], 'name');

        $taxRates = $query->paginate(ApiQuery::perPage($request));

        return TaxRateResource::collection($taxRates)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $taxRate = TaxRate::query()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new TaxRateResource($taxRate),
        ]);
    }
}
