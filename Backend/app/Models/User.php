<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\ProductCustomConfig;
use App\Models\ClientPortalLog;
use App\Models\Client;
use Laravel\Sanctum\HasApiTokens;


/**
 * App\Models\User
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property bool $portal_client
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class User extends Authenticatable implements MustVerifyEmailContract
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles, LogsActivity, MustVerifyEmail;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'portal_client', // 🔥 Ajout essentiel pour activer l’espace client
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'portal_client' => 'boolean',
        ];
    }

    /**
     * Activity Log configuration
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('user')
            ->logAll()
            ->logOnlyDirty()
            ->logExcept(['password'])
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "User has been {$eventName}");
    }

    /**
     * Check if user is Super Admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('SuperAdmin');
    }

    public function employee()
    {
        return $this->hasOne(Employee::class, 'user_id');
    }

    // ============================================================
    // 🚀 RELATIONS SPÉCIALES — PORTAIL CLIENT
    // ============================================================

    /**
     * Un utilisateur peut être associé à un client (entreprise).
     * Utile pour les comptes portail.
     */
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Tickets support créés par ce client
     */
    public function supportTickets()
    {
        return $this->hasMany(Ticket::class, 'user_id');
    }

    /**
     * Messages envoyés par ce client dans les tickets
     */
    public function supportMessages()
    {
        return $this->hasMany(TicketComment::class, 'sender_id');
    }

    /**
     * Configurations personnalisées envoyées via le configurateur visuel
     */
    public function customConfigs()
    {
        return $this->hasMany(ProductCustomConfig::class, 'user_id');
    }

    /**
     * Logs d’activité du portail client
     */
    public function portalLogs()
    {
        return $this->hasMany(ClientPortalLog::class, 'user_id');
    }
}
