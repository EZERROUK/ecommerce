<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::query()
            ->withTrashed()
            ->with(['head:id,first_name,last_name'])
            ->withCount('employees')
            ->orderBy('name')
            ->get();

        $departments = $departments->map(function ($d) {
            return [
                'id' => $d->id,
                'name' => $d->name,
                'description' => $d->description,
                'department_head' => $d->department_head,
                'department_head_full_name' => $d->department_head_full_name,
                'head' => $d->head ? [
                    'id' => $d->head->id,
                    'first_name' => $d->head->first_name,
                    'last_name' => $d->head->last_name,
                ] : null,
                'employees_count' => (int) $d->employees_count,
                'deleted_at' => $d->deleted_at,
            ];
        });

        // (Optionnel) log de consultation - souvent inutile et très verbeux, donc je ne le mets pas.

        return Inertia::render('Departments/Index', [
            'departments' => $departments,
        ]);
    }

    public function create()
    {
        $employees = Employee::select('id','first_name','last_name')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('Departments/Create', [
            'employees' => $employees,
        ]);
    }

    public function store(StoreDepartmentRequest $request)
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();

        $payload = $request->validated();

        $department = Department::create([
            ...$payload,
            'created_by' => $actor->id,
        ]);

        activity('department')
            ->performedOn($department)
            ->causedBy($actor)
            ->event('created')
            ->withProperties([
                'action' => 'create',
                'department' => [
                    'id' => $department->id,
                    'name' => $department->name,
                ],
                'payload' => [
                    'name' => $payload['name'] ?? null,
                    'description' => $payload['description'] ?? null,
                    'department_head' => $payload['department_head'] ?? null,
                ],
            ])
            ->log("Département créé : {$department->name}");

        return redirect()
            ->route('departments.index')
            ->with('success', 'Département créé.');
    }

    public function show(Department $department)
    {
        $department->load([
            'head:id,first_name,last_name,photo',
            'employees:id,first_name,last_name,photo,department_id',
            'creator:id,name',
        ])->loadCount('employees');

        // (Optionnel) log de consultation d’une fiche
        // activity('department')->performedOn($department)->causedBy(Auth::user())->event('viewed')
        //     ->withProperties(['action' => 'view'])->log("Consultation du département : {$department->name}");

        return Inertia::render('Departments/Show', [
            'department' => $department,
        ]);
    }

    public function edit(Department $department)
    {
        $employees = Employee::select('id','first_name','last_name')
            ->orderBy('first_name')
            ->get();

        $department->load(['head:id,first_name,last_name']);

        return Inertia::render('Departments/Edit', [
            'department' => $department,
            'employees'  => $employees,
        ]);
    }

    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();

        $before = $department->only(['name', 'description', 'department_head']);
        $payload = $request->validated();

        $department->update($payload);

        $after = $department->fresh()->only(['name', 'description', 'department_head']);

        $changed = array_keys(array_filter(
            $after,
            fn ($v, $k) => ($before[$k] ?? null) !== $v,
            ARRAY_FILTER_USE_BOTH
        ));

        activity('department')
            ->performedOn($department)
            ->causedBy($actor)
            ->event('updated')
            ->withProperties([
                'action' => 'update',
                'department' => [
                    'id' => $department->id,
                    'name' => $department->name,
                ],
                'changed_fields' => $changed,
                'before' => $before,
                'after' => $after,
            ])
            ->log("Département modifié : {$department->name}");

        return redirect()
            ->route('departments.index')
            ->with('success', 'Département mis à jour.');
    }

    public function destroy(Department $department)
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();

        $employeesCount = $department->employees()->count();

        // Cas métier bloquant => on LOG aussi (c’est important en audit)
        if ($employeesCount > 0) {
            activity('department')
                ->performedOn($department)
                ->causedBy($actor)
                ->event('delete_blocked')
                ->withProperties([
                    'action' => 'delete_blocked',
                    'reason' => 'department_not_empty',
                    'employees_count' => $employeesCount,
                    'department' => [
                        'id' => $department->id,
                        'name' => $department->name,
                    ],
                ])
                ->log("Suppression refusée : {$department->name} contient {$employeesCount} employé(s)");

            return redirect()
                ->route('departments.index')
                ->with('error', "Impossible de supprimer ce département : il contient déjà {$employeesCount} employé(s).");
        }

        $department->delete();

        activity('department')
            ->performedOn($department)
            ->causedBy($actor)
            ->event('deleted')
            ->withProperties([
                'action' => 'delete',
                'department' => [
                    'id' => $department->id,
                    'name' => $department->name,
                ],
            ])
            ->log("Département supprimé : {$department->name}");

        return redirect()
            ->route('departments.index')
            ->with('success', 'Département supprimé.');
    }

    public function restore($id)
    {
        /** @var \App\Models\User $actor */
        $actor = Auth::user();

        $department = Department::withTrashed()->findOrFail($id);

        $existsActive = Department::where('name', $department->name)
            ->whereNull('deleted_at')
            ->exists();

        // Cas métier bloquant => log aussi
        if ($existsActive) {
            activity('department')
                ->performedOn($department)
                ->causedBy($actor)
                ->event('restore_blocked')
                ->withProperties([
                    'action' => 'restore_blocked',
                    'reason' => 'name_already_exists_active',
                    'department' => [
                        'id' => $department->id,
                        'name' => $department->name,
                    ],
                ])
                ->log("Restauration refusée : un département actif existe déjà pour « {$department->name} »");

            return redirect()
                ->route('departments.index')
                ->with(
                    'error',
                    "Impossible de restaurer le département « {$department->name} » : un département actif avec ce nom existe déjà."
                );
        }

        $department->restore();

        activity('department')
            ->performedOn($department)
            ->causedBy($actor)
            ->event('restored')
            ->withProperties([
                'action' => 'restore',
                'department' => [
                    'id' => $department->id,
                    'name' => $department->name,
                ],
            ])
            ->log("Département restauré : {$department->name}");

        return redirect()
            ->route('departments.index')
            ->with('success', 'Département restauré avec succès.');
    }
}
