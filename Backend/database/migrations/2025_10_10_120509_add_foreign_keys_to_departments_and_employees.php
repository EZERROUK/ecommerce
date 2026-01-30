<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // On ALTÈRE la table existante, on ne la recrée pas
        Schema::table('departments', function (Blueprint $table) {
            // Ajoute deleted_at si tu veux la soft delete sur departments
            if (!Schema::hasColumn('departments', 'deleted_at')) {
                $table->softDeletes(); // ajoute colonne nullable deleted_at
            }

            // Ajoute la FK vers employees pour department_head
            // (la colonne existe déjà depuis la 1ʳᵉ migration)
            $table->foreign('department_head')
                  ->references('id')->on('employees')
                  ->nullOnDelete(); // équivaut à ON DELETE SET NULL
        });
    }

    public function down()
    {
        Schema::table('departments', function (Blueprint $table) {
            // Supprime d'abord la contrainte FK si elle existe
            if (Schema::hasColumn('departments', 'department_head')) {
                $table->dropForeign(['department_head']);
            }

            // Optionnel: retirer la soft delete si tu veux un rollback propre
            if (Schema::hasColumn('departments', 'deleted_at')) {
                $table->dropSoftDeletes();
                // équivalent à $table->dropColumn('deleted_at'); selon ta version de Laravel
            }
        });
    }
};
