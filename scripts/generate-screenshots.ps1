[CmdletBinding()]
param(
  [string]$BackendUrl = 'http://127.0.0.1:8000',
  [string]$FrontendPort = '4173',
  [string]$BackofficeStaticPort = '8010',
  [string]$OutDir = 'docs-assets/screenshots',
  [switch]$SkipBackendSeed,
  [switch]$SkipFrontendInstall,
  [switch]$ForceStaticBackoffice
)

$ErrorActionPreference = 'Stop'

function Write-Info([string]$Message) { Write-Host $Message -ForegroundColor Cyan }
function Write-Warn([string]$Message) { Write-Host $Message -ForegroundColor Yellow }

$root = (Get-Location).Path

$backendDir = Join-Path $root 'Backend'
$frontendDir = Join-Path $root 'frontend'
$outDirPath = Join-Path $root $OutDir

New-Item -ItemType Directory -Force -Path $outDirPath | Out-Null

$logsDir = Join-Path $outDirPath 'logs'
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

function Get-FreePort([int]$StartPort, [int]$MaxTries = 10) {
  for ($p = $StartPort; $p -lt ($StartPort + $MaxTries); $p++) {
    try {
      $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse('127.0.0.1'), $p)
      $listener.Start()
      $listener.Stop()
      return $p
    } catch {
      # port occupé
    }
  }
  throw "Aucun port libre trouvé à partir de $StartPort (essais: $MaxTries)."
}

Write-Info "[1/5] Préparation Backend (env screenshots + seed)"

$useStaticBackoffice = $ForceStaticBackoffice.IsPresent

if (-not $SkipBackendSeed -and -not $useStaticBackoffice) {
  $dbPath = Join-Path $backendDir 'database/database.screenshots.sqlite'
  if (-not (Test-Path $dbPath)) {
    New-Item -ItemType File -Force -Path $dbPath | Out-Null
  }

  Push-Location $backendDir
  try {
    & php artisan key:generate --env=screenshots --force | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "php artisan key:generate a échoué (code=$LASTEXITCODE)." }

    & php artisan migrate:fresh --seed --env=screenshots | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "php artisan migrate:fresh --seed a échoué (code=$LASTEXITCODE)." }
  } catch {
    Write-Warn "Impossible d'exécuter php artisan (probable incompatibilité de version PHP). Fallback en mode backoffice statique."
    Write-Warn ("Détail: " + $_.Exception.Message)
    $useStaticBackoffice = $true
  } finally {
    Pop-Location
  }
} else {
  if ($SkipBackendSeed) { Write-Warn "Skip backend seed (option -SkipBackendSeed)." }
  if ($useStaticBackoffice) { Write-Warn "Mode backoffice statique activé." }
}

Write-Info "[2/5] Démarrage serveurs (Backoffice + Frontend preview)"

$backendProc = $null
$backendPortToWait = 8000

if ($useStaticBackoffice) {
  Write-Info "Génération des pages backoffice statiques (Inertia) …"
  Push-Location $root
  try {
    & node scripts/generate-backoffice-static-preview.mjs | Out-Host
  } finally {
    Pop-Location
  }

  $backendPortToWait = Get-FreePort -StartPort ([int]$BackofficeStaticPort) -MaxTries 10
  $publicDir = Join-Path $backendDir 'public'
  $backendOut = Join-Path $logsDir 'backoffice-static.out.log'
  $backendErr = Join-Path $logsDir 'backoffice-static.err.log'
  $backendProc = Start-Process -FilePath 'php' -ArgumentList @('-S', "127.0.0.1:$backendPortToWait", '-t', $publicDir) -PassThru -WindowStyle Hidden -RedirectStandardOutput $backendOut -RedirectStandardError $backendErr
} else {
  $backendOut = Join-Path $logsDir 'backend-artisan-serve.out.log'
  $backendErr = Join-Path $logsDir 'backend-artisan-serve.err.log'
  $backendProc = Start-Process -FilePath 'php' -ArgumentList @('Backend/artisan','serve','--host=127.0.0.1','--port=8000','--env=screenshots') -PassThru -WindowStyle Hidden -RedirectStandardOutput $backendOut -RedirectStandardError $backendErr
}

