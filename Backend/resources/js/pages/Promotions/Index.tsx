import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Filter,
    MoreHorizontal,
    Pencil,
    Percent as PercentIcon,
    Plus,
    Power,
    Search,
    Shield,
    SlidersHorizontal,
    Tag,
    Trash2,
    X,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */
type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
};

type PromotionRow = {
    id: number;
    name: string;
    description?: string | null;
    type: 'order' | 'category' | 'product' | 'bogo';
    apply_scope: 'order' | 'category' | 'product';
    is_active: boolean;
    is_exclusive: boolean;
    priority: number;
    starts_at?: string | null;
    ends_at?: string | null;
    // ⬇️ backend renvoie souvent decimal en string (ou null) → on l’autorise
    actions?: { id: number; action_type: 'percent' | 'fixed'; value: number | string | null }[];
    codes?: { id: number; code: string }[];
    deleted_at?: string | null;
};

type Filters = {
    search?: string;
    name?: string;
    discount?: string;
    type?: '' | 'order' | 'category' | 'product' | 'bogo';
    active?: '' | '1' | '0';
};

type PromotionFilterField = 'search' | 'name' | 'discount' | 'type' | 'active';

type PromotionFilterType = {
    field: PromotionFilterField;
    value: string;
    operator: 'contains' | 'equals';
};

type Flash = { success?: string; error?: string };

type Props = {
    promotions: Pagination<PromotionRow>;
    filters: Filters;
    flash?: Flash;
};

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

