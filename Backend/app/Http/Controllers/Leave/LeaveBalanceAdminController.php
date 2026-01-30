<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeaveBalanceAdminController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->integer('year') ?: (int) now()->year;
        $leaveTypeId = $request->integer('leave_type_id');

        $leaveTypes = LeaveType::query()
            ->orderBy('sort_order')
            ->orderBy('name_fr')
            ->get(['id', 'code', 'name_fr', 'requires_balance']);

        $employees = Employee::query()
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name']);

        $balances = LeaveBalance::query()
            ->where('year', $year)
            ->when($leaveTypeId, fn($q) => $q->where('leave_type_id', $leaveTypeId))
            ->with(['employee:id,first_name,last_name', 'leaveType:id,name_fr,code,requires_balance'])
            ->orderBy('employee_id')
            ->paginate((int) $request->query('per_page', 50))
            ->withQueryString();

        return Inertia::render('Leaves/Admin/Balances/Index', [
            'year' => $year,
            'leaveTypeId' => $leaveTypeId,
            'leaveTypes' => $leaveTypes,
            'employees' => $employees,
            'items' => $balances,
        ]);
    }

    public function upsert(Request $request)
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'leave_type_id' => ['required', 'integer', 'exists:leave_types,id'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'allocated_days' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($data) {
            LeaveBalance::query()->updateOrCreate(
                [
                    'employee_id' => $data['employee_id'],
                    'leave_type_id' => $data['leave_type_id'],
                    'year' => $data['year'],
                ],
                [
                    'allocated_days' => $data['allocated_days'],
                ]
            );
        });

        return back()->with('success', 'Solde mis à jour.');
    }
}
