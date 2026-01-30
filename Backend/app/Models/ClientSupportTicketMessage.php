<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClientSupportTicketMessage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ticket_id',
        'sender_type',
        'sender_id',
        'message',
    ];

    protected $casts = [
        'sender_type' => 'string',
    ];

    // RELATIONS

    public function ticket()
    {
        return $this->belongsTo(ClientSupportTicket::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
