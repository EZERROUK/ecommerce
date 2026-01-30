<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductCustomConfig extends Model
{
    use SoftDeletes;

    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'product_id',
        'config',
        'requested_at'
    ];

    protected $casts = [
        'config' => 'array',
        'requested_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
