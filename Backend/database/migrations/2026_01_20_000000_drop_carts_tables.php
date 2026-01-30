<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop dans l'ordre FK -> parent
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
    }

    public function down(): void
    {
        // On ne recrée pas l'ancien module paniers.
        // Si besoin, restaurer via les migrations historiques 2025_09_25_*.
    }
};
