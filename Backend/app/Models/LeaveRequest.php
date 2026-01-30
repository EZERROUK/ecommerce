<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveRequest extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING_MANAGER = 'pending_manager';
    public const STATUS_PENDING_HR = 'pending_hr';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'start_half_day',
        'end_half_day',
        'days_count',
        'status',
        'reason',
        'attachment_path',
        'manager_employee_id',
        'manager_user_id',
        'manager_actioned_at',
        'hr_user_id',
        'hr_actioned_at',
        'submitted_at',
        'cancelled_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'days_count' => 'decimal:2',
        'manager_actioned_at' => 'datetime',
        'hr_actioned_at' => 'datetime',
        'submitted_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function managerEmployee()
    {
        return $this->belongsTo(Employee::class, 'manager_employee_id');
    }

    public function managerUser()
    {
        return $this->belongsTo(User::class, 'manager_user_id');
    }

    public function hrUser()
    {
        return $this->belongsTo(User::class, 'hr_user_id');
    }

    public function actions()
    {
        return $this->hasMany(LeaveRequestAction::class);
    }

    public function isBlockingOverlap(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING_MANAGER, self::STATUS_PENDING_HR, self::STATUS_APPROVED], true);
    }
}
