<?php

use App\Models\ClientSupportTicket;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('client_support_ticket_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignIdFor(ClientSupportTicket::class, 'ticket_id')
                ->constrained('client_support_tickets')
                ->cascadeOnDelete();

            // user_id devient l’expéditeur (client ou staff)
            $table->foreignIdFor(User::class, 'sender_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('sender_type', ['client','staff']);
            $table->text('message');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_support_ticket_messages');
    }
};
