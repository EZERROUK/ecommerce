<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExpenseCategory;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Fournitures & consommables', 'code' => 'CONS'],
            ['name' => 'Prestations de services',    'code' => 'SERV'],
            ['name' => 'Maintenance & réparations',  'code' => 'MAINT'],
            ['name' => 'Frais de déplacement',       'code' => 'TRAVEL'],
            ['name' => 'Loyers & charges locatives', 'code' => 'RENT'],
            ['name' => 'Assurances',                'code' => 'INS'],
            ['name' => 'Frais bancaires',           'code' => 'BANK'],
            ['name' => 'Marketing & communication', 'code' => 'MKT'],
            ['name' => 'Abonnements & logiciels',   'code' => 'SOFT'],
            ['name' => 'Autres charges',            'code' => 'OTHER'],
        ];

        foreach ($categories as $cat) {
            ExpenseCategory::firstOrCreate(
                ['code' => $cat['code']],
                ['name' => $cat['name']]
            );
        }
    }
}
