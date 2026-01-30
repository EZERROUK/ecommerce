<?php

namespace Database\Seeders;

use App\Models\Holiday;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class LeaveSeeder extends Seeder
{
    public function run(): void
    {
        // Types de congés (base Maroc, ajustable)
        $types = [
            [
                'code' => 'PAID',
                'name_fr' => 'Congé annuel payé',
                'name_ar' => 'العطلة السنوية المؤدى عنها',
                'requires_balance' => true,
                'requires_attachment' => false,
                'sort_order' => 10,
            ],
            [
                'code' => 'SICK',
                'name_fr' => 'Congé maladie',
                'name_ar' => 'عطلة مرضية',
                'requires_balance' => false,
                'requires_attachment' => true,
                'sort_order' => 20,
            ],
            [
                'code' => 'UNPAID',
                'name_fr' => 'Congé sans solde',
                'name_ar' => 'عطلة بدون أجر',
                'requires_balance' => false,
                'requires_attachment' => false,
                'sort_order' => 30,
            ],
            [
                'code' => 'MATERNITY',
                'name_fr' => 'Congé maternité',
                'name_ar' => 'عطلة الأمومة',
                'requires_balance' => false,
                'requires_attachment' => true,
                'sort_order' => 40,
            ],
            [
                'code' => 'PATERNITY',
                'name_fr' => 'Congé paternité',
                'name_ar' => 'عطلة الأبوة',
                'requires_balance' => false,
                'requires_attachment' => false,
                'sort_order' => 50,
            ],
            [
                'code' => 'SPECIAL',
                'name_fr' => 'Absence autorisée (évènement familial)',
                'name_ar' => 'رخصة استثنائية',
                'requires_balance' => false,
                'requires_attachment' => false,
                'sort_order' => 60,
            ],
        ];

        foreach ($types as $type) {
            LeaveType::updateOrCreate(
                ['code' => $type['code']],
                [
                    'name_fr' => $type['name_fr'],
                    'name_ar' => $type['name_ar'],
                    'requires_balance' => $type['requires_balance'],
                    'requires_attachment' => $type['requires_attachment'],
                    'is_active' => true,
                    'sort_order' => $type['sort_order'],
                ]
            );
        }

        // Jours fériés fixes (récurrents) - les fêtes mobiles (Aïd, etc.) sont à saisir chaque année.
        $year = 2026;
        $fixed = [
            ['name' => "Nouvel An", 'month' => 1, 'day' => 1],
            ['name' => "Manifeste de l'indépendance", 'month' => 1, 'day' => 11],
            ['name' => 'Fête du Travail', 'month' => 5, 'day' => 1],
            ['name' => 'Fête du Trône', 'month' => 7, 'day' => 30],
            ['name' => "Journée Oued Ed-Dahab", 'month' => 8, 'day' => 14],
            ['name' => 'Révolution du Roi et du Peuple', 'month' => 8, 'day' => 20],
            ['name' => 'Fête de la Jeunesse', 'month' => 8, 'day' => 21],
            ['name' => 'Marche Verte', 'month' => 11, 'day' => 6],
            ['name' => "Fête de l'Indépendance", 'month' => 11, 'day' => 18],
        ];

        foreach ($fixed as $h) {
            $date = Carbon::create($year, $h['month'], $h['day'])->toDateString();
            Holiday::updateOrCreate(
                ['date' => $date, 'name' => $h['name']],
                ['is_recurring' => true]
            );
        }
    }
}
