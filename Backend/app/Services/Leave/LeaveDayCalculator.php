<?php

namespace App\Services\Leave;

use App\Models\Employee;
use App\Models\Holiday;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class LeaveDayCalculator
{
    /**
     * Calcule le nombre de jours de congé (jours ouvrés - jours fériés),
     * avec support demi-journée.
     *
     * Convention demi-journée:
     * - Sur une demande multi-jours: start_half_day = 'pm' => 1/2 journée le 1er jour; end_half_day = 'am' => 1/2 journée le dernier jour.
     * - Sur une demande sur 1 seul jour: start_half_day ou end_half_day peut être 'am' ou 'pm'.
     */
    public function calculate(
        Employee $employee,
        Carbon $startDate,
        Carbon $endDate,
        string $startHalfDay = 'none',
        string $endHalfDay = 'none'
    ): float {
        $start = $startDate->copy()->startOfDay();
        $end = $endDate->copy()->startOfDay();

        if ($end->lt($start)) {
            return 0.0;
        }

        $holidayMap = $this->buildHolidayMap($start, $end);

        $count = 0.0;
        foreach (CarbonPeriod::create($start, $end) as $day) {
            /** @var Carbon $day */
            if (!$this->isWorkingDay($employee, $day)) {
                continue;
            }

            $key = $day->toDateString();
            if (isset($holidayMap[$key])) {
                continue;
            }

            $count += 1.0;
        }

        // Demi-journées
        if ($count <= 0) {
            return 0.0;
        }

        if ($start->equalTo($end)) {
            // Sur 1 seul jour
            $slots = $this->singleDaySlots($startHalfDay, $endHalfDay);
            return $count > 0 ? (count($slots) === 2 ? 1.0 : 0.5) : 0.0;
        }

        // Multi-jours
        if ($startHalfDay === 'pm' && $this->isCountedWorkingDay($employee, $start, $holidayMap)) {
            $count -= 0.5;
        }
        if ($endHalfDay === 'am' && $this->isCountedWorkingDay($employee, $end, $holidayMap)) {
            $count -= 0.5;
        }

        return max(0.0, round($count, 2));
    }

    private function isCountedWorkingDay(Employee $employee, Carbon $day, array $holidayMap): bool
    {
        if (!$this->isWorkingDay($employee, $day)) {
            return false;
        }
        return !isset($holidayMap[$day->toDateString()]);
    }

    private function buildHolidayMap(Carbon $start, Carbon $end): array
    {
        $map = [];

        $range = Holiday::query()
            ->whereNull('deleted_at')
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get(['date', 'is_recurring']);

        foreach ($range as $h) {
            $date = $this->asCarbonDate($h->date);
            $map[$date->toDateString()] = true;
        }

        // Jours fériés récurrents (même jour/mois chaque année)
        $recurring = Holiday::query()
            ->whereNull('deleted_at')
            ->where('is_recurring', true)
            ->get(['date']);

        if ($recurring->isNotEmpty()) {
            $recurringMonthDay = $recurring
                ->map(function ($h) {
                    /** @var \Carbon\Carbon $d */
                    $d = $this->asCarbonDate($h->date);
                    return $d->format('m-d');
                })
                ->unique()
                ->values();

            foreach (CarbonPeriod::create($start, $end) as $day) {
                /** @var Carbon $day */
                if ($recurringMonthDay->contains($day->format('m-d'))) {
                    $map[$day->toDateString()] = true;
                }
            }
        }

        return $map;
    }

    private function asCarbonDate(mixed $value): Carbon
    {
        if ($value instanceof Carbon) {
            return $value;
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value);
        }

        return Carbon::parse($value);
    }

    private function isWorkingDay(Employee $employee, Carbon $day): bool
    {
        $schedule = (array) ($employee->work_schedule ?? []);

        $key = strtolower($day->englishDayOfWeek); // monday...
        $enabled = null;

        if (array_key_exists($key, $schedule)) {
            $cfg = $schedule[$key];
            if (is_array($cfg) && array_key_exists('enabled', $cfg)) {
                $enabled = (bool) $cfg['enabled'];
            } else {
                // si une plage "09:00-17:00" est définie, on considère ouvré
                $enabled = true;
            }
        }

        if ($enabled !== null) {
            return $enabled;
        }

        // fallback: semaine de travail standard (lun-ven)
        return !in_array($day->dayOfWeekIso, [6, 7], true); // 6=samedi, 7=dimanche
    }

    /**
     * Retourne les slots occupés pour une demande sur 1 seul jour.
     * @return array<int, string> ['am'], ['pm'] ou ['am','pm']
     */
    private function singleDaySlots(string $startHalfDay, string $endHalfDay): array
    {
        $startHalfDay = $startHalfDay ?: 'none';
        $endHalfDay = $endHalfDay ?: 'none';

        if ($startHalfDay === 'none' && $endHalfDay === 'none') {
            return ['am', 'pm'];
        }

        // Si les deux sont présents
        if ($startHalfDay !== 'none' && $endHalfDay !== 'none') {
            if ($startHalfDay === 'am' && $endHalfDay === 'pm') {
                return ['am', 'pm'];
            }
            if ($startHalfDay === $endHalfDay) {
                return [$startHalfDay];
            }
            // cas incohérent (pm -> am)
            return ['am', 'pm'];
        }

        // Un seul côté défini: demi-journée
        $half = $startHalfDay !== 'none' ? $startHalfDay : $endHalfDay;
        return [$half === 'none' ? 'am' : $half];
    }
}
