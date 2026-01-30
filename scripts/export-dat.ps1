[CmdletBinding()]
param(
  [string]$InputFile = "DAT.md",
  [string]$OutDir = "dist-docs",
  [string]$BaseName = "DAT-X-Zone",
  [switch]$SkipPdf,
  [string]$PdfTemplate = "scripts/pandoc/corporate-template.tex"
)

$ErrorActionPreference = 'Stop'

# Assure une sortie console UTF-8 (évite les artefacts type "TerminÃ©")
try {
  $OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

# Recharge le PATH (winget peut modifier le PATH après installation)
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

function Write-Info([string]$Message) { Write-Host $Message -ForegroundColor Cyan }
function Write-Warn([string]$Message) { Write-Host $Message -ForegroundColor Yellow }
function Write-Err([string]$Message)  { Write-Host $Message -ForegroundColor Red }

$root = (Get-Location).Path
$inputPath = Join-Path $root $InputFile

$pdfTemplatePath = Join-Path $root $PdfTemplate

if (-not (Test-Path $inputPath)) {
  Write-Err "Fichier introuvable: $inputPath"
  exit 1
}

$outDirPath = Join-Path -Path $root -ChildPath $OutDir
New-Item -ItemType Directory -Force -Path $outDirPath | Out-Null

$pandoc = Get-Command pandoc -ErrorAction SilentlyContinue
if (-not $pandoc) {
  Write-Err "Pandoc n'est pas installé (commande 'pandoc' introuvable)."
  Write-Host "" 
  Write-Info "Installation recommandée (Windows):"
  Write-Host "- winget: winget install --id JohnMacFarlane.Pandoc" 
  Write-Host "- Chocolatey: choco install pandoc" 
  Write-Host "" 
  Write-Info "Ensuite relance: .\\scripts\\export-dat.ps1"
  Write-Host "" 
  Write-Warn "PDF: nécessite aussi un moteur LaTeX (ex: MiKTeX) pour que pandoc puisse produire un PDF."
  Write-Host "- winget: winget install --id MiKTeX.MiKTeX" 
  Write-Host "- Chocolatey: choco install miktex" 
  exit 2
}

$outHtml = Join-Path -Path $outDirPath -ChildPath ("$BaseName.html")
$outDocx = Join-Path -Path $outDirPath -ChildPath ("$BaseName.docx")
$outPdf  = Join-Path -Path $outDirPath -ChildPath ("$BaseName.pdf")

$pandocExe = $pandoc.Source

$commonArgs = @(
  '--toc',
  '--toc-depth=3',
  '--number-sections',
  '--metadata',
  ("title=$BaseName")
)

Write-Info "Export HTML -> $outHtml"; & $pandocExe $inputPath '--standalone' @commonArgs '-o' $outHtml

Write-Info "Export DOCX -> $outDocx"; & $pandocExe $inputPath @commonArgs '-o' $outDocx

if (-not $SkipPdf) {
  Write-Info "Export PDF -> $outPdf";
  try {
    $pdfArgs = @()
    if (Test-Path $pdfTemplatePath) {
      $pdfArgs += @('--template', $pdfTemplatePath)
    } else {
      Write-Warn "Template PDF introuvable: $pdfTemplatePath (export PDF avec template Pandoc par défaut)."
    }

    # Paramètres corporate: A4 + marges 2cm + police 11pt + interligne 1.15 + texte justifié
    # (Le template renforce l’habillage, mais on garde aussi des variables explicites.)
    $pdfArgs += @(
      '--pdf-engine=pdflatex',
      '-V', 'papersize=a4',
      '-V', 'fontsize=11pt',
      '-V', 'geometry:margin=2cm',
      '-V', 'linestretch=1.15'
    )

    & $pandocExe $inputPath @commonArgs @pdfArgs '-o' $outPdf
  } catch {
    Write-Warn "Échec export PDF. Cause probable: moteur LaTeX absent (MiKTeX/TeXLive)."
    Write-Warn "Tu peux installer MiKTeX puis relancer, ou faire: .\\scripts\\export-dat.ps1 -SkipPdf"
    Write-Host "Détail erreur: $($_.Exception.Message)"
  }
}

Write-Info "Terminé. Sorties dans: $(Join-Path $root $OutDir)" 
