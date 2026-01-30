<?php

use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Services\Leave\LeaveRequestService;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\delete;

it('refuse la suppression (soft delete) pour un utilisateur non admin', function () {
    $user = User::factory()->create();
    actingAs($user);

    $employee = Employee::factory()->create(['created_by' => $user->id]);
    $type = LeaveType::factory()->create(['requires_balance' => false]);

    $leave = LeaveRequest::create([
        'employee_id' => $employee->id,
        'leave_type_id' => $type->id,
        'start_date' => '2026-01-05',
        'end_date' => '2026-01-06',
        'start_half_day' => 'none',
        'end_half_day' => 'none',
        'days_count' => 2,
        'status' => LeaveRequest::STATUS_PENDING_HR,
        'submitted_at' => now(),
        'created_by' => $user->id,
        'updated_by' => $user->id,
    ]);

    delete(route('leaves.requests.destroy', $leave->id, absolute: false))
        ->assertStatus(403);
});

it('autorise la suppression (soft delete) pour un Admin et crée un log action=deleted', function () {
    Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    actingAs($admin);

    $employee = Employee::factory()->create(['created_by' => $admin->id]);
    $type = LeaveType::factory()->create(['requires_balance' => false]);

    $leave = LeaveRequest::create([
        'employee_id' => $employee->id,
        'leave_type_id' => $type->id,
        'start_date' => '2026-01-05',
        'end_date' => '2026-01-06',
        'start_half_day' => 'none',
        'end_half_day' => 'none',
        'days_count' => 2,
        'status' => LeaveRequest::STATUS_PENDING_HR,
        'submitted_at' => now(),
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);

    delete(route('leaves.requests.destroy', $leave->id, absolute: false))
        ->assertRedirect(route('leaves.requests.index', absolute: false));

    expect(LeaveRequest::withTrashed()->find($leave->id)?->deleted_at)->not()->toBeNull();

    assertDatabaseHas('leave_request_actions', [
        'leave_request_id' => $leave->id,
        'action' => 'deleted',
        'user_id' => $admin->id,
    ]);
});

it('softDelete rembourse le solde si la demande était approuvée', function () {
    $admin = User::factory()->create();
    Auth::login($admin);

    $employee = Employee::factory()->create(['created_by' => $admin->id]);
    $type = LeaveType::factory()->create(['requires_balance' => true]);

    LeaveBalance::create([
        'employee_id' => $employee->id,
        'leave_type_id' => $type->id,
        'year' => 2026,
        'allocated_days' => 10,
        'used_days' => 5,
    ]);

    $leave = LeaveRequest::create([
        'employee_id' => $employee->id,
        'leave_type_id' => $type->id,
        'start_date' => '2026-01-05',
        'end_date' => '2026-01-06',
        'start_half_day' => 'none',
        'end_half_day' => 'none',
        'days_count' => 2,
        'status' => LeaveRequest::STATUS_APPROVED,
        'submitted_at' => now(),
        'created_by' => $admin->id,
        'updated_by' => $admin->id,
    ]);

    /** @var LeaveRequestService $service */
    $service = app(LeaveRequestService::class);
    $service->softDelete($leave, 'test');

    $balance = LeaveBalance::query()
        ->where('employee_id', $employee->id)
        ->where('leave_type_id', $type->id)
        ->where('year', 2026)
        ->firstOrFail();

    expect((float) $balance->used_days)->toBe(3.0);

    assertDatabaseHas('leave_request_actions', [
        'leave_request_id' => $leave->id,
        'action' => 'deleted',
        'user_id' => $admin->id,
    ]);
});
