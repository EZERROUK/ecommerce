import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Category, PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Filter,
    ListChecks,
    MoreHorizontal,
    Pencil,
    Plus,
    Power,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */
interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
type SortDirection = 'asc' | 'desc';
type FilterType = { field: 'name' | 'status'; value: string };
interface Flash {
    success?: string;
    error?: string;
}

interface Props
    extends PageProps<{
        categories: Pagination<Category>;
        flash?: Flash;
    }> {}

/* ------------------------------ Permissions ------------------------------ */
const useCan = () => {
    const { props } = usePage<{ auth?: { roles?: string[]; permissions?: string[] } }>();
    const roles = props.auth?.roles ?? [];
    const perms = props.auth?.permissions;
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const set = useMemo(() => new Set(perms ?? []), [perms]);
    const can = (p?: string) => !p || isSuperAdmin || set.has(p);
    return { can, isSuperAdmin };
};

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */
export default function CategoriesIndex({ categories, flash }: Props) {
    const { can } = useCan();

    /* ------------------------------ STATE --------------------------------- */
    const catArray = categories.data;

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<'name' | 'status' | 'products_count'>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<FilterType['field']>('name');
    const [currentFilterValue, setCurrentFilterValue] = useState('');

    const [showSuccess, setShowSuccess] = useState(!!flash?.success);
    const [showError, setShowError] = useState(!!flash?.error);

    /* ------------------------------ FLASH --------------------------------- */
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

    /* ------------------------------ FILTERS ------------------------------- */
    const filterOptions = [
        { value: 'name', label: 'Nom' },
        { value: 'status', label: 'Statut' },
    ];

    const addFilter = () => {
        if (!currentFilterValue) return;
        setActiveFilters((p) => [...p, { field: currentFilterField, value: currentFilterValue }]);
        setCurrentFilterValue('');
    };
    const removeFilter = (idx: number) => setActiveFilters((p) => p.filter((_, i) => i !== idx));
    const clearAllFilters = () => setActiveFilters([]);

    /* --------------------------- DATA PIPELINE --------------------------- */
    const filtered = useMemo(
        () =>
            catArray.filter((cat) =>
                activeFilters.every((f) => {
                    if (f.field === 'name') return cat.name.toLowerCase().includes(f.value.toLowerCase());
                    if (f.field === 'status') {
                        if (f.value.toLowerCase() === 'actif') return !cat.deleted_at;
                        if (f.value.toLowerCase() === 'désactivé') return !!cat.deleted_at;
                    }
                    return true;
                }),
            ),
        [catArray, activeFilters],
    );

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            if (sortField === 'status') {
                const cmp = !a.deleted_at && b.deleted_at ? -1 : a.deleted_at && !b.deleted_at ? 1 : 0;
                return sortDirection === 'asc' ? cmp : -cmp;
            }
            if (sortField === 'products_count') {
                const aCount = (a as any).products_count ?? 0;
                const bCount = (b as any).products_count ?? 0;
                const cmp = aCount === bCount ? 0 : aCount < bCount ? -1 : 1;
                return sortDirection === 'asc' ? cmp : -cmp;
            }
            const cmp = a.name.localeCompare(b.name);
            return sortDirection === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortField, sortDirection]);

    const paginated = useMemo(() => {
        if (rowsPerPage === -1) return sorted;
        const start = (currentPage - 1) * rowsPerPage;
        return sorted.slice(start, start + rowsPerPage);
    }, [sorted, rowsPerPage, currentPage]);

    const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(filtered.length / rowsPerPage);

    /* -------------------- Pagination window (chevrons) ------------------- */
    const windowPages = useMemo<(number | '…')[]>(() => {
        const out: (number | '…')[] = [];
        const MAX = 5;
        const c = currentPage,
            l = totalPages;

        if (l <= MAX + 2) {
            for (let i = 1; i <= l; i++) out.push(i);
            return out;
        }

        out.push(1);
        let s = Math.max(2, c - Math.floor(MAX / 2));
        let e = s + MAX - 1;
        if (e >= l) {
            e = l - 1;
            s = e - MAX + 1;
        }

        if (s > 2) out.push('…');
        for (let i = s; i <= e; i++) out.push(i);
        if (e < l - 1) out.push('…');
        out.push(l);

        return out;
    }, [currentPage, totalPages]);

    /* ------------------------------- CRUD -------------------------------- */
    const changeSort = (f: 'name' | 'status' | 'products_count') => {
        if (sortField === f) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        else {
            setSortField(f);
            setSortDirection('asc');
        }
    };

    const restoreOne = (id: number) => {
        if (!can('category_restore')) return alert('Permission manquante: category_restore');
        if (confirm('Restaurer cette catégorie ?')) router.post(route('categories.restore', { id }), {}, { preserveScroll: true });
    };
    const deleteOne = (id: number) => {
        if (!can('category_delete')) return alert('Permission manquante: category_delete');
        if (confirm('Supprimer cette catégorie ?')) router.delete(route('categories.destroy', { id }), { preserveScroll: true });
    };
    const deleteSelected = () => {
        if (!can('category_delete')) return alert('Permission manquante: category_delete');
        if (!selectedIds.length) return;
        if (!confirm(`Supprimer ${selectedIds.length} catégorie(s) ?`)) return;
        Promise.all(selectedIds.map((id) => router.delete(route('categories.destroy', { id }), { preserveScroll: true }))).then(() =>
            setSelectedIds([]),
        );
    };
    const restoreSelected = () => {
        if (!can('category_restore')) return alert('Permission manquante: category_restore');
        if (!selectedIds.length) return;
        if (!confirm(`Restaurer ${selectedIds.length} catégorie(s) ?`)) return;
        Promise.all(selectedIds.map((id) => router.post(route('categories.restore', { id }), {}, { preserveScroll: true }))).then(() =>
            setSelectedIds([]),
        );
    };

    /* ------------------------ SELECTION HELPERS ------------------------ */
    const toggleSelect = (id: number) => {
        const cat = catArray.find((c) => c.id === id);
        const isActive = !cat?.deleted_at;

        // on autorise la sélection seulement si l'action correspondante est permise
        if (isActive && !can('category_delete')) return;
        if (!isActive && !can('category_restore')) return;

        setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
    };

    const toggleSelectAll = () => {
        // header checkbox n'est visible que si une action bulk est permise (voir calcul plus bas)
        if (!paginated.length) return;
        const first = paginated[0];
        const firstActive = !first.deleted_at;

        const canBulkDelete = can('category_delete');
        const canBulkRestore = can('category_restore');

        if (selectedIds.length === paginated.length) {
            setSelectedIds([]);
        } else {
            const ids = paginated
                .filter((cat) => {
                    const active = !cat.deleted_at;
                    if (active && !canBulkDelete) return false;
                    if (!active && !canBulkRestore) return false;
                    return active === firstActive;
                })
                .map((c) => c.id);
            setSelectedIds(ids);
        }
    };

    const allSelected = paginated.length > 0 && selectedIds.length === paginated.length;
    const anyInactive = selectedIds.some((id) => !!catArray.find((c) => c.id === id)?.deleted_at);
    const anyActive = selectedIds.some((id) => !catArray.find((c) => c.id === id)?.deleted_at);

    /* -------------------------- UI Permissions -------------------------- */
    const canCreate = can('category_create');
    const canBulkDelete = can('category_delete');
    const canBulkRestore = can('category_restore');

    // Montrer la colonne “Actions” seulement si au moins une action est possible
    const showActionsColumn = useMemo(() => {
        if (paginated.length === 0) return false;
        return paginated.some((cat) => {
            const isActive = !cat.deleted_at;
            const canShow = can('category_show');
            const canEdit = can('category_edit');
            const canDel = can('category_delete') && isActive;
            const canRes = can('category_restore') && !isActive;
            const canAttr = can('category_edit'); // gestion des attributs
            return canShow || canEdit || canDel || canRes || canAttr;
        });
    }, [paginated, can]);

    // Header checkbox visible seulement si une action bulk est permise sur au moins un élément
    const showCheckboxHeader = useMemo(() => {
        return paginated.some((cat) => {
            const isActive = !cat.deleted_at;
            if (isActive && canBulkDelete) return true;
            if (!isActive && canBulkRestore) return true;
            return false;
        });
    }, [paginated, canBulkDelete, canBulkRestore]);

    /* -------------------------------------------------------------------- */
    /*                                 UI                                   */
    /* -------------------------------------------------------------------- */
    return (
        <>
            <Head title="Catégories" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Catégories', href: '/categories' },
                ]}
            >
                {/* BACKGROUND + PARTICLES */}
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        {/* ---------------- FLASH ---------------- */}
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

                        {/* ------------------------ TITLE ------------------------ */}
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des catégories</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Administration et gestion des catégories système</p>
                            </div>
                        </div>

                        {/* ------------------- FILTER / TOOLS ------------------- */}
                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                {/* LEFT BLOCK */}
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

                                        {selectedIds.length > 0 && (
                                            <>
                                                {anyInactive && canBulkRestore && (
                                                    <Button variant="secondary" onClick={restoreSelected}>
                                                        <RotateCcw className="mr-1 h-4 w-4" /> Restaurer ({selectedIds.length})
                                                    </Button>
                                                )}
                                                {anyActive && canBulkDelete && (
                                                    <Button variant="destructive" onClick={deleteSelected}>
                                                        <Trash2 className="mr-1 h-4 w-4" /> Supprimer ({selectedIds.length})
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* FILTER PANEL */}
                                    {showFilterPanel && (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les catégories
                                            </h3>

                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <select
                                                    value={currentFilterField}
                                                    onChange={(e) => setCurrentFilterField(e.target.value as FilterType['field'])}
                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                >
                                                    {filterOptions.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </select>

                                                <div className="sm:col-span-2">
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

                                            {currentFilterField === 'status' && (
                                                <Button onClick={addFilter} disabled={!currentFilterValue}>
                                                    Ajouter le filtre
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {activeFilters.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {activeFilters.map((f, i) => (
                                                <span
                                                    key={i}
                                                    className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                                >
                                                    <span className="font-medium">{filterOptions.find((o) => o.value === f.field)?.label}:</span>
                                                    {f.value}
                                                    <button onClick={() => removeFilter(i)}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT BLOCK */}
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
                                        <Link href={route('categories.create')}>
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" /> Ajouter une catégorie
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* -------------------------- TABLE -------------------------- */}
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
                                                <Tag className="h-4 w-4" />
                                                Nom {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        <th className="w-[160px] cursor-pointer px-3 py-3 text-center" onClick={() => changeSort('products_count')}>
                                            <div className="flex items-center justify-center gap-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                                Produits {sortField === 'products_count' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                                            </div>
                                        </th>
                                        <th className="w-[140px] cursor-pointer px-3 py-3 text-center" onClick={() => changeSort('status')}>
                                            <div className="flex items-center justify-center gap-2">
                                                <Power className="h-4 w-4" />
                                                Statut
                                                {sortField === 'status' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                                            </div>
                                        </th>
                                        {showActionsColumn && (
                                            <th className="w-[160px] px-3 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    Actions
                                                </div>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={showActionsColumn ? 5 : 4}
                                                className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <Tag className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                    <div>
                                                        <p className="font-medium">Aucune catégorie trouvée</p>
                                                        <p className="text-xs">Aucune catégorie ne correspond aux critères de recherche</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map((cat) => {
                                            const isActive = !cat.deleted_at;
                                            const canShow = can('category_show');
                                            const canEdit = can('category_edit');
                                            const canDel = can('category_delete') && isActive;
                                            const canRes = can('category_restore') && !isActive;
                                            const canAttr = can('category_edit'); // gestion attributs = edit

                                            const canSelectRow = (isActive && can('category_delete')) || (!isActive && can('category_restore'));
                                            const showRowActions = canShow || canEdit || canDel || canRes || canAttr;

                                            return (
                                                <tr
                                                    key={cat.id}
                                                    className={`${cat.deleted_at ? 'bg-red-50 dark:bg-red-900/10' : ''} transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                                                >
                                                    {showCheckboxHeader && (
                                                        <td className="px-6 py-4 text-center">
                                                            {canSelectRow ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedIds.includes(cat.id)}
                                                                    onChange={() => toggleSelect(cat.id)}
                                                                    className="rounded border-slate-300 text-red-600"
                                                                />
                                                            ) : (
                                                                <span className="inline-block w-4" />
                                                            )}
                                                        </td>
                                                    )}

                                                    {/* name */}
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{cat.name}</td>

                                                    {/* products count */}
                                                    <td className="px-6 py-4 text-center">{(cat as any).products_count ?? 0}</td>

                                                    {/* status */}
                                                    <td className="min-w-[100px] px-6 py-4 text-center">
                                                        {cat.deleted_at ? (
                                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                Désactivé
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                Actif
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* actions */}
                                                    {showActionsColumn && (
                                                        <td className="px-6 py-4 text-center">
                                                            {showRowActions ? (
                                                                <div className="flex justify-center gap-2">
                                                                    {cat.deleted_at ? (
                                                                        canRes && (
                                                                            <button
                                                                                onClick={() => restoreOne(cat.id)}
                                                                                className="rounded-full p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                                                                                aria-label="Restaurer"
                                                                            >
                                                                                <RotateCcw className="h-5 w-5" />
                                                                            </button>
                                                                        )
                                                                    ) : (
                                                                        <>
                                                                            {canShow && (
                                                                                <Link
                                                                                    href={route('categories.show', cat.id)}
                                                                                    className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                                    aria-label="Voir"
                                                                                >
                                                                                    <Eye className="h-5 w-5" />
                                                                                </Link>
                                                                            )}
                                                                            {canEdit && (
                                                                                <Link
                                                                                    href={route('categories.edit', cat.id)}
                                                                                    className="rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800/30 dark:hover:text-yellow-300"
                                                                                    aria-label="Éditer"
                                                                                >
                                                                                    <Pencil className="h-5 w-5" />
                                                                                </Link>
                                                                            )}
                                                                            {canDel && (
                                                                                <button
                                                                                    onClick={() => deleteOne(cat.id)}
                                                                                    className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300"
                                                                                    aria-label="Supprimer"
                                                                                >
                                                                                    <Trash2 className="h-5 w-5" />
                                                                                </button>
                                                                            )}
                                                                            {canAttr && (
                                                                                <Link
                                                                                    href={route('categories.attributes.edit', cat.id)}
                                                                                    className="rounded-full p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-800/30 dark:hover:text-indigo-300"
                                                                                    aria-label="Gérer les attributs"
                                                                                >
                                                                                    <ListChecks className="h-5 w-5" />
                                                                                </Link>
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
                                    )}
                                </tbody>
                            </table>

                            {/* ----------------------- FOOTER ----------------------- */}
                            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-300">
                                        {rowsPerPage === -1
                                            ? `Affichage de toutes les ${filtered.length} catégories`
                                            : `Affichage de ${Math.min((currentPage - 1) * rowsPerPage + 1, filtered.length)} à ${Math.min(currentPage * rowsPerPage, filtered.length)} sur ${filtered.length} catégories`}
                                    </span>
                                </div>

                                {rowsPerPage !== -1 && totalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>

                                        {windowPages.map((p, idx) =>
                                            p === '…' ? (
                                                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 select-none">
                                                    …
                                                </span>
                                            ) : (
                                                <Button
                                                    key={`page-${p}`}
                                                    size="sm"
                                                    variant={p === currentPage ? 'default' : 'outline'}
                                                    onClick={() => setCurrentPage(p as number)}
                                                >
                                                    {p}
                                                </Button>
                                            ),
                                        )}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage((p) => p + 1)}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(totalPages)}
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
