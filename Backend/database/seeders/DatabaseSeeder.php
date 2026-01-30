<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed minimal (prod-safe) : rôles/permissions + comptes système + données de référence.
        $this->call([
            RolePermissionSeeder::class,
            SystemUsersSeeder::class,
            CurrencySeeder::class,
            TaxRateSeeder::class,
            LeaveSeeder::class,
        ]);

        // Données démo (catalogues, produits, etc.) : STRICTEMENT optionnel
        // Active uniquement via SEED_DEMO_DATA=true.
        if ((bool) env('SEED_DEMO_DATA', false)) {
            $this->call([
                DemoDataSeeder::class,
            ]);
        }
    }
}
