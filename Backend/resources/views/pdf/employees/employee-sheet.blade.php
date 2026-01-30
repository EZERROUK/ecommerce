@extends('pdf.layouts.hr-a4-premium')

@section('document_title', 'Fiche Employé - ' . $employee->full_name)
@section('ref_prefix', 'FE')

@php
  $addressLen = mb_strlen((string) ($employee->address ?? ''));
  $notesLen   = mb_strlen((string) ($employee->notes ?? ''));
  $isLong     = $addressLen > 110 || $notesLen > 160;

  $hasSignature = !empty($signatoryTitle) || !empty($signatoryName);
@endphp

@section('page_class', $isLong ? 'long-content' : '')

@section('meta_hint')
  <span class="muted">Fiche interne</span>
  @if(!empty($employee->department?->name))
    <span class="muted"> · {{ $employee->department->name }}</span>
  @endif
@endsection

@section('main')

  <table class="hero">
    <tr>
      <td>
        <div class="hero-title">Fiche de données de l’employé</div>
        <div class="hero-subtitle">
          Synthèse des informations personnelles, emploi, contact, urgence et coordonnées bancaires.
        </div>
        <div class="hero-rule"></div>
      </td>
    </tr>
  </table>

  {{-- 1) INFORMATIONS PERSONNELLES --}}
  <div class="section">
    <table class="section-bar"><tr><td><span class="section-title">Informations personnelles</span></td></tr></table>

    <table class="pair">
      <tr>
        <td class="label">Nom</td>
        <td class="value"><span class="value-line">{{ $employee->full_name }}</span></td>
        <td class="label">Matricule</td>
        <td class="value"><span class="value-line">{{ $employee->employee_code ?? '—' }}</span></td>
      </tr>
      <tr>
        <td class="label">CIN</td>
        <td class="value"><span class="value-line">{{ $employee->cin ?? '—' }}</span></td>
        <td class="label">N° CNSS</td>
        <td class="value"><span class="value-line">{{ $employee->cnss_number ?? '—' }}</span></td>
      </tr>
      <tr>
        <td class="label">Naissance</td>
        <td class="value"><span class="value-line">{{ $employee->date_of_birth ? $employee->date_of_birth->format('d/m/Y') : '—' }}</span></td>
        <td class="label"></td>
        <td class="value"><span class="value-line">&nbsp;</span></td>
      </tr>
    </table>
  </div>

  {{-- 2) INFORMATIONS D’EMPLOI --}}
  <div class="section">
    <table class="section-bar"><tr><td><span class="section-title">Informations d’emploi</span></td></tr></table>

    <table class="pair">
      <tr>
        <td class="label">Fonction</td>
        <td class="value"><span class="value-line">{{ $employee->position ?? '—' }}</span></td>
        <td class="label">Département</td>
        <td class="value"><span class="value-line">{{ $employee->department->name ?? '—' }}</span></td>
      </tr>
      <tr>
        <td class="label">Type contrat</td>
        <td class="value">
          <span class="value-line">
            @switch($employee->contract_type)
              @case('full_time') Temps plein @break
              @case('part_time') Temps partiel @break
              @case('temp') Temporaire @break
              @case('freelance') Freelance @break
              @default {{ $employee->contract_type ?? '—' }}
            @endswitch
          </span>
        </td>
        <td class="label">Type d’emploi</td>
        <td class="value">
          <span class="value-line">
            @switch($employee->employment_type)
              @case('permanent') CDI @break
              @case('fixed_term') CDD @break
              @case('intern') Stage @break
              @case('contractor') Prestataire @break
              @case('apprentice') Apprenti @break
              @case('apprentice') Apprenti @break
              @default {{ $employee->employment_type ?? '—' }}
            @endswitch
          </span>
        </td>
      </tr>
      <tr>
        <td class="label">Date d’entrée</td>
        <td class="value"><span class="value-line">{{ $employee->hire_date ? $employee->hire_date->format('d/m/Y') : '—' }}</span></td>
        <td class="label"></td>
        <td class="value"><span class="value-line">&nbsp;</span></td>
      </tr>
    </table>
  </div>

  {{-- 3) CONTACT / URGENCE --}}
  <div class="section">
    <table class="section-bar"><tr><td><span class="section-title">Contact & Urgence</span></td></tr></table>

    <table class="grid2">
      <tr>
        <td style="width:49%;">
          <table class="form">
            <tr>
              <td class="label">Email</td>
              <td class="value">
                <span class="value-line">
                  @if($employee->email)<span class="mono">{{ $employee->email }}</span>@else—@endif
                </span>
              </td>
            </tr>
            <tr>
              <td class="label">Téléphone</td>
              <td class="value"><span class="value-line">{{ $employee->phone_number ?? '—' }}</span></td>
            </tr>
            <tr>
              <td class="label">Manager</td>
              <td class="value">
                <span class="value-line">
                  {{ $employee->manager ? ($employee->manager->first_name . ' ' . $employee->manager->last_name) : '—' }}
                </span>
              </td>
            </tr>
            <tr>
              <td class="label">Adresse</td>
              <td class="value"><span class="value-line">{{ $employee->address ?? '—' }}</span></td>
            </tr>
          </table>
        </td>

        <td class="grid-gap"></td>

        <td style="width:49%;">
          <table class="form">
            <tr>
              <td class="label">Contact d’urgence</td>
              <td class="value"><span class="value-line">{{ $employee->emergency_contact_name ?? '—' }}</span></td>
            </tr>
            <tr>
              <td class="label">Tél. urgence</td>
              <td class="value"><span class="value-line">{{ $employee->emergency_contact_phone ?? '—' }}</span></td>
            </tr>
            <tr>
              <td class="label">IBAN</td>
              <td class="value">
                <span class="value-line">
                  @if($employee->bank_iban)<span class="mono">{{ $employee->bank_iban }}</span>@else—@endif
                </span>
              </td>
            </tr>
            <tr>
              <td class="label">RIB</td>
              <td class="value">
                <span class="value-line">
                  @if($employee->bank_rib)<span class="mono">{{ $employee->bank_rib }}</span>@else—@endif
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>

  {{-- 4) NOTES --}}
  @if(!empty($employee->notes))
    <div class="section">
      <table class="section-bar"><tr><td><span class="section-title">Notes</span></td></tr></table>
      <div class="note">{{ $employee->notes }}</div>
    </div>
  @endif

@endsection

@if($hasSignature)
  @section('main_bottom')
    <div class="signature">
      <div class="signature-box">
        <div class="signature-title">{{ $signatoryTitle ?? 'La Direction' }}</div>
        <div class="signature-line">{{ $signatoryName ?? 'Cachet et signature' }}</div>
      </div>
    </div>
  @endsection
@endif

@section('footer_right')
  <span class="muted">Confidentiel</span>
@endsection
