<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Models\Employee;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EmployeeDocumentController extends Controller
{
    private function makePdf(string $view, array $data)
    {
        $pdf = Pdf::loadView($view, $data);

        // DomPDF: UTF-8 + police fiable (accents FR) + PHP enabled (page numbers)
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'isPhpEnabled' => true,              // ✅ pour <script type="text/php"> (pagination)
            'defaultFont' => 'DejaVu Sans',
            'dpi' => 96,
            'isFontSubsettingEnabled' => true,
        ]);

        return $pdf;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers Audit (Activity Logs)
    // ─────────────────────────────────────────────────────────────────────

    private function extractSensitiveForPdf(Employee $employee): array
    {
        return [
            'cin' => $employee->cin,
            'salary_gross' => $employee->salary_gross,
            'salary_currency' => $employee->salary_currency,
            'pay_frequency' => $employee->pay_frequency,
        ];
    }

    private function maskKeepStartEnd(string $value, int $keepStart, int $keepEnd): string
    {
        $value = trim($value);
        $len = mb_strlen($value);

        if ($len === 0) return $value;

        if ($len <= ($keepStart + $keepEnd)) {
            return str_repeat('*', max(4, $len));
        }

        $start = $keepStart > 0 ? mb_substr($value, 0, $keepStart) : '';
        $end   = $keepEnd > 0 ? mb_substr($value, -$keepEnd) : '';
        $starsCount = max(4, $len - ($keepStart + $keepEnd));

        return $start . str_repeat('*', $starsCount) . $end;
    }

    private function maskSensitiveForPdf(array $data): array
    {
        // CIN partiellement, montants masqués
        foreach (['cin', 'salary_gross'] as $key) {
            if (!array_key_exists($key, $data)) continue;
            $value = $data[$key];
            if ($value === null || $value === '') continue;

            if ($key === 'cin') {
                $data[$key] = $this->maskKeepStartEnd((string) $value, 2, 2);
                continue;
            }

            $data[$key] = '***';
        }

        foreach (['salary_currency', 'pay_frequency'] as $key) {
            if (!array_key_exists($key, $data)) continue;
            $value = $data[$key];
            if ($value === null || $value === '') continue;
            $data[$key] = '***';
        }

        return $data;
    }

    private function auditPdf(
        Request $request,
        Employee $employee,
        string $event,
        string $documentType,
        string $lang,
        array $options,
        ?string $filename,
        ?int $durationMs = null,
        ?array $error = null
    ): void {
        $actor = $request->user();

        $sensitive = $this->extractSensitiveForPdf($employee);
        $safe = $this->maskSensitiveForPdf($sensitive);

        $sensitiveEncrypted = Crypt::encryptString(json_encode([
            'after' => $sensitive,
        ], JSON_UNESCAPED_UNICODE));

        $properties = [
            'action' => $event,
            'document_type' => $documentType,
            'lang' => $lang,
            'filename' => $filename,
            'employee' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
            ],

            // ✅ SAFE (visible par tous)
            'after' => $safe,

            // ✅ SENSIBLE (réservé SuperAdmin via déchiffrement backend)
            'sensitive_encrypted' => $sensitiveEncrypted,

            'options' => [
                'issued_at' => ($options['issueDate'] ?? null) instanceof Carbon
                    ? ($options['issueDate'])->toDateString()
                    : ($options['issueDate'] ?? null),
                'has_place' => !empty($options['place'] ?? null),
                'has_signatory_name' => !empty($options['signatoryName'] ?? null),
                'has_signatory_title' => !empty($options['signatoryTitle'] ?? null),
                'has_bank_name' => !empty($options['bankName'] ?? null),
                'has_bank_agency' => !empty($options['bankAgency'] ?? null),
            ],
            'request' => [
                'route' => optional($request->route())->getName(),
                'ip' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
            ],
        ];

        if ($durationMs !== null) {
            $properties['duration_ms'] = $durationMs;
        }

        if ($error) {
            $properties['error'] = $error;
        }

        $logger = activity('employee')
            ->performedOn($employee)
            ->event($event)
            ->withProperties($properties);

        if ($actor) {
            $logger->causedBy($actor);
        }

        $label = match ($documentType) {
            'employee-sheet' => 'Fiche Employé',
            'work-certificate' => 'Attestation de travail',
            'salary-certificate' => 'Attestation de salaire',
            'salary-domiciliation' => 'Domiciliation de salaire',
            default => $documentType,
        };

        $logger->log("PDF {$event} : {$label} — {$employee->employee_code}");
    }

    private function buildPdfLogContext(
        Request $request,
        Employee $employee,
        string $documentType,
        string $lang,
        array $options,
        ?string $filename = null,
        ?int $durationMs = null,
        ?array $error = null
    ): array {
        $user = $request->user();

        $ctx = [
            'event_source' => 'employees.pdf',
            'document_type' => $documentType,
            'lang' => $lang,
            'filename' => $filename,
            'employee' => [
                'id' => $employee->id,
                'code' => $employee->employee_code,
            ],
            'options' => [
                'issued_at' => ($options['issueDate'] ?? null) instanceof Carbon
                    ? ($options['issueDate'])->toDateString()
                    : ($options['issueDate'] ?? null),
                'has_place' => !empty($options['place'] ?? null),
                'has_signatory_name' => !empty($options['signatoryName'] ?? null),
                'has_signatory_title' => !empty($options['signatoryTitle'] ?? null),
                'has_bank_name' => !empty($options['bankName'] ?? null),
                'has_bank_agency' => !empty($options['bankAgency'] ?? null),
            ],
            'actor' => $user ? [
                'id' => $user->id,
            ] : null,
            'request' => [
                'method' => $request->method(),
                'path' => $request->path(),
                'route' => optional($request->route())->getName(),
                'ip' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
            ],
        ];

        if ($durationMs !== null) {
            $ctx['duration_ms'] = $durationMs;
        }
        if ($error) {
            $ctx['error'] = $error;
        }

        return $ctx;
    }

    private function normalizeLang(?string $lang): string
    {
        $lang = strtolower((string) $lang);
        return in_array($lang, ['fr', 'ar'], true) ? $lang : 'fr';
    }

    private function resolveIssueDate(Request $request): Carbon
    {
        $raw = $request->query('issued_at');
        if (!$raw) return Carbon::now();

        try {
            return Carbon::parse($raw);
        } catch (\Throwable) {
            return Carbon::now();
        }
    }

    private function resolveDocumentOptions(Request $request, ?AppSetting $appSettings): array
    {
        $signatoryName = trim((string) $request->query('signatory_name', ''));
        $signatoryTitle = trim((string) $request->query('signatory_title', ''));
        $place = trim((string) $request->query('place', ''));
        $bankName = trim((string) $request->query('bank_name', ''));
        $bankAgency = trim((string) $request->query('bank_agency', ''));

        return [
            'issueDate' => $this->resolveIssueDate($request),
            'place' => $place,
            'signatoryName' => $signatoryName,
            'signatoryTitle' => $signatoryTitle,
            'bankName' => $bankName !== '' ? $bankName : null,
            'bankAgency' => $bankAgency !== '' ? $bankAgency : null,
            'companyName' => $appSettings->company_name ?? 'Entreprise',
        ];
    }

    private function makeFilename(string $prefix, Employee $employee, Carbon $date): string
    {
        $matricule = (string) ($employee->employee_code ?: $employee->id);
        $matricule = preg_replace('/[^A-Za-z0-9_-]+/', '-', $matricule) ?: (string) $employee->id;
        $day = $date->format('Y-m-d');
        return "{$prefix}_{$matricule}_{$day}.pdf";
    }

    private function downloadPdf(
        Request $request,
        Employee $employee,
        string $documentType,
        string $view,
        string $filenamePrefix,
        array $relations,
        ?string $lang = 'fr'
    ): Response {
        $employee->load($relations);

        $lang = $this->normalizeLang($lang);
        $appSettings = AppSetting::first();
        $options = $this->resolveDocumentOptions($request, $appSettings);

        $filename = $this->makeFilename($filenamePrefix, $employee, $options['issueDate']);
        $start = microtime(true);

        // Audit + log (début)
        $this->auditPdf($request, $employee, 'pdf_generated', $documentType, $lang, $options, $filename);
        Log::info('employee_pdf_generation_started', $this->buildPdfLogContext(
            $request,
            $employee,
            $documentType,
            $lang,
            $options,
            $filename
        ));

        try {
            $pdf = $this->makePdf($view, [
                'employee' => $employee,
                'appSettings' => $appSettings,
                'lang' => $lang,
                ...$options,
            ]);

            $response = $pdf->download($filename);
            $durationMs = (int) round((microtime(true) - $start) * 1000);

            // Audit + log (download OK)
            $this->auditPdf($request, $employee, 'pdf_downloaded', $documentType, $lang, $options, $filename, $durationMs);
            Log::info('employee_pdf_download_response_created', $this->buildPdfLogContext(
                $request,
                $employee,
                $documentType,
                $lang,
                $options,
                $filename,
                $durationMs
            ));

            return $response;
        } catch (\Throwable $e) {
            $durationMs = (int) round((microtime(true) - $start) * 1000);

            $error = [
                'message' => $e->getMessage(),
                'class' => get_class($e),
            ];

            $this->auditPdf($request, $employee, 'pdf_failed', $documentType, $lang, $options, $filename, $durationMs, $error);
            Log::error('employee_pdf_generation_failed', $this->buildPdfLogContext(
                $request,
                $employee,
                $documentType,
                $lang,
                $options,
                $filename,
                $durationMs,
                $error
            ));

            throw $e;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Endpoints
    // ─────────────────────────────────────────────────────────────────────
    public function downloadEmployeeSheet(Request $request, Employee $employee, ?string $lang = 'fr'): Response
    {
        return $this->downloadPdf(
            $request,
            $employee,
            'employee-sheet',
            'pdf.employees.employee-sheet',
            'fiche-employe',
            ['department', 'manager', 'reports', 'createdBy', 'departmentHead'],
            $lang
        );
    }

    public function downloadWorkCertificate(Request $request, Employee $employee, ?string $lang = 'fr'): Response
    {
        return $this->downloadPdf(
            $request,
            $employee,
            'work-certificate',
            'pdf.employees.work-certificate',
            'attestation-travail',
            ['department'],
            $lang
        );
    }

    public function downloadSalaryCertificate(Request $request, Employee $employee, ?string $lang = 'fr'): Response
    {
        return $this->downloadPdf(
            $request,
            $employee,
            'salary-certificate',
            'pdf.employees.salary-certificate',
            'attestation-salaire',
            ['department'],
            $lang
        );
    }

    /**
     * Télécharge la domiciliation de salaire (modèle marocain) en PDF
     */
    public function downloadSalaryDomiciliation(Request $request, Employee $employee, ?string $lang = 'fr'): Response
    {
        return $this->downloadPdf(
            $request,
            $employee,
            'salary-domiciliation',
            'pdf.employees.salary-domiciliation',
            'domiciliation-salaire',
            ['department'],
            $lang
        );
    }
}
