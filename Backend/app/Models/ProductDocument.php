<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductDocument extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'product_id',
        'title',
        'type',
        'file_path',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
