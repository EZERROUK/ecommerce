<?php

namespace App\Services\Leave;

use App\Models\Employee;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Validation\ValidationException;

class LeaveOverlapService
{
    /**
     * Vérifie les chevauchements (incluant demi-journées) avec les congés existants
     * qui bloquent (pending_manager, pending_hr, approved).
     */
    public function assertNoOverlap(
        Employee $employee,
        Carbon $startDate,
        Carbon $endDate,
        string $startHalfDay,
        string $endHalfDay,
        ?int $ignoreLeaveRequestId = null
    ): void {
        $start = $startDate->copy()->startOfDay();
        $end = $endDate->copy()->startOfDay();

        $query = LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->whereIn('status', [
                LeaveRequest::STATUS_PENDING_MANAGER,
                LeaveRequest::STATUS_PENDING_HR,
                LeaveRequest::STATUS_APPROVED,
            ])
            ->whereDate('start_date', '<=', $end->toDateString())
            ->whereDate('end_date', '>=', $start->toDateString());

        if ($ignoreLeaveRequestId) {
            $query->where('id', '!=', $ignoreLeaveRequestId);
        }

        $existing = $query->get(['id', 'start_date', 'end_date', 'start_half_day', 'end_half_day', 'status']);
        if ($existing->isEmpty()) {
            return;
        }

        $requested = $this->buildSlots($start, $end, $startHalfDay, $endHalfDay);

        foreach ($existing as $leave) {
            $slots = $this->buildSlots(
                Carbon::parse($leave->start_date),
                Carbon::parse($leave->end_date),
                (string) $leave->start_half_day,
                (string) $leave->end_half_day
            );

            foreach ($requested as $date => $reqSlots) {
                if (!isset($slots[$date])) {
                    continue;
                }
                $overlap = array_intersect($reqSlots, $slots[$date]);
                if (!empty($overlap)) {
                    throw ValidationException::withMessages([
                        'date' => "Chevauchement détecté avec un congé existant (#{$leave->id}) le {$date}.",
                    ]);
                }
            }
        }
    }

    /**
     * Construit une map date => ['am','pm'] occupés.
     * @return array<string, array<int, string>>
     */
    private function buildSlots(Carbon $start, Carbon $end, string $startHalfDay, string $endHalfDay): array
    {
        $start = $start->copy()->startOfDay();
        $end = $end->copy()->startOfDay();

        $map = [];

        foreach (CarbonPeriod::create($start, $end) as $day) {
            /** @var Carbon $day */
            $date = $day->toDateString();

            $isFirst = $day->equalTo($start);
            $isLast = $day->equalTo($end);
            $isSingle = $start->equalTo($end);

            $map[$date] = $this->slotsForDay($startHalfDay, $endHalfDay, $isFirst, $isLast, $isSingle);
        }

        return $map;
    }

    /**
     * @return array<int, string>
     */
    private function slotsForDay(string $startHalfDay, string $endHalfDay, bool $isFirst, bool $isLast, bool $isSingle): array
    {
        $startHalfDay = $startHalfDay ?: 'none';
        $endHalfDay = $endHalfDay ?: 'none';

        if ($isSingle) {
            if ($startHalfDay === 'none' && $endHalfDay === 'none') return ['am', 'pm'];
            if ($startHalfDay !== 'none' && $endHalfDay !== 'none') {
                if ($startHalfDay === 'am' && $endHalfDay === 'pm') return ['am', 'pm'];
                if ($startHalfDay === $endHalfDay) return [$startHalfDay];
                return ['am', 'pm'];
            }
            $half = $startHalfDay !== 'none' ? $startHalfDay : $endHalfDay;
            return [$half === 'none' ? 'am' : $half];
        }

        // Multi-jours
        if ($isFirst) {
            return $startHalfDay === 'pm' ? ['pm'] : ['am', 'pm'];
        }
        if ($isLast) {
            return $endHalfDay === 'am' ? ['am'] : ['am', 'pm'];
        }
        return ['am', 'pm'];
    }
}
