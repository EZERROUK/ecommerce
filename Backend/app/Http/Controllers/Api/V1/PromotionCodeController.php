<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromotionCodeResource;
use App\Models\PromotionCode;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class PromotionCodeController extends Controller
{
    public function index(Request $request)
    {
        $query = PromotionCode::query();

        ApiQuery::applySearch($query, $request->query('search'), ['code']);

        if ($request->filled('promotion_id')) {
            $query->where('promotion_id', $request->query('promotion_id'));
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        ApiQuery::applyIncludes($query, $request, ['promotion'], []);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'code', 'uses', 'id'], '-created_at');

        $codes = $query->paginate(ApiQuery::perPage($request));

        return PromotionCodeResource::collection($codes)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = PromotionCode::query();
        ApiQuery::applyIncludes($query, $request, ['promotion'], ['promotion']);

        $code = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new PromotionCodeResource($code),
        ]);
    }
}
