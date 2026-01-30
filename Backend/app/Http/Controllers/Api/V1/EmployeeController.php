<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Support\Api\ApiQuery;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::query();

        ApiQuery::applySearch($query, $request->query('search'), [
            'first_name',
            'last_name',
            'employee_code',
            'email',
            'phone_number',
            'cin',
        ]);

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }
        if ($request->filled('manager_id')) {
            $query->where('manager_id', $request->query('manager_id'));
        }
        if ($request->filled('is_manager')) {
            $query->where('is_manager', filter_var($request->query('is_manager'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        ApiQuery::applyIncludes($query, $request, ['department', 'manager', 'user'], []);
        ApiQuery::applySort($query, $request->query('sort'), ['created_at', 'last_name', 'first_name', 'employee_code', 'id'], 'last_name');

        $employees = $query->paginate(ApiQuery::perPage($request));

        return EmployeeResource::collection($employees)
            ->additional(['success' => true]);
    }

    public function show(Request $request, string $id)
    {
        $query = Employee::query();
        ApiQuery::applyIncludes($query, $request, ['department', 'manager', 'reports', 'user'], ['department', 'manager']);

        $employee = $query->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new EmployeeResource($employee),
        ]);
    }
}
