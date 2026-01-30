<?php

use App\Models\Client;
use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_custom_configs', function (Blueprint $table) {
            $table->id();

            $table->foreignIdFor(User::class, 'user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->uuid('product_id');
            $table->json('config');

            $table->timestamp('requested_at')->useCurrent();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_custom_configs');
    }
};
