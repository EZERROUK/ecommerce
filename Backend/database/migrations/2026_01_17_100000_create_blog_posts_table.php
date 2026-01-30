<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('author_name')->nullable();
            $table->string('title');
            $table->string('slug')->unique();

            $table->string('category')->default('Actualités');
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();

            $table->string('banner_path')->nullable();

            $table->json('topics')->nullable();   // ["cloud", "sécurité", ...]
            $table->json('sources')->nullable();  // [{label,url}, ...]

            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable()->index();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
