@extends('pdf.layouts.hr-a4-premium')

@section('document_title', 'Domiciliation de Salaire - ' . $employee->full_name)
@section('ref_prefix', 'DS')

@php
    $positionLen = mb_strlen((string) ($employee->position ?? ''));
    $deptLen = mb_strlen((string) ($employee->department?->name ?? ''));
    $isLong = ($positionLen + $deptLen) > 60;
@endphp

@section('page_class', $isLong ? 'long-content' : '')

@section('main')
    <div class="doc-title">
        @if(($lang ?? 'fr') === 'ar')
            <span class="rtl">طلب توطين الأجرة</span>
        @else
            DOMICILIATION DE SALAIRE
        @endif
    </div>

    <div class="block avoid-break">
        <table class="kv">
            <tr>
                <td class="label">Banque</td>
                <td class="value">{{ $bankName ?: '—' }}</td>
            </tr>
            <tr>
                <td class="label">Agence</td>
                <td class="value">{{ $bankAgency ?: '—' }}</td>
            </tr>
        </table>
    </div>

    <div class="spacer-12"></div>

    <div class="block">
        @if(($lang ?? 'fr') === 'ar')
            <p class="rtl">
                نحن الموقعون أدناه، إدارة <strong>{{ $appSettings->company_name ?? 'الشركة' }}</strong>،
                نلتمس منكم توطين أجرة السيد(ة) <strong>{{ $employee->full_name }}</strong>
                رقم التعريف الوطني: <strong>{{ $employee->cin ?? 'غير متوفر' }}</strong>،
                الذي(التي) يعمل(تعمل) لدينا بصفة <strong>{{ $employee->position ?? '—' }}</strong>
                @if($employee->department)
                    في قسم <strong>{{ $employee->department->name }}</strong>
                @endif
                منذ تاريخ <strong>{{ $employee->hire_date ? $employee->hire_date->locale('ar')->isoFormat('D MMMM YYYY') : 'غير محدد' }}</strong>.
            </p>
        @else
            <p>
                Nous soussignés, Direction de <strong>{{ $appSettings->company_name ?? "l'Entreprise" }}</strong>,
                vous prions de bien vouloir procéder à la domiciliation du salaire de Monsieur/Madame
                <strong>{{ $employee->full_name }}</strong>, titulaire de la CIN n° <strong>{{ $employee->cin ?? 'Non renseignée' }}</strong>,
                occupant le poste de <strong>{{ $employee->position ?? '—' }}</strong>
                @if($employee->department)
                    au sein du département <strong>{{ $employee->department->name }}</strong>
                @endif
                depuis le <strong>{{ $employee->hire_date ? $employee->hire_date->locale('fr')->isoFormat('D MMMM YYYY') : 'Non renseigné' }}</strong>.
            </p>
        @endif
    </div>

    <div class="spacer-10"></div>

    <div class="block avoid-break">
        <div class="h2">Coordonnées de domiciliation</div>
        <table class="kv">
            <tr>
                <td class="label">IBAN</td>
                <td class="value">{{ $employee->bank_iban ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">RIB</td>
                <td class="value">{{ $employee->bank_rib ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Salaire brut déclaré</td>
                <td class="value">
                    @if($employee->salary_gross)
                        {{ number_format($employee->salary_gross, 2, ',', ' ') }} {{ $employee->salary_currency ?? 'MAD' }}
                    @else
                        —
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="spacer-12"></div>

    <div class="block">
        @if(($lang ?? 'fr') === 'ar')
            <p class="rtl">تم تحرير هذا الطلب لتقديمه للإدارة البنكية المعنية.</p>
        @else
            <p>La présente demande est établie pour servir et valoir ce que de droit auprès de votre établissement.</p>
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
