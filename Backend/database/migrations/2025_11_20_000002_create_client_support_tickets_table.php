<?php

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('client_support_tickets', function (Blueprint $table) {
            $table->id();

            $table->foreignIdFor(Client::class, 'client_id')
                ->constrained('clients')
                ->cascadeOnDelete();

            // Remplace portal_user_id par user_id
            $table->foreignIdFor(User::class, 'user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('subject');
            $table->text('message');

            $table->enum('status', ['open','in_progress','resolved','closed'])->default('open');
            $table->enum('priority', ['low','normal','high','urgent'])->default('normal');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_support_tickets');
    }
};
