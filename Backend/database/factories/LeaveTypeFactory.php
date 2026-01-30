<?php

namespace Database\Factories;

use App\Models\LeaveType;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeaveTypeFactory extends Factory
{
    protected $model = LeaveType::class;

    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->lexify('TYPE_????'),
            'name_fr' => $this->faker->words(3, true),
            'name_ar' => null,
            'requires_balance' => false,
            'requires_attachment' => false,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
