<?php

namespace App\Services\Leave;

use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveRequestAction;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class LeaveRequestService
{
    public function __construct(
        private readonly LeaveDayCalculator $calculator,
        private readonly LeaveOverlapService $overlap,
        private readonly LeaveBalanceService $balances,
    ) {}

    public function create(
        Employee $employee,
        LeaveType $type,
        Carbon $startDate,
        Carbon $endDate,
        string $startHalfDay,
        string $endHalfDay,
        ?string $reason,
        ?UploadedFile $attachment
    ): LeaveRequest {
        if ($endDate->lt($startDate)) {
            throw ValidationException::withMessages(['end_date' => 'La date de fin doit être >= date de début.']);
        }

        if ($type->requires_attachment && !$attachment) {
            throw ValidationException::withMessages(['attachment' => 'Justificatif requis pour ce type de congé.']);
        }

        $days = $this->calculator->calculate($employee, $startDate, $endDate, $startHalfDay, $endHalfDay);
        if ($days <= 0) {
            throw ValidationException::withMessages(['days_count' => "La période sélectionnée ne contient aucun jour ouvré."]);
        }

        $this->overlap->assertNoOverlap($employee, $startDate, $endDate, $startHalfDay, $endHalfDay);
        $this->balances->assertSufficient($employee, $type, $startDate, $days);

        $managerEmployee = $employee->manager;
        $managerUserId = $managerEmployee?->user_id;

        $status = $managerEmployee ? LeaveRequest::STATUS_PENDING_MANAGER : LeaveRequest::STATUS_PENDING_HR;

        return DB::transaction(function () use ($employee, $type, $startDate, $endDate, $startHalfDay, $endHalfDay, $days, $reason, $attachment, $managerEmployee, $managerUserId, $status) {
            $attachmentPath = null;
            if ($attachment) {
                $attachmentPath = $attachment->store('leave/attachments', 'public');
            }

            /** @var \App\Models\User|null $actor */
            $actor = Auth::user();

            $leave = LeaveRequest::create([
                'employee_id' => $employee->id,
                'leave_type_id' => $type->id,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'start_half_day' => $startHalfDay,
                'end_half_day' => $endHalfDay,
                'days_count' => $days,
                'status' => $status,
                'reason' => $reason,
                'attachment_path' => $attachmentPath,
                'manager_employee_id' => $managerEmployee?->id,
                'manager_user_id' => $managerUserId,
                'submitted_at' => now(),
                'created_by' => $actor?->id,
                'updated_by' => $actor?->id,
            ]);

            LeaveRequestAction::create([
                'leave_request_id' => $leave->id,
                'user_id' => $actor?->id,
                'action' => 'submitted',
                'comment' => null,
                'meta' => [
                    'days_count' => $days,
                    'status' => $status,
                ],
            ]);

            return $leave;
        });
    }

    public function approveManager(LeaveRequest $leave, ?string $comment = null): LeaveRequest
    {
        if ($leave->status !== LeaveRequest::STATUS_PENDING_MANAGER) {
            throw ValidationException::withMessages(['status' => 'Demande non en attente du manager.']);
        }

        /** @var \App\Models\User|null $actor */
        $actor = Auth::user();

        $leave->status = LeaveRequest::STATUS_PENDING_HR;
        $leave->manager_user_id = $actor?->id;
        $leave->manager_actioned_at = now();
        $leave->updated_by = $actor?->id;
        $leave->save();

        LeaveRequestAction::create([
            'leave_request_id' => $leave->id,
            'user_id' => $actor?->id,
            'action' => 'approved_manager',
            'comment' => $comment,
        ]);

        return $leave;
    }

    public function rejectManager(LeaveRequest $leave, ?string $comment = null): LeaveRequest
    {
        if ($leave->status !== LeaveRequest::STATUS_PENDING_MANAGER) {
            throw ValidationException::withMessages(['status' => 'Demande non en attente du manager.']);
        }

        /** @var \App\Models\User|null $actor */
        $actor = Auth::user();

        $leave->status = LeaveRequest::STATUS_REJECTED;
        $leave->manager_user_id = $actor?->id;
        $leave->manager_actioned_at = now();
        $leave->updated_by = $actor?->id;
        $leave->save();

        LeaveRequestAction::create([
            'leave_request_id' => $leave->id,
            'user_id' => $actor?->id,
            'action' => 'rejected_manager',
            'comment' => $comment,
        ]);

        return $leave;
    }

    public function approveHr(LeaveRequest $leave, ?string $comment = null): LeaveRequest
    {
        if ($leave->status !== LeaveRequest::STATUS_PENDING_HR) {
            throw ValidationException::withMessages(['status' => 'Demande non en attente RH.']);
        }

        $leave->loadMissing(['employee', 'leaveType']);

        /** @var \App\Models\User|null $actor */
        $actor = Auth::user();

        DB::transaction(function () use ($leave, $actor, $comment) {
            $leave->status = LeaveRequest::STATUS_APPROVED;
            $leave->hr_user_id = $actor?->id;
            $leave->hr_actioned_at = now();
            $leave->updated_by = $actor?->id;
            $leave->save();

            LeaveRequestAction::create([
                'leave_request_id' => $leave->id,
                'user_id' => $actor?->id,
                'action' => 'approved_hr',
                'comment' => $comment,
            ]);

            $this->balances->consume(
                $leave->employee,
                $leave->leaveType,
                Carbon::parse($leave->start_date),
                (float) $leave->days_count
            );
        });

        return $leave;
    }

    public function rejectHr(LeaveRequest $leave, ?string $comment = null): LeaveRequest
    {
        if ($leave->status !== LeaveRequest::STATUS_PENDING_HR) {
            throw ValidationException::withMessages(['status' => 'Demande non en attente RH.']);
        }

        /** @var \App\Models\User|null $actor */
        $actor = Auth::user();

        $leave->status = LeaveRequest::STATUS_REJECTED;
        $leave->hr_user_id = $actor?->id;
        $leave->hr_actioned_at = now();
        $leave->updated_by = $actor?->id;
        $leave->save();

        LeaveRequestAction::create([
            'leave_request_id' => $leave->id,
            'user_id' => $actor?->id,
            'action' => 'rejected_hr',
            'comment' => $comment,
        ]);

        return $leave;
    }

    public function cancel(LeaveRequest $leave, ?string $comment = null): LeaveRequest
    {
        if (in_array($leave->status, [LeaveRequest::STATUS_CANCELLED, LeaveRequest::STATUS_REJECTED], true)) {
            throw ValidationException::withMessages(['status' => 'Demande déjà clôturée.']);
        }

        $leave->loadMissing(['employee', 'leaveType']);

        /** @var \App\Models\User|null $actor */
        $actor = Auth::user();

        DB::transaction(function () use ($leave, $actor, $comment) {
            $wasApproved = $leave->status === LeaveRequest::STATUS_APPROVED;

            $leave->status = LeaveRequest::STATUS_CANCELLED;
            $leave->cancelled_at = now();
            $leave->updated_by = $actor?->id;
            $leave->save();

            LeaveRequestAction::create([
                'leave_request_id' => $leave->id,
                'user_id' => $actor?->id,
                'action' => 'cancelled',
                'comment' => $comment,
            ]);

            if ($wasApproved) {
                $this->balances->refund(
                    $leave->employee,
                    $leave->leaveType,
                    Carbon::parse($leave->start_date),
                    (float) $leave->days_count
                );
            }
        });

        return $leave;
    }

    public function deleteAttachmentIfAny(LeaveRequest $leave): void
    {
        if (!$leave->attachment_path) {
            return;
        }
        Storage::disk('public')->delete($leave->attachment_path);
    }

    public function softDelete(LeaveRequest $leave, ?string $comment = null): void
    {
        $leave->loadMissing(['employee', 'leaveType']);

        /** @var \App\Models\User|null $actor */
        $actor = Auth::user();

        DB::transaction(function () use ($leave, $actor, $comment) {
            $wasApproved = $leave->status === LeaveRequest::STATUS_APPROVED;

            LeaveRequestAction::create([
                'leave_request_id' => $leave->id,
                'user_id' => $actor?->id,
                'action' => 'deleted',
                'comment' => $comment,
                'meta' => [
                    'status' => $leave->status,
                    'days_count' => (float) $leave->days_count,
                ],
            ]);

            if ($wasApproved) {
                $this->balances->refund(
                    $leave->employee,
                    $leave->leaveType,
                    Carbon::parse($leave->start_date),
                    (float) $leave->days_count
                );
            }

            $leave->updated_by = $actor?->id;
            $leave->save();
            $leave->delete();
        });
    }
}
