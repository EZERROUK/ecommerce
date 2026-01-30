import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import {
    AlertTriangle,
    Building2,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Copy,
    DollarSign,
    Download,
    Eye,
    FileText,
    Filter,
    MoreHorizontal,
    Package,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';

import { PageProps, Pagination } from '@/types';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */
interface Quote {
    id: number;
    quote_number: string;
    status: string;
    quote_date: string;
    valid_until: string;
    subtotal_ht: number;
    total_tax: number;
    total_ttc: number;
    currency: {
        code: string;
        symbol: string;
    };
    client: {
        id: number;
        company_name: string;
        contact_name?: string;
    };
    user: {
        name: string;
    };
    items_count: number;
    deleted_at?: string;
    created_at: string;
}

interface Client {
    id: number;
    company_name: string;
}

interface Flash {
    success?: string;
    error?: string;
}

interface Props
    extends PageProps<{
        quotes: Pagination<Quote>;
        clients: Client[];
        filters: {
            search?: string;
            quote_number?: string;
            status?: string;
            client_id?: string;
            total_ttc?: string;
            total_ttc_min?: string;
            total_ttc_max?: string;
        };
        flash?: Flash;
    }> {}

type QuoteFilterField = 'search' | 'quote_number' | 'status' | 'client_id' | 'total_ttc';

type QuoteFilterType = {
    field: QuoteFilterField;
    value: string;
    value2?: string;
    operator: 'contains' | 'equals' | 'between';
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

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */
export default function QuotesIndex({ quotes: raw, clients, filters, flash }: Props) {
    const { can } = useCan();

    /* ----------------------- Pagination safe destructuring ---------------------- */
    const { data: rows = [], current_page = 1, last_page = 1, from = 0, to = 0, total = 0, per_page = 15 } = raw ?? { data: [] };

    /* ------------------------------ UI STATE ----------------------------------- */
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    const [currentFilterField, setCurrentFilterField] = useState<QuoteFilterField>('search');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [currentFilterValue2, setCurrentFilterValue2] = useState('');
    const [currentFilterOperator, setCurrentFilterOperator] = useState<QuoteFilterType['operator']>('contains');

    const [activeFilters, setActiveFilters] = useState<QuoteFilterType[]>(() => {
        const arr: QuoteFilterType[] = [];

        if (filters.search) arr.push({ field: 'search', value: filters.search, operator: 'contains' });
        if (filters.quote_number) arr.push({ field: 'quote_number', value: filters.quote_number, operator: 'contains' });
        if (filters.status) arr.push({ field: 'status', value: filters.status, operator: 'equals' });
        if (filters.client_id) arr.push({ field: 'client_id', value: filters.client_id, operator: 'equals' });
        if (filters.total_ttc) arr.push({ field: 'total_ttc', value: filters.total_ttc, operator: 'equals' });
        if (filters.total_ttc_min && filters.total_ttc_max) {
            arr.push({ field: 'total_ttc', value: filters.total_ttc_min, value2: filters.total_ttc_max, operator: 'between' });
        }

        return arr;
    });

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
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

    /* ------------------------- Inertia helpers --------------------------- */
    const inertiaOpts = {
        preserveScroll: true,
        preserveState: true,
        only: ['quotes', 'filters', 'clients', 'flash'],
    };

    const buildQueryPayload = (filtersList: QuoteFilterType[], extra: Record<string, any> = {}) => {
        const payload: Record<string, any> = { ...extra };

        filtersList.forEach((filter) => {
            switch (filter.field) {
                case 'search':
                    payload.search = filter.value;
                    break;
                case 'quote_number':
                    payload.quote_number = filter.value;
                    break;
                case 'status':
                    payload.status = filter.value;
                    break;
                case 'client_id':
                    payload.client_id = filter.value;
                    break;
                case 'total_ttc':
                    if (filter.operator === 'between' && filter.value2) {
                        payload.total_ttc_min = filter.value;
                        payload.total_ttc_max = filter.value2;
                    } else {
                        payload.total_ttc = filter.value;
                    }
                    break;
            }
        });

        if (payload.per_page == null) payload.per_page = per_page;
        return payload;
    };

    const go = (filtersList: QuoteFilterType[], extra: Record<string, any> = {}) => {
        const payload = buildQueryPayload(filtersList, extra);
        router.get(route('quotes.index'), payload, inertiaOpts);
    };

    const addFilter = () => {
        if (currentFilterField === 'total_ttc') {
            if (currentFilterOperator === 'between') {
                if (!currentFilterValue || !currentFilterValue2) return;
                const next: QuoteFilterType[] = [
                    ...activeFilters.filter((f) => f.field !== 'total_ttc'),
                    { field: 'total_ttc', value: currentFilterValue, value2: currentFilterValue2, operator: 'between' },
                ];
                setActiveFilters(next);
                setCurrentFilterValue('');
                setCurrentFilterValue2('');
                go(next, { page: 1, per_page });
                return;
            }

            if (!currentFilterValue) return;
            const next: QuoteFilterType[] = [
                ...activeFilters.filter((f) => f.field !== 'total_ttc'),
                { field: 'total_ttc', value: currentFilterValue, operator: 'equals' },
            ];
            setActiveFilters(next);
            setCurrentFilterValue('');
            setCurrentFilterValue2('');
            go(next, { page: 1, per_page });
            return;
        }

        if (!currentFilterValue) return;

        const operator: QuoteFilterType['operator'] =
            currentFilterField === 'search' || currentFilterField === 'quote_number' ? 'contains' : 'equals';

        const next: QuoteFilterType[] = [
            ...activeFilters.filter((f) => f.field !== currentFilterField),
            { field: currentFilterField, value: currentFilterValue, operator },
        ];

        setActiveFilters(next);
        setCurrentFilterValue('');
        setCurrentFilterValue2('');
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
        setCurrentFilterValue2('');
        setCurrentFilterOperator('contains');
        router.get(route('quotes.index'), { page: 1, per_page: per_page || 15 }, inertiaOpts);
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

    /* ------------------------------- CRUD -------------------------------- */
    const restoreOne = (id: number) => {
        if (!can('quote_restore')) return alert('Permission manquante: quote_restore');
        if (confirm('Restaurer ce devis ?')) router.post(route('quotes.restore', { id }), {}, { preserveScroll: true });
    };

    const deleteOne = (quote: Quote) => {
        if (!can('quote_delete')) return alert('Permission manquante: quote_delete');
        if (confirm(`Êtes-vous sûr de vouloir supprimer le devis « ${quote.quote_number} » ?`)) {
            router.delete(route('quotes.destroy', quote.id), {
                preserveScroll: true,
                onSuccess: () => toast.success('Devis supprimé avec succès'),
                onError: () => toast.error('Erreur lors de la suppression'),
            });
        }
    };

    const duplicateOne = (quote: Quote) => {
        if (!can('quote_create')) return alert('Permission manquante: quote_create');
        router.post(
            route('quotes.duplicate', quote.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Devis dupliqué avec succès'),
                onError: () => toast.error('Erreur lors de la duplication'),
            },
        );
    };

    const deleteSelected = () => {
        if (!can('quote_delete')) return alert('Permission manquante: quote_delete');
        if (!selectedIds.length) return;
        if (!confirm(`Supprimer ${selectedIds.length} devis ?`)) return;
        Promise.all(selectedIds.map((id) => router.delete(route('quotes.destroy', { id }), { preserveScroll: true }))).then(() => setSelectedIds([]));
    };

    const restoreSelected = () => {
        if (!can('quote_restore')) return alert('Permission manquante: quote_restore');
        if (!selectedIds.length) return;
        if (!confirm(`Restaurer ${selectedIds.length} devis ?`)) return;
        Promise.all(selectedIds.map((id) => router.post(route('quotes.restore', { id }), {}, { preserveScroll: true }))).then(() =>
            setSelectedIds([]),
        );
    };

    /* ------------------------ SELECTION HELPERS ------------------------ */
    const toggleSelect = (id: number) => {
        const quote = rows.find((q) => q.id === id);
        const isActive = !quote?.deleted_at;

        // on autorise la sélection seulement si l'action correspondante est permise
        if (isActive && !can('quote_delete')) return;
        if (!isActive && !can('quote_restore')) return;

        setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
    };

    const toggleSelectAll = () => {
        if (!rows.length) return;
        const first = rows[0];
        const firstActive = !first.deleted_at;

        const canBulkDelete = can('quote_delete');
        const canBulkRestore = can('quote_restore');

        if (selectedIds.length === rows.length) {
            setSelectedIds([]);
        } else {
            const ids = rows
                .filter((quote) => {
                    const active = !quote.deleted_at;
                    if (active && !canBulkDelete) return false;
                    if (!active && !canBulkRestore) return false;
                    return active === firstActive;
                })
                .map((q) => q.id);
            setSelectedIds(ids);
        }
    };

    const allSelected = rows.length > 0 && selectedIds.length === rows.length;
    const anyInactive = selectedIds.some((id) => !!rows.find((q) => q.id === id)?.deleted_at);
    const anyActive = selectedIds.some((id) => !rows.find((q) => q.id === id)?.deleted_at);

    /* -------------------------- UI Permissions -------------------------- */
    const canCreate = can('quote_create');
    const canBulkDelete = can('quote_delete');
    const canBulkRestore = can('quote_restore');

    // Montrer la colonne "Actions" seulement si au moins une action est possible
    const showActionsColumn = useMemo(() => {
        if (rows.length === 0) return false;
        return rows.some((quote) => {
            const isActive = !quote.deleted_at;
            const canShow = can('quote_show');
            const canEdit = can('quote_edit');
            const canDel = can('quote_delete') && isActive;
            const canRes = can('quote_restore') && !isActive;
            const canDup = can('quote_create');
            const canExport = can('quote_show'); // export = besoin de voir
            return canShow || canEdit || canDel || canRes || canDup || canExport;
        });
    }, [rows, can]);

    // Header checkbox visible seulement si une action bulk est permise sur au moins un élément
    const showCheckboxHeader = useMemo(() => {
        return rows.some((quote) => {
            const isActive = !quote.deleted_at;
            if (isActive && canBulkDelete) return true;
            if (!isActive && canBulkRestore) return true;
            return false;
        });
    }, [rows, canBulkDelete, canBulkRestore]);

    /* ------------------------ Utility functions --------------------------- */
    const getStatusBadge = (status: string) => {
        const variants = {
            draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
            sent: { label: 'Envoyé', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
            viewed: { label: 'Consulté', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
            accepted: { label: 'Accepté', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
            rejected: { label: 'Refusé', class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
            expired: { label: 'Expiré', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
            converted: { label: 'Converti', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
        };
        return variants[status as keyof typeof variants] || { label: status, class: 'bg-gray-100 text-gray-800' };
    };

    const filterOptions: Array<{ value: QuoteFilterField; label: string }> = [
        { value: 'search', label: 'Recherche' },
        { value: 'quote_number', label: 'Numéro de devis' },
        { value: 'status', label: 'Statut' },
        { value: 'client_id', label: 'Client' },
        { value: 'total_ttc', label: 'Montant TTC' },
    ];

    const getOperatorLabel = (op: QuoteFilterType['operator']) => {
        if (op === 'contains') return 'Contient';
        if (op === 'between') return 'Entre';
        return 'Égal à';
    };

    const formatAmount = (v: string) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return v;
        return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getFilterDisplayValue = (f: QuoteFilterType) => {
        if (f.field === 'status') return getStatusBadge(f.value).label;
        if (f.field === 'client_id') {
            const id = Number(f.value);
            const client = clients.find((c) => c.id === id);
            return client?.company_name ?? f.value;
        }
        if (f.field === 'total_ttc') {
            if (f.operator === 'between' && f.value2) return `${formatAmount(f.value)} - ${formatAmount(f.value2)}`;
            return formatAmount(f.value);
        }
        return f.value;
    };

    const isExpired = (quote: Quote) => {
        return new Date(quote.valid_until) < new Date() && ['sent', 'viewed'].includes(quote.status);
    };

    const formatCurrency = (amount: number, currency: { symbol: string }) => {
        return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.symbol}`;
    };

    /* -------------------------------------------------------------------- */
    /*                                 RENDER                               */
    /* -------------------------------------------------------------------- */
    return (
        <>
            <Head title="Devis" />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Devis', href: '/quotes' },
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
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des devis</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Gérez vos devis et propositions commerciales</p>
                            </div>
                        </div>

                        {/* -------------------------------- Tools --------------------------------- */}
                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
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

                                    {showFilterPanel && (
                                        <div className="relative z-[60] w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-3xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les devis
                                            </h3>

                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <select
                                                    value={currentFilterField}
                                                    onChange={(e) => {
                                                        const next = e.target.value as QuoteFilterField;
                                                        setCurrentFilterField(next);
                                                        setCurrentFilterValue('');
                                                        setCurrentFilterValue2('');
                                                        setCurrentFilterOperator(
                                                            next === 'total_ttc'
                                                                ? 'equals'
                                                                : next === 'search' || next === 'quote_number'
                                                                  ? 'contains'
                                                                  : 'equals',
                                                        );
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
                                                {currentFilterField === 'status' ? (
                                                    <select
                                                        value={currentFilterValue}
                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Sélectionner un statut</option>
                                                        <option value="draft">Brouillon</option>
                                                        <option value="sent">Envoyé</option>
                                                        <option value="viewed">Consulté</option>
                                                        <option value="accepted">Accepté</option>
                                                        <option value="rejected">Refusé</option>
                                                        <option value="expired">Expiré</option>
                                                        <option value="converted">Converti</option>
                                                    </select>
                                                ) : currentFilterField === 'client_id' ? (
                                                    <select
                                                        value={currentFilterValue}
                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Sélectionner un client</option>
                                                        {clients.map((c) => (
                                                            <option key={c.id} value={String(c.id)}>
                                                                {c.company_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : currentFilterField === 'total_ttc' ? (
                                                    <div className="space-y-2">
                                                        <select
                                                            value={currentFilterOperator}
                                                            onChange={(e) => {
                                                                setCurrentFilterOperator(e.target.value as QuoteFilterType['operator']);
                                                                setCurrentFilterValue('');
                                                                setCurrentFilterValue2('');
                                                            }}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="equals">Égal à</option>
                                                            <option value="between">Entre</option>
                                                        </select>

                                                        {currentFilterOperator === 'between' ? (
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <div className="relative min-w-[180px] flex-1">
                                                                    <span className="absolute top-2.5 left-3 text-xs font-semibold text-slate-400">
                                                                        Dhs
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={currentFilterValue}
                                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                                        placeholder="Min TTC"
                                                                        className="w-full rounded-lg border bg-white py-2 pr-3 pl-12 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                                    />
                                                                </div>
                                                                <span className="font-medium text-slate-500 dark:text-slate-400">à</span>
                                                                <div className="relative min-w-[180px] flex-1">
                                                                    <span className="absolute top-2.5 left-3 text-xs font-semibold text-slate-400">
                                                                        Dhs
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={currentFilterValue2}
                                                                        onChange={(e) => setCurrentFilterValue2(e.target.value)}
                                                                        placeholder="Max TTC"
                                                                        className="w-full rounded-lg border bg-white py-2 pr-3 pl-12 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <span className="absolute top-2.5 left-3 text-xs font-semibold text-slate-400">
                                                                    Dhs
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={currentFilterValue}
                                                                    onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                                                                    placeholder="Montant TTC"
                                                                    className="w-full rounded-lg border bg-white py-2 pr-3 pl-12 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                                />
                                                            </div>
                                                        )}
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
                                                                currentFilterField === 'quote_number'
                                                                    ? 'Numéro de devis…'
                                                                    : `Filtrer par ${
                                                                          filterOptions
                                                                              .find((o) => o.value === currentFilterField)
                                                                              ?.label.toLowerCase() || ''
                                                                      }`
                                                            }
                                                            className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                onClick={addFilter}
                                                disabled={
                                                    currentFilterField === 'total_ttc' && currentFilterOperator === 'between'
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
                                        <ChevronDown className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-400" />
                                    </div>

                                    {canCreate && (
                                        <Link href={route('quotes.create')}>
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" />
                                                Nouveau devis
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
                                        <th className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                Numéro
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Building2 className="h-4 w-4" />
                                                Client
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <CheckCircle className="h-4 w-4" />
                                                Statut
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Date / Validité
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                Montant TTC
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Package className="h-4 w-4" />
                                                Articles
                                            </div>
                                        </th>
                                        {showActionsColumn && (
                                            <th className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    Actions
                                                </div>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={showActionsColumn ? 8 : 7}
                                                className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                    <div>
                                                        <p className="font-medium">Aucun devis trouvé</p>
                                                        <p className="text-xs">Aucun devis ne correspond aux critères de recherche</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((quote) => {
                                            const isActive = !quote.deleted_at;
                                            const canShow = can('quote_show');
                                            const canEdit = can('quote_edit');
                                            const canDel = can('quote_delete') && isActive;
                                            const canRes = can('quote_restore') && !isActive;
                                            const canDup = can('quote_create');
                                            const canExport = can('quote_show');

                                            const canSelectRow = (isActive && can('quote_delete')) || (!isActive && can('quote_restore'));
                                            const showRowActions = canShow || canEdit || canDel || canRes || canDup || canExport;

                                            return (
                                                <tr
                                                    key={quote.id}
                                                    className={`${
                                                        quote.deleted_at ? 'bg-red-50 dark:bg-red-900/10' : ''
                                                    } transition-colors hover:bg-slate-50 dark:hover:bg-slate-800`}
                                                >
                                                    {showCheckboxHeader && (
                                                        <td className="px-3 py-4 text-center">
                                                            {canSelectRow ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedIds.includes(quote.id)}
                                                                    onChange={() => toggleSelect(quote.id)}
                                                                    className="rounded border-slate-300 text-red-600"
                                                                />
                                                            ) : (
                                                                <span className="inline-block w-4" />
                                                            )}
                                                        </td>
                                                    )}

                                                    {/* Numéro */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="h-5 w-5 text-slate-400" />
                                                            <div>
                                                                <div className="font-medium text-slate-900 dark:text-white">{quote.quote_number}</div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                    Par {quote.user.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Client */}
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-white">
                                                                {quote.client.company_name}
                                                            </div>
                                                            {quote.client.contact_name && (
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {quote.client.contact_name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Statut */}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(quote.status).class}`}
                                                            >
                                                                {getStatusBadge(quote.status).label}
                                                            </span>
                                                            {isExpired(quote) && (
                                                                <span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                    <Clock className="mr-1 h-3 w-3" />
                                                                    Expiré
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Date / Validité */}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-xs">
                                                            <div className="font-medium">
                                                                {new Date(quote.quote_date).toLocaleDateString('fr-FR')}
                                                            </div>
                                                            <div
                                                                className={`${isExpired(quote) ? 'font-medium text-red-600' : 'text-slate-500 dark:text-slate-400'}`}
                                                            >
                                                                Valide jusqu'au {new Date(quote.valid_until).toLocaleDateString('fr-FR')}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Montant */}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                            {formatCurrency(quote.total_ttc, quote.currency)}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            HT: {formatCurrency(quote.subtotal_ht, quote.currency)}
                                                        </div>
                                                    </td>

                                                    {/* Articles */}
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                            {quote.items_count} article{quote.items_count > 1 ? 's' : ''}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    {showActionsColumn && (
                                                        <td className="px-6 py-4 text-center">
                                                            {showRowActions ? (
                                                                <div className="flex justify-center gap-2">
                                                                    {quote.deleted_at ? (
                                                                        canRes && (
                                                                            <button
                                                                                onClick={() => restoreOne(quote.id)}
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
                                                                                    href={route('quotes.show', quote.id)}
                                                                                    className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                                    aria-label="Voir"
                                                                                >
                                                                                    <Eye className="h-5 w-5" />
                                                                                </Link>
                                                                            )}

                                                                            {canEdit && quote.status === 'draft' && (
                                                                                <Link
                                                                                    href={route('quotes.edit', quote.id)}
                                                                                    className="rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800/30 dark:hover:text-yellow-300"
                                                                                    aria-label="Modifier"
                                                                                >
                                                                                    <Pencil className="h-5 w-5" />
                                                                                </Link>
                                                                            )}

                                                                            {canDup && (
                                                                                <button
                                                                                    onClick={() => duplicateOne(quote)}
                                                                                    className="rounded-full p-1 text-green-600 hover:bg-green-50 hover:text-green-900 dark:text-green-400 dark:hover:bg-green-800/30 dark:hover:text-green-300"
                                                                                    aria-label="Dupliquer"
                                                                                >
                                                                                    <Copy className="h-5 w-5" />
                                                                                </button>
                                                                            )}

                                                                            {canExport && (
                                                                                <a
                                                                                    href={route('quotes.export', quote.id)}
                                                                                    className="rounded-full p-1 text-purple-600 hover:bg-purple-50 hover:text-purple-900 dark:text-purple-400 dark:hover:bg-purple-800/30 dark:hover:text-purple-300"
                                                                                    aria-label="Télécharger PDF"
                                                                                >
                                                                                    <Download className="h-5 w-5" />
                                                                                </a>
                                                                            )}

                                                                            {canDel && ['draft', 'rejected'].includes(quote.status) && (
                                                                                <button
                                                                                    onClick={() => deleteOne(quote)}
                                                                                    className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300"
                                                                                    aria-label="Supprimer"
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
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ------------------------------ Pagination ------------------------------ */}
                        <div className="mt-4 flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 shadow-xl backdrop-blur-md sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <span>
                                Affichage de {from} à {to} sur {total} devis
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
