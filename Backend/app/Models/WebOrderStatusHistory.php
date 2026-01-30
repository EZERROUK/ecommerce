<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebOrderStatusHistory extends Model
{
    protected $fillable = [
        'web_order_id',
        'user_id',
        'from_status',
        'to_status',
        'comment',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function webOrder(): BelongsTo
    {
        return $this->belongsTo(WebOrder::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
