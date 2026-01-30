<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // MySQL ENUM update: keep existing values + add 'deleted'
        DB::statement("ALTER TABLE `leave_request_actions` MODIFY `action` ENUM('created','submitted','approved_manager','rejected_manager','approved_hr','rejected_hr','cancelled','deleted')");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE `leave_request_actions` MODIFY `action` ENUM('created','submitted','approved_manager','rejected_manager','approved_hr','rejected_hr','cancelled')");
    }
};
