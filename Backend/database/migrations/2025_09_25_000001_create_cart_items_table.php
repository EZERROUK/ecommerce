<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->uuid('id')->primary();

            // FK vers carts (uuid)
            $table->uuid('cart_id');
            $table->foreign('cart_id')->references('id')->on('carts')->cascadeOnDelete();

            // FK vers products (uuid)
            $table->uuid('product_id');
            $table->foreign('product_id')->references('id')->on('products')->restrictOnDelete();

            $table->unsignedInteger('quantity')->default(1);

            // Snapshots
            $table->decimal('unit_price_ht_snapshot', 12, 2);
            $table->decimal('tax_rate_percent_snapshot', 5, 2)->default(20.00);
            $table->string('title_snapshot');
            $table->string('brand_snapshot')->nullable();
            $table->json('attributes_snapshot')->nullable();

            // Hash des attributs
            // -> default('') pour avoir un triplet stable même sans attributs
            $table->string('attributes_hash', 64)->default('')->index();

            $table->timestamps();
            $table->softDeletes();

            // Unicité uniquement pour les lignes actives (deleted_at NULL) :
            // on inclut deleted_at dans l'index unique pour “séparer” les versions soft-deleted
            $table->unique(
                ['cart_id', 'product_id', 'attributes_hash', 'deleted_at'],
                'cart_items_unique_product_hash'
            );

            // Index utiles
            $table->index(['cart_id', 'product_id']);
            $table->index(['cart_id', 'deleted_at']); // accélère les requêtes sur les items actifs d’un panier
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