if (-not $SkipFrontendInstall) {
  if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    Write-Info "Installation frontend dependencies…"
    & npm --prefix $frontendDir install | Out-Host
  }
}

Write-Info "Build frontend…"
& npm --prefix $frontendDir run build | Out-Host

$frontendPortToWait = Get-FreePort -StartPort ([int]$FrontendPort) -MaxTries 10
$frontendOut = Join-Path $logsDir 'frontend-preview.out.log'
$frontendErr = Join-Path $logsDir 'frontend-preview.err.log'

# Windows (chemins avec espaces): on fixe le working directory au frontend, et on évite --prefix.
$frontendCmd = "npm run preview -- --host=127.0.0.1 --port=$frontendPortToWait --strictPort"
$frontendProc = Start-Process -FilePath 'cmd.exe' -WorkingDirectory $frontendDir -ArgumentList @('/c', $frontendCmd) -PassThru -WindowStyle Hidden -RedirectStandardOutput $frontendOut -RedirectStandardError $frontendErr

Write-Info "[3/5] Attente démarrage (ports $backendPortToWait et $frontendPortToWait)"
function Wait-Port([int]$Port, [int]$TimeoutSec = 60, $Proc = $null, [string]$ProcName = '') {
  $start = Get-Date
  while ((Get-Date) -lt $start.AddSeconds($TimeoutSec)) {
    if ($Proc -ne $null) {
      try {
        if ($Proc.HasExited) {
          throw "$ProcName s'est arrêté prématurément (exit code: $($Proc.ExitCode))."
        }
      } catch {
        throw
      }
    }
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $client.Connect('127.0.0.1', $Port)
      $client.Close()
      return
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }
  throw "Port $Port non joignable après ${TimeoutSec}s"
}

Wait-Port -Port $backendPortToWait -TimeoutSec 90 -Proc $backendProc -ProcName 'Backend'
try {
  Wait-Port -Port $frontendPortToWait -TimeoutSec 90 -Proc $frontendProc -ProcName 'Frontend preview'
} catch {
  Write-Warn "Échec démarrage frontend preview. Logs:"
  Write-Warn "- $frontendOut"
  Write-Warn "- $frontendErr"
  if (Test-Path $frontendOut) { Write-Host (Get-Content $frontendOut -Raw) }
  if (Test-Path $frontendErr) { Write-Host (Get-Content $frontendErr -Raw) }
  throw
}

Write-Info "[4/5] Capture via Puppeteer"

$frontendBase = "http://127.0.0.1:$frontendPortToWait"
Push-Location $frontendDir
try {
  if ([string]::IsNullOrWhiteSpace($env:SEED_SUPERADMIN_EMAIL)) { $env:SEED_SUPERADMIN_EMAIL = 'SuperAdmin@example.com' }
  if ([string]::IsNullOrWhiteSpace($env:SEED_DEFAULT_PASSWORD)) { $env:SEED_DEFAULT_PASSWORD = 'Password123!' }
  if ($useStaticBackoffice) {
    $staticBase = "http://127.0.0.1:$backendPortToWait"
    & node scripts/capture-screenshots.mjs --frontendBase=$frontendBase --backofficeStaticBase=$staticBase --out="../$OutDir" | Out-Host
  } else {
    & node scripts/capture-screenshots.mjs --frontendBase=$frontendBase --backendBase=$BackendUrl --out="../$OutDir" | Out-Host
  }
} finally {
  Pop-Location
}

Write-Info "[5/5] Arrêt serveurs"
try { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue } catch {}
try { if ($backendProc) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue } } catch {}

Write-Info "Terminé. Captures dans: $outDirPath"
