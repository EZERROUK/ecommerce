<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL: étendre l'ENUM pour inclure les nouveaux statuts.
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE `web_orders` MODIFY `status` ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending'"
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE `web_orders` MODIFY `status` ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending'"
            );
        }
    }
};
