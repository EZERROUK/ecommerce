<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'description')) {
                $table->text('description')->nullable()->after('slug');
            }
            if (!Schema::hasColumn('categories', 'image_path')) {
                $table->string('image_path')->nullable()->after('description');
            }
            if (!Schema::hasColumn('categories', 'meta_title')) {
                $table->string('meta_title')->nullable()->after('image_path');
            }
            if (!Schema::hasColumn('categories', 'meta_description')) {
                $table->text('meta_description')->nullable()->after('meta_title');
            }
            if (!Schema::hasColumn('categories', 'parent_id')) {
                $table->foreignId('parent_id')->nullable()->after('meta_description');
            }
            if (!Schema::hasColumn('categories', 'icon')) {
                $table->string('icon')->nullable()->after('parent_id');
            }
            if (!Schema::hasColumn('categories', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('icon');
            }
            if (!Schema::hasColumn('categories', 'sort_order')) {
                $table->unsignedInteger('sort_order')->default(0)->after('is_active');
            }
            if (!Schema::hasColumn('categories', 'level')) {
                $table->unsignedInteger('level')->default(0)->after('sort_order');
            }
            if (!Schema::hasColumn('categories', 'type')) {
                $table->string('type')->default('default')->after('level');
            }
            if (!Schema::hasColumn('categories', 'visibility')) {
                $table->string('visibility')->default('public')->after('type');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            // FK parent_id (séparé pour éviter les soucis de création de colonne + FK dans certains moteurs)
            if (Schema::hasColumn('categories', 'parent_id')) {
                $driver = Schema::getConnection()->getDriverName();
                if ($driver !== 'sqlite') {
                    $existingFk = DB::selectOne(
                        "SELECT CONSTRAINT_NAME
                         FROM information_schema.KEY_COLUMN_USAGE
                         WHERE TABLE_SCHEMA = DATABASE()
                           AND TABLE_NAME = 'categories'
                           AND COLUMN_NAME = 'parent_id'
                           AND REFERENCED_TABLE_NAME IS NOT NULL
                         LIMIT 1"
                    );

                    if (!$existingFk) {
                        $table->foreign('parent_id')->references('id')->on('categories')->nullOnDelete();
                    }
                }
            }

            if (Schema::hasColumn('categories', 'is_active')) {
                $table->index(['is_active']);
            }
            if (Schema::hasColumn('categories', 'parent_id')) {
                $table->index(['parent_id']);
            }
            if (Schema::hasColumn('categories', 'sort_order')) {
                $table->index(['sort_order']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Drop FKs / indexes best-effort
            foreach (['categories_parent_id_foreign'] as $fk) {
                try { $table->dropForeign($fk); } catch (Throwable) {}
            }
            foreach (['categories_is_active_index','categories_parent_id_index','categories_sort_order_index'] as $idx) {
                try { $table->dropIndex($idx); } catch (Throwable) {}
            }

            foreach (['visibility','type','level','sort_order','is_active','icon','parent_id','meta_description','meta_title','image_path','description'] as $col) {
                if (Schema::hasColumn('categories', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
