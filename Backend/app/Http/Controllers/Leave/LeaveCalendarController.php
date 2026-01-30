<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveCalendarController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $employee = $user?->employee;

        $canViewAll = $user && (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin() || $user->can('leave_manage_all'));

        return Inertia::render('Leaves/Calendar', [
            'canViewAll' => $canViewAll,
            'meEmployeeId' => $employee?->id,
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
            'employees' => $canViewAll
                ? Employee::select('id', 'first_name', 'last_name', 'department_id')
                    ->with('department:id,name')
                    ->orderBy('first_name')->orderBy('last_name')
                    ->get()
                : [],
            'leaveTypes' => LeaveType::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name_fr')
                ->get(['id', 'code', 'name_fr', 'name_ar', 'requires_attachment', 'requires_balance']),
        ]);
    }

    public function events(Request $request)
    {
        $user = $request->user();
        $actorEmployee = $user?->employee;

        $canViewAll = $user && (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin() || $user->can('leave_manage_all'));

        $start = $request->query('start') ? Carbon::parse((string) $request->query('start'))->startOfDay() : now()->startOfMonth();
        $end = $request->query('end') ? Carbon::parse((string) $request->query('end'))->startOfDay() : now()->endOfMonth();

        $employeeId = $request->integer('employee_id');
        $departmentId = $request->integer('department_id');
        $leaveTypeId = $request->integer('leave_type_id');
        $status = $request->query('status');

        $query = LeaveRequest::query()
            ->with(['employee:id,first_name,last_name,department_id', 'employee.department:id,name', 'leaveType:id,name_fr,code'])
            ->whereDate('start_date', '<=', $end->toDateString())
            ->whereDate('end_date', '>=', $start->toDateString());

        // Scoping
        if (!$canViewAll) {
            if (!$actorEmployee) {
                return response()->json([]);
            }

            // Employé: ses demandes + manager: ses reports directs
            $query->where(function ($q) use ($actorEmployee) {
                $q->where('employee_id', $actorEmployee->id)
                  ->orWhereHas('employee', fn($qq) => $qq->where('manager_id', $actorEmployee->id));
            });
        }

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        if ($departmentId) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $departmentId));
        }

        if ($leaveTypeId) {
            $query->where('leave_type_id', $leaveTypeId);
        }

        if (is_string($status) && $status !== '') {
            $query->where('status', $status);
        }

        $items = $query->get();

        $events = $items->map(function (LeaveRequest $lr) {
            $title = ($lr->employee?->first_name ? ($lr->employee->first_name . ' ' . $lr->employee->last_name) : 'Employé')
                . ' — ' . ($lr->leaveType?->name_fr ?? 'Congé');

            $color = match ($lr->status) {
                LeaveRequest::STATUS_APPROVED => '#16a34a',
                LeaveRequest::STATUS_REJECTED => '#dc2626',
                LeaveRequest::STATUS_CANCELLED => '#64748b',
                LeaveRequest::STATUS_PENDING_HR, LeaveRequest::STATUS_PENDING_MANAGER => '#d97706',
                default => '#0ea5e9',
            };

            $start = Carbon::parse($lr->start_date)->toDateString();
            $endExclusive = Carbon::parse($lr->end_date)->addDay()->toDateString();

            return [
                'id' => (string) $lr->id,
                'title' => $title,
                'start' => $start,
                'end' => $endExclusive,
                'allDay' => true,
                'backgroundColor' => $color,
                'borderColor' => $color,
                'textColor' => '#ffffff',
                'extendedProps' => [
                    'status' => $lr->status,
                    'days_count' => (float) $lr->days_count,
                    'employee_id' => $lr->employee_id,
                    'department' => $lr->employee?->department?->name,
                    'leave_type' => $lr->leaveType?->name_fr,
                ],
            ];
        })->values();

        return response()->json($events);
    }
}
