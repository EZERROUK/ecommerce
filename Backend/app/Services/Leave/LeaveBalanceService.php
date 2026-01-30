<?php

namespace App\Services\Leave;

use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeaveBalanceService
{
    public function getOrCreate(Employee $employee, LeaveType $type, int $year): LeaveBalance
    {
        return LeaveBalance::query()->firstOrCreate(
            [
                'employee_id' => $employee->id,
                'leave_type_id' => $type->id,
                'year' => $year,
            ],
            [
                'allocated_days' => 0,
                'used_days' => 0,
            ]
        );
    }

    public function assertSufficient(Employee $employee, LeaveType $type, Carbon $startDate, float $daysRequested): void
    {
        if (!$type->requires_balance) {
            return;
        }

        $year = (int) $startDate->year;
        $balance = $this->getOrCreate($employee, $type, $year);
        $remaining = (float) $balance->remaining_days;

        if ($daysRequested > $remaining) {
            throw ValidationException::withMessages([
                'days_count' => "Solde insuffisant. Restant: {$remaining} jours.",
            ]);
        }
    }

    public function consume(Employee $employee, LeaveType $type, Carbon $startDate, float $days): void
    {
        if (!$type->requires_balance || $days <= 0) {
            return;
        }

        $year = (int) $startDate->year;

        DB::transaction(function () use ($employee, $type, $year, $days) {
            $balance = LeaveBalance::query()
                ->where('employee_id', $employee->id)
                ->where('leave_type_id', $type->id)
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if (!$balance) {
                $balance = LeaveBalance::create([
                    'employee_id' => $employee->id,
                    'leave_type_id' => $type->id,
                    'year' => $year,
                    'allocated_days' => 0,
                    'used_days' => 0,
                ]);
            }

            $balance->used_days = (float) $balance->used_days + (float) $days;
            $balance->save();
        });
    }

    public function refund(Employee $employee, LeaveType $type, Carbon $startDate, float $days): void
    {
        if (!$type->requires_balance || $days <= 0) {
            return;
        }

        $year = (int) $startDate->year;

        DB::transaction(function () use ($employee, $type, $year, $days) {
            $balance = LeaveBalance::query()
                ->where('employee_id', $employee->id)
                ->where('leave_type_id', $type->id)
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if (!$balance) {
                return;
            }

            $balance->used_days = max(0, (float) $balance->used_days - (float) $days);
            $balance->save();
        });
    }
}
