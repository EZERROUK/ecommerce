import ModernDatePicker from '@/components/ModernDatePicker';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { PageProps, Pagination, Product, ProductFilterType, ProductFilters } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Archive,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    DollarSign,
    Eye,
    Filter,
    Layers,
    MoreHorizontal,
    Package,
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

type ProductRow = Product & {
    deleted_at?: string | null;
};

interface Flash {
    success?: string;
    error?: string;
}

interface Props
    extends PageProps<{
        products: Pagination<ProductRow>;
        categories: Array<{ id: number | string; name: string }>;
        filters: ProductFilters;
        sort: 'name' | 'status' | 'created_at' | 'price' | 'stock_quantity';
        dir: 'asc' | 'desc';
        flash?: Flash;
    }> {}

/** YYYY-MM-DD (local) */
const formatDateToYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
/** parse YYYY-MM-DD (local) */
const parseDateFromYMD = (s: string): Date => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
};

/* -------------------------- QS helper (safe 1-arg router.get) -------------------------- */
function toQueryString(payload: Record<string, unknown>): string {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        params.append(k, String(v));
    });
    return params.toString();
}

export default function ProductsIndex({ products, categories, filters, sort, dir, flash }: Props) {
    /* ------------------------------ AUTH (Spatie) ------------------------------ */
    const {
        props: { auth },
    } = usePage<PageProps<any>>();
    const roles: string[] = (auth as any)?.roles ?? [];
    const perms: string[] = (auth as any)?.permissions ?? [];
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const can = (p: string) => isSuperAdmin || perms.includes(p);

    const canCreate = can('product_create');
    const canShow = can('product_show');
    const canEdit = can('product_edit');
    const canDelete = can('product_delete');
    const canRestore = can('product_restore');
    const canToggle = canEdit;

    const showActionsCol = canShow || canEdit || canDelete;
    const showSelectCol = canDelete || canToggle;

    /* ------------------------------ UI STATE ------------------------------ */
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<ProductFilterType['field']>('search');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [currentFilterOperator, setCurrentFilterOperator] = useState<ProductFilterType['operator']>('contains');
    const [currentFilterValue2, setCurrentFilterValue2] = useState('');

    const [activeFilters, setActiveFilters] = useState<ProductFilterType[]>(() => {
        const arr: ProductFilterType[] = [];
        if (filters.search) filters.search.split(/\s+/).forEach((v) => arr.push({ field: 'search', value: v, operator: 'contains' }));
        if (filters.name) arr.push({ field: 'name', value: filters.name, operator: 'contains' });
        if (filters.category) arr.push({ field: 'category', value: filters.category, operator: 'contains' });
        if (filters.status) arr.push({ field: 'status', value: filters.status, operator: 'equals' });

        if (filters.price && filters.price_operator) {
            if (filters.price_operator === 'between' && filters.price_min && filters.price_max) {
                arr.push({ field: 'price', value: filters.price_min, value2: filters.price_max, operator: 'between' });
            } else {
                arr.push({ field: 'price', value: filters.price, operator: filters.price_operator as ProductFilterType['operator'] });
            }
        }
        if (filters.stock && filters.stock_operator) {
            if (filters.stock_operator === 'between' && filters.stock_min && filters.stock_max) {
                arr.push({ field: 'stock', value: filters.stock_min, value2: filters.stock_max, operator: 'between' });
            } else {
                arr.push({ field: 'stock', value: filters.stock, operator: filters.stock_operator as ProductFilterType['operator'] });
            }
        }
        if (filters.date_start && filters.date_end) {
            arr.push({ field: 'date', value: filters.date_start, value2: filters.date_end, operator: 'date_range' });
        }
        return arr;
    });

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showSuccess, setShowSuccess] = useState(!!flash?.success);
    const [showError, setShowError] = useState(!!flash?.error);

    const [startDate, setStartDate] = useState<Date | null>(filters.date_start ? parseDateFromYMD(filters.date_start) : null);
    const [endDate, setEndDate] = useState<Date | null>(filters.date_end ? parseDateFromYMD(filters.date_end) : null);

    /* -------------------------- Flash auto-dismiss ------------------------ */
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

    /* ------------------------- Inertia helpers --------------------------- */
    const buildQueryPayload = (filtersList: ProductFilterType[], extra: Record<string, any> = {}) => {
        const payload: Record<string, any> = { ...extra };
        filtersList.forEach((filter) => {
            switch (filter.field) {
                case 'search': {
                    const terms = filtersList
                        .filter((f) => f.field === 'search')
                        .map((f) => f.value)
                        .join(' ');
                    if (terms) payload.search = terms;
                    break;
                }
                case 'name':
                    payload.name = filter.value;
                    break;
                case 'category':
                    payload.category = filter.value;
                    break;
                case 'status':
                    payload.status = filter.value;
                    break;
                case 'price': {
                    const op =
                        filter.operator && ['equals', 'gt', 'gte', 'lt', 'lte', 'between'].includes(filter.operator) ? filter.operator : 'equals';

                    if (op === 'between' && filter.value2) {
                        payload.price_min = filter.value;
                        payload.price_max = filter.value2;
                        payload.price_operator = 'between';
                    } else {
                        payload.price = filter.value;
                        payload.price_operator = op;
                    }
                    break;
                }
                case 'stock': {
                    const op =
                        filter.operator && ['equals', 'gt', 'gte', 'lt', 'lte', 'between'].includes(filter.operator) ? filter.operator : 'equals';

                    if (op === 'between' && filter.value2) {
                        payload.stock_min = filter.value;
                        payload.stock_max = filter.value2;
                        payload.stock_operator = 'between';
                    } else {
                        payload.stock = filter.value;
                        payload.stock_operator = op;
                    }
                    break;
                }
                case 'date':
                    if (filter.operator === 'date_range' && filter.value2) {
                        payload.date_start = filter.value;
                        payload.date_end = filter.value2;
                    }
                    break;
            }
        });
        return payload;
    };

    const go = (filtersList: ProductFilterType[], extra: Record<string, any> = {}) => {
        const payload = buildQueryPayload(filtersList, extra);
        const base = route('products.index');
        const qs = toQueryString(payload);
        const url = qs ? `${base}?${qs}` : base;
        router.get(url); // 1 seul argument => compatible
    };

    /* --------------------------- Filters CRUD ---------------------------- */
    const addFilter = () => {
        if (currentFilterField === 'date') {
            if (startDate && endDate) {
                const newFilter: ProductFilterType = {
                    field: 'date',
                    value: formatDateToYMD(startDate),
                    value2: formatDateToYMD(endDate),
                    operator: 'date_range',
                };
                const next = [...activeFilters.filter((f) => f.field !== 'date'), newFilter];
                setActiveFilters(next);
                go(next, { page: 1, per_page: products.per_page, sort, dir });
            }
            return;
        }

        if (currentFilterOperator === 'between') {
            if (currentFilterValue !== '' && currentFilterValue2 !== '') {
                const newFilter: ProductFilterType = {
                    field: currentFilterField,
                    value: currentFilterValue,
                    value2: currentFilterValue2,
                    operator: 'between',
                };
                const next = [...activeFilters.filter((f) => f.field !== currentFilterField), newFilter];
                setActiveFilters(next);
                setCurrentFilterValue('');
                setCurrentFilterValue2('');
                go(next, { page: 1, per_page: products.per_page, sort, dir });
            }
            return;
        }

        if (currentFilterValue !== '') {
            const newFilter: ProductFilterType = {
                field: currentFilterField,
                value: currentFilterValue,
                operator: currentFilterOperator,
            };
            const next = [...activeFilters.filter((f) => f.field !== currentFilterField), newFilter];
            setActiveFilters(next);
            setCurrentFilterValue('');
            go(next, { page: 1, per_page: products.per_page, sort, dir });
        }
    };

    const removeFilter = (idx: number) => {
        const f = activeFilters[idx];
        if (f.field === 'date') {
            setStartDate(null);
            setEndDate(null);
        }
        const next = activeFilters.filter((_, i) => i !== idx);
        setActiveFilters(next);
        go(next, { page: 1, per_page: products.per_page, sort, dir });
    };

    const resetFilters = () => {
        setActiveFilters([]);
        setStartDate(null);
        setEndDate(null);
        setCurrentFilterValue('');
        setCurrentFilterValue2('');
        const base = route('products.index');
        const qs = toQueryString({ page: 1, per_page: products.per_page });
        router.get(`${base}?${qs}`);
    };

    /* ----------------------- Pagination & Tri --------------------------- */
    const changePage = (p: number) => go(activeFilters, { page: p, per_page: products.per_page, sort, dir });
    const changePer = (n: number) => go(activeFilters, { page: 1, per_page: n, sort, dir });
    const changeSort = (field: 'name' | 'status' | 'created_at' | 'price' | 'stock_quantity') => {
        const newDir = sort === field ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
        go(activeFilters, { page: 1, per_page: products.per_page, sort: field, dir: newDir });
    };

    /* ---------------------------- Selection ----------------------------- */
    const toggleSelect = (id: string) => setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
    const toggleSelectAll = () => {
        const ids = products.data.map((p) => p.id);
        setSelectedIds((p) => (p.length === ids.length ? [] : ids));
    };

    const anyInactive = selectedIds.some((id) => Number((products.data.find((p) => p.id === id) as any)?.is_active) === 0);
    const anyActive = selectedIds.some((id) => Number((products.data.find((p) => p.id === id) as any)?.is_active) === 1);

    /* ---------------------- Bulk actions (gated) ---------------------- */
    const activateSelected = () => {
        if (!canToggle || !selectedIds.length) return;
        if (!confirm(`Activer ${selectedIds.length} produit(s) ?`)) return;

        selectedIds.forEach((id) => {
            const p = products.data.find((x) => x.id === id) as any;
            if (Number(p?.is_active) === 0) {
                router.patch(route('products.toggle-status', { product: id }), {}, { preserveScroll: true, preserveState: true });
            }
        });

        setSelectedIds([]);
    };

    const deactivateSelected = () => {
        if (!canToggle || !selectedIds.length) return;
        if (!confirm(`Désactiver ${selectedIds.length} produit(s) ?`)) return;

        selectedIds.forEach((id) => {
            const p = products.data.find((x) => x.id === id) as any;
            if (Number(p?.is_active) === 1) {
                router.patch(route('products.toggle-status', { product: id }), {}, { preserveScroll: true, preserveState: true });
            }
        });

        setSelectedIds([]);
    };

    const deleteSelected = () => {
        if (!canDelete || !selectedIds.length) return;
        if (!confirm(`Supprimer ${selectedIds.length} produit(s) ?`)) return;
        selectedIds.forEach((id) => {
            router.delete(route('products.destroy', { product: id }));
        });
        setSelectedIds([]);
    };

    /* -------------------- Pagination window -------------------- */
    const windowPages = useMemo<(number | '…')[]>(() => {
        const pages: (number | '…')[] = [];
        const MAX = 5;
        const c = products.current_page;
        const l = products.last_page;

        if (l <= MAX + 2) {
            for (let i = 1; i <= l; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        let start = Math.max(2, c - Math.floor(MAX / 2));
        let end = start + MAX - 1;
        if (end >= l) {
            end = l - 1;
            start = end - MAX + 1;
        }
        if (start > 2) pages.push('…');
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < l - 1) pages.push('…');
        pages.push(l);
        return pages;
    }, [products.current_page, products.last_page]);

    /* ----------------------------- RENDER ----------------------------- */
    return (
        <>
            <Head title="Produits" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Produits', href: '/products' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />
                    <div className="relative z-10 w-full px-4 py-6">
                        {/* Flash */}
                        {flash?.success && showSuccess && (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="flex-1 font-medium">{flash.success}</span>
                                <button onClick={() => setShowSuccess(false)}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {flash?.error && showError && (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <span className="flex-1 font-medium">{flash.error}</span>
                                <button onClick={() => setShowError(false)}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* ------------------------ TITLE ------------------------ */}
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des produits</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Catalogue, prix, stock et statut des produits</p>
                            </div>
                        </div>

                        {/* Outils + filtres */}
                        <div className="relative z-50 mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                {/* Bloc filtres */}
                                <div className="flex w-full flex-col gap-4 lg:w-auto">
                                    <div className="flex items-center gap-3">
                                        <Button onClick={() => setShowFilterPanel(!showFilterPanel)}>
                                            <Filter className="h-4 w-4" />
                                            {showFilterPanel ? 'Masquer les filtres' : 'Afficher les filtres'}
                                        </Button>

                                        {activeFilters.length > 0 && (
                                            <Button variant="outline" onClick={resetFilters} className="gap-1.5">
                                                <X className="h-4 w-4" /> Effacer
                                            </Button>
                                        )}

                                        {showSelectCol && selectedIds.length > 0 && (
                                            <>
                                                {anyInactive && canToggle && (
                                                    <Button variant="secondary" onClick={activateSelected}>
                                                        <RotateCcw className="mr-1 h-4 w-4" /> Activer ({selectedIds.length})
                                                    </Button>
                                                )}
                                                {anyActive && canToggle && (
                                                    <Button variant="secondary" onClick={deactivateSelected}>
                                                        <Power className="mr-1 h-4 w-4" /> Désactiver ({selectedIds.length})
                                                    </Button>
                                                )}
                                                {anyActive && canDelete && (
                                                    <Button variant="destructive" onClick={deleteSelected}>
                                                        <Trash2 className="mr-1 h-4 w-4" /> Supprimer ({selectedIds.length})
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {showFilterPanel && (
                                        <div className="relative z-[60] w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-2xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les produits
                                            </h3>

                                            {/* Sélection du type de filtre */}
                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <select
                                                    value={currentFilterField}
                                                    onChange={(e) => {
                                                        const field = e.target.value as ProductFilterType['field'];
                                                        setCurrentFilterField(field);

                                                        // Reset des valeurs à chaque changement de champ pour éviter des incohérences
                                                        setCurrentFilterValue('');
                                                        setCurrentFilterValue2('');
                                                        setStartDate(null);
                                                        setEndDate(null);

                                                        // Opérateur par défaut selon le type de filtre
                                                        if (field === 'price' || field === 'stock') {
                                                            setCurrentFilterOperator('equals');
                                                        } else if (field === 'date') {
                                                            setCurrentFilterOperator('date_range');
                                                        } else if (field === 'status') {
                                                            setCurrentFilterOperator('equals');
                                                        } else if (field === 'category') {
                                                            setCurrentFilterOperator('equals');
                                                        } else {
                                                            setCurrentFilterOperator('contains');
                                                        }
                                                    }}
                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                >
                                                    <option value="search">Recherche globale</option>
                                                    <option value="name">Nom</option>
                                                    <option value="category">Catégorie</option>
                                                    <option value="price">Prix</option>
                                                    <option value="stock">Stock</option>
                                                    <option value="status">Statut</option>
                                                    <option value="date">Date de création</option>
                                                </select>

                                                {(currentFilterField === 'price' || currentFilterField === 'stock') && (
                                                    <select
                                                        value={currentFilterOperator}
                                                        onChange={(e) => setCurrentFilterOperator(e.target.value as ProductFilterType['operator'])}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="equals">Égal à</option>
                                                        <option value="gt">Supérieur à</option>
                                                        <option value="gte">Supérieur ou égal à</option>
                                                        <option value="lt">Inférieur à</option>
                                                        <option value="lte">Inférieur ou égal à</option>
                                                        <option value="between">Entre</option>
                                                    </select>
                                                )}
                                            </div>

                                            {/* Saisie des valeurs */}
                                            <div className="mb-3">
                                                {currentFilterField === 'date' ? (
                                                    <div className="relative z-[70] flex flex-wrap items-center gap-3">
                                                        <div className="min-w-[180px] flex-1">
                                                            <ModernDatePicker
                                                                selected={startDate}
                                                                onChange={(date) => setStartDate(date)}
                                                                placeholder="Date de début"
                                                                selectsStart
                                                                startDate={startDate}
                                                                endDate={endDate}
                                                                className="relative z-[80] w-full"
                                                            />
                                                        </div>
                                                        <span className="font-medium text-slate-500 dark:text-slate-400">à</span>
                                                        <div className="min-w-[180px] flex-1">
                                                            <ModernDatePicker
                                                                selected={endDate}
                                                                onChange={(date) => setEndDate(date)}
                                                                placeholder="Date de fin"
                                                                selectsEnd
                                                                startDate={startDate}
                                                                endDate={endDate}
                                                                minDate={startDate || undefined}
                                                                className="relative z-[80] w-full"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : currentFilterField === 'status' ? (
                                                    <select
                                                        value={currentFilterValue}
                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Sélectionner un statut</option>
                                                        <option value="actif">Actif</option>
                                                        <option value="inactif">Inactif</option>
                                                    </select>
                                                ) : currentFilterField === 'category' ? (
                                                    <select
                                                        value={currentFilterValue}
                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Sélectionner une catégorie</option>
                                                        {(categories || []).map((c) => (
                                                            <option key={String(c.id)} value={String(c.id)}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : currentFilterOperator === 'between' ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type={
                                                                currentFilterField === 'price' || currentFilterField === 'stock' ? 'number' : 'text'
                                                            }
                                                            step={currentFilterField === 'price' ? '0.01' : '1'}
                                                            min="0"
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            placeholder="Valeur minimale"
                                                            className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                        <span className="text-slate-500 dark:text-slate-400">à</span>
                                                        <input
                                                            type={
                                                                currentFilterField === 'price' || currentFilterField === 'stock' ? 'number' : 'text'
                                                            }
                                                            step={currentFilterField === 'price' ? '0.01' : '1'}
                                                            min="0"
                                                            value={currentFilterValue2}
                                                            onChange={(e) => setCurrentFilterValue2(e.target.value)}
                                                            placeholder="Valeur maximale"
                                                            className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                        <input
                                                            type={
                                                                currentFilterField === 'price' || currentFilterField === 'stock' ? 'number' : 'text'
                                                            }
                                                            step={currentFilterField === 'price' ? '0.01' : '1'}
                                                            min={currentFilterField === 'price' || currentFilterField === 'stock' ? 0 : undefined}
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                                                            placeholder={`Filtrer par ${
                                                                (
                                                                    {
                                                                        search: 'Recherche globale',
                                                                        name: 'Nom',
                                                                        category: 'Catégorie',
                                                                        price: 'Prix',
                                                                        stock: 'Stock',
                                                                        status: 'Statut',
                                                                        date: 'Date de création',
                                                                    } as Record<string, string>
                                                                )[currentFilterField]
                                                            }`.toLowerCase()}
                                                            className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                onClick={addFilter}
                                                disabled={
                                                    currentFilterField === 'date'
                                                        ? !startDate || !endDate
                                                        : currentFilterOperator === 'between'
                                                          ? !currentFilterValue || !currentFilterValue2
                                                          : !currentFilterValue
                                                }
                                                className="w-full"
                                            >
                                                Ajouter le filtre
                                            </Button>
                                        </div>
                                    )}

                                    {activeFilters.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {activeFilters.map((f, i) => (
                                                <span
                                                    key={`${f.field}-${f.value}-${i}`}
                                                    className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                                >
                                                    <span className="font-medium">
                                                        {
                                                            (
                                                                {
                                                                    search: 'Recherche globale',
                                                                    name: 'Nom',
                                                                    category: 'Catégorie',
                                                                    price: 'Prix',
                                                                    stock: 'Stock',
                                                                    status: 'Statut',
                                                                    date: 'Date de création',
                                                                } as Record<string, string>
                                                            )[f.field]
                                                        }
                                                    </span>
                                                    <span className="text-xs opacity-75">
                                                        (
                                                        {
                                                            (
                                                                {
                                                                    contains: 'Contient',
                                                                    equals: 'Égal à',
                                                                    gt: 'Supérieur à',
                                                                    gte: 'Supérieur ou égal à',
                                                                    lt: 'Inférieur à',
                                                                    lte: 'Inférieur ou égal à',
                                                                    between: 'Entre',
                                                                    date_range: 'Intervalle',
                                                                } as Record<string, string>
                                                            )[f.operator || 'contains']
                                                        }
                                                        )
                                                    </span>
                                                    :{' '}
                                                    <span>
                                                        {f.operator === 'between' && f.value2
                                                            ? `${f.value} - ${f.value2}`
                                                            : f.operator === 'date_range' && f.value2
                                                              ? `${parseDateFromYMD(f.value).toLocaleDateString('fr-FR')} - ${parseDateFromYMD(f.value2).toLocaleDateString('fr-FR')}`
                                                              : f.field === 'category'
                                                                ? (categories.find((c) => String(c.id) === String(f.value))?.name ?? f.value)
                                                                : f.value}
                                                    </span>
                                                    <button onClick={() => removeFilter(i)}>
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
                                            value={products.per_page}
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

                                    {canCreate && (
                                        <Link href={route('products.create')}>
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" /> Ajouter un produit
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="relative z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                    <tr>
                                        {showSelectCol && (
                                            <th className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={products.data.length > 0 && selectedIds.length === products.data.length}
                                                    onChange={() => toggleSelectAll()}
                                                    className="rounded border-slate-300 text-red-600"
                                                />
                                            </th>
                                        )}
                                        <th className="cursor-pointer px-4 py-3" onClick={() => changeSort('name')}>
                                            <div className="flex items-center gap-1">
                                                <Package className="h-4 w-4" />
                                                Nom {sort === 'name' && (dir === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4" />
                                                Catégorie
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4" />
                                                État
                                            </div>
                                        </th>
                                        <th className="cursor-pointer px-6 py-4" onClick={() => changeSort('price')}>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Prix {sort === 'price' && (dir === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        <th className="cursor-pointer px-6 py-4 text-center" onClick={() => changeSort('stock_quantity')}>
                                            <div className="flex items-center justify-center gap-2">
                                                <Archive className="h-4 w-4" />
                                                Stock {sort === 'stock_quantity' && (dir === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                Statut
                                            </div>
                                        </th>
                                        <th className="cursor-pointer px-6 py-4 text-center" onClick={() => changeSort('created_at')}>
                                            <div className="flex items-center justify-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Créé {sort === 'created_at' && (dir === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        {showActionsCol && (
                                            <th className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    Actions
                                                </div>
                                            </th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {products.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7 + (showSelectCol ? 1 : 0) + (showActionsCol ? 1 : 0)}
                                                className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                Aucun produit trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.data.map((p) => {
                                            const isActive = Number((p as any).is_active) === 1;
                                            const isTrashed = Boolean(p.deleted_at);
                                            const condition = String((p as any).condition ?? 'new');
                                            const conditionLabel =
                                                condition === 'new'
                                                    ? 'Neuf'
                                                    : condition === 'refurbished'
                                                      ? 'Reconditionné'
                                                      : condition === 'refurbished_premium'
                                                        ? 'Reconditionné Premium'
                                                        : condition;

                                            const rowCanToggle = !isTrashed && canToggle;
                                            const rowCanShow = canShow;
                                            const rowCanEdit = !isTrashed && canEdit;
                                            const rowCanDelete = !isTrashed && canDelete;
                                            const rowCanRestore = isTrashed && canRestore;
                                            return (
                                                <tr
                                                    key={p.id}
                                                    className={`${isTrashed ? 'bg-red-50/60 dark:bg-red-950/20' : ''} transition-colors hover:bg-slate-50 dark:hover:bg-slate-800`}
                                                >
                                                    {showSelectCol && (
                                                        <td className="px-4 py-3 text-center">
                                                            {(p.deleted_at ? canRestore : canToggle || canDelete) ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedIds.includes(p.id)}
                                                                    onChange={() => toggleSelect(p.id)}
                                                                    className="rounded border-slate-300 text-red-600"
                                                                />
                                                            ) : (
                                                                <input type="checkbox" disabled className="rounded border-slate-300 text-slate-300" />
                                                            )}
                                                        </td>
                                                    )}

                                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{p.category?.name}</td>
                                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{conditionLabel}</td>
                                                    <td className="px-4 py-3">
                                                        {p.price} {p.currency?.symbol}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">{p.stock_quantity}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {isTrashed ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                Supprimé
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (!rowCanToggle) return;
                                                                    router.patch(
                                                                        route('products.toggle-status', { product: p.id }),
                                                                        {},
                                                                        { preserveScroll: true, preserveState: true },
                                                                    );
                                                                }}
                                                                disabled={!rowCanToggle}
                                                                title={rowCanToggle ? 'Cliquer pour basculer le statut' : 'Permission requise'}
                                                                className="inline-flex"
                                                            >
                                                                {isActive ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                        Actif
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                        Inactif
                                                                    </span>
                                                                )}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {new Date(p.created_at).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        })}
                                                    </td>

                                                    {showActionsCol && (
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                {isTrashed ? (
                                                                    rowCanRestore && (
                                                                        <button
                                                                            onClick={() => {
                                                                                if (!confirm('Restaurer ce produit ?')) return;
                                                                                router.post(
                                                                                    route('products.restore', { id: p.id }),
                                                                                    {},
                                                                                    { preserveScroll: true, preserveState: true },
                                                                                );
                                                                            }}
                                                                            className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-800/30 dark:hover:text-emerald-300"
                                                                            aria-label="Restaurer"
                                                                            title="Restaurer"
                                                                        >
                                                                            <RotateCcw className="h-5 w-5" />
                                                                        </button>
                                                                    )
                                                                ) : (
                                                                    <>
                                                                        {rowCanShow && (
                                                                            <Link
                                                                                href={route('products.show', p.id)}
                                                                                className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-500 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                                aria-label="Voir"
                                                                                title="Voir"
                                                                            >
                                                                                <Eye className="h-5 w-5" />
                                                                            </Link>
                                                                        )}

                                                                        {rowCanEdit && (
                                                                            <Link
                                                                                href={route('products.edit', p.id)}
                                                                                className="rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-800/30 dark:hover:text-yellow-300"
                                                                                aria-label="Éditer"
                                                                                title="Éditer"
                                                                            >
                                                                                <Pencil className="h-5 w-5" />
                                                                            </Link>
                                                                        )}

                                                                        {rowCanDelete && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (!confirm('Supprimer ce produit ?')) return;
                                                                                    router.delete(route('products.destroy', { product: p.id }), {
                                                                                        preserveScroll: true,
                                                                                        preserveState: true,
                                                                                    });
                                                                                }}
                                                                                className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-500 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300"
                                                                                aria-label="Supprimer"
                                                                                title="Supprimer"
                                                                            >
                                                                                <Trash2 className="h-5 w-5" />
                                                                            </button>
                                                                        )}
                                                                    </>
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

                        {/* Pagination */}
                        <div className="mt-4 flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 shadow-xl backdrop-blur-md sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <span>
                                Affichage de {products.from} à {products.to} sur {products.total} résultats
                            </span>

                            {products.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={products.current_page === 1}
                                        onClick={() => changePage(1)}
                                        aria-label="Première page"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={products.current_page === 1}
                                        onClick={() => changePage(products.current_page - 1)}
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
                                                variant={p === products.current_page ? 'default' : 'outline'}
                                                onClick={() => changePage(p as number)}
                                            >
                                                {p}
                                            </Button>
                                        ),
                                    )}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={products.current_page === products.last_page}
                                        onClick={() => changePage(products.current_page + 1)}
                                        aria-label="Page suivante"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={products.current_page === products.last_page}
                                        onClick={() => changePage(products.last_page)}
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
