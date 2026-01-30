import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { Department, PageProps, Pagination } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Filter,
    Image as ImageIcon,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type EmployeeStatus = 'active' | 'inactive';
type SortCol = 'name' | 'status';
type SortDir = 'asc' | 'desc';

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    position: string;
    department_id: number | null;
    department?: Department | null;
    status: EmployeeStatus;
    hire_date: string;
    photo?: string | null;
    deleted_at?: string | null;

    employee_code?: string | null;
    cin?: string | null;
    salary_gross?: string | number | null;
    salary_currency?: string | null;
}

interface EmployeesFilters {
    search?: string;
    status?: EmployeeStatus | '';
    department_id?: string | number | '';
    start_date?: string;
    end_date?: string;
    sort?: SortCol;
    direction?: SortDir;
    per_page?: number;
    page?: number;
}

interface Flash {
    success?: string;
    error?: string;
}

interface Props
    extends PageProps<{
        employees: Pagination<Employee>;
        filters: EmployeesFilters;
        departments: Department[];
        flash?: Flash;
    }> {}

/* -------------------------- QS helper -------------------------- */
function toQueryString(payload: Record<string, unknown>): string {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        params.append(k, String(v));
    });
    return params.toString();
}

/* ------------------------------ Permissions (Spatie) ------------------------------ */
const useCan = () => {
    const { props } = usePage<PageProps<any>>();
    const auth = (props as any)?.auth;

    const rolesRaw = auth?.roles ?? [];
    const roles: string[] = rolesRaw.map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean);

    const permsRaw = auth?.permissions ?? [];
    const perms: string[] = permsRaw.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean);

    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const can = (p?: string) => !p || isSuperAdmin || perms.includes(p);

    return { can, isSuperAdmin };
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function EmployeesIndex({ employees, filters, departments, flash }: Props) {
    const { can } = useCan();

    const sort: SortCol = (filters?.sort as SortCol) || 'name';
    const dir: SortDir = (filters?.direction as SortDir) || 'asc';
    const per: number =
        typeof filters?.per_page !== 'undefined' && filters?.per_page !== null
            ? Number(filters.per_page)
            : Number((employees as any)?.per_page ?? 10);

    /* ---------------- état UI ---------------- */
    const [showFilters, setShowFilters] = useState(false);
    type ChipField = 'search' | 'status' | 'department' | 'date';
    const [field, setField] = useState<ChipField>('search');
    const [value, setValue] = useState('');

    const [start, setStart] = useState<string>(filters?.start_date ?? '');
    const [end, setEnd] = useState<string>(filters?.end_date ?? '');

    type Chip =
        | { field: 'search'; value: string }
        | { field: 'status'; value: EmployeeStatus | '' }
        | { field: 'department'; value: string }
        | { field: 'date'; value: string; value2: string };

    const makeChipsFromFilters = (): Chip[] => {
        const arr: Chip[] = [];
        if (filters?.search) {
            const tokens = String(filters.search)
                .split(/\s+/)
                .map((t) => t.trim())
                .filter(Boolean);
            tokens.forEach((t) => arr.push({ field: 'search', value: t }));
        }
        if (filters?.status !== undefined && filters?.status !== '') {
            arr.push({ field: 'status', value: filters.status as EmployeeStatus });
        }
        if (filters?.department_id) {
            arr.push({ field: 'department', value: String(filters.department_id) });
        }
        if (filters?.start_date && filters?.end_date) {
            arr.push({ field: 'date', value: filters.start_date!, value2: filters.end_date! });
        }
        return arr;
    };

    const [chips, setChips] = useState<Chip[]>(() => makeChipsFromFilters());

    useEffect(() => {
        setChips(makeChipsFromFilters());
        setStart(filters?.start_date ?? '');
        setEnd(filters?.end_date ?? '');
        setSelectedIds([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters?.search,
        filters?.status,
        filters?.department_id,
        filters?.start_date,
        filters?.end_date,
        filters?.sort,
        filters?.direction,
        filters?.per_page,
        employees?.current_page,
    ]);

    /* ---------------- Sélection en masse (soft-delete uniquement) ---------------- */
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const toggleSelect = (id: number) => setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));

    const anySelectedDeleted = selectedIds.some((id) => !!employees.data.find((e) => e.id === id)?.deleted_at);
    const anySelectedNotDeleted = selectedIds.some((id) => !employees.data.find((e) => e.id === id)?.deleted_at);

    const deleteSelected = () => {
        if (!can('employee_delete') || !selectedIds.length) return;
        if (!confirm(`Supprimer ${selectedIds.length} employé(s) ?`)) return;

        selectedIds.forEach((id) => {
            const row = employees.data.find((e) => e.id === id);
            if (row?.deleted_at) return;
            router.delete(route('employees.destroy', { employee: id }), { preserveScroll: true });
        });
        setSelectedIds([]);
    };

    const restoreSelected = () => {
        if (!can('employee_restore') || !selectedIds.length) return;
        if (!confirm(`Restaurer ${selectedIds.length} employé(s) ?`)) return;

        selectedIds.forEach((id) => {
            const row = employees.data.find((e) => e.id === id);
            if (!row?.deleted_at) return;
            router.post(route('employees.restore', { id }), {}, { preserveScroll: true });
        });
        setSelectedIds([]);
    };

    /* ---------------- Flash ---------------- */
    const [showSuccess, setShowSuccess] = useState(!!flash?.success);
    const [showError, setShowError] = useState(!!flash?.error);

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const t = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    useEffect(() => {
        if (flash?.error) {
            setShowError(true);
            const t = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.error]);

    /* ---------------- Navigation helper ---------------- */
    const visit = (url: string) => {
        router.get(url, {}, { preserveScroll: true, preserveState: true, replace: true });
    };

    /* ---------------- Inertia helpers ---------------- */
    const buildQueryPayload = (list: Chip[], extra: Record<string, any> = {}) => {
        const p: Record<string, any> = { ...extra };

        const searchTokens = list.filter((s): s is Extract<Chip, { field: 'search' }> => s.field === 'search').map((s) => s.value);

        if (searchTokens.length) p.search = searchTokens.join(' ');

        const st = list.find((f): f is Extract<Chip, { field: 'status' }> => f.field === 'status');
        if (st && st.value) p.status = st.value;

        const dep = list.find((f): f is Extract<Chip, { field: 'department' }> => f.field === 'department');
        if (dep && dep.value) p.department_id = dep.value;

        const rng = list.find((f): f is Extract<Chip, { field: 'date' }> => f.field === 'date');
        if (rng) {
            p.start_date = rng.value;
            p.end_date = rng.value2;
        }

        return p;
    };

    const go = (list: Chip[], extra: Record<string, any> = {}) => {
        const q = buildQueryPayload(list, { sort, direction: dir, per_page: per, ...extra });
        const base = route('employees.index');
        const qs = toQueryString(q);
        const url = qs ? `${base}?${qs}` : base;
        visit(url);
    };

    /* ---------------- gestion des filtres ---------------- */
    const upsertChip = (n: Chip) => {
        let next: Chip[] = [];

        if (n.field === 'search') {
            const keep = chips.filter((c) => !(c.field === 'search' && c.value === n.value));
            next = [...keep, n];
        } else {
            next = chips.filter((c) => c.field !== n.field).concat(n);
        }

        setChips(next);
        go(next, { page: 1 });
    };

    const addChip = () => {
        if (field === 'date') {
            if (start && end) upsertChip({ field: 'date', value: start, value2: end });
            return;
        }

        const v = value.trim();
        if (!v) return;

        if (field === 'status') upsertChip({ field: 'status', value: v as EmployeeStatus });
        else if (field === 'department') upsertChip({ field: 'department', value: v });
        else upsertChip({ field: 'search', value: v });

        setValue('');
    };

    const removeChip = (idx: number) => {
        const toRemove = chips[idx];
        if (toRemove?.field === 'date') {
            setStart('');
            setEnd('');
        }
        const next = chips.filter((_, i) => i !== idx);
        setChips(next);
        go(next, { page: 1 });
    };

    const resetFilters = () => {
        setChips([]);
        setStart('');
        setEnd('');
        setValue('');
        setSelectedIds([]);

        const base = route('employees.index');
        const qs = toQueryString({ page: 1, per_page: per, sort, direction: dir });
        visit(`${base}?${qs}`);
    };

    const onChangeStatus = (val: string) => {
        if (val === '') {
            const next = chips.filter((c) => c.field !== 'status');
            setChips(next);
            go(next, { page: 1 });
        } else {
            upsertChip({ field: 'status', value: val as EmployeeStatus });
        }
    };

    const onChangeDepartment = (val: string) => {
        if (val === '') {
            const next = chips.filter((c) => c.field !== 'department');
            setChips(next);
            go(next, { page: 1 });
        } else {
            upsertChip({ field: 'department', value: val });
        }
    };

    const onChangeDateStart = (val: string) => {
        setStart(val);
        const existing = chips.find((c) => c.field === 'date') as Extract<Chip, { field: 'date' }> | undefined;
        const endVal = existing?.value2 ?? end;
        if (val && endVal) upsertChip({ field: 'date', value: val, value2: endVal });
    };

    const onChangeDateEnd = (val: string) => {
        setEnd(val);
        const existing = chips.find((c) => c.field === 'date') as Extract<Chip, { field: 'date' }> | undefined;
        const startVal = existing?.value ?? start;
        if (startVal && val) upsertChip({ field: 'date', value: startVal, value2: val });
    };

    /* ---------------- pagination / tri ---------------- */
    const changePage = (p: number) => go(chips, { page: p });

    const changePer = (n: number) => {
        const q = buildQueryPayload(chips, { sort, direction: dir, per_page: n, page: 1 });
        const base = route('employees.index');
        const qs = toQueryString(q);
        visit(`${base}?${qs}`);
    };

    const changeSort = (col: SortCol) => {
        const newDir: SortDir = sort === col ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
        const q = buildQueryPayload(chips, { sort: col, direction: newDir, page: 1, per_page: per });
        const base = route('employees.index');
        const qs = toQueryString(q);
        visit(`${base}?${qs}`);
    };

    const windowPages = useMemo<(number | '…')[]>(() => {
        const res: (number | '…')[] = [];
        const MAX = 5;
        const c = employees.current_page;
        const l = employees.last_page;

        if (l <= MAX + 2) {
            for (let i = 1; i <= l; i++) res.push(i);
            return res;
        }

        res.push(1);
        let s = Math.max(2, c - Math.floor(MAX / 2));
        let e = s + MAX - 1;

        if (e >= l) {
            e = l - 1;
            s = e - MAX + 1;
        }

        if (s > 2) res.push('…');
        for (let i = s; i <= e; i++) res.push(i);
        if (e < l - 1) res.push('…');
        res.push(l);

        return res;
    }, [employees.current_page, employees.last_page]);

    /* ---------------- helpers UI ---------------- */
    const FIELD_LABELS: Record<'search' | 'status' | 'department' | 'date', string> = {
        search: 'Recherche globale',
        status: 'Statut',
        department: 'Département',
        date: "Date d'embauche",
    };

    const statusText = (st: EmployeeStatus) => (st === 'active' ? 'Actif' : 'Inactif');

    const showActionsCol = useMemo(() => {
        if (!employees?.data?.length) return false;
        return employees.data.some((e) => {
            const canShow = can('employee_show') && !e.deleted_at;
            const canEdit = can('employee_edit') && !e.deleted_at;
            const canDel = can('employee_delete') && !e.deleted_at;
            const canRes = can('employee_restore') && !!e.deleted_at;
            return canShow || canEdit || canDel || canRes;
        });
    }, [employees?.data, can]);

    const showSelectCol = useMemo(() => {
        if (!employees?.data?.length) return false;
        return employees.data.some((e) => (e.deleted_at ? can('employee_restore') : can('employee_delete')));
    }, [employees?.data, can]);

    const selectableIds = useMemo(() => {
        return employees.data.filter((e) => (e.deleted_at ? can('employee_restore') : can('employee_delete'))).map((e) => e.id);
    }, [employees.data, can]);

    const toggleSelectAll = () => {
        if (!selectableIds.length) return;
        const allSelected = selectableIds.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelected ? [] : selectableIds);
    };

    /* --------------------- statut : toggle (métier) --------------------- */
    const toggleEmployeeStatus = (employeeId: number) => {
        if (!can('employee_edit')) return;
        if (!confirm('Changer le statut de cet employé ?')) return;

        router.patch(
            route('employees.toggle-status', { employee: employeeId }),
            {},
            {
                preserveScroll: true,
                onError: () => alert('Une erreur est survenue lors du changement de statut.'),
            },
        );
    };

    /* ----------------------------- RENDER ----------------------------- */
    return (
        <>
            <Head title="Employés" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Employés', href: '/employees' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        {/* Flash */}
                        {flash?.success && showSuccess && (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-100">
                                <span className="flex-1 font-medium">{flash.success}</span>
                                <button onClick={() => setShowSuccess(false)}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {flash?.error && showError && (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100">
                                <span className="flex-1 font-medium">{flash.error}</span>
                                <button onClick={() => setShowError(false)}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Header */}
                        <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Gestion des employés</h1>
                        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">Administration et gestion du personnel</p>

                        {/* Outils + filtres */}
                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                {/* Bloc filtres + bulk actions */}
                                <div className="flex w-full flex-col gap-4 lg:w-auto">
                                    <div className="flex items-center gap-3">
                                        <Button onClick={() => setShowFilters(!showFilters)}>
                                            <Filter className="h-4 w-4" />
                                            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
                                        </Button>

                                        {chips.length > 0 && (
                                            <Button variant="outline" onClick={resetFilters} className="gap-1.5">
                                                <X className="h-4 w-4" /> Effacer
                                            </Button>
                                        )}

                                        {selectedIds.length > 0 && (
                                            <>
                                                {anySelectedDeleted && can('employee_restore') && (
                                                    <Button variant="secondary" onClick={restoreSelected}>
                                                        <RotateCcw className="mr-1 h-4 w-4" /> Restaurer ({selectedIds.length})
                                                    </Button>
                                                )}
                                                {anySelectedNotDeleted && can('employee_delete') && (
                                                    <Button variant="destructive" onClick={deleteSelected}>
                                                        <Trash2 className="mr-1 h-4 w-4" /> Supprimer ({selectedIds.length})
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {showFilters && (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-2xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les employés
                                            </h3>

                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <select
                                                    value={field}
                                                    onChange={(e) => {
                                                        setField(e.target.value as any);
                                                        setValue('');
                                                    }}
                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                >
                                                    <option value="search">Recherche globale</option>
                                                    <option value="status">Statut</option>
                                                    <option value="department">Département</option>
                                                    <option value="date">Date d'embauche</option>
                                                </select>
                                            </div>

                                            <div className="mb-3">
                                                {field === 'date' ? (
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <input
                                                            type="date"
                                                            value={start}
                                                            onChange={(e) => onChangeDateStart(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={end}
                                                            onChange={(e) => onChangeDateEnd(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                ) : field === 'status' ? (
                                                    <select
                                                        value={(chips.find((c) => c.field === 'status') as any)?.value ?? ''}
                                                        onChange={(e) => onChangeStatus(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Tous</option>
                                                        <option value="active">Actif</option>
                                                        <option value="inactive">Inactif</option>
                                                    </select>
                                                ) : field === 'department' ? (
                                                    <select
                                                        value={(chips.find((c) => c.field === 'department') as any)?.value ?? ''}
                                                        onChange={(e) => onChangeDepartment(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Tous les départements</option>
                                                        {departments.map((d) => (
                                                            <option key={d.id} value={String(d.id)}>
                                                                {d.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="relative">
                                                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={value}
                                                            onChange={(e) => setValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addChip()}
                                                            placeholder="Nom, email, poste… (Entrée pour appliquer)"
                                                            className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {field === 'search' && (
                                                <Button onClick={addChip} disabled={!value.trim()} className="w-full">
                                                    Ajouter le filtre
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Chips actifs */}
                                    {chips.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {chips.map((c, i) => (
                                                <span
                                                    key={`${c.field}-${i}-${(c as any).value ?? ''}`}
                                                    className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                                >
                                                    <span className="font-medium">{FIELD_LABELS[c.field]}</span>:{' '}
                                                    <span>
                                                        {c.field === 'department'
                                                            ? (departments.find((d) => String(d.id) === String(c.value))?.name ?? c.value)
                                                            : c.field === 'status'
                                                              ? ({ '': 'Tous', active: 'Actif', inactive: 'Inactif' } as Record<string, string>)[
                                                                    c.value
                                                                ]
                                                              : c.field === 'date'
                                                                ? `${c.value} – ${c.value2}`
                                                                : c.value}
                                                    </span>
                                                    <button onClick={() => removeChip(i)}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Droite : per-page + créer */}
                                <div className="ml-auto flex items-center gap-3">
                                    <div className="relative min-w-[220px]">
                                        <select
                                            value={per}
                                            onChange={(e) => changePer(Number(e.target.value))}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            {[5, 10, 20, 50].map((n) => (
                                                <option key={n} value={n}>
                                                    {n} lignes par page
                                                </option>
                                            ))}
                                            <option value={-1}>Tous</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-400" />
                                    </div>

                                    {can('employee_create') && (
                                        <Link href={route('employees.create')}>
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" /> Nouvel employé
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                    <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                        <tr>
                                            {showSelectCol && (
                                                <th className="w-[50px] px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id))}
                                                        onChange={toggleSelectAll}
                                                        className="rounded border-slate-300 text-red-600"
                                                    />
                                                </th>
                                            )}
                                            <th className="px-4 py-3">Photo</th>
                                            <th className="cursor-pointer px-6 py-4" onClick={() => changeSort('name')}>
                                                <div className="flex items-center gap-2">Nom {sort === 'name' && (dir === 'asc' ? '▲' : '▼')}</div>
                                            </th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Département</th>
                                            <th className="cursor-pointer px-6 py-4 text-center" onClick={() => changeSort('status')}>
                                                <div className="flex items-center justify-center gap-2">
                                                    Statut {sort === 'status' && (dir === 'asc' ? '▲' : '▼')}
                                                </div>
                                            </th>
                                            {showActionsCol && (
                                                <th className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">Actions</div>
                                                </th>
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {employees.data.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5 + (showSelectCol ? 1 : 0) + (showActionsCol ? 1 : 0)}
                                                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                                                >
                                                    Aucun employé trouvé.
                                                </td>
                                            </tr>
                                        ) : (
                                            employees.data.map((e) => {
                                                const rowCanShow = can('employee_show') && !e.deleted_at;
                                                const rowCanRestore = !!e.deleted_at && can('employee_restore');
                                                const rowCanDelete = !e.deleted_at && can('employee_delete');
                                                const rowCanEdit = can('employee_edit') && !e.deleted_at;

                                                const rowSelectable = e.deleted_at ? rowCanRestore : rowCanDelete;

                                                return (
                                                    <tr
                                                        key={e.id}
                                                        className={`${e.deleted_at ? 'bg-red-50 dark:bg-red-900/10' : ''} transition-colors hover:bg-slate-50 dark:hover:bg-slate-800`}
                                                    >
                                                        {showSelectCol && (
                                                            <td className="px-4 py-3 text-center">
                                                                {rowSelectable ? (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedIds.includes(e.id)}
                                                                        onChange={() => toggleSelect(e.id)}
                                                                        className="rounded border-slate-300 text-red-600"
                                                                    />
                                                                ) : (
                                                                    <input
                                                                        type="checkbox"
                                                                        disabled
                                                                        className="rounded border-slate-300 text-slate-300"
                                                                    />
                                                                )}
                                                            </td>
                                                        )}

                                                        {/* Photo */}
                                                        <td className="px-4 py-3">
                                                            {rowCanShow ? (
                                                                <Link href={route('employees.show', e.id)} aria-label="Voir l'employé">
                                                                    {e.photo ? (
                                                                        <img
                                                                            src={`/storage/${e.photo}`}
                                                                            alt={`${e.first_name} ${e.last_name}`}
                                                                            className="h-10 w-10 rounded-full border border-slate-300 object-cover dark:border-slate-600"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                                                                            <ImageIcon className="h-5 w-5 text-slate-500" />
                                                                        </div>
                                                                    )}
                                                                </Link>
                                                            ) : e.photo ? (
                                                                <img
                                                                    src={`/storage/${e.photo}`}
                                                                    alt={`${e.first_name} ${e.last_name}`}
                                                                    className="h-10 w-10 rounded-full border border-slate-300 object-cover dark:border-slate-600"
                                                                />
                                                            ) : (
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                                                                    <ImageIcon className="h-5 w-5 text-slate-500" />
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Nom */}
                                                        <td className="px-6 py-3">
                                                            {rowCanShow ? (
                                                                <Link
                                                                    href={route('employees.show', e.id)}
                                                                    className="font-medium text-slate-900 hover:underline dark:text-white"
                                                                >
                                                                    {e.first_name} {e.last_name}
                                                                </Link>
                                                            ) : (
                                                                <span className="font-medium text-slate-900 dark:text-white">
                                                                    {e.first_name} {e.last_name}
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{e.email}</td>
                                                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{e.department?.name ?? '—'}</td>

                                                        {/* Statut (métier) : ne jamais afficher "Supprimé" */}
                                                        <td className="px-6 py-3 text-center">
                                                            {e.deleted_at ? (
                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                                        e.status === 'active'
                                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                    } cursor-not-allowed opacity-70`}
                                                                    title="Employé supprimé (statut non modifiable ici)"
                                                                >
                                                                    {statusText(e.status)}
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => toggleEmployeeStatus(e.id)}
                                                                    className="focus:outline-none"
                                                                    title="Changer le statut"
                                                                    disabled={!can('employee_edit')}
                                                                >
                                                                    <span
                                                                        className={`inline-flex cursor-pointer items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                                                                            e.status === 'active'
                                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                                                                                : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                                                                        }`}
                                                                    >
                                                                        {statusText(e.status)}
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </td>

                                                        {/* Actions */}
                                                        {showActionsCol && (
                                                            <td className="px-6 py-3 text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    {/* Show uniquement si non supprimé */}
                                                                    {rowCanShow && (
                                                                        <Link
                                                                            href={route('employees.show', e.id)}
                                                                            className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                            aria-label="Voir"
                                                                            title="Voir"
                                                                        >
                                                                            <Eye className="h-5 w-5" />
                                                                        </Link>
                                                                    )}

                                                                    {/* Edit */}
                                                                    {rowCanEdit && (
                                                                        <Link
                                                                            href={route('employees.edit', e.id)}
                                                                            className="rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800/30 dark:hover:text-yellow-300"
                                                                            aria-label="Éditer"
                                                                            title="Éditer"
                                                                        >
                                                                            <Pencil className="h-5 w-5" />
                                                                        </Link>
                                                                    )}

                                                                    {/* Delete */}
                                                                    {rowCanDelete && (
                                                                        <button
                                                                            onClick={() => {
                                                                                if (!can('employee_delete')) return;
                                                                                if (!confirm('Supprimer cet employé ?')) return;
                                                                                router.delete(route('employees.destroy', { employee: e.id }), {
                                                                                    preserveScroll: true,
                                                                                });
                                                                            }}
                                                                            className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300"
                                                                            aria-label="Supprimer"
                                                                            title="Supprimer"
                                                                        >
                                                                            <Trash2 className="h-5 w-5" />
                                                                        </button>
                                                                    )}

                                                                    {/* Restore */}
                                                                    {rowCanRestore && (
                                                                        <button
                                                                            onClick={() => {
                                                                                if (!can('employee_restore')) return;
                                                                                router.post(
                                                                                    route('employees.restore', { id: e.id }),
                                                                                    {},
                                                                                    { preserveScroll: true },
                                                                                );
                                                                            }}
                                                                            className="rounded-full p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                                                                            aria-label="Restaurer"
                                                                            title="Restaurer"
                                                                        >
                                                                            <RotateCcw className="h-5 w-5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 shadow-xl backdrop-blur-md sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <span>
                                Affichage de {employees.from} à {employees.to} sur {employees.total} résultats
                            </span>

                            {employees.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={employees.current_page === 1}
                                        onClick={() => changePage(1)}
                                        aria-label="Première page"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={employees.current_page === 1}
                                        onClick={() => changePage(employees.current_page - 1)}
                                        aria-label="Page précédente"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    {windowPages.map((p, idx) =>
                                        p === '…' ? (
                                            <span key={`ellipsis-${idx}`} className="px-2 select-none">
                                                …
                                            </span>
                                        ) : (
                                            <Button
                                                key={`page-${p}`}
                                                size="sm"
                                                variant={p === employees.current_page ? 'default' : 'outline'}
                                                onClick={() => changePage(p as number)}
                                            >
                                                {p}
                                            </Button>
                                        ),
                                    )}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={employees.current_page === employees.last_page}
                                        onClick={() => changePage(employees.current_page + 1)}
                                        aria-label="Page suivante"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={employees.current_page === employees.last_page}
                                        onClick={() => changePage(employees.last_page)}
                                        aria-label="Dernière page"
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
