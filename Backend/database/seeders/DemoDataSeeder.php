<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            BrandSeeder::class,
            ProductSeeder::class,
            ProviderSeeder::class,
            StockMovementReasonSeeder::class,
            ClientSeeder::class,
            ExpenseCategorySeeder::class,
        ]);
    }
}
