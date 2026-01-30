import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Eye,
    Filter,
    MousePointerClick,
    Plus,
    Power,
    Search,
    SlidersHorizontal,
    Tag,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

type Department = { id: number; name: string };
type Employee = { id: number; first_name: string; last_name: string; department_id?: number | null };
type LeaveType = { id: number; code: string; name_fr: string };

type PaginationLike<T> = {
    data: T[];
    from?: number;
    to?: number;
    total?: number;
    current_page?: number;
    last_page?: number;
};

type Flash = { success?: string; error?: string };

type Props = {
    items: PaginationLike<any> | any[];
    filters?: Record<string, any>;
    departments: Department[];
    employees: Employee[];
    leaveTypes: LeaveType[];
    canViewAll: boolean;
    flash?: Flash;
};

type FilterField = 'search' | 'status' | 'leave_type_id' | 'department_id' | 'employee_id';
type FilterType = { field: FilterField; value: string };

const useCan = () => {
    const { props } = usePage<{ auth?: { roles?: string[]; permissions?: string[] } }>();
    const roles = props.auth?.roles ?? [];
    const perms = props.auth?.permissions;
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const set = useMemo(() => new Set(perms ?? []), [perms]);
    const can = (p?: string) => !p || isSuperAdmin || set.has(p);
    return { can };
};

const statusLabel: Record<string, string> = {
    pending_manager: 'En attente manager',
    pending_hr: 'En attente RH',
    approved: 'Approuvée',
    rejected: 'Refusée',
    cancelled: 'Annulée',
};

const shortDate = (value: unknown) => {
    if (!value) return '—';
    const raw = String(value);
    const iso = raw.length >= 10 ? raw.slice(0, 10) : raw;
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    }
    const dt = new Date(raw);
    if (!Number.isNaN(dt.getTime())) {
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dt);
    }
    return raw;
};

const statusPill = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status === 'rejected') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (status === 'cancelled') return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200';
};

function pageWindow(current: number, last: number): Array<number | '…'> {
    const radius = 2;
    const pages: Array<number | '…'> = [];
    const start = Math.max(1, current - radius);
    const end = Math.min(last, current + radius);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push('…');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < last - 1) pages.push('…');
    if (end < last) pages.push(last);
    return pages;
}

