<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class LeaveRequestResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                   => $this->id,
            'employee_id'          => $this->employee_id,
            'leave_type_id'        => $this->leave_type_id,
            'start_date'           => optional($this->start_date)?->toDateString(),
            'end_date'             => optional($this->end_date)?->toDateString(),
            'start_half_day'       => (bool) $this->start_half_day,
            'end_half_day'         => (bool) $this->end_half_day,
            'days_count'           => $this->days_count,
            'status'               => $this->status,
            'reason'               => $this->reason,
            'attachment_path'      => $this->attachment_path,
            'attachment_url'       => $this->attachment_path ? Storage::url($this->attachment_path) : null,
            'manager_employee_id'  => $this->manager_employee_id,
            'manager_user_id'      => $this->manager_user_id,
            'manager_actioned_at'  => optional($this->manager_actioned_at)?->format('Y-m-d H:i'),
            'hr_user_id'           => $this->hr_user_id,
            'hr_actioned_at'       => optional($this->hr_actioned_at)?->format('Y-m-d H:i'),
            'submitted_at'         => optional($this->submitted_at)?->format('Y-m-d H:i'),
            'cancelled_at'         => optional($this->cancelled_at)?->format('Y-m-d H:i'),
            'created_by'           => $this->created_by,
            'updated_by'           => $this->updated_by,
            'created_at'           => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'           => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at'           => optional($this->deleted_at)?->format('Y-m-d H:i'),

            'employee' => $this->whenLoaded('employee', fn () => [
                'id'        => $this->employee?->id,
                'full_name' => $this->employee?->full_name,
            ]),
            'leave_type' => $this->whenLoaded('leaveType', fn () => [
                'id'      => $this->leaveType?->id,
                'code'    => $this->leaveType?->code,
                'name_fr' => $this->leaveType?->name_fr,
            ]),
        ];
    }
}
