<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebOrder extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SHIPPED = 'shipped';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_PROCESSING,
        self::STATUS_SHIPPED,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'order_number',
        'status',
        'payment_method',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_address',
        'subtotal_ht',
        'total_tax',
        'total_ttc',
        'currency_code',
        'notes',
    ];

    protected $casts = [
        'shipping_address' => 'array',
        'subtotal_ht' => 'decimal:2',
        'total_tax' => 'decimal:2',
        'total_ttc' => 'decimal:2',
    ];

    public static function statuses(): array
    {
        return self::STATUSES;
    }

    public function items(): HasMany
    {
        return $this->hasMany(WebOrderItem::class)->orderBy('sort_order');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(WebOrderStatusHistory::class)->latest();
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_code', 'code');
    }
}
