<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            // PK en UUID
            $table->uuid('id')->primary();

            // Back-office e-commerce : rattacher à un client (optionnel)
            $table->foreignId('client_id')
                ->nullable()
                ->constrained('clients')
                ->nullOnDelete();

            // (Optionnel) rattacher à un user si besoin (ex: panier web authentifié)
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Session pour panier invité
            $table->string('session_id', 100)->nullable()->index();

            // Métadonnées
            $table->string('currency', 3)->default('MAD');
            $table->enum('status', ['active', 'converted', 'abandoned'])->default('active');

            // Notes
            $table->text('notes')->nullable();

            // ✅ Totaux (avant promo) PERSISTÉS
            $table->decimal('subtotal_ht', 12, 2)->default(0);
            $table->decimal('tva_amount',  12, 2)->default(0);
            $table->decimal('total_ttc',   12, 2)->default(0);

            // ✅ Promotions / remises PERSISTÉES
            $table->decimal('discount_total', 12, 2)->default(0);   // montant total remisé (TTC)
            $table->decimal('total_ttc_after', 12, 2)->default(0);  // TTC après remises
            $table->json('applied_promotions')->nullable();
            $table->json('lines_total_discounts')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Index utiles
            $table->index(['status', 'updated_at']);
            $table->index(['client_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
