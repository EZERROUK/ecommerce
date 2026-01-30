# Audit sécurité (2026-01-18)

## Résumé
- Composer (PHP) : aucune advisory de sécurité détectée (`composer audit`).
- npm (Backend) : 0 vulnérabilité (`npm audit --omit=dev`).
- npm (Frontend) : 0 vulnérabilité (`npm audit --omit=dev`).
- Tests & builds : OK (backend tests + builds backend/frontend).
- Durcissement applicatif : ajout d’un rate limiting nommé sur l’API publique (catalogue, catégories, blog).

## Changements appliqués
- Rate limiters ajoutés : `public-api` (120/min/IP) et `public-search` (30/min/IP)
   - Implémentation : [Backend/app/Providers/AppServiceProvider.php](Backend/app/Providers/AppServiceProvider.php)
- Throttle appliqué sur les routes publiques majeures (catalogue, catégories, blog)
   - Implémentation : [Backend/routes/api.php](Backend/routes/api.php)

## Constat configuration (Laravel)
- `app.debug` : `false` (OK).
- `app.env` : `local` (OK en dev ; en prod utiliser `production`).
- `session.http_only` : `true` (OK).
- `session.same_site` : `lax` (OK par défaut).
- `session.secure` : `null` (à fixer en prod si HTTPS).

## Recommandations prod (à appliquer dans l’environnement, pas en dev)
1. Forcer le cookie sécurisé si le site est en HTTPS :
   - `SESSION_SECURE_COOKIE=true`
2. Définir l’environnement et désactiver tout debug :
   - `APP_ENV=production`
   - `APP_DEBUG=false`
3. Cookies/session (optionnel selon besoin) :
   - `SESSION_SAME_SITE=lax` (ou `strict` si compatible)
4. Déploiement :
   - `php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan event:cache` (si utilisé)
   - permissions strictes sur `.env` (lecture uniquement pour l’utilisateur du service)

## À surveiller
- Garder Node/PHP/Composer à jour (patches sécurité).
- Refaire l’audit après ajout de nouvelles dépendances.
