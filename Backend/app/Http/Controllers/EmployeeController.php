<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Department;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $query = Employee::query()
            ->withTrashed()
            ->with('department:id,name');

        /* ---------------- Recherche globale ---------------- */
        $query->when(request('search'), function ($q, $search) {
            $tokens = preg_split('/\s+/', trim($search));

            $q->where(function ($qq) use ($tokens) {
                foreach ($tokens as $token) {
                    $qq->where(function ($w) use ($token) {
                        $w->where('first_name', 'like', "%{$token}%")
                          ->orWhere('last_name', 'like', "%{$token}%")
                          ->orWhere('email', 'like', "%{$token}%")
                          ->orWhere('position', 'like', "%{$token}%")
                          ->orWhere('employee_code', 'like', "%{$token}%")
                          ->orWhere('cin', 'like', "%{$token}%");
                    });
                }
            });
        });

        /* ---------------- Statut (métier) ---------------- */
        $query->when(request()->filled('status'), function ($q) {
            $q->where('status', request('status'));
        });

        /* ---------------- Département ---------------- */
        $query->when(request()->filled('department_id'), function ($q) {
            $q->where('department_id', request('department_id'));
        });

        /* ---------------- Date d'embauche ---------------- */
        $query->when(
            request()->filled('start_date') && request()->filled('end_date'),
            fn ($q) => $q->whereBetween('hire_date', [
                request('start_date'),
                request('end_date'),
            ])
        );

        /* ---------------- Tri ---------------- */
        $sort = request('sort', 'name');
        $dir  = request('direction', 'asc');

        if ($sort === 'status') {
            $query->orderBy('status', $dir)
                  ->orderBy('last_name', 'asc')
                  ->orderBy('first_name', 'asc');
        } else {
            $query->orderBy('last_name', $dir)
                  ->orderBy('first_name', $dir);
        }

        /* ---------------- Pagination ---------------- */
        $perPage = (int) request('per_page', 10);

        if ($perPage === -1) {
            $count = $query->count();
            $employees = $query->paginate($count > 0 ? $count : 1);
        } else {
            $employees = $query->paginate($perPage);
        }

        return Inertia::render('Employees/Index', [
            'employees'   => $employees->withQueryString(),
            'filters'     => request()->only([
                'search',
                'status',
                'department_id',
                'start_date',
                'end_date',
                'sort',
                'direction',
                'per_page',
            ]),
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function create()
    {
        $departments = Department::select('id','name')->orderBy('name')->get();

        $last = Employee::withTrashed()
            ->where('employee_code', 'like', 'EMP-%')
            ->orderBy('employee_code', 'desc')
            ->value('employee_code');

        $nextNumber = 1;
        if ($last && preg_match('/^EMP-(\d{4,})$/', $last, $m)) {
            $nextNumber = ((int)$m[1]) + 1;
        }
        $next = 'EMP-'.str_pad((string)$nextNumber, 4, '0', STR_PAD_LEFT);

        $managers = Employee::select('id','first_name','last_name')
            ->where('is_manager', true)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        return Inertia::render('Employees/Create', [
            'departments'        => $departments,
            'next_employee_code' => $next,
            'managers'           => $managers,
        ]);
    }

    public function store(StoreEmployeeRequest $request)
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();

        $photoPath    = $request->hasFile('photo')    ? $request->file('photo')->store('employees/photos', 'public')       : null;
        $cvPath       = $request->hasFile('cv')       ? $request->file('cv')->store('employees/cv', 'public')              : null;
        $contractPath = $request->hasFile('contract') ? $request->file('contract')->store('employees/contracts', 'public') : null;

        $employee = Employee::create([
            'first_name'     => $request->first_name,
            'last_name'      => $request->last_name,
            'employee_code'  => $request->employee_code,
            'cin'            => $request->cin,
            'cnss_number'    => $request->cnss_number ?: null,
            'photo'          => $photoPath,
            'cv_path'        => $cvPath,
            'contract_path'  => $contractPath,
            'email'          => $request->email,
            'phone_number'   => $request->phone_number,
            'address'        => $request->address,
            'date_of_birth'  => $request->date_of_birth,

            'position'       => $request->position,
            'department_id'  => $request->department_id,
            'status'         => $request->status,
            'hire_date'      => $request->hire_date,
            'departure_date' => $request->departure_date,

            'manager_id'         => $request->manager_id,
            'is_manager'         => $request->boolean('is_manager'),
            'location'           => $request->location,
            'probation_end_date' => $request->probation_end_date,
            'last_review_date'   => $request->last_review_date,
            'notes'              => $request->notes,

            'employment_type' => $request->employment_type,
            'contract_type'   => $request->contract_type,
            'work_schedule'   => $request->work_schedule,
            'salary_gross'    => $request->salary_gross,
            'salary_currency' => strtoupper($request->salary_currency ?? 'EUR'),
            'pay_frequency'   => $request->pay_frequency,
            'hourly_rate'     => $request->hourly_rate,
            'bonus_target'    => $request->bonus_target,
            'benefits'        => $request->benefits,
            'cost_center'     => $request->cost_center,

            'emergency_contact_name'  => $request->emergency_contact_name,
            'emergency_contact_phone' => $request->emergency_contact_phone,
            'bank_iban'               => $request->bank_iban,
            'bank_rib'                => $request->bank_rib,

            'created_by' => $actor->id,
        ]);

        // Données sensibles (avant/après). Ici on a surtout "after" à la création.
        $afterRaw = $employee->only($this->auditFields());
        $afterMasked = $this->maskSensitiveArray($afterRaw);

        $sensitiveEncrypted = Crypt::encryptString(json_encode([
            'after' => $this->extractSensitive($afterRaw),
        ], JSON_UNESCAPED_UNICODE));

        activity('employee')
            ->performedOn($employee)
            ->causedBy($actor)
            ->event('created')
            ->withProperties([
                'action' => 'create',
                'employee' => [
                    'id' => $employee->id,
                    'employee_code' => $employee->employee_code,
                    'full_name' => trim($employee->first_name . ' ' . $employee->last_name),
                ],

                // ✅ SAFE (visible par tous)
                'after' => $afterMasked,

                // ✅ SENSIBLE (réservé SuperAdmin via déchiffrement backend)
                'sensitive_encrypted' => $sensitiveEncrypted,

                'files' => [
                    'photo_uploaded' => (bool) $photoPath,
                    'cv_uploaded' => (bool) $cvPath,
                    'contract_uploaded' => (bool) $contractPath,
                ],
            ])
            ->log("Employé créé : {$employee->employee_code} — " . trim($employee->first_name . ' ' . $employee->last_name));

        return redirect()->route('employees.index')->with('success', 'Employé créé avec succès.');
    }

    public function show(Employee $employee)
    {
        $employee->load(['department', 'manager', 'reports', 'createdBy', 'departmentHead']);

        return Inertia::render('Employees/Show', [
            'employee' => $employee,
        ]);
    }

    public function edit(Employee $employee)
    {
        $departments = Department::select('id', 'name')->orderBy('name')->get();

        $managersQuery = Employee::query()
            ->select('id', 'first_name', 'last_name')
            ->where('id', '!=', $employee->id)
            ->where(function ($q) use ($employee) {
                $q->where('is_manager', true);

                // Garde le manager actuel visible même si pas encore flaggé manager
                if ($employee->manager_id) {
                    $q->orWhere('id', $employee->manager_id);
                }
            })
            ->orderBy('first_name')
            ->orderBy('last_name');

        $managers = $managersQuery->get();

        return Inertia::render('Employees/Edit', [
            'employee'    => $employee,
            'departments' => $departments,
            'managers'    => $managers,
        ]);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee)
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();

        // 🔎 Valeurs réelles pour calculer précisément les changements
        $beforeRaw = $employee->only($this->auditFields());

        $filesChanged = [
            'photo_replaced' => false,
            'cv_replaced' => false,
            'contract_replaced' => false,
        ];

        if ($request->hasFile('photo')) {
            if ($employee->photo) Storage::disk('public')->delete($employee->photo);
            $employee->photo = $request->file('photo')->store('employees/photos', 'public');
            $filesChanged['photo_replaced'] = true;
        }

        if ($request->hasFile('cv')) {
            if ($employee->cv_path) Storage::disk('public')->delete($employee->cv_path);
            $employee->cv_path = $request->file('cv')->store('employees/cv', 'public');
            $filesChanged['cv_replaced'] = true;
        }

        if ($request->hasFile('contract')) {
            if ($employee->contract_path) Storage::disk('public')->delete($employee->contract_path);
            $employee->contract_path = $request->file('contract')->store('employees/contracts', 'public');
            $filesChanged['contract_replaced'] = true;
        }

        $employee->fill([
            'first_name'     => $request->first_name,
            'last_name'      => $request->last_name,
            'employee_code'  => $request->employee_code,
            'cin'            => $request->cin,
            'cnss_number'    => $request->cnss_number ?: null,
            'email'          => $request->email,
            'phone_number'   => $request->phone_number,
            'address'        => $request->address,
            'date_of_birth'  => $request->date_of_birth,

            'position'       => $request->position,
            'department_id'  => $request->department_id,
            'status'         => $request->status,
            'hire_date'      => $request->hire_date,
            'departure_date' => $request->departure_date,

            'manager_id'         => $request->manager_id,
            'is_manager'         => $request->boolean('is_manager'),
            'location'           => $request->location,
            'probation_end_date' => $request->probation_end_date,
            'last_review_date'   => $request->last_review_date,
            'notes'              => $request->notes,

            'employment_type' => $request->employment_type,
            'contract_type'   => $request->contract_type,
            'work_schedule'   => $request->work_schedule,
            'salary_gross'    => $request->salary_gross,
            'salary_currency' => strtoupper($request->salary_currency ?? 'EUR'),
            'pay_frequency'   => $request->pay_frequency,
            'hourly_rate'     => $request->hourly_rate,
            'bonus_target'    => $request->bonus_target,
            'benefits'        => $request->benefits,
            'cost_center'     => $request->cost_center,

            'emergency_contact_name'  => $request->emergency_contact_name,
            'emergency_contact_phone' => $request->emergency_contact_phone,
            'bank_iban'               => $request->bank_iban,
            'bank_rib'                => $request->bank_rib,
        ])->save();

        $afterRaw = $employee->fresh()->only($this->auditFields());

        // ✅ champs modifiés (comparaison sur valeurs réelles)
        $changedFields = [];
        foreach ($afterRaw as $k => $v) {
            if (($beforeRaw[$k] ?? null) !== $v) {
                $changedFields[] = $k;
            }
        }

        // ✅ ce qu'on stocke dans audit_logs (MASQUÉ)
        $beforeMasked = $this->maskSensitiveArray($beforeRaw);
        $afterMasked  = $this->maskSensitiveArray($afterRaw);

        // ✅ stock chiffré (vraies valeurs sensibles)
        $sensitiveEncrypted = Crypt::encryptString(json_encode([
            'before' => $this->extractSensitive($beforeRaw),
            'after'  => $this->extractSensitive($afterRaw),
        ], JSON_UNESCAPED_UNICODE));

        activity('employee')
            ->performedOn($employee)
            ->causedBy($actor)
            ->event('updated')
            ->withProperties([
                'action' => 'update',
                'employee' => [
                    'id' => $employee->id,
                    'employee_code' => $employee->employee_code,
                    'full_name' => trim($employee->first_name . ' ' . $employee->last_name),
                ],
                'changed_fields' => $changedFields,
                'files_changed' => $filesChanged,

                // ✅ SAFE
                'before' => $beforeMasked,
                'after'  => $afterMasked,

                // ✅ SENSIBLE (pour SuperAdmin)
                'sensitive_encrypted' => $sensitiveEncrypted,
            ])
            ->log("Employé modifié : {$employee->employee_code} — " . trim($employee->first_name . ' ' . $employee->last_name));

        return redirect()->route('employees.index')->with('success', 'Employé mis à jour avec succès.');
    }

    /**
     * Soft delete + si actif => passe à inactif.
     * On NE supprime pas les fichiers en soft delete.
     */
    public function destroy(Employee $employee)
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();

        $beforeStatus = $employee->status;

        if ($employee->status === 'active') {
            $employee->status = 'inactive';
            $employee->save();
        }

        $employee->delete();

        activity('employee')
            ->performedOn($employee)
            ->causedBy($actor)
            ->event('deleted')
            ->withProperties([
                'action' => 'delete',
                'employee' => [
                    'id' => $employee->id,
                    'employee_code' => $employee->employee_code,
                    'full_name' => trim($employee->first_name . ' ' . $employee->last_name),
                ],
                'status_before' => $beforeStatus,
                'status_after' => $employee->status,
                'note' => $beforeStatus === 'active'
                    ? 'Statut automatiquement passé à inactive avant suppression'
                    : null,
            ])
            ->log("Employé supprimé (soft) : {$employee->employee_code} — " . trim($employee->first_name . ' ' . $employee->last_name));

        return redirect()->route('employees.index')->with('success', 'Employé supprimé avec succès.');
    }

    public function restore($id)
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();

        $employee = Employee::withTrashed()->findOrFail($id);
        $employee->restore();

        activity('employee')
            ->performedOn($employee)
            ->causedBy($actor)
            ->event('restored')
            ->withProperties([
                'action' => 'restore',
                'employee' => [
                    'id' => $employee->id,
                    'employee_code' => $employee->employee_code,
                    'full_name' => trim($employee->first_name . ' ' . $employee->last_name),
                ],
            ])
            ->log("Employé restauré : {$employee->employee_code} — " . trim($employee->first_name . ' ' . $employee->last_name));

        return redirect()
            ->route('employees.index')
            ->with('success', 'Employé restauré avec succès.');
    }

    public function toggleStatus(Employee $employee)
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();

        $before = $employee->status;

        $employee->update([
            'status' => $employee->status === 'active' ? 'inactive' : 'active',
        ]);

        $after = $employee->status;

        activity('employee')
            ->performedOn($employee)
            ->causedBy($actor)
            ->event('status_toggled')
            ->withProperties([
                'action' => 'toggle_status',
                'employee' => [
                    'id' => $employee->id,
                    'employee_code' => $employee->employee_code,
                    'full_name' => trim($employee->first_name . ' ' . $employee->last_name),
                ],
                'status_before' => $before,
                'status_after' => $after,
            ])
            ->log("Statut employé modifié : {$employee->employee_code} ({$before} → {$after})");

        return back()->with('success', 'Statut de l’employé mis à jour.');
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers Audit
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Champs qu'on suit pour l'audit (valeurs réelles).
     * (Les fichiers sont inclus car ils ont un impact)
     */
    private function auditFields(): array
    {
        return [
            'first_name',
            'last_name',
            'employee_code',
            'cin',
            'cnss_number',
            'email',
            'phone_number',
            'address',
            'date_of_birth',
            'position',
            'department_id',
            'status',
            'hire_date',
            'departure_date',
            'manager_id',
            'location',
            'probation_end_date',
            'last_review_date',
            'notes',
            'employment_type',
            'contract_type',
            'work_schedule',
            'salary_gross',
            'salary_currency',
            'pay_frequency',
            'hourly_rate',
            'bonus_target',
            'benefits',
            'cost_center',
            'emergency_contact_name',
            'emergency_contact_phone',
            'bank_iban',
            'bank_rib',
            'photo',
            'cv_path',
            'contract_path',
        ];
    }

    /**
     * Extrait uniquement ce qu'on considère comme sensible,
     * pour stockage chiffré dans audit_logs.
     */
    private function extractSensitive(array $data): array
    {
        $keys = [
            'cin',
            'cnss_number',
            'bank_iban',
            'bank_rib',
            'salary_gross',
            'hourly_rate',
            'bonus_target',
        ];

        $out = [];
        foreach ($keys as $k) {
            if (array_key_exists($k, $data)) {
                $out[$k] = $data[$k];
            }
        }

        return $out;
    }

    /**
     * Masque les données sensibles pour stockage "safe" dans properties.
     * (ce qui sera visible par défaut dans l’UI)
     */
    private function maskSensitiveArray(array $data): array
    {
        $sensitiveKeys = [
            'cin',
            'cnss_number',
            'bank_iban',
            'bank_rib',
            'salary_gross',
            'hourly_rate',
            'bonus_target',
        ];

        foreach ($sensitiveKeys as $key) {
            if (!array_key_exists($key, $data)) continue;

            $value = $data[$key];

            if ($value === null || $value === '') {
                $data[$key] = $value;
                continue;
            }

            $stringValue = (string) $value;

            switch ($key) {
                case 'cin':
                    // garde 2 premiers + 2 derniers
                    $data[$key] = $this->maskKeepStartEnd($stringValue, 2, 2);
                    break;

                case 'cnss_number':
                    // garde 2 derniers
                    $data[$key] = $this->maskKeepStartEnd($stringValue, 0, 2);
                    break;

                case 'bank_iban':
                    // garde 4 premiers + 4 derniers
                    $data[$key] = $this->maskKeepStartEnd($stringValue, 4, 4);
                    break;

                case 'bank_rib':
                    // garde 2 derniers
                    $data[$key] = $this->maskKeepStartEnd($stringValue, 0, 2);
                    break;

                case 'salary_gross':
                case 'hourly_rate':
                case 'bonus_target':
                    // montants : masquage total (safe)
                    $data[$key] = '***';
                    break;

                default:
                    $data[$key] = '***';
                    break;
            }
        }

        return $data;
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
}
