<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Renommage des tables existantes "support tickets" vers des noms génériques.
        if (Schema::hasTable('client_support_tickets') && !Schema::hasTable('tickets')) {
            Schema::rename('client_support_tickets', 'tickets');
        }

        if (Schema::hasTable('client_support_ticket_messages') && !Schema::hasTable('ticket_comments')) {
            Schema::rename('client_support_ticket_messages', 'ticket_comments');
        }

        if (!Schema::hasTable('tickets')) {
            return;
        }

        // 2) Migration de données AVANT modification des enums (MySQL).
        if (Schema::hasColumn('tickets', 'status')) {
            DB::table('tickets')->where('status', 'in_progress')->update(['status' => 'open']);
        }

        if (Schema::hasColumn('tickets', 'priority')) {
            DB::table('tickets')->where('priority', 'normal')->update(['priority' => 'medium']);
            DB::table('tickets')->where('priority', 'urgent')->update(['priority' => 'critical']);
        }

        // 3) Évolution schéma tickets : code + title/description (sans dépendances).
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'code_year')) {
                $table->unsignedSmallInteger('code_year')->nullable()->after('id');
            }
            if (!Schema::hasColumn('tickets', 'code_seq')) {
                $table->unsignedInteger('code_seq')->nullable()->after('code_year');
            }
            if (!Schema::hasColumn('tickets', 'code')) {
                $table->string('code')->nullable()->unique()->after('code_seq');
            }

            if (!Schema::hasColumn('tickets', 'title')) {
                $table->string('title')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('tickets', 'description')) {
                $table->longText('description')->nullable()->after('title');
            }
        });

        // Backfill title/description depuis subject/message si existants.
        $hasSubject = Schema::hasColumn('tickets', 'subject');
        $hasMessage = Schema::hasColumn('tickets', 'message');
        if ($hasSubject) {
            DB::table('tickets')->whereNull('title')->update(['title' => DB::raw('subject')]);
        }
        if ($hasMessage) {
            DB::table('tickets')->whereNull('description')->update(['description' => DB::raw('message')]);
        }

        // 4) Extension des enums (MySQL) : status & priority.
        // Sans doctrine/dbal, on passe en SQL brut.
        if (DB::getDriverName() === 'mysql') {
            // Status
            if (Schema::hasColumn('tickets', 'status')) {
                DB::statement("ALTER TABLE `tickets` MODIFY `status` ENUM('new','open','pending_customer','pending_internal','on_hold','resolved','closed','cancelled') NOT NULL DEFAULT 'new'");
            }

            // Priority
            if (Schema::hasColumn('tickets', 'priority')) {
                DB::statement("ALTER TABLE `tickets` MODIFY `priority` ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium'");
            }
        }

        // 5) Table commentaires : normalisation (public/internal) et body.
        if (Schema::hasTable('ticket_comments')) {
            Schema::table('ticket_comments', function (Blueprint $table) {
                if (!Schema::hasColumn('ticket_comments', 'visibility')) {
                    $table->enum('visibility', ['public', 'internal'])->default('public')->after('sender_type');
                }
                if (!Schema::hasColumn('ticket_comments', 'body')) {
                    $table->longText('body')->nullable()->after('visibility');
                }
            });

            $hasOldMessage = Schema::hasColumn('ticket_comments', 'message');
            if ($hasOldMessage) {
                DB::table('ticket_comments')->whereNull('body')->update(['body' => DB::raw('message')]);
            }

            // Si un message est envoyé par un client, il est forcément public.
            if (Schema::hasColumn('ticket_comments', 'sender_type')) {
                DB::table('ticket_comments')->where('sender_type', 'client')->update(['visibility' => 'public']);
            }
        }

        // Index unique pour le séquençage du code (safe si pas rempli).
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'code_year') && Schema::hasColumn('tickets', 'code_seq')) {
                $table->unique(['code_year', 'code_seq'], 'tickets_code_year_seq_unique');
            }
        });
    }

    public function down(): void
    {
        // On ne rollback pas ce refactor automatiquement.
        // (Le down renommerait/altérerait des colonnes sans doctrine/dbal.)
    }
};
