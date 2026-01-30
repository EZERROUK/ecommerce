@extends('pdf.layouts.hr-a4-premium')

@section('document_title', 'Attestation de Travail - ' . $employee->full_name)
@section('ref_prefix', 'AT')

@php
  $positionLen = mb_strlen((string) ($employee->position ?? ''));
  $deptLen = mb_strlen((string) ($employee->department?->name ?? ''));
  $isLong = ($positionLen + $deptLen) > 60;
@endphp

@section('page_class', $isLong ? 'long-content' : '')

@section('meta_hint')
  @if(($lang ?? 'fr') === 'ar')
    <span class="muted rtl">وثيقة رسمية</span>
  @else
    <span class="muted">Document officiel</span>
  @endif
@endsection

@section('main')
  <div class="doc-title">
    @if(($lang ?? 'fr') === 'ar')
      <span class="rtl">شهادة عمل</span>
    @else
      ATTESTATION DE TRAVAIL
    @endif
  </div>

  <div class="block avoid-break">
    <table class="kv">
      <tr>
        <td class="label">Nom</td>
        <td class="value">{{ $employee->full_name }}</td>
      </tr>
      <tr>
        <td class="label">Matricule</td>
        <td class="value">{{ $employee->employee_code ?? '—' }}</td>
      </tr>
      <tr>
        <td class="label">CIN</td>
        <td class="value">{{ $employee->cin ?? '—' }}</td>
      </tr>
      <tr>
        <td class="label">Fonction</td>
        <td class="value">{{ $employee->position ?? '—' }}@if($employee->department) — {{ $employee->department->name }}@endif</td>
      </tr>
    </table>
  </div>

  <div class="spacer-12"></div>

  <div class="block">
    @if(($lang ?? 'fr') === 'ar')
      <p class="rtl">
        نحن الموقعون أدناه، إدارة <strong>{{ $appSettings->company_name ?? 'الشركة' }}</strong>،
        نشهد بأن السيد(ة) <strong>{{ $employee->full_name }}</strong>،
        رقم التعريف الوطني: <strong>{{ $employee->cin ?? 'غير متوفر' }}</strong>،
        يعمل(تعمل) لدينا بصفة <strong>{{ $employee->position ?? '—' }}</strong>
        @if($employee->department)
          في قسم <strong>{{ $employee->department->name }}</strong>
        @endif
        منذ تاريخ <strong>{{ $employee->hire_date ? $employee->hire_date->locale('ar')->isoFormat('D MMMM YYYY') : 'غير محدد' }}</strong>.
      </p>
      <p class="rtl">
        @if($employee->status === 'active')
          وما زال(ت) يعمل(تعمل) لدينا حتى تاريخه في وضع نشط.
        @else
          وقد غادر(ت) منصبه(ها) بتاريخ <strong>{{ $employee->departure_date ? $employee->departure_date->locale('ar')->isoFormat('D MMMM YYYY') : 'غير محدد' }}</strong>.
        @endif
      </p>
      <p class="rtl">تم تحرير هذه الشهادة بناءً على طلبه(ها) لتقديمها حيثما يلزم.</p>
    @else
      <p>
        Nous soussignés, Direction de <strong>{{ $appSettings->company_name ?? "l'Entreprise" }}</strong>, attestons que Monsieur/Madame
        <strong>{{ $employee->full_name }}</strong>, titulaire de la CIN n° <strong>{{ $employee->cin ?? 'Non renseignée' }}</strong>,
        exerce au sein de notre établissement les fonctions de <strong>{{ $employee->position ?? '—' }}</strong>
        @if($employee->department)
          au sein du département <strong>{{ $employee->department->name }}</strong>
        @endif
        depuis le <strong>{{ $employee->hire_date ? $employee->hire_date->locale('fr')->isoFormat('D MMMM YYYY') : 'Non renseigné' }}</strong>.
      </p>
      <p>
        @if($employee->status === 'active')
          L'intéressé(e) est toujours en activité à ce jour.
        @else
          L'intéressé(e) a quitté ses fonctions le <strong>{{ $employee->departure_date ? $employee->departure_date->locale('fr')->isoFormat('D MMMM YYYY') : 'Non renseigné' }}</strong>.
        @endif
      </p>
      <p>La présente attestation est délivrée à l'intéressé(e) sur sa demande pour servir et valoir ce que de droit.</p>
    @endif
  </div>

  <div class="spacer-12"></div>

  <div class="signature avoid-break">
    <div class="signature-box">
      @if(($lang ?? 'fr') === 'ar')
        <div class="signature-title rtl">{{ $signatoryTitle ?: 'الإدارة' }}</div>
      @else
        <div class="signature-title">{{ $signatoryTitle ?: 'La Direction' }}</div>
      @endif
      <div class="signature-line">{{ $signatoryName ?: (($lang ?? 'fr') === 'ar' ? 'الختم والتوقيع' : 'Cachet et Signature') }}</div>
    </div>
  </div>
@endsection

@section('footer_right')
  <span class="muted">Officiel</span>
@endsection
