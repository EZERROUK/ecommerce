<?php

use App\Models\Product;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_documents', function (Blueprint $table) {
        $table->id();
        $table->uuid('product_id');
        $table->string('title');
        $table->string('file_path');
        $table->timestamps();
        $table->softDeletes();

        $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
    });

    }

    public function down(): void
    {
        Schema::dropIfExists('product_documents');
    }
};
