<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Référentiels
        |--------------------------------------------------------------------------
        */

        Schema::create('ticket_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('parent_id')->nullable()->constrained('ticket_categories')->nullOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['parent_id', 'is_active']);
        });

        Schema::create('ticket_queues', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('ticket_queue_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_queue_id')->constrained('ticket_queues')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['ticket_queue_id', 'user_id']);
        });

        Schema::create('ticket_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('color')->nullable();
            $table->timestamps();
        });

        Schema::create('ticket_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('ticket_tag_id')->constrained('ticket_tags')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['ticket_id', 'ticket_tag_id']);
        });

        Schema::create('ticket_watchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['ticket_id', 'user_id']);
        });

        Schema::create('ticket_sla_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->nullable();
            $table->foreignId('ticket_category_id')->nullable()->constrained('ticket_categories')->nullOnDelete();

            $table->unsignedInteger('first_response_minutes')->default(60);
            $table->unsignedInteger('resolution_minutes')->default(24 * 60);

            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'priority', 'ticket_category_id'], 'sla_policy_lookup');
        });

        /*
        |--------------------------------------------------------------------------
        | Évolution table tickets
        |--------------------------------------------------------------------------
        */

        if (Schema::hasTable('tickets')) {
            Schema::table('tickets', function (Blueprint $table) {
                if (!Schema::hasColumn('tickets', 'impact')) {
                    $table->enum('impact', ['low', 'medium', 'high', 'critical'])->default('medium')->after('priority');
                }
                if (!Schema::hasColumn('tickets', 'urgency')) {
                    $table->enum('urgency', ['low', 'medium', 'high', 'critical'])->default('medium')->after('impact');
                }

                if (!Schema::hasColumn('tickets', 'ticket_category_id')) {
                    $table->foreignId('ticket_category_id')->nullable()->constrained('ticket_categories')->nullOnDelete()->after('urgency');
                }
                if (!Schema::hasColumn('tickets', 'ticket_subcategory_id')) {
                    $table->foreignId('ticket_subcategory_id')->nullable()->constrained('ticket_categories')->nullOnDelete()->after('ticket_category_id');
                }

                if (!Schema::hasColumn('tickets', 'source')) {
                    $table->enum('source', ['email', 'web', 'admin'])->default('web')->after('status');
                }
                if (!Schema::hasColumn('tickets', 'channel')) {
                    $table->string('channel')->nullable()->after('source');
                }

                if (!Schema::hasColumn('tickets', 'assigned_to_user_id')) {
                    $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete()->after('channel');
                }

                if (!Schema::hasColumn('tickets', 'ticket_queue_id')) {
                    $table->foreignId('ticket_queue_id')->nullable()->constrained('ticket_queues')->nullOnDelete()->after('assigned_to_user_id');
                }

                if (!Schema::hasColumn('tickets', 'visible_to_client')) {
                    $table->boolean('visible_to_client')->default(true)->after('ticket_queue_id');
                }

                if (!Schema::hasColumn('tickets', 'internal_confidential')) {
                    $table->boolean('internal_confidential')->default(false)->after('visible_to_client');
                }

                if (!Schema::hasColumn('tickets', 'ticket_sla_policy_id')) {
                    $table->foreignId('ticket_sla_policy_id')->nullable()->constrained('ticket_sla_policies')->nullOnDelete()->after('internal_confidential');
                }

                if (!Schema::hasColumn('tickets', 'first_response_due_at')) {
                    $table->timestamp('first_response_due_at')->nullable()->after('ticket_sla_policy_id');
                }
                if (!Schema::hasColumn('tickets', 'resolution_due_at')) {
                    $table->timestamp('resolution_due_at')->nullable()->after('first_response_due_at');
                }
                if (!Schema::hasColumn('tickets', 'first_response_at')) {
                    $table->timestamp('first_response_at')->nullable()->after('resolution_due_at');
                }

                if (!Schema::hasColumn('tickets', 'resolved_at')) {
                    $table->timestamp('resolved_at')->nullable()->after('first_response_at');
                }
                if (!Schema::hasColumn('tickets', 'closed_at')) {
                    $table->timestamp('closed_at')->nullable()->after('resolved_at');
                }
                if (!Schema::hasColumn('tickets', 'cancelled_at')) {
                    $table->timestamp('cancelled_at')->nullable()->after('closed_at');
                }

                if (!Schema::hasColumn('tickets', 'first_response_breached_at')) {
                    $table->timestamp('first_response_breached_at')->nullable()->after('cancelled_at');
                }
                if (!Schema::hasColumn('tickets', 'resolution_breached_at')) {
                    $table->timestamp('resolution_breached_at')->nullable()->after('first_response_breached_at');
                }

                if (!Schema::hasColumn('tickets', 'last_activity_at')) {
                    $table->timestamp('last_activity_at')->nullable()->after('resolution_breached_at');
                }
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Pièces jointes
        |--------------------------------------------------------------------------
        */

        Schema::create('ticket_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('ticket_comment_id')->nullable()->constrained('ticket_comments')->nullOnDelete();
            $table->foreignId('uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('disk');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 191);
            $table->unsignedBigInteger('size');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['ticket_id', 'ticket_comment_id']);
        });

        /*
        |--------------------------------------------------------------------------
        | Évolution commentaires (optionnel)
        |--------------------------------------------------------------------------
        */

        if (Schema::hasTable('ticket_comments')) {
            Schema::table('ticket_comments', function (Blueprint $table) {
                if (!Schema::hasColumn('ticket_comments', 'edited_at')) {
                    $table->timestamp('edited_at')->nullable()->after('body');
                }
            });
        }

        // Met à jour last_activity_at pour les tickets existants
        if (Schema::hasTable('tickets') && Schema::hasColumn('tickets', 'last_activity_at')) {
            DB::table('tickets')->whereNull('last_activity_at')->update(['last_activity_at' => DB::raw('updated_at')]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_attachments');
        Schema::dropIfExists('ticket_watchers');
        Schema::dropIfExists('ticket_tag');
        Schema::dropIfExists('ticket_tags');
        Schema::dropIfExists('ticket_queue_user');
        Schema::dropIfExists('ticket_queues');
        Schema::dropIfExists('ticket_sla_policies');
        Schema::dropIfExists('ticket_categories');
    }
};
