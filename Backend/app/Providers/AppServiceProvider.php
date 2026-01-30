<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\Role as CustomRole;
use App\Models\Permission as CustomPermission;
use Inertia\Inertia;
use App\Models\AppSetting;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bindings Spatie sur tes modèles customs
        $this->app->bind(Role::class, CustomRole::class);
        $this->app->bind(Permission::class, CustomPermission::class);
    }

    public function boot(): void
    {
        RateLimiter::for('public-api', function (Request $request) {
            // Limite large pour les endpoints publics (listing, tree, blog, etc.)
            // Ajustable sans toucher aux routes.
            return Limit::perMinute(120)->by($request->ip());
        });

        RateLimiter::for('public-search', function (Request $request) {
            // Recherche = endpoint plus coûteux -> limite plus stricte.
            return Limit::perMinute(30)->by($request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->input('email');

            return [
                Limit::perMinute(10)->by($request->ip()),
                // Additional key to slow down targeted email attacks.
                Limit::perMinute(5)->by(strtolower($email).'|'.$request->ip()),
            ];
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('password', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('setup', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('client-login', function (Request $request) {
            $identifier = $request->input('email') ?? $request->input('username') ?? $request->input('phone') ?? '';
            $identifier = is_string($identifier) ? Str::lower(trim($identifier)) : '';

            return Limit::perMinute(10)->by($request->ip().'|'.$identifier);
        });

        RateLimiter::for('client-tickets', function (Request $request) {
            $userId = optional($request->user())->id;
            return Limit::perMinute(10)->by($request->ip().'|'.$userId);
        });

        RateLimiter::for('client-config', function (Request $request) {
            $userId = optional($request->user())->id;
            return Limit::perMinute(20)->by($request->ip().'|'.$userId);
        });

        /**
         * Partage global Inertia des réglages d'application.
         * - app_name : figé depuis config (branding)
         * - company_name : raison sociale (depuis DB)
         * - logos / favicon / contacts / SEO / social_links / état onboarding
         */
        Inertia::share('settings', function () {
            $s = AppSetting::query()->first();

            // Fallbacks d’assets si non configuré
            $logoUrl = $s && $s->logo_path
                ? asset('storage/' . $s->logo_path)
                : asset('storage/settings/logo.png');

            $logoDarkUrl = $s && $s->logo_dark_path
                ? asset('storage/' . $s->logo_dark_path)
                : null;

            $faviconUrl = $s && $s->favicon_path
                ? asset('storage/' . $s->favicon_path)
                : asset('/favicon.png');

            return [
                // Identité
                'app_name'        => config('app.name', 'Système de Gestion Centralisée'), // branding figé
                'company_name'    => $s?->company_name,             // raison sociale
                'app_slogan'      => $s?->app_slogan ?? null,

                // Assets
                'logo_path'       => $logoUrl,
                'logo_dark_path'  => $logoDarkUrl,
                'favicon_url'     => $faviconUrl,

                // Contacts
                'contact_email'   => $s?->contact_email ?? null,
                'contact_phone'   => $s?->contact_phone ?? null,
                'contact_address' => $s?->contact_address ?? null,

                // Mentions / SEO
                'cgu_url'         => $s?->cgu_url ?? null,
                'privacy_url'     => $s?->privacy_url ?? null,
                'copyright'       => $s?->copyright ?? null,
                'meta_keywords'   => $s?->meta_keywords ?? null,
                'meta_description'=> $s?->meta_description ?? null,

                // Réseaux sociaux (stockés en JSON)
                'social_links'    => $s?->social_links ?? null,

                // Onboarding / setup
                'is_configured'   => (bool) ($s?->is_configured ?? false),
                'onboarded_at'    => $s?->onboarding_completed_at?->toIso8601String() ?? null,
            ];
        });
    }

}
