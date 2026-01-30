<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();

            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
            $table->enum('payment_method', ['cod'])->default('cod');

            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->json('shipping_address');

            $table->decimal('subtotal_ht', 12, 2)->default(0);
            $table->decimal('total_tax', 12, 2)->default(0);
            $table->decimal('total_ttc', 12, 2)->default(0);
            $table->char('currency_code', 3)->default('MAD');

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->foreign('currency_code')->references('code')->on('currencies');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('web_orders');
    }
};
