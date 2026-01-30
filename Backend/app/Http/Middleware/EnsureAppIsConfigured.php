<?php

namespace App\Http\Middleware;

use App\Models\AppSetting;
use Closure;

class EnsureAppIsConfigured
{
    public function handle($request, Closure $next)
    {
        // En tests, on ne bloque pas le routing par l’onboarding.
        if (app()->environment('testing')) {
            return $next($request);
        }

        // Autoriser les routes de setup et les assets publics
        if ($request->is('setup*') || $request->is('storage/*') || $request->is('build/*')) {
            return $next($request);
        }

        $settings = AppSetting::query()->first();
        if (!$settings || !$settings->is_configured) {
            return redirect()->route('setup.show');
        }

        return $next($request);
    }
}