export default function PromotionsIndex({ promotions: raw, filters, flash }: Props) {
    const { can } = useCan();

    /* ----------------------- Pagination safe destructuring ---------------------- */
    const { data: rows = [], current_page = 1, last_page = 1, from = 0, to = 0, total = 0, per_page = 15 } = raw ?? { data: [] };

    /* ------------------------------ UI STATE ----------------------------------- */
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<PromotionFilterField>('search');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [activeFilters, setActiveFilters] = useState<PromotionFilterType[]>(() => {
        const arr: PromotionFilterType[] = [];
        if (filters.search) arr.push({ field: 'search', value: filters.search, operator: 'contains' });
        if (filters.name) arr.push({ field: 'name', value: filters.name, operator: 'contains' });
        if (filters.discount) arr.push({ field: 'discount', value: filters.discount, operator: 'equals' });
        if (filters.type) arr.push({ field: 'type', value: filters.type, operator: 'equals' });
        if (filters.active) arr.push({ field: 'active', value: filters.active, operator: 'equals' });
        return arr;
    });
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

    /* ------------------------------ Helpers ------------------------------------ */
    const buildQueryPayload = (filtersList: PromotionFilterType[], extra: Record<string, any> = {}) => {
        const payload: Record<string, any> = { ...extra };

        for (const filter of filtersList) {
            if (!filter.value) continue;
            if (filter.field === 'search') payload.search = filter.value;
            if (filter.field === 'name') payload.name = filter.value;
            if (filter.field === 'discount') payload.discount = filter.value;
            if (filter.field === 'type') payload.type = filter.value;
            if (filter.field === 'active') payload.active = filter.value;
        }

        if (payload.per_page == null) payload.per_page = per_page;
        return payload;
    };

    const go = (filtersList: PromotionFilterType[], extra: Record<string, any> = {}) => {
        const payload = buildQueryPayload(filtersList, extra);
        router.get(route('promotions.index'), payload, { preserveScroll: true, preserveState: true });
    };

    const addFilter = () => {
        if (!currentFilterValue) return;

        const operator: PromotionFilterType['operator'] = currentFilterField === 'search' || currentFilterField === 'name' ? 'contains' : 'equals';

        const next: PromotionFilterType[] = [
            ...activeFilters.filter((f) => f.field !== currentFilterField),
            { field: currentFilterField, value: currentFilterValue, operator },
        ];
        setActiveFilters(next);
        setCurrentFilterValue('');
        go(next, { page: 1, per_page });
    };

    const removeFilter = (idx: number) => {
        const next = activeFilters.filter((_, i) => i !== idx);
        setActiveFilters(next);
        go(next, { page: 1, per_page });
    };

    const resetFilters = () => {
        setActiveFilters([]);
        setCurrentFilterValue('');
        router.get(route('promotions.index'), { page: 1, per_page: per_page || 15 }, { preserveScroll: true, preserveState: true });
    };

    const changePage = (p: number) => go(activeFilters, { page: p, per_page });
    const changePer = (n: number) => go(activeFilters, { page: 1, per_page: n });

    const windowPages = useMemo<(number | '…')[]>(() => {
        const pages: (number | '…')[] = [];
        const MAX = 5;
        const c = current_page;
        const l = last_page;

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
    }, [current_page, last_page]);

    /* --------------------------------- CRUD ------------------------------------ */
    const toggleStatus = (row: PromotionRow) => {
        const next = !row.is_active;
        // ⬇️ la route accepte PATCH (web.php), pas PUT
        router.patch(
            route('promotions.update', row.id),
            { is_active: next },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(next ? 'Promotion activée' : 'Promotion désactivée'),
                onError: () => toast.error('Impossible de mettre à jour'),
            },
        );
    };

    const destroyOne = (row: PromotionRow) => {
        if (!can('promotion_delete')) return alert('Permission manquante: promotion_delete');
        if (!confirm(`Supprimer la promotion « ${row.name} » ?`)) return;
        router.delete(route('promotions.destroy', { promotion: row.id }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Promotion supprimée');
            },
            onError: () => {
                toast.error('Suppression impossible');
            },
        });
    };

    /* ------------------------ Utility functions --------------------------- */
    const fmtAction = (row: PromotionRow) => {
        const a = row.actions?.[0];
        if (!a || a.value == null) return '—';
        const v = Number(a.value);
        if (!Number.isFinite(v)) return '—';
        return a.action_type === 'percent' ? `${v}%` : `${v} MAD`;
    };

    const fmtPeriod = (row: PromotionRow) => {
        const from = row.starts_at ? new Date(row.starts_at).toLocaleString('fr-FR') : 'dès maintenant';
        const to = row.ends_at ? ` au ${new Date(row.ends_at).toLocaleString('fr-FR')}` : '';
        return `${from}${to}`;
    };

    const canCreate = can('promotion_create');
    const canEdit = can('promotion_edit');
    const canDelete = can('promotion_delete');
    const canShow = can('promotion_show');

    const filterOptions: Array<{ value: PromotionFilterField; label: string }> = [
        { value: 'search', label: 'Recherche' },
        { value: 'name', label: 'Nom' },
        { value: 'discount', label: 'Remise' },
        { value: 'type', label: 'Type' },
        { value: 'active', label: 'Statut' },
    ];

    const getOperatorLabel = (op: PromotionFilterType['operator']) => (op === 'contains' ? 'Contient' : 'Égal à');

    const getFilterDisplayValue = (f: PromotionFilterType) => {
        if (f.field === 'type') {
            const map: Record<string, string> = {
                order: 'Commande',
                category: 'Catégorie',
                product: 'Produit',
                bogo: 'BOGO',
            };
            return map[f.value] ?? f.value;
        }
        if (f.field === 'active') return f.value === '1' ? 'Actives' : f.value === '0' ? 'Inactives' : f.value;
        return f.value;
    };

    /* -------------------------------------------------------------------- */
    /*                                 RENDER                               */
    /* -------------------------------------------------------------------- */
    return (
        <>
            <Head title="Promotions" />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Promotions', href: '/promotions' }, // ⬅️ breadcrumb public
                ]}
            >
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

                        {/* -------------------------------- Header -------------------------------- */}
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des promotions</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Gérez vos remises, codes promotionnels et fenêtres de validité
                                </p>
                            </div>
                        </div>

                        {/* -------------------------------- Tools --------------------------------- */}
                        <div className="relative z-50 mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                {/* Bloc gauche : filtres */}
                                <div className="flex w-full flex-col gap-4 lg:w-auto">
                                    <div className="flex items-center gap-3">
                                        <Button onClick={() => setShowFilterPanel((v) => !v)}>
                                            <Filter className="h-4 w-4" />
                                            {showFilterPanel ? 'Masquer les filtres' : 'Afficher les filtres'}
                                        </Button>

                                        {activeFilters.length > 0 && (
                                            <Button variant="outline" onClick={resetFilters} className="gap-1.5">
                                                <X className="h-4 w-4" /> Effacer filtres
                                            </Button>
                                        )}
                                    </div>

                                    {showFilterPanel && (
                                        <div className="relative z-[60] w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-2xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les promotions
                                            </h3>

                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <select
                                                    value={currentFilterField}
                                                    onChange={(e) => {
                                                        setCurrentFilterField(e.target.value as PromotionFilterField);
                                                        setCurrentFilterValue('');
                                                    }}
                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                >
                                                    {filterOptions.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-3">
                                                {currentFilterField === 'type' ? (
                                                    <select
                                                        value={currentFilterValue}
                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Sélectionner un type</option>
                                                        <option value="order">Commande</option>
                                                        <option value="category">Catégorie</option>
                                                        <option value="product">Produit</option>
                                                        <option value="bogo">BOGO</option>
                                                    </select>
                                                ) : currentFilterField === 'active' ? (
                                                    <select
                                                        value={currentFilterValue}
                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Sélectionner un statut</option>
                                                        <option value="1">Actives</option>
                                                        <option value="0">Inactives</option>
                                                    </select>
                                                ) : currentFilterField === 'discount' ? (
                                                    <div className="relative">
                                                        <PercentIcon className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                                                            placeholder="Remise (ex: 10 ou 10.5)"
                                                            className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                                                            placeholder={
                                                                currentFilterField === 'name' ? 'Nom de la promotion…' : 'Rechercher par nom, code…'
                                                            }
                                                            className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <Button onClick={addFilter} disabled={!currentFilterValue} className="w-full">
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
                                                    <span className="font-medium">{filterOptions.find((o) => o.value === f.field)?.label}</span>
                                                    <span className="text-xs opacity-75">({getOperatorLabel(f.operator)})</span>:
                                                    <span>{getFilterDisplayValue(f)}</span>
                                                    <button onClick={() => removeFilter(i)} type="button">
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bloc droit : rows per page + bouton ajouter */}
                                <div className="ml-auto flex items-center gap-3">
                                    <div className="relative min-w-[220px]">
                                        <select
                                            value={per_page}
                                            onChange={(e) => changePer(Number(e.target.value))}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            {[5, 10, 15, 25, 50].map((n) => (
                                                <option key={n} value={n}>
                                                    {n} lignes par page
                                                </option>
                                            ))}
                                            <option value={-1}>Tous</option>
                                        </select>
                                        {/* caret visuel */}
                                        <svg
                                            className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                                        </svg>
                                    </div>

                                    {canCreate && (
                                        <Link href={route('promotions.create')}>
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" />
                                                Nouvelle promotion
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* -------------------------------- Table --------------------------------- */}
                        <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Tag className="h-4 w-4" />
                                                Nom
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Shield className="h-4 w-4" />
                                                Type / Portée
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <PercentIcon className="h-4 w-4" />
                                                Remise
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <MoreHorizontal className="h-4 w-4" />
                                                Priorité
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Période
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Power className="h-4 w-4" />
                                                Statut
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <MoreHorizontal className="h-4 w-4" />
                                                Actions
                                            </div>
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                                Aucune promotion trouvée
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => {
                                            const code = row.codes?.[0]?.code;
                                            return (
                                                <tr key={row.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                                                    {/* Nom + desc */}
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
                                                        {row.description && (
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">{row.description}</div>
                                                        )}
                                                    </td>

                                                    {/* Type / portée */}
                                                    <td className="px-6 py-4">
                                                        <Badge variant="secondary">{row.type}</Badge>
                                                        <span className="ml-2 text-xs text-slate-500">scope: {row.apply_scope}</span>
                                                    </td>

                                                    {/* Remise */}
                                                    <td className="px-6 py-4">
                                                        <span className="font-medium">{fmtAction(row)}</span>
                                                    </td>

                                                    {/* Priorité */}
                                                    <td className="px-6 py-4 text-center">{row.priority}</td>

                                                    {/* Période */}
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs">{fmtPeriod(row)}</div>
                                                    </td>

                                                    {/* Code */}
                                                    <td className="px-6 py-4">{code ?? <span className="text-slate-400">—</span>}</td>

                                                    {/* Statut (badge cliquable) */}
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => canEdit && toggleStatus(row)}
                                                            className="inline-flex items-center justify-center"
                                                            title={row.is_active ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                                                            aria-label={row.is_active ? 'Désactiver la promotion' : 'Activer la promotion'}
                                                            disabled={!canEdit}
                                                        >
                                                            {row.is_active ? (
                                                                <Badge className="cursor-pointer bg-green-100 text-green-800 hover:opacity-90 disabled:opacity-60 dark:bg-green-900 dark:text-green-200">
                                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                                    Active
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="cursor-pointer bg-slate-100 text-slate-800 hover:opacity-90 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200">
                                                                    Inactive
                                                                </Badge>
                                                            )}
                                                        </button>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            {canShow && (
                                                                <Link
                                                                    href={route('promotions.show', row.id)}
                                                                    className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                    aria-label="Voir"
                                                                >
                                                                    <Eye className="h-5 w-5" />
                                                                </Link>
                                                            )}
                                                            {canEdit && (
                                                                <Link
                                                                    href={route('promotions.edit', row.id)}
                                                                    className="rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800/30 dark:hover:text-yellow-300"
                                                                    aria-label="Modifier"
                                                                >
                                                                    <Pencil className="h-5 w-5" />
                                                                </Link>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => destroyOne(row)}
                                                                    className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300"
                                                                    aria-label="Supprimer"
                                                                    type="button"
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ------------------------------ Pagination ------------------------------ */}
                        <div className="mt-4 flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 shadow-xl backdrop-blur-md sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <span>
                                Affichage de {from} à {to} sur {total} promotions
                            </span>

                            {last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="outline" disabled={current_page === 1} onClick={() => changePage(1)}>
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={current_page === 1} onClick={() => changePage(current_page - 1)}>
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
                                                variant={p === current_page ? 'default' : 'outline'}
                                                onClick={() => changePage(p as number)}
                                            >
                                                {p}
                                            </Button>
                                        ),
                                    )}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={current_page === last_page}
                                        onClick={() => changePage(current_page + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={current_page === last_page} onClick={() => changePage(last_page)}>
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
