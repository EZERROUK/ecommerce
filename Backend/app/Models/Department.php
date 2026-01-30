<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes; // ✅

class Department extends Model
{
    use HasFactory;
    use SoftDeletes; // ✅

    protected $fillable = ['name', 'description', 'department_head','created_by'];

    protected $appends = ['department_head_full_name'];

    protected $dates = ['deleted_at']; // (optionnel mais propre)

    public function head()
    {
        return $this->belongsTo(Employee::class, 'department_head');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function getDepartmentHeadFullNameAttribute(): ?string
    {
        if (!$this->relationLoaded('head')) {
            $this->loadMissing('head');
        }

        if ($this->head && ($this->head->first_name || $this->head->last_name)) {
            return trim(($this->head->first_name ?? '') . ' ' . ($this->head->last_name ?? '')) ?: null;
        }

        return null;
    }
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

}
