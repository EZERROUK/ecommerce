# ============================================================
# SCRIPT DE BUILD POUR DÉPLOIEMENT HOSTINGER
# ============================================================
# Exécute ce script en local AVANT de transférer sur Hostinger
# Usage: .\scripts\build-production.ps1
# ============================================================

param(
    [string]$Domain = "TONDOMAINE.com"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BUILD PRODUCTION - X-Zone Ecommerce" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$RootPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackendPath = Join-Path $RootPath "Backend"
$FrontendPath = Join-Path $RootPath "frontend"

# ============================================================
# 1. BUILD FRONTEND
# ============================================================
Write-Host "[1/4] Build du Frontend React..." -ForegroundColor Yellow
Set-Location $FrontendPath

# Installer les dépendances si nécessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "  -> Installation des dépendances npm..." -ForegroundColor Gray
    npm install
}

# Build production
Write-Host "  -> Build Vite en mode production..." -ForegroundColor Gray
npm run build

if (Test-Path "dist") {
    Write-Host "  -> Frontend buildé avec succès!" -ForegroundColor Green
    
    # Copier le .htaccess dans dist
    if (Test-Path ".htaccess") {
        Copy-Item ".htaccess" -Destination "dist\.htaccess" -Force
        Write-Host "  -> .htaccess copié dans dist/" -ForegroundColor Gray
    }
} else {
    Write-Host "  -> ERREUR: Le build frontend a échoué!" -ForegroundColor Red
    exit 1
}

# ============================================================
# 2. BUILD BACKEND
# ============================================================
Write-Host ""
Write-Host "[2/4] Build du Backend Laravel..." -ForegroundColor Yellow
Set-Location $BackendPath

# Installer les dépendances Composer (sans dev)
Write-Host "  -> Installation des dépendances Composer (production)..." -ForegroundColor Gray
composer install --no-dev --optimize-autoloader

# Build assets Inertia/Vite
Write-Host "  -> Build des assets Vite (Inertia)..." -ForegroundColor Gray
npm install
npm run build

Write-Host "  -> Backend buildé avec succès!" -ForegroundColor Green

# ============================================================
# 3. OPTIMISATION LARAVEL
# ============================================================
Write-Host ""
Write-Host "[3/4] Optimisation Laravel..." -ForegroundColor Yellow

# Générer les caches de production
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Ces commandes seront exécutées sur le serveur avec le bon .env
Write-Host "  -> Caches nettoyés (seront régénérés sur le serveur)" -ForegroundColor Gray

# ============================================================
# 4. PRÉPARATION ARCHIVE
# ============================================================
Write-Host ""
Write-Host "[4/4] Préparation des fichiers..." -ForegroundColor Yellow

$OutputPath = Join-Path $RootPath "deploy"
if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath | Out-Null
}

Write-Host "  -> Dossier de déploiement: $OutputPath" -ForegroundColor Gray

# Créer les archives
Write-Host "  -> Compression des fichiers..." -ForegroundColor Gray

# Frontend dist
$FrontendDist = Join-Path $FrontendPath "dist"
$FrontendZip = Join-Path $OutputPath "frontend-dist.zip"
if (Test-Path $FrontendZip) { Remove-Item $FrontendZip }
Compress-Archive -Path "$FrontendDist\*" -DestinationPath $FrontendZip -Force
Write-Host "  -> frontend-dist.zip créé" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BUILD TERMINÉ AVEC SUCCÈS!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichiers prêts dans: $OutputPath" -ForegroundColor White
Write-Host ""
Write-Host "PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "1. Lis le guide: docs/HOSTINGER-DEPLOYMENT.md" -ForegroundColor White
Write-Host "2. Upload les fichiers via hPanel File Manager" -ForegroundColor White
Write-Host "3. Configure la base de données MySQL" -ForegroundColor White
Write-Host "4. Lance les migrations" -ForegroundColor White
Write-Host ""
