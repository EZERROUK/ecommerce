<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained('leave_types')->restrictOnDelete();

            $table->date('start_date');
            $table->date('end_date');
            $table->enum('start_half_day', ['none', 'am', 'pm'])->default('none');
            $table->enum('end_half_day', ['none', 'am', 'pm'])->default('none');
            $table->decimal('days_count', 6, 2)->default(0);

            $table->enum('status', ['pending_manager', 'pending_hr', 'approved', 'rejected', 'cancelled'])->default('pending_manager');
            $table->text('reason')->nullable();
            $table->string('attachment_path')->nullable();

            // Workflow metadata
            $table->foreignId('manager_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('manager_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('manager_actioned_at')->nullable();

            $table->foreignId('hr_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('hr_actioned_at')->nullable();

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['employee_id', 'status']);
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
