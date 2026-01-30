<?php

use App\Models\User;
use App\Models\FinancialTransaction;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('financial_transaction_reminders', function (Blueprint $table) {
            $table->id();

            $table->foreignIdFor(FinancialTransaction::class, 'financial_transaction_id')
                ->constrained('financial_transactions')
                ->cascadeOnDelete();

            $table->timestamp('reminder_date')->nullable(); // date/heure de la relance
            $table->string('channel', 50)->nullable();      // ex : email, téléphone, whatsapp…
            $table->text('note')->nullable();               // commentaire libre

            $table->foreignIdFor(User::class, 'created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_transaction_reminders');
    }
};
