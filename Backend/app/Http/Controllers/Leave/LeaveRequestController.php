<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveRequest;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Services\Leave\LeaveBalanceService;
use App\Services\Leave\LeaveRequestService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveRequestController extends Controller
{
    private function ensureAdminOrSuperAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user) {
            abort(403);
        }

        if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
            return;
        }

        if (method_exists($user, 'hasRole') && $user->hasRole('Admin')) {
            return;
        }

        abort(403);
    }

    private function canAccessLeave(Request $request, LeaveRequest $leaveRequest): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }

        $canViewAll = (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) || $user->can('leave_manage_all');
        if ($canViewAll) {
            return true;
        }

        $actorEmployee = $user->employee;
        if (!$actorEmployee) {
            return false;
        }

        if ((int) $leaveRequest->employee_id === (int) $actorEmployee->id) {
            return true;
        }

        $leaveRequest->loadMissing('employee:id,manager_id');
        return (int) ($leaveRequest->employee?->manager_id ?? 0) === (int) $actorEmployee->id;
    }

    private function ensureManagerFor(Request $request, LeaveRequest $leaveRequest): void
    {
        $user = $request->user();
        if (!$user) {
            abort(403);
        }

        $canViewAll = (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) || $user->can('leave_manage_all');
        if ($canViewAll) {
            return;
        }

        $actorEmployee = $user->employee;
        if (!$actorEmployee) {
            abort(403);
        }

        $leaveRequest->loadMissing('employee:id,manager_id');
        if ((int) ($leaveRequest->employee?->manager_id ?? 0) !== (int) $actorEmployee->id) {
            abort(403);
        }
    }

    private function ensureOwnerOrAdmin(Request $request, LeaveRequest $leaveRequest): void
    {
        $user = $request->user();
        if (!$user) {
            abort(403);
        }

        $canViewAll = (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) || $user->can('leave_manage_all');
        if ($canViewAll) {
            return;
        }

        $actorEmployee = $user->employee;
        if (!$actorEmployee) {
            abort(403);
        }

        if ((int) $leaveRequest->employee_id !== (int) $actorEmployee->id) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $actorEmployee = $user?->employee;
        $canViewAll = $user && (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin() || $user->can('leave_manage_all'));

        $query = LeaveRequest::query()->with(['employee.department', 'leaveType', 'actions.user']);

        if (!$canViewAll) {
            if (!$actorEmployee) {
                return Inertia::render('Leaves/Requests/Index', [
                    'items' => [],
                    'filters' => $request->only(['status', 'employee_id', 'department_id', 'leave_type_id', 'search']),
                    'departments' => [],
                    'employees' => [],
                    'leaveTypes' => [],
                    'canViewAll' => false,
                ]);
            }

            $query->where(function ($q) use ($actorEmployee) {
                $q->where('employee_id', $actorEmployee->id)
                  ->orWhereHas('employee', fn($qq) => $qq->where('manager_id', $actorEmployee->id));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }
        if ($request->filled('department_id')) {
            $query->whereHas('employee', fn($q) => $q->where('department_id', $request->integer('department_id')));
        }
        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->integer('leave_type_id'));
        }
        if ($request->filled('search')) {
            $s = '%' . trim((string) $request->query('search')) . '%';
            $query->whereHas('employee', fn($q) => $q
                ->where('first_name', 'like', $s)
                ->orWhere('last_name', 'like', $s)
                ->orWhere('employee_code', 'like', $s)
            );
        }

        $items = $query->orderByDesc('created_at')->paginate((int) $request->query('per_page', 15))->withQueryString();

        return Inertia::render('Leaves/Requests/Index', [
            'items' => $items,
            'filters' => $request->only(['status', 'employee_id', 'department_id', 'leave_type_id', 'search', 'per_page']),
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
            'employees' => $canViewAll
                ? Employee::select('id', 'first_name', 'last_name', 'department_id')->orderBy('first_name')->orderBy('last_name')->get()
                : [],
            'leaveTypes' => LeaveType::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name_fr')->get(['id','name_fr','code']),
            'canViewAll' => $canViewAll,
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();
        $employee = $user?->employee;
        $canViewAll = $user && (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin() || $user->can('leave_manage_all'));

        if (!$employee && !$canViewAll) {
            abort(403, "Aucun employé n'est associé à votre compte.");
        }

        return Inertia::render('Leaves/Requests/Create', [
            'canViewAll' => $canViewAll,
            'meEmployeeId' => $employee?->id,
            'employees' => $canViewAll
                ? Employee::select('id', 'first_name', 'last_name', 'department_id')->with('department:id,name')->orderBy('first_name')->orderBy('last_name')->get()
                : [],
            'leaveTypes' => LeaveType::query()->where('is_active', true)->orderBy('sort_order')->orderBy('name_fr')->get(['id','code','name_fr','name_ar','requires_attachment','requires_balance']),
        ]);
    }

    public function balance(Request $request, LeaveBalanceService $balances)
    {
        $user = $request->user();
        $actorEmployee = $user?->employee;
        $canViewAll = $user && (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin() || $user->can('leave_manage_all'));

        $leaveTypeId = (int) $request->integer('leave_type_id');
        if (!$leaveTypeId) {
            return response()->json(['message' => 'leave_type_id requis.'], 422);
        }

        $leaveType = LeaveType::findOrFail($leaveTypeId);
        $year = (int) ($request->integer('year') ?: now()->year);

        $employeeId = $canViewAll ? (int) $request->integer('employee_id') : (int) ($actorEmployee?->id ?? 0);
        if (!$employeeId) {
            return response()->json(['message' => 'employee_id requis.'], 422);
        }

        if (!$canViewAll && (int) ($actorEmployee?->id ?? 0) !== $employeeId) {
            abort(403);
        }

        if (!$leaveType->requires_balance) {
            return response()->json([
                'requires_balance' => false,
                'year' => $year,
                'employee_id' => $employeeId,
                'leave_type_id' => $leaveType->id,
            ]);
        }

        $employee = Employee::findOrFail($employeeId);
        $balance = $balances->getOrCreate($employee, $leaveType, $year);

        return response()->json([
            'requires_balance' => true,
            'year' => $year,
            'employee_id' => $employeeId,
            'leave_type_id' => $leaveType->id,
            'allocated_days' => (float) $balance->allocated_days,
            'used_days' => (float) $balance->used_days,
            'remaining_days' => (float) $balance->remaining_days,
        ]);
    }

    public function store(StoreLeaveRequest $request, LeaveRequestService $service)
    {
        $user = $request->user();
        $meEmployee = $user?->employee;
        $canViewAll = $user && (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin() || $user->can('leave_manage_all'));

        $employeeId = $canViewAll ? (int) ($request->input('employee_id') ?: 0) : ($meEmployee?->id ?? 0);
        if (!$employeeId) {
            return back()->withErrors(['employee_id' => "Employé requis."]);
        }

        $employee = Employee::with('manager')->findOrFail($employeeId);
        $leaveType = LeaveType::findOrFail((int) $request->input('leave_type_id'));

        $leave = $service->create(
            $employee,
            $leaveType,
            Carbon::parse((string) $request->input('start_date')),
            Carbon::parse((string) $request->input('end_date')),
            (string) ($request->input('start_half_day') ?? 'none'),
            (string) ($request->input('end_half_day') ?? 'none'),
            $request->input('reason'),
            $request->file('attachment')
        );

        return redirect()->route('leaves.requests.show', $leave->id)->with('success', 'Demande de congé créée.');
    }

    public function show(Request $request, LeaveRequest $leaveRequest)
    {
        if (!$this->canAccessLeave($request, $leaveRequest)) {
            abort(403);
        }

        $leaveRequest->load(['employee.department', 'leaveType', 'actions.user']);

        return Inertia::render('Leaves/Requests/Show', [
            'item' => $leaveRequest,
        ]);
    }

    public function destroy(Request $request, LeaveRequest $leaveRequest, LeaveRequestService $service)
    {
        $this->ensureAdminOrSuperAdmin($request);

        $service->softDelete($leaveRequest, $request->string('comment')->toString() ?: null);

        return redirect()->route('leaves.requests.index')->with('success', 'Demande supprimée.');
    }

    public function managerApprove(Request $request, LeaveRequest $leaveRequest, LeaveRequestService $service)
    {
        $this->ensureManagerFor($request, $leaveRequest);
        $service->approveManager($leaveRequest, $request->string('comment')->toString() ?: null);
        return back()->with('success', 'Demande approuvée (manager).');
    }

    public function managerReject(Request $request, LeaveRequest $leaveRequest, LeaveRequestService $service)
    {
        $this->ensureManagerFor($request, $leaveRequest);
        $service->rejectManager($leaveRequest, $request->string('comment')->toString() ?: null);
        return back()->with('success', 'Demande refusée (manager).');
    }

    public function hrApprove(Request $request, LeaveRequest $leaveRequest, LeaveRequestService $service)
    {
        $service->approveHr($leaveRequest, $request->string('comment')->toString() ?: null);
        return back()->with('success', 'Demande approuvée (RH).');
    }

    public function hrReject(Request $request, LeaveRequest $leaveRequest, LeaveRequestService $service)
    {
        $service->rejectHr($leaveRequest, $request->string('comment')->toString() ?: null);
        return back()->with('success', 'Demande refusée (RH).');
    }

    public function cancel(Request $request, LeaveRequest $leaveRequest, LeaveRequestService $service)
    {
        $this->ensureOwnerOrAdmin($request, $leaveRequest);
        $service->cancel($leaveRequest, $request->string('comment')->toString() ?: null);
        return back()->with('success', 'Demande annulée.');
    }
}
