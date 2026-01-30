<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromotionResource;
use App\Models\Promotion;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index(Request $request)
    {
        $query = Promotion::query();

        ApiQuery::applySearch($query, $request->query('search'), ['name', 'type']);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        ApiQuery::applyIncludes($query, $request, ['actions', 'codes', 'products', 'categories'], []);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'name', 'priority', 'starts_at', 'ends_at', 'id'], '-created_at');

        $promotions = $query->paginate(ApiQuery::perPage($request));

        return PromotionResource::collection($promotions)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = Promotion::query();
        ApiQuery::applyIncludes($query, $request, ['actions', 'codes', 'products', 'categories'], ['actions', 'codes']);

        $promotion = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new PromotionResource($promotion),
        ]);
    }
}
