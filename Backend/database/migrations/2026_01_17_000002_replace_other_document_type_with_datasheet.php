<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // La précédente migration a pu positionner `type` à 'other'.
        // On aligne les données existantes sur un type autorisé (sans 'other').
        DB::table('product_documents')
            ->whereNull('type')
            ->orWhere('type', '=', 'other')
            ->update(['type' => 'datasheet']);
    }

    public function down(): void
    {
        // Pas de retour automatique: on ne peut pas distinguer les anciens 'other' de vrais 'datasheet'.
    }
};
