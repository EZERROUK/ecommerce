<!DOCTYPE html>
<html lang="{{ $lang ?? 'fr' }}">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('document_title', 'Document')</title>

  <style>
    /*
      ✅ Marges EXACTEMENT comme Word (ta capture)
      Haut: 1,45 cm | Bas: 2 cm | Gauche/Droite: 2,5 cm
    */
    @page { size: A4; margin: 14.5mm 25mm 20mm 25mm; }

    html, body { margin:0; padding:0; }
    * { box-sizing:border-box; }

    body{
      font-family:'DejaVu Sans', Arial, sans-serif;
      font-size:10.2pt;
      line-height:1.55;
      color:#0F2B2E;
      background:#FFFFFF;
    }

    p{ margin:0 0 8pt 0; line-height:1.65; }
    strong{ font-weight:700; color:#0F2B2E; }
    .muted{ color:#6B7280; }
    .rtl{ direction:rtl; text-align:right; unicode-bidi:bidi-override; }
    img{ display:block; }

    body.long-content{ font-size:9.7pt; }

    /*
      ✅ Header/Footer répétés
      On les place DANS les marges (top:-14.5mm / bottom:-20mm)
      => aucune “grande zone vide” en haut.
    */
    .pdf-header{
      position:fixed;
      top:-14.5mm;      /* = marge top */
      left:0;
      right:0;
      height:14.5mm;    /* = marge top */
    }
    .pdf-header-inner{
      height:14.5mm;
      padding-top:2.2mm;
    }

    .pdf-footer{
      position:fixed;
      bottom:-20mm;     /* = marge bottom */
      left:0;
      right:0;
      height:20mm;      /* = marge bottom */
    }
    .pdf-footer-inner{
      height:20mm;
      padding-bottom:6mm;
      font-size:9pt;
      color:#6B7280;
    }

    /* Header compact (pour tenir dans 1,45 cm) */
    .header-grid{ width:100%; border-collapse:collapse; }
    .header-grid td{ vertical-align:middle; }

    .company-line{
      font-weight:800;
      font-size:10.6pt;
      color:#0E3E44;
      line-height:1.1;
    }

    .company-logo{
      max-height:8mm;
      max-width:28mm;
      margin-right:8pt;
    }

    .meta{
      text-align:right;
      font-size:9.2pt;
      color:#6B7280;
      line-height:1.15;
      white-space:nowrap;
    }
    .meta strong{ color:#0F2B2E; font-weight:800; }

    .header-rule{
      margin-top:2mm;
      height:1px;
      background:#E5E7EB;
    }
    .header-accent{
      margin-top:1mm;
      height:2px;
      width:42mm;
      background:#D89C3C;
      border-radius:2pt;
    }

    /* Footer compact */
    .footer-rule{ height:1px; background:#E5E7EB; margin-bottom:5pt; }
    .footer-row{ width:100%; border-collapse:collapse; }
    .footer-row td{ vertical-align:middle; }
    .footer-left strong{ color:#0F2B2E; }

    /* ─────────────────────────────
       Blocs corporate (tes sections)
    ───────────────────────────── */
    .doc-title{
      font-size:14pt;
      font-weight:800;
      text-align:center;
      letter-spacing:.8pt;
      color:#0E3E44;
      margin:2pt 0 12pt;
      text-transform:uppercase;
    }

    .hero{
      width:100%;
      border-collapse:collapse;
      margin:0 0 12pt 0;
    }
    .hero td{
      padding:10pt 12pt;
      background:#0E3E44;
      color:#fff;
      border-radius:7pt;
    }
    .hero-title{
      font-size:13.8pt;
      font-weight:800;
      letter-spacing:.25pt;
      margin-bottom:3pt;
    }
    .hero-subtitle{
      font-size:9pt;
      color:#E9F0F1;
      line-height:1.35;
    }
    .hero-rule{
      height:2px;
      width:42mm;
      background:#D89C3C;
      margin-top:8pt;
      border-radius:2pt;
    }

    .section{ margin-bottom:12pt; page-break-inside:avoid; }
    .section-bar{ width:100%; border-collapse:collapse; margin:0 0 6pt 0; }
    .section-bar td{
      padding:7pt 10pt;
      background:#F6F8FC;
      border:1px solid #E5E7EB;
      border-left:4pt solid #D89C3C;
    }
    .section-title{
      font-size:9.6pt;
      font-weight:800;
      letter-spacing:.45pt;
      text-transform:uppercase;
      color:#0F2B2E;
    }

    .grid2{ width:100%; border-collapse:collapse; }
    .grid2 td{ vertical-align:top; }
    .grid-gap{ width:16pt; }

    .form, .pair, .kv{
      width:100%;
      border-collapse:collapse;
      border:1px solid #E5E7EB;
    }
    .form tr, .pair tr, .kv tr{ border-bottom:1px solid #F1F3F6; }
    .form tr:last-child, .pair tr:last-child, .kv tr:last-child{ border-bottom:none; }

    .form td, .pair td{ padding:7pt 10pt; vertical-align:middle; }
    .kv td{ padding:7pt 12pt; vertical-align:top; }

    .label{
      color:#6B7280;
      font-size:8.9pt;
      font-weight:800;
      letter-spacing:.12pt;
      white-space:nowrap;
    }
    .value{
      font-weight:800;
      color:#0F2B2E;
    }
    .value-line{
      display:block;
      padding-bottom:2pt;
      border-bottom:1px solid #E5E7EB;
      min-height:12pt;
    }

    .pair .label{ width:16%; }
    .pair .value{ width:34%; }

    .block{
      border:1px solid #E5E7EB;
      background:#FFFFFF;
      padding:10pt 12pt;
      border-radius:7pt;
    }

    .h2{ font-size:10.5pt; font-weight:800; margin:0 0 6pt; color:#0F2B2E; }

    .note{
      border:1px solid #E5E7EB;
      padding:10pt 12pt;
      background:#fff;
      color:#0F2B2E;
      line-height:1.65;
      border-radius:7pt;
    }

    .signature{ text-align:right; }
    .signature-box{ display:inline-block; min-width:220px; text-align:center; }
    .signature-title{ font-weight:800; margin-bottom:4pt; }
    .signature-line{
      margin-top:20pt;
      border-top:1px solid #0F2B2E;
      padding-top:7pt;
      font-size:9pt;
      color:#0F2B2E;
    }

    .spacer-10{ height:10pt; }
    .spacer-12{ height:12pt; }
    .avoid-break{ page-break-inside:avoid; }

    body.long-content .form td,
    body.long-content .pair td,
    body.long-content .kv td{ padding:6.5pt 10pt; }
    body.long-content .signature-line{ margin-top:16pt; }
  </style>

  @yield('styles')
</head>

<body class="@yield('page_class')">
@php
  $refCode = data_get($employee, 'employee_code') ?? data_get($employee, 'id') ?? '';

  // Supporte plusieurs champs selon ton AppSetting
  $logoRel = $appSettings->logo_dark_path
      ?? $appSettings->logo_path
      ?? $appSettings->logo_dark
      ?? $appSettings->logo
      ?? null;

  $logoData = null;
  if (!empty($logoRel)) {
      $logoRelClean = ltrim((string) $logoRel, '/');
      $logoRelClean = str_replace(['storage/storage/'], ['storage/'], $logoRelClean);

      $path = str_starts_with($logoRelClean, 'storage/')
          ? public_path($logoRelClean)
          : public_path('storage/' . $logoRelClean);

      if (is_string($path) && file_exists($path)) {
          $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
          $mime = in_array($ext, ['jpg','jpeg'], true) ? 'image/jpeg' : 'image/png';
          $logoData = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($path));
      }
  }
@endphp

<header class="pdf-header">
  <div class="pdf-header-inner">
    <table class="header-grid">
      <tr>
        <td style="width:65%;">
          <table style="border-collapse:collapse;">
            <tr>
              @if($logoData)
                <td style="vertical-align:middle;">
                  <img src="{{ $logoData }}" alt="" class="company-logo">
                </td>
              @endif
              <td style="vertical-align:middle;">
                <div class="company-line">{{ $appSettings->company_name ?? 'Entreprise' }}</div>
              </td>
            </tr>
          </table>
        </td>

        <td style="width:35%;">
          <div class="meta">
            Réf. <strong>@yield('ref_prefix')</strong>@if($refCode) -{{ $refCode }}@endif
            &nbsp;·&nbsp;
            {{ $issueDate->locale($lang ?? 'fr')->isoFormat('D MMMM YYYY') }}
          </div>
        </td>
      </tr>
    </table>

    <div class="header-rule"></div>
    <div class="header-accent"></div>
  </div>
</header>

<footer class="pdf-footer">
  <div class="pdf-footer-inner">
    <div class="footer-rule"></div>
    <table class="footer-row">
      <tr>
        <td class="footer-left" style="text-align:left;">
          <strong>{{ $appSettings->company_name ?? '' }}</strong>
          <span class="muted"> — Documents RH</span>
        </td>
        <td style="text-align:center;">
          <span class="muted">@yield('footer_center', '')</span>
        </td>
        <td style="text-align:right;">
          @yield('footer_right')
        </td>
      </tr>
    </table>
  </div>
</footer>

<main>
  @yield('main')

  @hasSection('main_bottom')
    <div class="spacer-12"></div>
    @yield('main_bottom')
  @endif
</main>

{{-- ✅ Pagination (Page X / Y) - nécessite isPhpEnabled=true dans le controller --}}
<script type="text/php">
if (isset($pdf) && isset($fontMetrics)) {
    $font = $fontMetrics->get_font("DejaVu Sans", "normal");
    $size = 9;

    $w = $pdf->get_width();
    $h = $pdf->get_height();

    $text = "Page $PAGE_NUM / $PAGE_COUNT";
    $textWidth = $fontMetrics->get_text_width($text, $font, $size);

    // Dans le bas (zone footer), aligné à droite
    $x = $w - 25 - $textWidth;  // 25pt approx
    $y = $h - 18;               // près du bas

    $pdf->text($x, $y, $text, $font, $size, array(107,114,128));
}
</script>

</body>
</html>
