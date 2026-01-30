<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeaveRequestResource;
use App\Models\LeaveRequest;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveRequest::query();

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }
        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->query('leave_type_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        ApiQuery::applyIncludes($query, $request, ['employee', 'leaveType', 'managerEmployee', 'managerUser', 'hrUser', 'actions'], ['employee', 'leaveType']);
        ApiQuery::applySort($query, $request->query('sort'), ['start_date', 'end_date', 'created_at', 'status', 'id'], '-created_at');

        $requests = $query->paginate(ApiQuery::perPage($request));

        return LeaveRequestResource::collection($requests)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = LeaveRequest::query();
        ApiQuery::applyIncludes($query, $request, ['employee', 'leaveType', 'managerEmployee', 'managerUser', 'hrUser', 'actions'], ['employee', 'leaveType', 'actions']);

        $leave = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new LeaveRequestResource($leave),
        ]);
    }
}
