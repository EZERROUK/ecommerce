<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    /**
     * Add baseline security headers.
     *
     * Intentionally avoids CSP here to prevent breaking the Inertia/React UI.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Some responses (binary downloads) may not support header mutation.
        if (! method_exists($response, 'headers')) {
            return $response;
        }

        $headers = $response->headers;

        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'SAMEORIGIN');
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $headers->set('X-DNS-Prefetch-Control', 'off');

        // Cross-origin isolation (safe defaults for typical same-origin apps).
        $headers->set('Cross-Origin-Opener-Policy', 'same-origin');

        // Disable powerful features by default.
        $headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)'
        );

        // Only advertise HSTS on HTTPS.
        if ($request->isSecure()) {
            $headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
