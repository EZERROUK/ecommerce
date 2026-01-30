<?php

use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\User;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

it('balance endpoint retourne requires_balance=false si le type ne requiert pas de solde', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'leave_create', 'guard_name' => 'web']);
    $user->givePermissionTo('leave_create');

    $employee = Employee::factory()->create([
        'user_id' => $user->id,
        'created_by' => $user->id,
    ]);

    $type = LeaveType::factory()->create([
        'requires_balance' => false,
    ]);

    actingAs($user);

    getJson(route('leaves.requests.balance', [
        'leave_type_id' => $type->id,
        'year' => 2026,
    ], absolute: false))
        ->assertOk()
        ->assertJson([
            'requires_balance' => false,
            'year' => 2026,
            'employee_id' => $employee->id,
            'leave_type_id' => $type->id,
        ])
        ->assertJsonMissing(['allocated_days', 'used_days', 'remaining_days']);
});

it('balance endpoint retourne allocated/used/remaining quand requires_balance=true', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'leave_create', 'guard_name' => 'web']);
    $user->givePermissionTo('leave_create');

    $employee = Employee::factory()->create([
        'user_id' => $user->id,
        'created_by' => $user->id,
    ]);

    $type = LeaveType::factory()->create([
        'requires_balance' => true,
    ]);

    LeaveBalance::create([
        'employee_id' => $employee->id,
        'leave_type_id' => $type->id,
        'year' => 2026,
        'allocated_days' => 10,
        'used_days' => 3,
    ]);

    actingAs($user);

    getJson(route('leaves.requests.balance', [
        'leave_type_id' => $type->id,
        'year' => 2026,
    ], absolute: false))
        ->assertOk()
        ->assertJson([
            'requires_balance' => true,
            'year' => 2026,
            'employee_id' => $employee->id,
            'leave_type_id' => $type->id,
        ])
        ->assertJsonPath('allocated_days', 10)
        ->assertJsonPath('used_days', 3)
        ->assertJsonPath('remaining_days', 7);
});

it("balance endpoint renvoie 422 si l'utilisateur n'a pas d'employé associé", function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'leave_create', 'guard_name' => 'web']);
    $user->givePermissionTo('leave_create');

    $type = LeaveType::factory()->create([
        'requires_balance' => true,
    ]);

    actingAs($user);

    getJson(route('leaves.requests.balance', [
        'leave_type_id' => $type->id,
        'year' => 2026,
    ], absolute: false))
        ->assertStatus(422)
        ->assertJsonPath('message', 'employee_id requis.');
});
