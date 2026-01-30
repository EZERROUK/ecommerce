import ParticlesBackground from '@/components/ParticlesBackground';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Filter, Save, SlidersHorizontal, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

type Employee = { id: number; first_name: string; last_name: string };
type LeaveType = { id: number; code: string; name_fr: string; requires_balance: boolean };

type BalanceRow = {
    id: number;
    year: number;
    employee_id: number;
    leave_type_id: number;
    allocated_days: string | number;
    used_days: string | number;
    employee?: Employee;
    leave_type?: LeaveType;
    leaveType?: LeaveType;
};

const ALL = '__all__';

type FilterField = 'year' | 'leave_type_id';
type FilterType = { field: FilterField; value: string };

export default function LeaveBalancesIndexPage() {
    const { props } = usePage<{
        year: number;
        leaveTypeId?: number | null;
        leaveTypes: LeaveType[];
        employees: Employee[];
        items: any;
    }>();

    const rows: BalanceRow[] = props.items?.data ?? [];

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<FilterField>('leave_type_id');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [activeFilters, setActiveFilters] = useState<FilterType[]>(() => {
        const out: FilterType[] = [{ field: 'year', value: String(props.year) }];
        if (props.leaveTypeId) out.push({ field: 'leave_type_id', value: String(props.leaveTypeId) });
        return out;
    });

    const upsertForm = useForm({
        employee_id: props.employees[0]?.id ?? 0,
        leave_type_id: props.leaveTypes.find((t) => t.requires_balance)?.id ?? props.leaveTypes[0]?.id ?? 0,
        year: props.year,
        allocated_days: 0,
    });

    const breadcrumbs = useMemo(
        () => [
            { title: 'Congés', href: route('leaves.requests.index') },
            { title: 'Soldes', href: route('leaves.admin.balances.index') },
        ],
        [],
    );

    const applyFilters = (nextYear: number, nextLeaveTypeId: string) => {
        const params: Record<string, any> = { year: nextYear };
        if (nextLeaveTypeId !== ALL) params.leave_type_id = nextLeaveTypeId;

        router.get(route('leaves.admin.balances.index'), params, {
            preserveState: true,
            replace: true,
        });
    };

    const filterOptions = useMemo(
        () => [
            { value: 'year' as const, label: 'Année' },
            { value: 'leave_type_id' as const, label: 'Type' },
        ],
        [],
    );

    const leaveTypeLabelById = useMemo(() => {
        const m = new Map<string, string>();
        props.leaveTypes.forEach((lt) => m.set(String(lt.id), lt.name_fr));
        return m;
    }, [props.leaveTypes]);

    const applyFiltersFromList = (list: FilterType[]) => {
        const byField = new Map<FilterField, string>();
        for (const f of list) {
            if (!f.value) continue;
            byField.set(f.field, f.value);
        }

        const nextYear = Number(byField.get('year') ?? props.year);
        const nextLeaveTypeId = byField.get('leave_type_id') ?? ALL;
        applyFilters(nextYear, nextLeaveTypeId);
    };

    const addFilter = () => {
        if (!currentFilterValue) return;

        const next = [...activeFilters.filter((f) => f.field !== currentFilterField), { field: currentFilterField, value: currentFilterValue }];
        setActiveFilters(next);
        setCurrentFilterValue('');
        applyFiltersFromList(next);
    };

    const removeFilter = (i: number) => {
        const next = activeFilters.filter((_, idx) => idx !== i);
        setActiveFilters(next);
        applyFiltersFromList(next);
    };

    const clearAllFilters = () => {
        const next: FilterType[] = [{ field: 'year', value: String(props.year) }];
        setActiveFilters(next);
        setCurrentFilterValue('');
        applyFiltersFromList(next);
    };

    const scrollToUpsert = () => {
        document.getElementById('leave-balance-upsert')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const remaining = (allocated: string | number, used: string | number) => {
        const a = Number(allocated);
        const u = Number(used);
        return Math.max(0, a - u);
    };

    const submitUpsert = (e: React.FormEvent) => {
        e.preventDefault();
        upsertForm.post(route('leaves.admin.balances.upsert'), {
            preserveScroll: true,
            onSuccess: () => upsertForm.reset('allocated_days'),
        });
    };

    return (
        <>
            <Head title="Congés — Soldes" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Soldes</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Allocation annuelle par employé / type.</p>
                            </div>
                        </div>

                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href={route('leaves.requests.index')}>Retour aux demandes</Link>
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button onClick={() => setShowFilterPanel(!showFilterPanel)}>
                                        <Filter className="h-4 w-4" />
                                        {showFilterPanel ? 'Masquer les filtres' : 'Afficher les filtres'}
                                    </Button>

                                    {activeFilters.length > 1 && (
                                        <Button variant="outline" onClick={clearAllFilters} className="gap-1.5">
                                            <X className="h-4 w-4" /> Effacer filtres
                                        </Button>
                                    )}

                                    <Button
                                        onClick={scrollToUpsert}
                                        className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600"
                                    >
                                        <Save className="h-4 w-4" /> Mettre à jour
                                    </Button>
                                </div>
                            </div>

                            {showFilterPanel && (
                                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                        <SlidersHorizontal className="h-4 w-4" /> Filtrer les soldes
                                    </h3>

                                    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
                                        <select
                                            value={currentFilterField}
                                            onChange={(e) => {
                                                setCurrentFilterField(e.target.value as FilterField);
                                                setCurrentFilterValue('');
                                            }}
                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                        >
                                            {filterOptions.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="sm:col-span-3">
                                            {currentFilterField === 'year' ? (
                                                <input
                                                    type="number"
                                                    value={currentFilterValue}
                                                    onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                    placeholder="Ex: 2026"
                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                />
                                            ) : (
                                                <select
                                                    value={currentFilterValue}
                                                    onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                >
                                                    <option value="">Sélectionner un type</option>
                                                    {props.leaveTypes.map((lt) => (
                                                        <option key={lt.id} value={String(lt.id)}>
                                                            {lt.name_fr}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <Button onClick={addFilter} disabled={!currentFilterValue}>
                                        Ajouter le filtre
                                    </Button>
                                </div>
                            )}

                            {activeFilters.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {activeFilters.map((f, i) => {
                                        const label = filterOptions.find((o) => o.value === f.field)?.label ?? f.field;
                                        const displayValue = f.field === 'year' ? f.value : (leaveTypeLabelById.get(f.value) ?? f.value);

                                        return (
                                            <span
                                                key={`${f.field}-${f.value}`}
                                                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200"
                                            >
                                                <span className="font-medium">{label}:</span>
                                                {displayValue}
                                                {f.field !== 'year' && (
                                                    <button onClick={() => removeFilter(i)}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div
                            id="leave-balance-upsert"
                            className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5"
                        >
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mettre à jour un solde</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Crée ou met à jour l’allocation annuelle.</p>
                                </div>
                            </div>

                            <div className="p-6">
                                <form onSubmit={submitUpsert} className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                    <div>
                                        <Select
                                            value={String(upsertForm.data.employee_id)}
                                            onValueChange={(v) => upsertForm.setData('employee_id', Number(v))}
                                        >
                                            <SelectTrigger className="rounded-lg border border-slate-200 bg-slate-50 text-sm dark:border-slate-700 dark:bg-slate-800">
                                                <SelectValue placeholder="Employé" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {props.employees.map((emp) => (
                                                    <SelectItem key={emp.id} value={String(emp.id)}>
                                                        {emp.first_name} {emp.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {upsertForm.errors.employee_id && (
                                            <div className="text-destructive mt-1 text-xs">{upsertForm.errors.employee_id}</div>
                                        )}
                                    </div>

                                    <div>
                                        <Select
                                            value={String(upsertForm.data.leave_type_id)}
                                            onValueChange={(v) => upsertForm.setData('leave_type_id', Number(v))}
                                        >
                                            <SelectTrigger className="rounded-lg border border-slate-200 bg-slate-50 text-sm dark:border-slate-700 dark:bg-slate-800">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {props.leaveTypes
                                                    .filter((t) => t.requires_balance)
                                                    .map((lt) => (
                                                        <SelectItem key={lt.id} value={String(lt.id)}>
                                                            {lt.name_fr}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        {upsertForm.errors.leave_type_id && (
                                            <div className="text-destructive mt-1 text-xs">{upsertForm.errors.leave_type_id}</div>
                                        )}
                                    </div>

                                    <div>
                                        <Input
                                            type="number"
                                            value={upsertForm.data.year}
                                            onChange={(e) => upsertForm.setData('year', Number(e.target.value))}
                                            placeholder="Année"
                                            className="border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                        {upsertForm.errors.year && <div className="text-destructive mt-1 text-xs">{upsertForm.errors.year}</div>}
                                    </div>

                                    <div>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={upsertForm.data.allocated_days}
                                            onChange={(e) => upsertForm.setData('allocated_days', Number(e.target.value))}
                                            placeholder="Jours alloués"
                                            className="border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                        {upsertForm.errors.allocated_days && (
                                            <div className="text-destructive mt-1 text-xs">{upsertForm.errors.allocated_days}</div>
                                        )}
                                    </div>

                                    <div className="md:col-span-4">
                                        <Button
                                            type="submit"
                                            disabled={upsertForm.processing}
                                            className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600"
                                        >
                                            <Save className="h-4 w-4" />
                                            {upsertForm.processing ? 'Enregistrement…' : 'Enregistrer'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Liste</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{rows.length} solde(s)</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                                        <tr className="text-left text-slate-600 dark:text-slate-300">
                                            <th className="px-6 py-3 font-medium">Employé</th>
                                            <th className="px-6 py-3 font-medium">Type</th>
                                            <th className="px-6 py-3 font-medium">Alloué</th>
                                            <th className="px-6 py-3 font-medium">Utilisé</th>
                                            <th className="px-6 py-3 font-medium">Restant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {rows.map((r) => {
                                            const lt = r.leaveType ?? r.leave_type;
                                            const emp = r.employee;
                                            const rest = remaining(r.allocated_days, r.used_days);
                                            return (
                                                <tr key={r.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                                                    <td className="px-6 py-3">
                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                            {emp ? `${emp.first_name} ${emp.last_name}` : `#${r.employee_id}`}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-900 dark:text-white">
                                                        {lt ? lt.name_fr : `#${r.leave_type_id}`}
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{r.allocated_days}</td>
                                                    <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{r.used_days}</td>
                                                    <td className="px-6 py-3">
                                                        <Badge variant={rest > 0 ? 'default' : 'secondary'}>{rest}</Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {rows.length === 0 && (
                                            <tr>
                                                <td className="py-14 text-center text-slate-600 dark:text-slate-400" colSpan={5}>
                                                    Aucun solde pour ces filtres.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
