<?php

use App\Models\Ticket;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('tickets:sla-check {--dry-run : Ne modifie rien, affiche seulement les compteurs}', function () {
    $now = now();
    $dryRun = (bool) $this->option('dry-run');

    $activeForSla = ['new', 'open', 'pending_customer', 'pending_internal', 'on_hold'];

    $firstResponseQuery = Ticket::query()
        ->whereIn('status', $activeForSla)
        ->whereNotNull('first_response_due_at')
        ->whereNull('first_response_at')
        ->whereNull('first_response_breached_at')
        ->where('first_response_due_at', '<=', $now);

    $resolutionQuery = Ticket::query()
        ->whereIn('status', $activeForSla)
        ->whereNotNull('resolution_due_at')
        ->whereNull('resolved_at')
        ->whereNull('resolution_breached_at')
        ->where('resolution_due_at', '<=', $now);

    $firstCount = (int) $firstResponseQuery->count();
    $resolutionCount = (int) $resolutionQuery->count();

    if (!$dryRun) {
        if ($firstCount > 0) {
            $firstResponseQuery->update(['first_response_breached_at' => $now]);
        }
        if ($resolutionCount > 0) {
            $resolutionQuery->update(['resolution_breached_at' => $now]);
        }
    }

    $this->info('tickets:sla-check');
    $this->line('First response breaches: ' . $firstCount . ($dryRun ? ' (dry-run)' : ''));
    $this->line('Resolution breaches: ' . $resolutionCount . ($dryRun ? ' (dry-run)' : ''));
})->purpose('Marque les breaches SLA (first response / resolution)');

Schedule::command('tickets:sla-check')
    ->everyFiveMinutes()
    ->withoutOverlapping(10);

// Et côté serveur (CRON) :
// * * * * * cd /var/www/ton-app && php artisan schedule:run >> /dev/null 2>&1
