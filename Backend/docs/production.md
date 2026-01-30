# Déploiement production (Laravel 12 + Inertia + React/Vite)

Ce document décrit une procédure reproductible pour déployer l’application en production.

## 1) Pré-requis

- PHP 8.2+ (recommandé 8.3)
- Composer
- Node.js (recommandé LTS) + npm (si tu builds le front sur le serveur)
- Base de données (MySQL/MariaDB/PostgreSQL)
- Un serveur web (Nginx/Apache) pointant vers `public/`

## 2) Checklist `.env` (production)

Sur le serveur, vérifie au minimum :

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=base64:...` (généré)
- `APP_URL=https://ton-domaine.tld`
- `LOG_LEVEL=warning` (ou `error` selon besoin)
- `DB_*` correctement configuré
- `SESSION_DRIVER` / `CACHE_DRIVER` / `QUEUE_CONNECTION` (ex: `database` / `redis`)

Commandes utiles :

- Générer la clé : `php artisan key:generate`

## 3) Permissions

Les dossiers suivants doivent être *écrits* par l’utilisateur du serveur web :

- `storage/`
- `bootstrap/cache/`

Sous Linux (exemple) :

- `chown -R www-data:www-data storage bootstrap/cache`
- `chmod -R u+rwX,g+rwX storage bootstrap/cache`

## 4) Lien storage (uploads)

Si l’application sert des fichiers depuis `/storage/...`, crée le lien :

- `php artisan storage:link`

Vérifie :

- `public/storage` pointe bien vers `storage/app/public`

## 5) Installer les dépendances (backend)

En production :

- `composer install --no-dev --optimize-autoloader`

## 6) Migrations

En production, toujours avec `--force` :

- `php artisan migrate --force`

> Si tu utilises des seeders “système” (rôles/permissions/paramètres), lance-les explicitement ici.

## 7) Build front (Vite)

Deux options :

### A) Build sur le serveur

- `npm ci`
- `npm run build`

### B) Build en CI puis déploiement

- Exécuter `npm ci && npm run build` en CI
- Déployer `public/build/` (et `public/build/manifest.json`) avec le reste du code

## 8) Optimisations Laravel (caches)

Après avoir correctement configuré `.env` :

- `php artisan config:cache`
- `php artisan route:cache`
- `php artisan view:cache`
- `php artisan event:cache` (si disponible)

Pour repartir propre :

- `php artisan optimize:clear`

## 9) Scheduler & Queue

### Scheduler

Configurer une tâche cron (Linux) :

- `* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1`

### Queue

- Utiliser Supervisor / systemd pour lancer `php artisan queue:work` (recommandé)

## 10) Vérifications finales

- Page login et dashboard accessibles
- Upload/affichage d’images OK (`/storage/...`)
- Logs OK (`storage/logs/laravel.log`)
- Santé DB + migrations OK

## Scripts

Le projet inclut des scripts pour automatiser les étapes clés.

### Windows (PowerShell)

- Script : `scripts/deploy-prod.ps1`
- Mode local (safe, sans migration ni storage link) :

```powershell
pwsh -File .\scripts\deploy-prod.ps1 -Mode local
```

Dry-run (affiche les commandes sans les exécuter) :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-prod.ps1 -Mode production -DryRun -RunMigrations -RunStorageLink
```

Si `pwsh` (PowerShell 7) n’est pas installé, utilise Windows PowerShell :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-prod.ps1 -Mode local
```

- Mode production (avec migrations et storage link) :

```powershell
pwsh -File .\scripts\deploy-prod.ps1 -Mode production -RunMigrations -RunStorageLink
```

Options utiles :

- `-DryRun` : affiche les commandes sans les exécuter
- `-SkipComposer` : ne relance pas `composer install`
- `-SkipNpm` : ne relance pas `npm ci/install` + build

### Linux (bash)

- Script : `scripts/deploy-prod.sh`

```bash
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh production

# Dry-run
./scripts/deploy-prod.sh production --dry-run
```
