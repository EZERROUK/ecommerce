<?php

namespace App\Support\Activity;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity as SpatieActivity;
use Spatie\Activitylog\Traits\LogsActivity;

final class GlobalModelActivityLogger
{
    /**
     * Enregistre des listeners globaux pour journaliser les actions Eloquent
     * sur les modèles qui ne loggent pas déjà via le trait LogsActivity.
     */
    public static function register(): void
    {
        $map = [
            'eloquent.created: *' => 'created',
            'eloquent.updated: *' => 'updated',
            'eloquent.deleted: *' => 'deleted',
            'eloquent.restored: *' => 'restored',
        ];

        foreach ($map as $pattern => $event) {
            Event::listen($pattern, function (string $eventName, array $data) use ($event) {
                $model = $data[0] ?? null;
                if (!$model instanceof Model) {
                    return;
                }

                self::handle($event, $model);
            });
        }
    }

    private static function handle(string $event, Model $model): void
    {
        // Évite toute récursion (l’écriture dans activity_log ne doit pas re-déclencher un log)
        if ($model instanceof SpatieActivity) {
            return;
        }

        // Si le modèle gère déjà ses logs via Spatie LogsActivity, on ne duplique pas.
        if (in_array(LogsActivity::class, class_uses_recursive($model), true)) {
            return;
        }

        // Réduction du bruit sur l’event updated
        if ($event === 'updated') {
            $changes = $model->getChanges();
            unset($changes['updated_at'], $changes['created_at'], $changes['deleted_at']);
            unset($changes['updated_by'], $changes['created_by']);
            if (empty($changes)) {
                return;
            }
        }

        $properties = self::buildProperties($event, $model);

        $logger = activity()
            ->useLog(self::logNameFor($model))
            ->performedOn($model)
            ->event($event)
            ->withProperties($properties);

        $causer = Auth::user();
        if ($causer instanceof Model) {
            $logger->causedBy($causer);
        }

        $logger->log(self::descriptionFor($event, $model));
    }

    private static function logNameFor(Model $model): string
    {
        return Str::snake(class_basename($model));
    }

    private static function descriptionFor(string $event, Model $model): string
    {
        $action = match ($event) {
            'created' => 'Création',
            'updated' => 'Mise à jour',
            'deleted' => 'Suppression',
            'restored' => 'Restauration',
            default => $event,
        };

        return Str::headline(class_basename($model)) . ' — ' . $action;
    }

    private static function buildProperties(string $event, Model $model): array
    {
        $hidden = [
            'password',
            'remember_token',
            'current_password',
            'new_password',
            'two_factor_secret',
            'two_factor_recovery_codes',
        ];

        $properties = [];

        if ($event === 'created') {
            $properties['attributes'] = self::sanitize($model->getAttributes(), $hidden);
        }

        if ($event === 'updated') {
            $changes = $model->getChanges();
            unset($changes['updated_at'], $changes['created_at'], $changes['deleted_at']);
            unset($changes['updated_by'], $changes['created_by']);

            $old = [];
            foreach ($changes as $key => $_newValue) {
                $old[$key] = $model->getOriginal($key);
            }

            $properties['attributes'] = self::sanitize($changes, $hidden);
            $properties['old'] = self::sanitize($old, $hidden);
        }

        if ($event === 'deleted' || $event === 'restored') {
            // Snapshot minimal
            if ($event === 'deleted') {
                $properties['old'] = self::sanitize($model->getAttributes(), $hidden);
            } else {
                $properties['attributes'] = self::sanitize($model->getAttributes(), $hidden);
            }
        }

        return $properties;
    }

    private static function sanitize(array $values, array $hidden): array
    {
        foreach ($hidden as $k) {
            if (array_key_exists($k, $values)) {
                $values[$k] = '[masqué]';
            }
        }

        return $values;
    }
}
