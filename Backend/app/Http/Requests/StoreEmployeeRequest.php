<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Identité / contact
            'first_name'     => ['required','string','max:255'],
            'last_name'      => ['required','string','max:255'],
            'employee_code'  => ['nullable','string','max:255','unique:employees,employee_code'],
            'cin'            => ['required','string','max:255','unique:employees,cin'],
            'cnss_number'    => ['nullable','string','max:255','unique:employees,cnss_number'],
            'photo'          => ['nullable','image','max:2048'], // 2Mo
            'cv'             => ['nullable','file','mimes:pdf,doc,docx','max:5120'],
            'contract'       => ['nullable','file','mimes:pdf,doc,docx','max:5120'],
            'email'          => ['required','email','unique:employees,email'],
            'phone_number'   => ['nullable','string','max:20'],
            'address'        => ['nullable','string'],
            'date_of_birth'  => ['required','date'],

            // Poste & orga
            'position'       => ['required','string','max:255'],
            'department_id'  => ['nullable','exists:departments,id'],
            'status'         => ['required','in:active,inactive'],
            'hire_date'      => ['required','date'],
            'departure_date' => ['nullable','date','after_or_equal:hire_date'],

            // Orga & suivi
            'manager_id'         => [
                'nullable',
                Rule::exists('employees', 'id')->where(fn ($q) => $q->where('is_manager', true)),
            ],
            'is_manager'         => ['nullable','boolean'],
            'location'           => ['nullable','string','max:255'],
            'probation_end_date' => ['nullable','date','after_or_equal:hire_date'],
            'last_review_date'   => ['nullable','date','after_or_equal:hire_date'],
            'notes'              => ['nullable','string'],

            // Rémunération & contrat
            'employment_type' => ['required','in:permanent,fixed_term,intern,contractor,apprentice'],
            'contract_type'   => ['required','in:full_time,part_time,temp,freelance'],
            'work_schedule'   => ['nullable','array'],
            'salary_gross'    => ['required','numeric','min:0'],
            'salary_currency' => ['required','string','size:3'],
            'pay_frequency'   => ['required','in:monthly,weekly,biweekly,hourly'],
            'hourly_rate'     => ['nullable','numeric','min:0'],
            'bonus_target'    => ['nullable','numeric','min:0'],
            'benefits'        => ['nullable','array'],
            'cost_center'     => ['nullable','string','max:255'],

            // Sécurité / bancaire
            'emergency_contact_name'  => ['nullable','string','max:255'],
            'emergency_contact_phone' => ['nullable','string','max:50'],
            'bank_iban'               => ['nullable','string','max:255'],
            'bank_rib'                => ['nullable','string','max:255','unique:employees,bank_rib'],
        ];
    }
}
