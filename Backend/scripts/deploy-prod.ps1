param(
  [ValidateSet('local','production')]
  [string]$Mode = 'local',

  [switch]$DryRun,
  [switch]$RunMigrations,
  [switch]$RunStorageLink,
  [switch]$SkipComposer,
  [switch]$SkipNpm
)

$ErrorActionPreference = 'Stop'

# Évite les accents illisibles dans certains terminaux Windows
try {
  $utf8 = [System.Text.UTF8Encoding]::new($false)
  [Console]::OutputEncoding = $utf8
  $OutputEncoding = $utf8
} catch {
  # no-op
}

function Step($msg) {
  Write-Host "\n==> $msg" -ForegroundColor Cyan
}

function HasCommand($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function RunCmd(
  [Parameter(Mandatory = $true)]
  [string]$File,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
) {
  $pretty = ($Args | ForEach-Object {
    if ($_ -match '\s') { '"' + ($_ -replace '"', '\\"') + '"' } else { $_ }
  }) -join ' '

  if ($DryRun) {
    Write-Host "DRYRUN> $File $pretty" -ForegroundColor Yellow
    return
  }

  & $File @Args
}

try {
  $projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
  Set-Location $projectRoot
} catch {
  # si Resolve-Path échoue, on reste dans le dossier courant
}

Step "Déploiement ($Mode) - démarrage"

if (-not (Test-Path -Path "artisan")) {
  throw "Ce script doit être exécuté à la racine du projet (fichier artisan introuvable)."
}

if (-not (HasCommand php)) {
  throw "PHP (commande 'php') introuvable dans le PATH."
}

if (-not $SkipComposer) {
  if (-not (HasCommand composer)) {
    throw "Composer introuvable dans le PATH."
  }

  if ($Mode -eq 'production') {
    Step "Composer install (no-dev + optimize)"
    RunCmd composer install --no-dev --optimize-autoloader
  } else {
    Step "Composer install (dev)"
    RunCmd composer install
  }
}

if (-not $SkipNpm) {
  if (-not (HasCommand npm)) {
    throw "npm introuvable dans le PATH."
  }

  Step "NPM install (ci si lockfile présent)"
  if (Test-Path -Path "package-lock.json") {
    RunCmd npm ci
  } else {
    RunCmd npm install
  }

  Step "Build Vite"
  RunCmd npm run build
}

if ($RunStorageLink) {
  Step "storage:link"
  RunCmd php artisan storage:link
}

if ($RunMigrations) {
  Step "migrate"
  if ($Mode -eq 'production') {
    RunCmd php artisan migrate --force
  } else {
    RunCmd php artisan migrate
  }
}

Step "Optimisations Laravel (optimize:clear + caches)"
RunCmd php artisan optimize:clear

RunCmd php artisan config:cache
RunCmd php artisan route:cache
RunCmd php artisan view:cache

try {
  RunCmd php artisan event:cache
} catch {
  Write-Host "event:cache indisponible (ok)." -ForegroundColor Yellow
}

Step "Terminé"
Write-Host "OK" -ForegroundColor Green