export default function LeaveRequestsIndexPage() {
    const { props } = usePage<Props>();
    const { can } = useCan();

    const roles = usePage<{ auth?: { roles?: string[] } }>().props.auth?.roles ?? [];
    const canDelete = roles.includes('SuperAdmin') || roles.includes('super-admin') || roles.includes('Admin');

    const canManageLeaveTypes = can('leave_type_manage');
    const canManageHolidays = can('holiday_manage');
    const canManageBalances = can('leave_balance_manage');

    const paginator: PaginationLike<any> = useMemo(() => {
        if (!props.items || Array.isArray(props.items)) return { data: [] };
        if (!('data' in props.items)) return { data: [] };
        return props.items as any;
    }, [props.items]);

    const rows = paginator.data ?? [];
    const serverFilters = props.filters ?? {};

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<FilterField>('search');
    const [currentFilterValue, setCurrentFilterValue] = useState('');

    const [perPage, setPerPage] = useState<string>(serverFilters.per_page ? String(serverFilters.per_page) : '10');
    const [activeFilters, setActiveFilters] = useState<FilterType[]>(() => {
        const out: FilterType[] = [];
        if (serverFilters.search) out.push({ field: 'search', value: String(serverFilters.search) });
        if (serverFilters.status) out.push({ field: 'status', value: String(serverFilters.status) });
        if (serverFilters.leave_type_id) out.push({ field: 'leave_type_id', value: String(serverFilters.leave_type_id) });
        if (serverFilters.department_id) out.push({ field: 'department_id', value: String(serverFilters.department_id) });
        if (serverFilters.employee_id) out.push({ field: 'employee_id', value: String(serverFilters.employee_id) });
        return out;
    });

    const [showSuccess, setShowSuccess] = useState(!!props.flash?.success);
    const [showError, setShowError] = useState(!!props.flash?.error);

    useEffect(() => {
        if (props.flash?.success) {
            setShowSuccess(true);
            const t = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(t);
        }
    }, [props.flash?.success]);

    useEffect(() => {
        if (props.flash?.error) {
            setShowError(true);
            const t = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(t);
        }
    }, [props.flash?.error]);

    const filterOptions = useMemo(
        () => [
            { value: 'search' as const, label: 'Recherche' },
            { value: 'status' as const, label: 'Statut' },
            { value: 'leave_type_id' as const, label: 'Type' },
            { value: 'department_id' as const, label: 'Département' },
            { value: 'employee_id' as const, label: 'Employé' },
        ],
        [],
    );

    const leaveTypeLabelById = useMemo(() => {
        const m = new Map<string, string>();
        props.leaveTypes.forEach((lt) => m.set(String(lt.id), lt.name_fr));
        return m;
    }, [props.leaveTypes]);

    const departmentLabelById = useMemo(() => {
        const m = new Map<string, string>();
        props.departments.forEach((d) => m.set(String(d.id), d.name));
        return m;
    }, [props.departments]);

    const employeeLabelById = useMemo(() => {
        const m = new Map<string, string>();
        props.employees.forEach((e) => m.set(String(e.id), `${e.first_name} ${e.last_name}`.trim()));
        return m;
    }, [props.employees]);

    const filtersToQuery = (list: FilterType[]) => {
        const obj: Record<string, any> = {};
        for (const f of list) {
            if (!f.value) continue;
            obj[f.field] = f.value;
        }
        return {
            search: obj.search || undefined,
            status: obj.status || undefined,
            leave_type_id: obj.leave_type_id || undefined,
            department_id: obj.department_id || undefined,
            employee_id: obj.employee_id || undefined,
        };
    };

    const apply = (list: FilterType[], extra?: Record<string, any>) => {
        router.get(
            route('leaves.requests.index'),
            {
                ...filtersToQuery(list),
                per_page: perPage || undefined,
                ...(extra ?? {}),
            },
            { preserveState: true, replace: true },
        );
    };

    const addFilter = () => {
        if (!currentFilterValue) return;
        const next = [...activeFilters.filter((f) => f.field !== currentFilterField), { field: currentFilterField, value: currentFilterValue }];
        setActiveFilters(next);
        setCurrentFilterValue('');
        apply(next, { page: 1 });
    };

    const removeFilter = (i: number) => {
        const next = activeFilters.filter((_, idx) => idx !== i);
        setActiveFilters(next);
        apply(next, { page: 1 });
    };

    const clearAllFilters = () => {
        setActiveFilters([]);
        setCurrentFilterValue('');
        router.get(route('leaves.requests.index'), { per_page: perPage || undefined }, { preserveState: true, replace: true });
    };

    const currentPage = Number(paginator.current_page ?? 1);
    const lastPage = Number(paginator.last_page ?? 1);
    const pages = pageWindow(currentPage, lastPage);

    return (
        <>
            <Head title="Congés — Demandes" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Congés', href: route('leaves.requests.index') },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        {props.flash?.success && showSuccess && (
                            <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                <p className="flex-1 font-medium">{props.flash.success}</p>
                                <button onClick={() => setShowSuccess(false)} className="text-green-500 hover:text-green-700 dark:text-green-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        {props.flash?.error && showError && (
                            <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <p className="flex-1 font-medium">{props.flash.error}</p>
                                <button onClick={() => setShowError(false)} className="text-red-500 hover:text-red-700 dark:text-red-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des congés</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Administration et suivi des demandes de congés</p>
                            </div>
                        </div>

                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                <div className="flex w-full flex-col gap-4 lg:w-auto">
                                    <div className="flex items-center gap-3">
                                        <Button onClick={() => setShowFilterPanel(!showFilterPanel)}>
                                            <Filter className="h-4 w-4" />
                                            {showFilterPanel ? 'Masquer les filtres' : 'Afficher les filtres'}
                                        </Button>

                                        {activeFilters.length > 0 && (
                                            <Button variant="outline" onClick={clearAllFilters} className="gap-1.5">
                                                <X className="h-4 w-4" /> Effacer filtres
                                            </Button>
                                        )}
                                    </div>

                                    {showFilterPanel && (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les congés
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
                                                    {currentFilterField === 'status' ? (
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="">Sélectionner un statut</option>
                                                            <option value="pending_manager">En attente manager</option>
                                                            <option value="pending_hr">En attente RH</option>
                                                            <option value="approved">Approuvée</option>
                                                            <option value="rejected">Refusée</option>
                                                            <option value="cancelled">Annulée</option>
                                                        </select>
                                                    ) : currentFilterField === 'leave_type_id' ? (
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
                                                    ) : currentFilterField === 'department_id' ? (
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="">Sélectionner un département</option>
                                                            {props.departments.map((d) => (
                                                                <option key={d.id} value={String(d.id)}>
                                                                    {d.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : currentFilterField === 'employee_id' ? (
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                            disabled={!props.canViewAll}
                                                            title={!props.canViewAll ? 'Filtre employé indisponible' : undefined}
                                                        >
                                                            <option value="">Sélectionner un employé</option>
                                                            {props.employees.map((e) => (
                                                                <option key={e.id} value={String(e.id)}>
                                                                    {e.first_name} {e.last_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="relative flex">
                                                            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                            <input
                                                                value={currentFilterValue}
                                                                onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                                                                placeholder="Recherche..."
                                                                className="flex-1 rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                            />
                                                            <Button onClick={addFilter} disabled={!currentFilterValue} className="ml-2">
                                                                Ajouter
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {currentFilterField !== 'search' && (
                                                <Button onClick={addFilter} disabled={!currentFilterValue}>
                                                    Ajouter le filtre
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {activeFilters.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {activeFilters.map((f, i) => {
                                                const label = filterOptions.find((o) => o.value === f.field)?.label ?? f.field;
                                                const displayValue =
                                                    f.field === 'status'
                                                        ? (statusLabel[f.value] ?? f.value)
                                                        : f.field === 'leave_type_id'
                                                          ? (leaveTypeLabelById.get(f.value) ?? f.value)
                                                          : f.field === 'department_id'
                                                            ? (departmentLabelById.get(f.value) ?? f.value)
                                                            : f.field === 'employee_id'
                                                              ? (employeeLabelById.get(f.value) ?? f.value)
                                                              : f.value;

                                                return (
                                                    <span
                                                        key={`${f.field}-${f.value}`}
                                                        className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200"
                                                    >
                                                        <span className="font-medium">{label}:</span>
                                                        {displayValue}
                                                        <button onClick={() => removeFilter(i)}>
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="ml-auto flex items-center gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href={route('leaves.calendar')}>
                                            <CalendarDays className="h-4 w-4" /> Calendrier
                                        </Link>
                                    </Button>

                                    {(canManageLeaveTypes || canManageHolidays || canManageBalances) && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {canManageLeaveTypes && (
                                                <Button variant="outline" asChild>
                                                    <Link href={route('leaves.admin.leave-types.index')}>
                                                        <Tag className="h-4 w-4" /> Types
                                                    </Link>
                                                </Button>
                                            )}
                                            {canManageHolidays && (
                                                <Button variant="outline" asChild>
                                                    <Link href={route('leaves.admin.holidays.index')}>
                                                        <CalendarDays className="h-4 w-4" /> Jours fériés
                                                    </Link>
                                                </Button>
                                            )}
                                            {canManageBalances && (
                                                <Button variant="outline" asChild>
                                                    <Link href={route('leaves.admin.balances.index')}>
                                                        <Power className="h-4 w-4" /> Soldes
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    <div className="relative min-w-[220px]">
                                        <select
                                            value={perPage}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setPerPage(v);
                                                apply(activeFilters, { per_page: v || undefined, page: 1 });
                                            }}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            {[10, 15, 25, 50].map((n) => (
                                                <option key={n} value={String(n)}>
                                                    {n} lignes par page
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-400" />
                                    </div>

                                    <Link href={route('leaves.requests.create')}>
                                        <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                            <Plus className="mr-1 h-4 w-4" /> Nouvelle demande
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                    <tr>
                                        <th className="w-[240px] min-w-[200px] px-6 py-3 text-left">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" /> Employé
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4" /> Type
                                            </div>
                                        </th>
                                        <th className="min-w-[280px] px-6 py-3 text-left">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4" /> Période
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Clock className="h-4 w-4" /> Jours
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Power className="h-4 w-4" /> Statut
                                            </div>
                                        </th>
                                        <th className="w-[120px] px-3 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <MousePointerClick className="h-4 w-4" /> Actions
                                            </div>
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {rows.length ? (
                                        rows.map((r: any) => (
                                            <tr key={r.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium whitespace-nowrap text-slate-900 dark:text-white">
                                                        {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '—'}
                                                    </div>
                                                    {r.employee?.department?.name ? (
                                                        <div className="text-xs text-slate-600 dark:text-slate-400">{r.employee.department.name}</div>
                                                    ) : null}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {r.leave_type?.name_fr ?? r.leaveType?.name_fr ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    <div className="text-xs whitespace-nowrap">
                                                        De {shortDate(r.start_date)} à {shortDate(r.end_date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                                        {r.days_count ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill(String(r.status))}`}
                                                    >
                                                        {statusLabel[String(r.status)] ?? String(r.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Link
                                                            href={route('leaves.requests.show', r.id)}
                                                            className="inline-flex rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                            aria-label="Voir"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </Link>

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const ok = window.confirm('Supprimer cette demande ?');
                                                                    if (!ok) return;
                                                                    router.delete(route('leaves.requests.destroy', r.id), { preserveScroll: true });
                                                                }}
                                                                className="inline-flex rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                                                                aria-label="Supprimer"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <CalendarDays className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                    <div>
                                                        <p className="font-medium">Aucune demande trouvée</p>
                                                        <p className="text-xs">Aucune demande ne correspond aux critères de recherche</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-300">
                                        Affichage de {paginator.from ?? 0} à {paginator.to ?? 0} sur {paginator.total ?? 0} demandes
                                    </span>
                                </div>

                                {lastPage > 1 && (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === 1}
                                            onClick={() => apply(activeFilters, { page: 1 })}
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === 1}
                                            onClick={() => apply(activeFilters, { page: Math.max(1, currentPage - 1) })}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>

                                        {pages.map((p, idx) =>
                                            p === '…' ? (
                                                <span key={idx} className="px-2 text-slate-400 select-none">
                                                    …
                                                </span>
                                            ) : (
                                                <Button
                                                    key={p}
                                                    size="sm"
                                                    variant={p === currentPage ? 'default' : 'outline'}
                                                    onClick={() => apply(activeFilters, { page: p })}
                                                >
                                                    {p}
                                                </Button>
                                            ),
                                        )}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === lastPage}
                                            onClick={() => apply(activeFilters, { page: Math.min(lastPage, currentPage + 1) })}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === lastPage}
                                            onClick={() => apply(activeFilters, { page: lastPage })}
                                        >
                                            <ChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
