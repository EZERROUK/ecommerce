<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        // Identité / contact
        'first_name', 'last_name', 'employee_code', 'cin', 'cnss_number', 'photo', 'cv_path', 'contract_path',
        'email', 'phone_number', 'address', 'date_of_birth',

        // Poste & orga
        'position', 'department_id', 'status', 'hire_date', 'departure_date','status',

        // Orga & suivi
        'manager_id', 'is_manager', 'location', 'probation_end_date', 'last_review_date', 'notes',

        // Rémunération & contrat
        'employment_type', 'contract_type', 'work_schedule',
        'salary_gross', 'salary_currency', 'pay_frequency',
        'hourly_rate', 'bonus_target', 'benefits', 'cost_center',

        // Sécurité / bancaire
        'emergency_contact_name', 'emergency_contact_phone', 'bank_iban', 'bank_rib',

        // Auteur
        'created_by',

        // Liaison compte utilisateur (optionnelle)
        'user_id',
    ];

    protected $casts = [
        'date_of_birth'      => 'date',
        'hire_date'          => 'date',
        'departure_date'     => 'date',
        'probation_end_date' => 'date',
        'last_review_date'   => 'date',

        'work_schedule' => 'array',
        'benefits'      => 'array',

        'salary_gross'  => 'decimal:2',
        'hourly_rate'   => 'decimal:2',
        'bonus_target'  => 'decimal:2',

        'is_manager' => 'boolean',
    ];

    /* ---------------- Relations ---------------- */

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function reports()
    {
        return $this->hasMany(Employee::class, 'manager_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Département dont CET employé est le chef
     * (nécessite une colonne departments.department_head pointant vers employees.id)
     */
    public function departmentHead()
    {
        return $this->hasOne(Department::class, 'department_head');
    }

    /* ---------------- Accessors utiles ---------------- */

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }
}
