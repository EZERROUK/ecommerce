<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClientSupportTicket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'user_id',
        'subject',
        'message',
        'status',
        'priority',
    ];

    protected $casts = [
        'status' => 'string',
        'priority' => 'string',
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

    public function messages()
    {
        return $this->hasMany(ClientSupportTicketMessage::class, 'ticket_id')
                    ->orderBy('created_at');
    }
}
