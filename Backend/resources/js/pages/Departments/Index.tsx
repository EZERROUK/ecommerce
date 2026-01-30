import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Filter,
    MousePointerClick,
    Pencil,
    Plus,
    Power,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Trash2,
    User,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
}

interface Department {
    id: number;
    name: string;
    description: string | null;
    department_head: number | null;
    department_head_name?: string | null;
    department_head_full_name?: string | null;
    head?: Employee | null;
    employees_count?: number;
    deleted_at: string | null;
}

interface Props {
    departments: Department[];
    flash?: { success?: string; error?: string };
}

type SortDirection = 'asc' | 'desc';
type FilterType = { field: 'name' | 'description' | 'head' | 'status'; value: string };

const useCan = () => {
    const { props } = usePage<{ auth?: { roles?: string[]; permissions?: string[] } }>();
    const roles = props.auth?.roles ?? [];
    const perms = props.auth?.permissions;
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const set = useMemo(() => new Set(perms ?? []), [perms]);
    const can = (p?: string) => !p || isSuperAdmin || set.has(p);
    return { can, isSuperAdmin };
};

export default function DepartmentsIndex({ departments: initialDepartments, flash }: Props) {
    const { can } = useCan();
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<'name' | 'status'>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
    const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<FilterType['field']>('name');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [showSuccess, setShowSuccess] = useState(!!flash?.success);
    const [showError, setShowError] = useState(!!flash?.error);

    useEffect(() => {
        setDepartments(initialDepartments);
    }, [initialDepartments]);

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

    const filterOptions = [
        { value: 'name', label: 'Nom' },
        { value: 'description', label: 'Description' },
        { value: 'head', label: 'Chef de département' },
        { value: 'status', label: 'Statut' },
    ];

    const truncateDescription = (text: string | null, max = 80) => {
        if (!text) return 'N/A';
        return text.length > max ? text.slice(0, max).trim() + '…' : text;
    };

    const getHeadName = (d: Department) => {
        if (d.head && (d.head.first_name || d.head.last_name)) {
            return `${d.head.first_name ?? ''} ${d.head.last_name ?? ''}`.trim();
        }
        if (d.department_head_full_name) return d.department_head_full_name;
        if (d.department_head_name) return d.department_head_name;
        return '';
    };

    const departmentHeads = useMemo(() => {
        const map = new Map<number, Employee>();
        departments.forEach((d) => {
            if (d.department_head && d.head) {
                map.set(d.department_head, d.head);
            }
        });
        return Array.from(map.values()).sort((a, b) =>
            `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim().localeCompare(`${b.first_name ?? ''} ${b.last_name ?? ''}`.trim()),
        );
    }, [departments]);

    const headLabelById = useMemo(() => {
        const m = new Map<string, string>();
        departmentHeads.forEach((e) => {
            const label = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim();
            m.set(String(e.id), label || String(e.id));
        });
        return m;
    }, [departmentHeads]);

    const addFilter = () => {
        if (!currentFilterValue) return;
        setActiveFilters((p) => [...p, { field: currentFilterField, value: currentFilterValue }]);
        setCurrentFilterValue('');
    };

    const removeFilter = (i: number) => setActiveFilters((p) => p.filter((_, idx) => idx !== i));

    const clearAllFilters = () => setActiveFilters([]);

    const filteredDepartments = useMemo(() => {
        return departments.filter((department) =>
            activeFilters.every((f) => {
                if (f.field === 'name') {
                    return department.name.toLowerCase().includes(f.value.toLowerCase());
                }
                if (f.field === 'description') {
                    return (department.description ?? '').toLowerCase().includes(f.value.toLowerCase());
                }
                if (f.field === 'head') {
                    return String(department.department_head ?? '') === f.value;
                }
                if (f.field === 'status') {
                    return f.value.toLowerCase() === 'actif' ? !department.deleted_at : !!department.deleted_at;
                }
                return true;
            }),
        );
    }, [departments, activeFilters]);

    const sortedDepartments = useMemo(() => {
        return [...filteredDepartments].sort((a, b) => {
            if (sortField === 'status') {
                const cmp = !a.deleted_at === !b.deleted_at ? 0 : !a.deleted_at ? -1 : 1;
                return sortDirection === 'asc' ? cmp : -cmp;
            }
            const cmp = a.name.localeCompare(b.name);
            return sortDirection === 'asc' ? cmp : -cmp;
        });
    }, [filteredDepartments, sortField, sortDirection]);

    const paginatedDepartments = useMemo(() => {
        if (rowsPerPage === -1) return sortedDepartments;
        const start = (currentPage - 1) * rowsPerPage;
        return sortedDepartments.slice(start, start + rowsPerPage);
    }, [sortedDepartments, currentPage, rowsPerPage]);

    const totalPages = useMemo(
        () => (rowsPerPage === -1 ? 1 : Math.ceil(filteredDepartments.length / rowsPerPage)),
        [filteredDepartments.length, rowsPerPage],
    );

    const windowPages = useMemo(() => {
        const win = 5;
        const out: (number | '…')[] = [];

        if (totalPages <= win + 2) {
            for (let i = 1; i <= totalPages; i++) out.push(i);
        } else {
            out.push(1);
            const s = Math.max(2, currentPage - 1);
            const e = Math.min(totalPages - 1, currentPage + 1);
            if (s > 2) out.push('…');
            for (let i = s; i <= e; i++) out.push(i);
            if (e < totalPages - 1) out.push('…');
            out.push(totalPages);
        }
        return out;
    }, [currentPage, totalPages]);

    const changeSort = (f: 'name' | 'status') => {
        if (sortField === f) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        else {
            setSortField(f);
            setSortDirection('asc');
        }
    };

    const changePage = (p: number) => setCurrentPage(p);

    const handleDelete = (id: number) => {
        if (!can('department_delete')) return alert('Permission manquante: department_delete');
        if (!confirm('Voulez-vous vraiment supprimer ce département ?')) return;

        router.delete(route('departments.destroy', { department: id }), {
            preserveScroll: true,
            onSuccess: () => {
                setDepartments((prev) => prev.filter((d) => d.id !== id));
                setSelectedDepartmentIds((prev) => prev.filter((c) => c !== id));
            },
            onError: () => {
                alert('Une erreur est survenue lors de la suppression.');
            },
        });
    };

    const restoreDepartment = (id: number) => {
        if (!can('department_restore')) return alert('Permission manquante: department_restore');
        if (!confirm('Voulez-vous restaurer ce département ?')) return;
        router.post(route('departments.restore', { id }), {}, { preserveScroll: true });
    };

    const deleteSelectedDepartments = () => {
        if (!can('department_delete')) return alert('Permission manquante: department_delete');
        if (!selectedDepartmentIds.length) return;
        if (!confirm(`Supprimer ${selectedDepartmentIds.length} département(s) ?`)) return;
        Promise.all(selectedDepartmentIds.map((id) => router.delete(route('departments.destroy', { department: id }), { preserveScroll: true })))
            .then(() => setSelectedDepartmentIds([]))
            .catch(() => alert('Une erreur est survenue lors de la suppression.'));
    };

    const restoreSelectedDepartments = () => {
        if (!can('department_restore')) return alert('Permission manquante: department_restore');
        if (!selectedDepartmentIds.length) return;
        if (!confirm(`Restaurer ${selectedDepartmentIds.length} département(s) ?`)) return;
        Promise.all(selectedDepartmentIds.map((id) => router.post(route('departments.restore', { id }), {}, { preserveScroll: true })))
            .then(() => setSelectedDepartmentIds([]))
            .catch(() => alert('Une erreur est survenue lors de la restauration.'));
    };

    const toggleSelectDepartment = (id: number) => {
        const department = departments.find((d) => d.id === id);
        const isActive = !department?.deleted_at;

        if (isActive && !can('department_delete')) return;
        if (!isActive && !can('department_restore')) return;

        setSelectedDepartmentIds((p) => (p.includes(id) ? p.filter((c) => c !== id) : [...p, id]));
    };

    const toggleSelectAll = () => {
        if (!paginatedDepartments.length) return;
        const first = paginatedDepartments[0];
        const firstActive = !first.deleted_at;

        const canBulkDelete = can('department_delete');
        const canBulkRestore = can('department_restore');

        if (selectedDepartmentIds.length === paginatedDepartments.length) {
            setSelectedDepartmentIds([]);
        } else {
            const ids = paginatedDepartments
                .filter((department) => {
                    const active = !department.deleted_at;
                    if (active && !canBulkDelete) return false;
                    if (!active && !canBulkRestore) return false;
                    return active === firstActive;
                })
                .map((d) => d.id);
            setSelectedDepartmentIds(ids);
        }
    };

    const allSelected = paginatedDepartments.length > 0 && selectedDepartmentIds.length === paginatedDepartments.length;
    const anySelectedInactive = selectedDepartmentIds.some((id) => departments.find((d) => d.id === id)?.deleted_at);
    const anySelectedActive = selectedDepartmentIds.some((id) => !departments.find((d) => d.id === id)?.deleted_at);

    const canCreate = can('department_create');
    const canBulkDelete = can('department_delete');
    const canBulkRestore = can('department_restore');

    const showActionsColumn = useMemo(() => {
        if (paginatedDepartments.length === 0) return false;
        return paginatedDepartments.some((department) => {
            const isActive = !department.deleted_at;
            const canShow = can('department_show');
            const canEdit = can('department_edit');
            const canDel = can('department_delete') && isActive;
            const canRes = can('department_restore') && !isActive;
            return canShow || canEdit || canDel || canRes;
        });
    }, [paginatedDepartments, can]);

    const showCheckboxHeader = useMemo(() => {
        return paginatedDepartments.some((department) => {
            const isActive = !department.deleted_at;
            if (isActive && canBulkDelete) return true;
            if (!isActive && canBulkRestore) return true;
            return false;
        });
    }, [paginatedDepartments, canBulkDelete, canBulkRestore]);

    const renderHead = (d: Department) => {
        const n = getHeadName(d);
        return n ? n : 'Non assigné';
    };

    return (
        <>
            <Head title="Départements" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Départements', href: '/departments' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        {flash?.success && showSuccess && (
                            <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                <p className="flex-1 font-medium">{flash.success}</p>
                                <button onClick={() => setShowSuccess(false)} className="text-green-500 hover:text-green-700 dark:text-green-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        {flash?.error && showError && (
                            <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <p className="flex-1 font-medium">{flash.error}</p>
                                <button onClick={() => setShowError(false)} className="text-red-500 hover:text-red-700 dark:text-red-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des départements</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Administration et organisation des départements</p>
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

                                        {selectedDepartmentIds.length > 0 && (
                                            <>
                                                {anySelectedInactive && canBulkRestore && (
                                                    <Button variant="secondary" onClick={restoreSelectedDepartments}>
                                                        <RotateCcw className="mr-1 h-4 w-4" /> Restaurer ({selectedDepartmentIds.length})
                                                    </Button>
                                                )}
                                                {anySelectedActive && canBulkDelete && (
                                                    <Button variant="destructive" onClick={deleteSelectedDepartments}>
                                                        <Trash2 className="mr-1 h-4 w-4" /> Supprimer ({selectedDepartmentIds.length})
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {showFilterPanel && (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les départements
                                            </h3>

                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
                                                <select
                                                    value={currentFilterField}
                                                    onChange={(e) => setCurrentFilterField(e.target.value as FilterType['field'])}
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
                                                            <option value="actif">Actif</option>
                                                            <option value="désactivé">Désactivé</option>
                                                        </select>
                                                    ) : currentFilterField === 'head' ? (
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="">Sélectionner un chef</option>
                                                            {departmentHeads.map((e) => (
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
                                                                placeholder={`Filtrer par ${currentFilterField}`}
                                                                className="flex-1 rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                            />
                                                            <Button onClick={addFilter} disabled={!currentFilterValue} className="ml-2">
                                                                Ajouter
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {(currentFilterField === 'status' || currentFilterField === 'head') && (
                                                <Button onClick={addFilter} disabled={!currentFilterValue}>
                                                    Ajouter le filtre
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {activeFilters.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {activeFilters.map((f, i) => {
                                                const displayValue = f.field === 'head' ? (headLabelById.get(f.value) ?? f.value) : f.value;

                                                return (
                                                    <span
                                                        key={i}
                                                        className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200"
                                                    >
                                                        <span className="font-medium">{filterOptions.find((o) => o.value === f.field)?.label}:</span>
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
                                    <div className="relative min-w-[220px]">
                                        <select
                                            value={rowsPerPage}
                                            onChange={(e) => {
                                                setRowsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            {[5, 10, 20, 50].map((n) => (
                                                <option key={n} value={n}>
                                                    {n} lignes par page
                                                </option>
                                            ))}
                                            <option value={-1}>Tous les enregistrements</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-400" />
                                    </div>

                                    {canCreate && (
                                        <Link href="/departments/create">
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" /> Ajouter un département
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                    <tr>
                                        {showCheckboxHeader && (
                                            <th className="w-[50px] px-3 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!allSelected}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-slate-300 text-red-600"
                                                />
                                            </th>
                                        )}
                                        <th className="cursor-pointer px-6 py-3 text-left" onClick={() => changeSort('name')}>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Nom {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <div className="flex items-center gap-2">Description</div>
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <User className="h-4 w-4" />
                                                Chef de département
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Employés
                                            </div>
                                        </th>
                                        <th className="w-[120px] cursor-pointer px-3 py-3 text-center" onClick={() => changeSort('status')}>
                                            <div className="flex items-center justify-center gap-2">
                                                <Power className="h-4 w-4" />
                                                Statut {sortField === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        {showActionsColumn && (
                                            <th className="w-[120px] px-3 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <MousePointerClick className="h-4 w-4" />
                                                    Actions
                                                </div>
                                            </th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {paginatedDepartments.length ? (
                                        paginatedDepartments.map((department) => {
                                            const isActive = !department.deleted_at;
                                            const canShow = can('department_show');
                                            const canEdit = can('department_edit');
                                            const canDel = can('department_delete') && isActive;
                                            const canRes = can('department_restore') && !isActive;
                                            const canSelectRow = (isActive && can('department_delete')) || (!isActive && can('department_restore'));
                                            const showRowActions = canShow || canEdit || canDel || canRes;
                                            const hasConflict =
                                                !!department.deleted_at && departments.some((d) => !d.deleted_at && d.name === department.name);

                                            return (
                                                <tr
                                                    key={department.id}
                                                    className={`${department.deleted_at ? 'bg-red-50 dark:bg-red-900/10' : ''} transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                                                >
                                                    {showCheckboxHeader && (
                                                        <td className="px-6 py-4 text-center">
                                                            {canSelectRow ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedDepartmentIds.includes(department.id)}
                                                                    onChange={() => toggleSelectDepartment(department.id)}
                                                                    className="rounded border-slate-300 text-red-600"
                                                                />
                                                            ) : (
                                                                <span className="inline-block w-4" />
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{department.name}</td>
                                                    <td
                                                        className="max-w-[420px] px-6 py-4 text-slate-600 dark:text-slate-400"
                                                        title={department.description ?? undefined}
                                                    >
                                                        {truncateDescription(department.description)}
                                                    </td>

                                                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                                                        {renderHead(department)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                                            {department.employees_count ?? 0}
                                                        </span>
                                                    </td>
                                                    <td className="min-w-[100px] px-6 py-4 text-center">
                                                        {department.deleted_at ? (
                                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                Désactivé
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                Actif
                                                            </span>
                                                        )}
                                                    </td>
                                                    {showActionsColumn && (
                                                        <td className="px-6 py-4 text-center">
                                                            {showRowActions ? (
                                                                <div className="flex justify-center gap-2">
                                                                    {department.deleted_at ? (
                                                                        <>
                                                                            {/* 🔁 Restaurer – autorisé */}
                                                                            {canRes && !hasConflict && (
                                                                                <button
                                                                                    onClick={() => restoreDepartment(department.id)}
                                                                                    className="rounded-full p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                                                                                    aria-label="Restaurer"
                                                                                >
                                                                                    <RotateCcw className="h-5 w-5" />
                                                                                </button>
                                                                            )}

                                                                            {/* 🚫 Restaurer – conflit de nom */}
                                                                            {canRes && hasConflict && (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        alert(
                                                                                            `Impossible de restaurer : un département actif porte déjà le nom « ${department.name} ».`,
                                                                                        )
                                                                                    }
                                                                                    className="cursor-not-allowed rounded-full p-1 text-slate-400"
                                                                                    aria-label="Conflit de restauration"
                                                                                >
                                                                                    <RotateCcw className="h-5 w-5" />
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {/* 👁️ Voir */}
                                                                            {canShow && (
                                                                                <Link
                                                                                    href={route('departments.show', department.id)}
                                                                                    className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                                    aria-label="Voir"
                                                                                >
                                                                                    <Eye className="h-5 w-5" />
                                                                                </Link>
                                                                            )}

                                                                            {/* ✏️ Éditer */}
                                                                            {canEdit && (
                                                                                <Link
                                                                                    href={route('departments.edit', department.id)}
                                                                                    className="rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800/30 dark:hover:text-yellow-300"
                                                                                    aria-label="Éditer"
                                                                                >
                                                                                    <Pencil className="h-5 w-5" />
                                                                                </Link>
                                                                            )}

                                                                            {/* 🗑️ Supprimer – autorisé (0 employés) */}
                                                                            {canDel && department.employees_count === 0 && (
                                                                                <button
                                                                                    onClick={() => handleDelete(department.id)}
                                                                                    className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300"
                                                                                    aria-label="Supprimer"
                                                                                >
                                                                                    <Trash2 className="h-5 w-5" />
                                                                                </button>
                                                                            )}

                                                                            {/* 🚫 Supprimer – bloqué (employés présents) */}
                                                                            {canDel && department.employees_count! > 0 && (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        alert(
                                                                                            `Impossible de supprimer ce département : ${department.employees_count} employé(s) y sont rattaché(s).`,
                                                                                        )
                                                                                    }
                                                                                    className="cursor-not-allowed rounded-full p-1 text-slate-400"
                                                                                    aria-label="Suppression impossible"
                                                                                >
                                                                                    <Trash2 className="h-5 w-5" />
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic dark:text-slate-600">
                                                                    Aucune action
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={showActionsColumn ? 7 : 6}
                                                className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                    <div>
                                                        <p className="font-medium">Aucun département trouvé</p>
                                                        <p className="text-xs">Aucun département ne correspond aux critères de recherche</p>
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
                                        {rowsPerPage === -1
                                            ? `Affichage de tous les ${filteredDepartments.length} départements`
                                            : `Affichage de ${Math.min((currentPage - 1) * rowsPerPage + 1, filteredDepartments.length)} à ${Math.min(currentPage * rowsPerPage, filteredDepartments.length)} sur ${filteredDepartments.length} départements`}
                                    </span>
                                </div>

                                {rowsPerPage !== -1 && totalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => changePage(1)}>
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>

                                        {windowPages.map((p, idx) =>
                                            p === '…' ? (
                                                <span key={idx} className="px-2 text-slate-400 select-none">
                                                    …
                                                </span>
                                            ) : (
                                                <Button
                                                    key={p}
                                                    size="sm"
                                                    variant={p === currentPage ? 'default' : 'outline'}
                                                    onClick={() => changePage(p as number)}
                                                >
                                                    {p}
                                                </Button>
                                            ),
                                        )}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === totalPages}
                                            onClick={() => changePage(currentPage + 1)}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === totalPages}
                                            onClick={() => changePage(totalPages)}
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
