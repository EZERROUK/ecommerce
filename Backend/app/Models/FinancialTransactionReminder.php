<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialTransactionReminder extends Model
{
    protected $fillable = [
        'financial_transaction_id',
        'reminder_date',
        'channel',
        'note',
        'created_by',
    ];

    protected $casts = [
        'reminder_date' => 'datetime',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(FinancialTransaction::class, 'financial_transaction_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
