<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('product_documents', function (Blueprint $table) {
            $table->string('type')->nullable()->default('other')->after('title');
        });

        // Valeur par défaut pour l'existant
        DB::table('product_documents')->whereNull('type')->update(['type' => 'other']);

        Schema::table('product_documents', function (Blueprint $table) {
            $table->index(['product_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('product_documents', function (Blueprint $table) {
            $table->dropIndex(['product_id', 'type']);
            $table->dropColumn('type');
        });
    }
};
