<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('employees', 'is_manager')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->boolean('is_manager')->default(false)->index()->after('manager_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('employees', 'is_manager')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('is_manager');
            });
        }
    }
};
