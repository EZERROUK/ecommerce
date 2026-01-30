<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('web_order_id')->constrained('web_orders')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');

            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('comment')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['web_order_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('web_order_status_histories');
    }
};
