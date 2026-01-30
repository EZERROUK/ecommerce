<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'employee_code' => $this->faker->unique()->bothify('EMP-####'),
            'cin' => $this->faker->unique()->bothify('??######'),
            'cnss_number' => $this->faker->boolean(70) ? $this->faker->unique()->bothify('CNSS-#####') : null,
            'photo' => null,
            'cv_path' => null,
            'contract_path' => null,
            'email' => $this->faker->unique()->safeEmail(),
            'phone_number' => $this->faker->optional()->phoneNumber(),
            'address' => $this->faker->optional()->address(),
            'date_of_birth' => $this->faker->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),

            'position' => $this->faker->jobTitle(),
            'department_id' => Department::factory(),

            'status' => 'active',
            'hire_date' => $this->faker->dateTimeBetween('-10 years', 'now')->format('Y-m-d'),
            'departure_date' => null,

            'manager_id' => null,
            'location' => $this->faker->optional()->city(),
            'probation_end_date' => null,
            'last_review_date' => null,
            'notes' => null,

            'employment_type' => 'permanent',
            'contract_type' => 'full_time',
            'work_schedule' => [
                'mon' => true,
                'tue' => true,
                'wed' => true,
                'thu' => true,
                'fri' => true,
                'sat' => false,
                'sun' => false,
            ],

            'salary_gross' => 0,
            'salary_currency' => 'MAD',
            'pay_frequency' => 'monthly',
            'hourly_rate' => null,
            'bonus_target' => null,
            'benefits' => null,
            'cost_center' => null,

            'emergency_contact_name' => null,
            'emergency_contact_phone' => null,
            'bank_iban' => null,
            'bank_rib' => $this->faker->boolean(70) ? $this->faker->unique()->bothify('RIB############') : null,

            'created_by' => User::factory(),
            'user_id' => null,
        ];
    }

    public function withManager(Employee $manager): static
    {
        return $this->state(fn () => ['manager_id' => $manager->id]);
    }
}
