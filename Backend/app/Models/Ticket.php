<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'client_id',
        'user_id',

        // Legacy columns (kept for backward compatibility)
        'subject',
        'message',

        'code_year',
        'code_seq',
        'code',

        'title',
        'description',

        'status',
        'priority',
        'impact',
        'urgency',

        'source',
        'channel',

        'ticket_category_id',
        'ticket_subcategory_id',

        'assigned_to_user_id',
        'ticket_queue_id',

        'visible_to_client',
        'internal_confidential',

        'ticket_sla_policy_id',
        'first_response_due_at',
        'resolution_due_at',
        'first_response_at',
        'resolved_at',
        'closed_at',
        'cancelled_at',
        'first_response_breached_at',
        'resolution_breached_at',
        'last_activity_at',
    ];

    protected $casts = [
        'first_response_due_at' => 'datetime',
        'resolution_due_at' => 'datetime',
        'first_response_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'first_response_breached_at' => 'datetime',
        'resolution_breached_at' => 'datetime',
        'last_activity_at' => 'datetime',

        'visible_to_client' => 'boolean',
        'internal_confidential' => 'boolean',
    ];

    // RELATIONS

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function queue()
    {
        return $this->belongsTo(TicketQueue::class, 'ticket_queue_id');
    }

    public function category()
    {
        return $this->belongsTo(TicketCategory::class, 'ticket_category_id');
    }

    public function subcategory()
    {
        return $this->belongsTo(TicketCategory::class, 'ticket_subcategory_id');
    }

    public function slaPolicy()
    {
        return $this->belongsTo(TicketSlaPolicy::class, 'ticket_sla_policy_id');
    }

    public function comments()
    {
        return $this->hasMany(TicketComment::class, 'ticket_id')->orderBy('created_at');
    }

    public function tags()
    {
        return $this->belongsToMany(TicketTag::class, 'ticket_tag', 'ticket_id', 'ticket_tag_id')
            ->withTimestamps();
    }

    public function watchers()
    {
        return $this->belongsToMany(User::class, 'ticket_watchers', 'ticket_id', 'user_id')
            ->withTimestamps();
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class, 'ticket_id')->orderByDesc('created_at');
    }
}
