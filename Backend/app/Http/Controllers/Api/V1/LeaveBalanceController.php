<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeaveBalanceResource;
use App\Models\LeaveBalance;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class LeaveBalanceController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveBalance::query();

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }
        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->query('leave_type_id'));
        }
        if ($request->filled('year')) {
            $query->where('year', (int) $request->query('year'));
        }

        ApiQuery::applyIncludes($query, $request, ['employee', 'leaveType'], ['employee', 'leaveType']);
        ApiQuery::applySort($query, $request->query('sort'), ['year', 'allocated_days', 'used_days', 'id'], '-year');

        $balances = $query->paginate(ApiQuery::perPage($request));

        return LeaveBalanceResource::collection($balances)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = LeaveBalance::query();
        ApiQuery::applyIncludes($query, $request, ['employee', 'leaveType'], ['employee', 'leaveType']);

        $balance = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new LeaveBalanceResource($balance),
        ]);
    }
}
