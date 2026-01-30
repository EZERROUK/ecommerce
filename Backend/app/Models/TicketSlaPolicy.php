<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TicketSlaPolicy extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'priority',
        'ticket_category_id',
        'first_response_minutes',
        'resolution_minutes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(TicketCategory::class, 'ticket_category_id');
    }
}
