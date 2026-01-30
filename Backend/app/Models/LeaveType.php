<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name_fr',
        'name_ar',
        'requires_balance',
        'requires_attachment',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'requires_balance' => 'boolean',
        'requires_attachment' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
