<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeaveTypeResource;
use App\Models\LeaveType;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveType::query();

        ApiQuery::applySearch($query, $request->query('search'), ['code', 'name_fr', 'name_ar']);

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        ApiQuery::applySort($query, $request->query('sort'), ['sort_order', 'created_at', 'code', 'id'], 'sort_order');

        $types = $query->paginate(ApiQuery::perPage($request));

        return LeaveTypeResource::collection($types)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $type = LeaveType::query()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new LeaveTypeResource($type),
        ]);
    }
}
