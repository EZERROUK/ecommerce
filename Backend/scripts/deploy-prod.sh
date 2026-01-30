#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-local}"
DRY_RUN=0

if [[ "${2:-}" == "--dry-run" || "${2:-}" == "-n" ]]; then
  DRY_RUN=1
fi

# Se placer à la racine du projet (parent du dossier scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if [[ ! -f "artisan" ]]; then
  echo "Ce script doit être exécuté à la racine du projet (artisan introuvable)." >&2
  exit 1
fi

if ! command -v php >/dev/null 2>&1; then
  echo "PHP introuvable (commande 'php')." >&2
  exit 1
fi

step() {
  echo
  echo "==> $*"
}

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "DRYRUN> $*"
    return 0
  fi
  "$@"
}

step "Déploiement ($MODE) - démarrage"

if command -v composer >/dev/null 2>&1; then
  if [[ "$MODE" == "production" ]]; then
    step "Composer install (no-dev + optimize)"
    run composer install --no-dev --optimize-autoloader
  else
    step "Composer install (dev)"
    run composer install
  fi
else
  echo "Composer introuvable" >&2
  exit 1
fi

if command -v npm >/dev/null 2>&1; then
  step "NPM install"
  if [[ -f package-lock.json ]]; then
    run npm ci
  else
    run npm install
  fi

  step "Build Vite"
  run npm run build
else
  echo "npm introuvable" >&2
  exit 1
fi

step "Optimisations Laravel (optimize:clear + caches)"
run php artisan optimize:clear
run php artisan config:cache
run php artisan route:cache
run php artisan view:cache

run php artisan event:cache 2>/dev/null || echo "event:cache indisponible (ok)."

step "Terminé"
echo "OK"
