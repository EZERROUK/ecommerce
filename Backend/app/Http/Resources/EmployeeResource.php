<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                   => $this->id,
            'first_name'           => $this->first_name,
            'last_name'            => $this->last_name,
            'full_name'            => $this->full_name,
            'employee_code'        => $this->employee_code,
            'cin'                  => $this->cin,
            'cnss_number'          => $this->cnss_number,
            'photo'                => $this->photo,
            'cv_path'              => $this->cv_path,
            'contract_path'        => $this->contract_path,
            'email'                => $this->email,
            'phone_number'         => $this->phone_number,
            'address'              => $this->address,
            'date_of_birth'        => optional($this->date_of_birth)?->toDateString(),

            'position'             => $this->position,
            'department_id'        => $this->department_id,
            'status'               => $this->status,
            'hire_date'            => optional($this->hire_date)?->toDateString(),
            'departure_date'       => optional($this->departure_date)?->toDateString(),

            'manager_id'           => $this->manager_id,
            'is_manager'           => (bool) $this->is_manager,
            'location'             => $this->location,
            'probation_end_date'   => optional($this->probation_end_date)?->toDateString(),
            'last_review_date'     => optional($this->last_review_date)?->toDateString(),
            'notes'                => $this->notes,

            'employment_type'      => $this->employment_type,
            'contract_type'        => $this->contract_type,
            'work_schedule'        => $this->work_schedule,
            'salary_gross'         => $this->salary_gross,
            'salary_currency'      => $this->salary_currency,
            'pay_frequency'        => $this->pay_frequency,
            'hourly_rate'          => $this->hourly_rate,
            'bonus_target'         => $this->bonus_target,
            'benefits'             => $this->benefits,
            'cost_center'          => $this->cost_center,

            'emergency_contact_name'=> $this->emergency_contact_name,
            'emergency_contact_phone'=> $this->emergency_contact_phone,
            'bank_iban'            => $this->bank_iban,
            'bank_rib'             => $this->bank_rib,

            'created_by'           => $this->created_by,
            'user_id'              => $this->user_id,
            'created_at'           => optional($this->created_at)?->format('Y-m-d H:i'),
            'updated_at'           => optional($this->updated_at)?->format('Y-m-d H:i'),
            'deleted_at'           => optional($this->deleted_at)?->format('Y-m-d H:i'),

            'department' => $this->whenLoaded('department', fn () => [
                'id'   => $this->department?->id,
                'name' => $this->department?->name,
            ]),
            'manager' => $this->whenLoaded('manager', fn () => [
                'id'        => $this->manager?->id,
                'full_name' => $this->manager?->full_name,
            ]),
        ];
    }
}
