<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_request_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_request_id')->constrained('leave_requests')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('action', ['created', 'submitted', 'approved_manager', 'rejected_manager', 'approved_hr', 'rejected_hr', 'cancelled', 'deleted']);
            $table->text('comment')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['leave_request_id']);
            $table->index(['action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_request_actions');
    }
};
