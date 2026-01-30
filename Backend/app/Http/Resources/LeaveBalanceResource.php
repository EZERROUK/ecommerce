<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LeaveBalanceResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'employee_id'   => $this->employee_id,
            'leave_type_id' => $this->leave_type_id,
            'year'          => $this->year,
            'allocated_days'=> $this->allocated_days,
            'used_days'     => $this->used_days,
            'remaining_days'=> $this->remaining_days,
            'created_at'    => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'    => optional($this->updated_at)?->format('Y-m-d H:i'),

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
