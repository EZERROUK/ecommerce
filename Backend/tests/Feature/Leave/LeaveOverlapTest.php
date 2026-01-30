<?php

use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Services\Leave\LeaveRequestService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

it('refuse une demande qui chevauche une demande existante', function () {
    $actor = User::factory()->create();
    Auth::login($actor);

    $employee = Employee::factory()->create(['created_by' => $actor->id]);
    $type = LeaveType::factory()->create(['requires_balance' => false]);

    LeaveRequest::create([
        'employee_id' => $employee->id,
        'leave_type_id' => $type->id,
        'start_date' => '2026-01-05',
        'end_date' => '2026-01-06',
        'start_half_day' => 'none',
        'end_half_day' => 'none',
        'days_count' => 2,
        'status' => LeaveRequest::STATUS_APPROVED,
        'submitted_at' => now(),
        'created_by' => $actor->id,
        'updated_by' => $actor->id,
    ]);

    /** @var LeaveRequestService $service */
    $service = app(LeaveRequestService::class);

    $thrown = false;
    try {
        $service->create(
            $employee,
            $type,
            Carbon::parse('2026-01-06'),
            Carbon::parse('2026-01-06'),
            'none',
            'none',
            'Test overlap',
            null
        );
    } catch (ValidationException $e) {
        $thrown = true;
        expect($e->errors())->toHaveKey('date');
    }

    expect($thrown)->toBeTrue();
});
