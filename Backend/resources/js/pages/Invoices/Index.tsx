import { Head, Link, router, usePage } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import {
    Building2,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    DollarSign,
    Download,
    Eye,
    Filter,
    MoreHorizontal,
    Package,
    Receipt,
    Search,
    Trash2,
} from 'lucide-react';

import { Pagination } from '@/types';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */
interface Invoice {
    id: string;
    invoice_number: string;
    status: 'draft' | 'sent' | 'issued' | 'paid' | 'partially_paid' | 'cancelled' | 'refunded';
    invoice_date: string;
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
    user?: { name: string };
    items_count: number;
    deleted_at?: string;
    created_at: string;
}

interface Client {
    id: number;
    company_name: string;
}

type InvoiceFilterField = 'search' | 'invoice_number' | 'status' | 'client_id' | 'total_ttc';

type InvoiceFilterType = {
    field: InvoiceFilterField;
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
    const can = useCallback((p?: string) => !p || isSuperAdmin || set.has(p), [isSuperAdmin, set]);
    return { can, isSuperAdmin };
};

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */
export default function InvoicesIndex() {
    const { props } = usePage() as any;
    const { can } = useCan();

    // props avec défauts sûrs
    const raw = (props.invoices ?? {
        data: [] as Invoice[],
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0,
        total: 0,
        per_page: 15,
    }) as Pagination<Invoice>;

    const clients = (props.clients ?? []) as Client[];
    const filters = (props.filters ?? {}) as {
        search?: string;
        invoice_number?: string;
        status?: string;
        client_id?: string;
        total_ttc?: string;
        total_ttc_min?: string;
        total_ttc_max?: string;
    };

    /* ----------------------- Pagination safe destructuring ---------------------- */
    const { data: rows = [], current_page = 1, last_page = 1, from = 0, to = 0, total = 0, per_page = 15 } = raw ?? { data: [] };

    /* ------------------------------ UI STATE ----------------------------------- */
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    const [currentFilterField, setCurrentFilterField] = useState<InvoiceFilterField>('search');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [currentFilterValue2, setCurrentFilterValue2] = useState('');
    const [currentFilterOperator, setCurrentFilterOperator] = useState<InvoiceFilterType['operator']>('contains');

    const [activeFilters, setActiveFilters] = useState<InvoiceFilterType[]>(() => {
        const arr: InvoiceFilterType[] = [];

        if (filters.search) arr.push({ field: 'search', value: filters.search, operator: 'contains' });
        if (filters.invoice_number) arr.push({ field: 'invoice_number', value: filters.invoice_number, operator: 'contains' });
        if (filters.status) arr.push({ field: 'status', value: filters.status, operator: 'equals' });
        if (filters.client_id) arr.push({ field: 'client_id', value: filters.client_id, operator: 'equals' });
        if (filters.total_ttc) arr.push({ field: 'total_ttc', value: filters.total_ttc, operator: 'equals' });
        if (filters.total_ttc_min && filters.total_ttc_max) {
            arr.push({ field: 'total_ttc', value: filters.total_ttc_min, value2: filters.total_ttc_max, operator: 'between' });
        }

        return arr;
    });

    const inertiaOpts = {
        preserveScroll: true,
        preserveState: true,
        only: ['invoices', 'filters', 'clients', 'statuses'],
    };

    const buildQueryPayload = (filtersList: InvoiceFilterType[], extra: Record<string, any> = {}) => {
        const payload: Record<string, any> = { ...extra };

        filtersList.forEach((filter) => {
            switch (filter.field) {
                case 'search':
                    payload.search = filter.value;
                    break;
                case 'invoice_number':
                    payload.invoice_number = filter.value;
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

    const go = (filtersList: InvoiceFilterType[], extra: Record<string, any> = {}) => {
        const payload = buildQueryPayload(filtersList, extra);
        router.get(route('invoices.index'), payload, inertiaOpts);
    };

    const addFilter = () => {
        if (currentFilterField === 'total_ttc') {
            if (currentFilterOperator === 'between') {
                if (!currentFilterValue || !currentFilterValue2) return;
                const next: InvoiceFilterType[] = [
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
            const next: InvoiceFilterType[] = [
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

        const operator: InvoiceFilterType['operator'] =
            currentFilterField === 'search' || currentFilterField === 'invoice_number' ? 'contains' : 'equals';

        const next: InvoiceFilterType[] = [
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
        router.get(route('invoices.index'), { page: 1, per_page: per_page || 15 }, inertiaOpts);
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

    // Badge aligné sur Show.tsx (mêmes couleurs/labels)
    const getStatusBadge = (status: Invoice['status']) => {
        const variants: Record<Invoice['status'], { label: string; class: string }> = {
            draft: { label: 'Brouillon', class: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' },
            sent: { label: 'Envoyée', class: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' },
            issued: { label: 'Émise', class: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' },
            partially_paid: { label: 'Partiellement payée', class: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' },
            paid: { label: 'Payée', class: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' },
            cancelled: { label: 'Annulée', class: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' },
            refunded: { label: 'Remboursée', class: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
        };
        return variants[status];
    };

    const formatCurrency = (amount: number, currency: { symbol: string }) =>
        `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.symbol}`;

    const filterOptions: Array<{ value: InvoiceFilterField; label: string }> = [
        { value: 'search', label: 'Recherche' },
        { value: 'invoice_number', label: 'Numéro de facture' },
        { value: 'status', label: 'Statut' },
        { value: 'client_id', label: 'Client' },
        { value: 'total_ttc', label: 'Montant TTC' },
    ];

    const getOperatorLabel = (op: InvoiceFilterType['operator']) => {
        if (op === 'contains') return 'Contient';
        if (op === 'between') return 'Entre';
        return 'Égal à';
    };

    const formatAmount = (v: string) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return v;
        return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getFilterDisplayValue = (f: InvoiceFilterType) => {
        if (f.field === 'status') return getStatusBadge(f.value as Invoice['status']).label;
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

    const handleDelete = (inv: Invoice) => {
        if (!can('invoice_delete')) return alert('Permission manquante: invoice_delete');
        if (confirm(`Supprimer la facture « ${inv.invoice_number} » ?`)) {
            router.delete(route('invoices.destroy', inv.id), {
                onSuccess: () => toast.success('Facture supprimée avec succès'),
                onError: () => toast.error('Erreur lors de la suppression'),
            });
        }
    };

    /* -------------------------- UI Permissions -------------------------- */
    // Déterminer si la colonne Actions doit être affichée (au moins une action possible sur au moins une ligne)
    const showActionsColumn = useMemo(() => {
        if (!rows || rows.length === 0) return false;
        return rows.some((inv: Invoice) => {
            const canShow = can('invoice_show');
            const canExport = can('invoice_export');
            const canDel = can('invoice_delete') && inv.status === 'draft' && !inv.deleted_at;
            return canShow || canExport || canDel;
        });
    }, [rows, can]);

    /* -------------------------------------------------------------------- */
    /*                                 RENDER                               */
    /* -------------------------------------------------------------------- */
    return (
        <>
            <Head title="Factures" />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Factures', href: '/invoices' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        {/* -------------------------------- Header -------------------------------- */}
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des factures</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Liste et suivi de la facturation client</p>
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
                                                Effacer filtres
                                            </Button>
                                        )}
                                    </div>

                                    {showFilterPanel && (
                                        <div className="relative z-[60] w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-3xl dark:border-slate-700 dark:bg-slate-800">
                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <select
                                                    value={currentFilterField}
                                                    onChange={(e) => {
                                                        const next = e.target.value as InvoiceFilterField;
                                                        setCurrentFilterField(next);
                                                        setCurrentFilterValue('');
                                                        setCurrentFilterValue2('');
                                                        setCurrentFilterOperator(
                                                            next === 'total_ttc'
                                                                ? 'equals'
                                                                : next === 'search' || next === 'invoice_number'
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
                                                        <option value="sent">Envoyée</option>
                                                        <option value="issued">Émise</option>
                                                        <option value="paid">Payée</option>
                                                        <option value="partially_paid">Partiellement payée</option>
                                                        <option value="cancelled">Annulée</option>
                                                        <option value="refunded">Remboursée</option>
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
                                                                setCurrentFilterOperator(e.target.value as InvoiceFilterType['operator']);
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
                                                                currentFilterField === 'invoice_number'
                                                                    ? 'Numéro de facture…'
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
                                                    <button onClick={() => removeFilter(i)} type="button" className="ml-1">
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bloc droit : rows per page */}
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
                                                <Receipt className="h-4 w-4" />
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
                                                Date
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
                                                colSpan={showActionsColumn ? 7 : 6}
                                                className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                Aucune facture trouvée.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((inv) => {
                                            const canShow = can('invoice_show');
                                            const canExport = can('invoice_export');
                                            const canDel = can('invoice_delete') && inv.status === 'draft' && !inv.deleted_at;
                                            const showRowActions = canShow || canExport || canDel;

                                            return (
                                                <tr
                                                    key={inv.id}
                                                    className={`${inv.deleted_at ? 'bg-red-50 dark:bg-red-900/10' : ''} transition-colors hover:bg-slate-50 dark:hover:bg-slate-800`}
                                                >
                                                    {/* Numéro */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Receipt className="h-5 w-5 text-slate-400" />
                                                            <div>
                                                                <div className="font-medium text-slate-900 dark:text-white">{inv.invoice_number}</div>
                                                                {inv.user?.name && (
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                        Par {inv.user.name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Client */}
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-white">
                                                                {inv.client.company_name}
                                                            </div>
                                                            {inv.client.contact_name && (
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {inv.client.contact_name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Statut */}
                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(inv.status).class}`}
                                                        >
                                                            {getStatusBadge(inv.status).label}
                                                        </span>
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-xs">
                                                            <div className="font-medium">
                                                                {new Date(inv.invoice_date).toLocaleDateString('fr-FR')}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Montant */}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                            {formatCurrency(inv.total_ttc, inv.currency)}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            HT: {formatCurrency(inv.subtotal_ht, inv.currency)}
                                                        </div>
                                                    </td>

                                                    {/* Articles */}
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                            {inv.items_count} article{inv.items_count > 1 ? 's' : ''}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    {showActionsColumn && (
                                                        <td className="px-6 py-4 text-center">
                                                            {showRowActions ? (
                                                                <div className="flex justify-center gap-2">
                                                                    {canShow && !inv.deleted_at && (
                                                                        <Link
                                                                            href={route('invoices.show', inv.id)}
                                                                            className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                            aria-label="Voir"
                                                                        >
                                                                            <Eye className="h-5 w-5" />
                                                                        </Link>
                                                                    )}

                                                                    {canExport && !inv.deleted_at && (
                                                                        <a
                                                                            href={route('invoices.export-pdf', inv.id)}
                                                                            className="rounded-full p-1 text-purple-600 hover:bg-purple-50 hover:text-purple-900 dark:text-purple-400 dark:hover:bg-purple-800/30 dark:hover:text-purple-300"
                                                                            aria-label="Télécharger PDF"
                                                                        >
                                                                            <Download className="h-5 w-5" />
                                                                        </a>
                                                                    )}

                                                                    {canDel && (
                                                                        <button
                                                                            onClick={() => handleDelete(inv)}
                                                                            className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300"
                                                                            aria-label="Supprimer"
                                                                        >
                                                                            <Trash2 className="h-5 w-5" />
                                                                        </button>
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
                                Affichage de {from} à {to} sur {total} factures
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
