<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('product_id')->index();

            $table->string('author_name', 100);
            $table->string('author_email')->nullable();
            $table->unsignedTinyInteger('rating');
            $table->text('comment');

            $table->string('status', 20)->default('pending')->index(); // pending|approved|rejected

            $table->unsignedBigInteger('moderated_by')->nullable()->index();
            $table->timestamp('moderated_at')->nullable();
            $table->string('moderation_note', 255)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('moderated_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['product_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};
