import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowUpCircle,
    Building2,
    CalendarDays,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CreditCard,
    Euro,
    Filter,
    MoreHorizontal,
    Pencil,
    Search,
    SlidersHorizontal,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import { PageProps } from '@/types';

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

type SortField = 'due_date' | 'direction' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

type FilterField = 'direction' | 'status' | 'text';
interface FilterType {
    field: FilterField;
    value: string;
}

interface Flash {
    success?: string;
    error?: string;
}

interface ClientLite {
    id: string | number;
    company_name: string;
}

interface ProviderLite {
    id: string | number;
    name: string;
}

interface ExpenseCategoryLite {
    id: string | number;
    name: string;
}

interface FinancialTransaction {
    id: string | number;
    direction: 'in' | 'out';
    context?: string | null;
    amount: number;
    currency: string;
    status: 'planned' | 'paid' | 'overdue' | 'canceled';
    due_date?: string | null;
    paid_at?: string | null;
    label?: string | null;
    reference?: string | null;
    payment_method?: string | null;
    client?: ClientLite | null;
    provider?: ProviderLite | null;
    expense_category?: ExpenseCategoryLite | null;
    created_at?: string;
    updated_at?: string;
}

interface Summary {
    total_in: number;
    total_out: number;
    net: number;
}

interface Props
    extends PageProps<{
        transactions: Pagination<FinancialTransaction>;
        summary: Summary;
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

export default function TransactionsIndex({ transactions, summary, flash }: Props) {
    const { can } = useCan();

    const txArray = transactions.data;

    const [activeTab, setActiveTab] = useState<'transactions' | 'schedule'>('transactions');

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [sortField, setSortField] = useState<SortField>('due_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<FilterField>('text');
    const [currentFilterValue, setCurrentFilterValue] = useState('');

    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
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

    /* ----------------------- HELPER: IS OVERDUE --------------------------- */

    const isOverdueTx = (tx: FinancialTransaction) => {
        if (!tx.due_date) return false;

        const due = new Date(tx.due_date);
        if (Number.isNaN(due.getTime())) return false;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

        return dueDay < today && (tx.status === 'planned' || tx.status === 'overdue');
    };

    /* ------------------------------ FILTERS ------------------------------- */

    const filterOptions = [
        { value: 'text', label: 'Texte (libellé, ref, client, fournisseur)' },
        { value: 'direction', label: 'Sens' },
        { value: 'status', label: 'Statut' },
    ] as const;

    const addFilter = () => {
        if (!currentFilterValue) return;
        setActiveFilters((prev) => [...prev, { field: currentFilterField, value: currentFilterValue }]);
        setCurrentFilterValue('');
    };

    const removeFilter = (idx: number) => setActiveFilters((p) => p.filter((_, i) => i !== idx));

    const clearAllFilters = () => setActiveFilters([]);

    /* --------------------------- DATA PIPELINE --------------------------- */

    const filtered = useMemo(() => {
        return txArray.filter((tx) =>
            activeFilters.every((f) => {
                const val = f.value.toLowerCase();

                if (f.field === 'direction') {
                    if (val === 'encaissement' || val === 'in') return tx.direction === 'in';
                    if (val === 'décaissement' || val === 'out') return tx.direction === 'out';
                    return true;
                }

                if (f.field === 'status') {
                    if (val === 'payé' || val === 'paid') return tx.status === 'paid';
                    if (val === 'prévu' || val === 'planned') return tx.status === 'planned';
                    if (val === 'retard' || val === 'overdue') return tx.status === 'overdue';
                    if (val === 'annulé' || val === 'canceled') return tx.status === 'canceled';
                    return true;
                }

                const haystack = [
                    tx.label ?? '',
                    tx.reference ?? '',
                    tx.context ?? '',
                    tx.client?.company_name ?? '',
                    tx.provider?.name ?? '',
                    tx.expense_category?.name ?? '',
                ]
                    .join(' ')
                    .toLowerCase();

                return haystack.includes(val);
            }),
        );
    }, [txArray, activeFilters]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const dir = sortDirection === 'asc' ? 1 : -1;

            if (sortField === 'amount') {
                return a.amount < b.amount ? -1 * dir : 1 * dir;
            }

            if (sortField === 'direction') {
                const da = a.direction === 'in' ? 0 : 1;
                const db = b.direction === 'in' ? 0 : 1;
                return da < db ? -1 * dir : 1 * dir;
            }

            if (sortField === 'status') {
                const order = ['planned', 'overdue', 'paid', 'canceled'] as const;
                const ia = order.indexOf(a.status);
                const ib = order.indexOf(b.status);
                return ia < ib ? -1 * dir : 1 * dir;
            }

            const da = a.due_date ?? a.paid_at ?? '';
            const db = b.due_date ?? b.paid_at ?? '';
            return da < db ? -1 * dir : 1 * dir;
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

    const changeSort = (f: SortField) => {
        if (sortField === f) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        else {
            setSortField(f);
            setSortDirection('asc');
        }
    };

    const deleteOne = (id: string | number) => {
        if (!can('financial_transaction_delete')) {
            alert('Permission manquante: financial_transaction_delete');
            return;
        }
        if (!confirm('Supprimer cette transaction ?')) return;

        router.delete(route('financial.transactions.destroy', { transaction: id }), { preserveScroll: true });
    };

    const deleteSelected = () => {
        if (!can('financial_transaction_delete')) {
            alert('Permission manquante: financial_transaction_delete');
            return;
        }
        if (!selectedIds.length) return;
        if (!confirm(`Supprimer ${selectedIds.length} transaction(s) ?`)) return;

        selectedIds.forEach((id) => {
            router.delete(route('financial.transactions.destroy', { transaction: id }), { preserveScroll: true });
        });
        setSelectedIds([]);
    };

    /* ------------------------ SELECTION HELPERS ------------------------ */

    const toggleSelect = (id: string | number) => {
        if (!can('financial_transaction_delete')) return;
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const allSelected = paginated.length > 0 && selectedIds.length === paginated.length;

    const toggleSelectAll = () => {
        if (!paginated.length || !can('financial_transaction_delete')) return;

        if (selectedIds.length === paginated.length) setSelectedIds([]);
        else setSelectedIds(paginated.map((tx) => tx.id));
    };

    const canCreate = can('financial_transaction_create');
    const canDelete = can('financial_transaction_delete');
    const canEdit = can('financial_transaction_edit');

    /* ----------------------------- HELPERS UI ----------------------------- */

    const formatAmount = (amount: number, currency: string) =>
        `${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
        })} ${currency}`;

    const formatDate = (str?: string | null) => {
        if (!str) return '-';
        const d = new Date(str);
        if (Number.isNaN(d.getTime())) return str;
        return d.toLocaleDateString();
    };

    const netIsPositive = summary.net > 0;
    const netIsNegative = summary.net < 0;

    const netAccentClasses = netIsPositive
        ? 'text-emerald-500 bg-emerald-500/10 ring-emerald-500/30'
        : netIsNegative
          ? 'text-rose-500 bg-rose-500/10 ring-rose-500/30'
          : 'text-slate-500 bg-slate-500/10 ring-slate-500/30';

    /* -------------------------------------------------------------------- */
    /*                                 UI                                   */
    /* -------------------------------------------------------------------- */

    return (
        <>
            <Head title="Suivi des paiements & trésorerie" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    {
                        title: 'Finances',
                        href: route('financial.transactions.index'),
                    },
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

                        {/* ------------------------ TITLE ------------------------ */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suivi des paiements & trésorerie</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Encaissements, décaissements, échéances et vision de trésorerie.
                                </p>
                            </div>

                            {/* TABS */}
                            <div className="flex gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                                <button
                                    className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                                        activeTab === 'transactions'
                                            ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-slate-100'
                                            : 'text-slate-600 dark:text-slate-400'
                                    }`}
                                    onClick={() => setActiveTab('transactions')}
                                >
                                    Transactions
                                </button>

                                <button
                                    className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                                        activeTab === 'schedule'
                                            ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-slate-100'
                                            : 'text-slate-600 dark:text-slate-400'
                                    }`}
                                    onClick={() => setActiveTab('schedule')}
                                >
                                    Échéancier
                                </button>
                            </div>
                        </div>

                        {/* ======================= ONGLET : TRANSACTIONS ======================= */}
                        {activeTab === 'transactions' && (
                            <>
                                {/* ------------------- SUMMARY CARDS ------------------- */}
                                <div className="mb-6 grid gap-4 md:grid-cols-3">
                                    {/* Encaissements */}
                                    <div className="group relative overflow-hidden rounded-2xl border border-emerald-100/70 bg-gradient-to-br from-white via-emerald-50/80 to-white p-4 shadow-sm dark:border-emerald-500/40 dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-900/80 dark:shadow-lg">
                                        <div className="relative flex flex-col gap-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-black/30 dark:text-emerald-100 dark:ring-emerald-400/40">
                                                        <ArrowDownCircle className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-semibold tracking-wide text-emerald-700/80 uppercase dark:text-emerald-200/90">
                                                            Encaissements payés
                                                        </span>
                                                        <span className="text-[11px] text-emerald-700/70 dark:text-emerald-100/70">
                                                            Entrées de trésorerie
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-semibold text-emerald-900 dark:text-emerald-50">
                                                    {summary.total_in.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-200">MAD</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Décaissements */}
                                    <div className="group relative overflow-hidden rounded-2xl border border-rose-100/70 bg-gradient-to-br from-white via-rose-50/80 to-white p-4 shadow-sm dark:border-rose-500/40 dark:from-rose-950 dark:via-rose-900 dark:to-rose-900/80 dark:shadow-lg">
                                        <div className="relative flex flex-col gap-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-black/30 dark:text-rose-100 dark:ring-rose-400/40">
                                                        <ArrowUpCircle className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-semibold tracking-wide text-rose-700/80 uppercase dark:text-rose-100/90">
                                                            Décaissements payés
                                                        </span>
                                                        <span className="text-[11px] text-rose-700/70 dark:text-rose-100/70">
                                                            Sorties de trésorerie
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-semibold text-rose-900 dark:text-rose-50">
                                                    {summary.total_out.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                                <span className="text-sm font-medium text-rose-700 dark:text-rose-200">MAD</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Net */}
                                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-white p-4 shadow-sm dark:border-slate-500/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80 dark:shadow-lg">
                                        <div className="relative flex flex-col gap-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/5 ring-1 dark:bg-black/40 ${netAccentClasses}`}
                                                    >
                                                        <Euro className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-semibold tracking-wide text-slate-800 uppercase dark:text-slate-100">
                                                            Net de trésorerie
                                                        </span>
                                                        <span className="text-[11px] text-slate-600 dark:text-slate-300/80">
                                                            Encaissements - décaissements
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                                                    {summary.net.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">MAD</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ------------------ FILTER BAR ------------------ */}
                                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <div className="flex flex-wrap justify-between gap-4">
                                        {/* LEFT */}
                                        <div className="flex w-full flex-col gap-4 lg:w-auto">
                                            <div className="flex items-center gap-3">
                                                <Button onClick={() => setShowFilterPanel(!showFilterPanel)}>
                                                    <Filter className="h-4 w-4" />
                                                    {showFilterPanel ? 'Masquer les filtres' : 'Afficher les filtres'}
                                                </Button>

                                                {activeFilters.length > 0 && (
                                                    <Button variant="outline" onClick={clearAllFilters} className="gap-1.5">
                                                        <X className="h-4 w-4" />
                                                        Effacer filtres
                                                    </Button>
                                                )}

                                                {selectedIds.length > 0 && canDelete && (
                                                    <Button variant="destructive" onClick={deleteSelected}>
                                                        <Trash2 className="mr-1 h-4 w-4" />
                                                        Supprimer ({selectedIds.length})
                                                    </Button>
                                                )}
                                            </div>

                                            {/* FILTER PANEL */}
                                            {showFilterPanel && (
                                                <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-xl dark:border-slate-700 dark:bg-slate-800">
                                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                        <SlidersHorizontal className="h-4 w-4" />
                                                        Filtrer les transactions
                                                    </h3>

                                                    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                        <select
                                                            value={currentFilterField}
                                                            onChange={(e) => setCurrentFilterField(e.target.value as FilterField)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            {filterOptions.map((o) => (
                                                                <option key={o.value} value={o.value}>
                                                                    {o.label}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <div className="sm:col-span-2">
                                                            {currentFilterField === 'direction' ? (
                                                                <select
                                                                    value={currentFilterValue}
                                                                    onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                                >
                                                                    <option value="">Sens</option>
                                                                    <option value="encaissement">Encaissement</option>
                                                                    <option value="décaissement">Décaissement</option>
                                                                </select>
                                                            ) : currentFilterField === 'status' ? (
                                                                <select
                                                                    value={currentFilterValue}
                                                                    onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                                >
                                                                    <option value="">Statut</option>
                                                                    <option value="planned">Prévu</option>
                                                                    <option value="overdue">En retard</option>
                                                                    <option value="paid">Payé</option>
                                                                    <option value="canceled">Annulé</option>
                                                                </select>
                                                            ) : (
                                                                <div className="relative flex">
                                                                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                                    <input
                                                                        value={currentFilterValue}
                                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                                                                        placeholder="Libellé, référence, client, fournisseur..."
                                                                        className="flex-1 rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                                    />
                                                                    <Button onClick={addFilter} disabled={!currentFilterValue} className="ml-2">
                                                                        Ajouter
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {(currentFilterField === 'direction' || currentFilterField === 'status') && (
                                                        <Button onClick={addFilter} disabled={!currentFilterValue}>
                                                            Ajouter le filtre
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {/* ACTIVE FILTERS */}
                                            {activeFilters.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {activeFilters.map((f, i) => (
                                                        <span
                                                            key={i}
                                                            className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                                        >
                                                            <span className="font-medium">
                                                                {filterOptions.find((o) => o.value === f.field)?.label}:
                                                            </span>
                                                            {f.value}
                                                            <button onClick={() => removeFilter(i)}>
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* RIGHT CONTROLS */}
                                        <div className="ml-auto flex items-center gap-3">
                                            <div className="relative min-w-[220px]">
                                                <select
                                                    value={rowsPerPage}
                                                    onChange={(e) => {
                                                        setRowsPerPage(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                                                <Link href={route('financial.transactions.create')}>
                                                    <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md hover:from-emerald-500 hover:to-emerald-600">
                                                        + Nouvelle transaction
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* -------------------------- TABLE DES TRANSACTIONS -------------------------- */}
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                        <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                            <tr>
                                                {canDelete && paginated.length > 0 && (
                                                    <th className="w-[50px] px-3 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            onChange={toggleSelectAll}
                                                            className="rounded border-slate-300 text-red-600"
                                                        />
                                                    </th>
                                                )}

                                                <th className="cursor-pointer px-4 py-3 text-left" onClick={() => changeSort('due_date')}>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-4 w-4" />
                                                        Échéance / Paiement
                                                        {sortField === 'due_date' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                                                    </div>
                                                </th>

                                                <th className="cursor-pointer px-4 py-3 text-left" onClick={() => changeSort('direction')}>
                                                    <div className="flex items-center gap-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        Sens
                                                        {sortField === 'direction' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                                                    </div>
                                                </th>

                                                <th className="px-4 py-3 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-4 w-4" />
                                                        Libellé / Référence
                                                    </div>
                                                </th>

                                                <th className="px-4 py-3 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        Client / Fournisseur
                                                    </div>
                                                </th>

                                                <th className="px-4 py-3 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4" />
                                                        Catégorie
                                                    </div>
                                                </th>

                                                <th className="cursor-pointer px-4 py-3 text-right" onClick={() => changeSort('amount')}>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Euro className="h-4 w-4" />
                                                        Montant
                                                        {sortField === 'amount' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                                                    </div>
                                                </th>

                                                <th className="cursor-pointer px-4 py-3 text-center" onClick={() => changeSort('status')}>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        Statut
                                                        {sortField === 'status' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                                                    </div>
                                                </th>

                                                <th className="w-[80px] px-3 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {paginated.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={canDelete ? 9 : 8}
                                                        className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                                                    >
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Euro className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                            <div>
                                                                <p className="font-medium">Aucune transaction trouvée</p>
                                                                <p className="text-xs">Aucune transaction ne correspond aux critères</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginated.map((tx) => {
                                                    const isIn = tx.direction === 'in';
                                                    const isOverdue = isOverdueTx(tx);

                                                    const dateDisplay =
                                                        tx.paid_at && tx.status === 'paid'
                                                            ? `Payé le ${formatDate(tx.paid_at)}`
                                                            : tx.due_date
                                                              ? `Échéance : ${formatDate(tx.due_date)}`
                                                              : '-';

                                                    const hasClient = !!tx.client;
                                                    const hasProvider = !!tx.provider;
                                                    const showCategory = !isIn && tx.expense_category && tx.expense_category.name;

                                                    return (
                                                        <tr
                                                            key={tx.id}
                                                            className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                                                isOverdue ? 'bg-red-50/60 dark:bg-red-900/10' : ''
                                                            }`}
                                                        >
                                                            {canDelete && (
                                                                <td className="px-3 py-4 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedIds.includes(tx.id)}
                                                                        onChange={() => toggleSelect(tx.id)}
                                                                        className="rounded border-slate-300 text-red-600"
                                                                    />
                                                                </td>
                                                            )}

                                                            <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{dateDisplay}</td>

                                                            <td className="px-4 py-4">
                                                                {isIn ? (
                                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                                                        <ArrowDownCircle className="mr-1 h-3.5 w-3.5" />
                                                                        Encaissement
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                                                                        <ArrowUpCircle className="mr-1 h-3.5 w-3.5" />
                                                                        Décaissement
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-4 text-sm">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                                        {tx.label || '(Sans libellé)'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {tx.reference && <>Ref: {tx.reference}</>}
                                                                        {tx.context && (
                                                                            <>
                                                                                {tx.reference && ' • '}
                                                                                Contexte: {tx.context}
                                                                            </>
                                                                        )}
                                                                        {!tx.reference && !tx.context && '-'}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-4 text-sm">
                                                                <div className="flex flex-col gap-0.5">
                                                                    {hasClient && (
                                                                        <span className="inline-flex items-center gap-1 text-xs">
                                                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                                                            {tx.client!.company_name}
                                                                        </span>
                                                                    )}

                                                                    {hasProvider && (
                                                                        <span className="inline-flex items-center gap-1 text-xs">
                                                                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                                            {tx.provider!.name}
                                                                        </span>
                                                                    )}

                                                                    {!hasClient && !hasProvider && (
                                                                        <span className="text-xs text-slate-400 italic">Non rattaché</span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-4 text-sm">
                                                                {showCategory ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                                                                        {tx.expense_category!.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">-</span>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                                                                {formatAmount(tx.amount, tx.currency)}
                                                            </td>

                                                            <td className="px-4 py-4 text-center">
                                                                {tx.status === 'paid' && (
                                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                                                        Payé
                                                                    </span>
                                                                )}
                                                                {tx.status === 'planned' && !isOverdue && (
                                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                                                        Prévu
                                                                    </span>
                                                                )}
                                                                {isOverdue && (
                                                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                        En retard
                                                                    </span>
                                                                )}
                                                                {tx.status === 'canceled' && (
                                                                    <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                        Annulé
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td className="px-3 py-4 text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    {canEdit && (
                                                                        <Link
                                                                            href={route('financial.transactions.edit', { transaction: tx.id })}
                                                                            className="rounded-full p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
                                                                            aria-label="Modifier"
                                                                        >
                                                                            <Pencil className="h-5 w-5" />
                                                                        </Link>
                                                                    )}

                                                                    {canDelete && (
                                                                        <button
                                                                            onClick={() => deleteOne(tx.id)}
                                                                            className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300"
                                                                            aria-label="Supprimer"
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

                                    {/* ----------------------- FOOTER ----------------------- */}
                                    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                        <div>
                                            {rowsPerPage === -1
                                                ? `Affichage de toutes les ${filtered.length} transactions`
                                                : `Affichage de ${Math.min((currentPage - 1) * rowsPerPage + 1, filtered.length)} à ${Math.min(
                                                      currentPage * rowsPerPage,
                                                      filtered.length,
                                                  )} sur ${filtered.length} transactions`}
                                        </div>

                                        {rowsPerPage !== -1 && totalPages > 1 && (
                                            <div className="flex items-center gap-1">
                                                <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                                                    <ChevronsLeft className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage((p) => p - 1)}
                                                >
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
                            </>
                        )}

                        {/* ======================= ONGLET : ÉCHÉANCIER ======================= */}
                        {activeTab === 'schedule' &&
                            (() => {
                                const scheduleTx = filtered.filter(
                                    (tx) => tx.due_date && (tx.status === 'planned' || tx.status === 'overdue' || isOverdueTx(tx)),
                                );

                                if (!scheduleTx.length) {
                                    return (
                                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                            <p className="text-sm text-slate-600 dark:text-slate-300">Aucune échéance à venir.</p>
                                        </div>
                                    );
                                }

                                const monthNames = [
                                    'janvier',
                                    'février',
                                    'mars',
                                    'avril',
                                    'mai',
                                    'juin',
                                    'juillet',
                                    'août',
                                    'septembre',
                                    'octobre',
                                    'novembre',
                                    'décembre',
                                ];

                                const getWeekOfYear = (d: Date) => {
                                    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                                    const dayNum = date.getUTCDay() || 7;
                                    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
                                    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
                                    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
                                };

                                type WeekBucket = {
                                    key: string;
                                    label: string;
                                    items: FinancialTransaction[];
                                    totalIn: number;
                                    totalOut: number;
                                };

                                type MonthBucket = {
                                    key: string;
                                    label: string;
                                    totalIn: number;
                                    totalOut: number;
                                    net: number;
                                    weeks: WeekBucket[];
                                };

                                const monthMap = new Map<
                                    string,
                                    {
                                        key: string;
                                        label: string;
                                        totalIn: number;
                                        totalOut: number;
                                        weeksMap: Map<string, WeekBucket>;
                                    }
                                >();

                                scheduleTx.forEach((tx) => {
                                    if (!tx.due_date) return;
                                    const d = new Date(tx.due_date);
                                    if (Number.isNaN(d.getTime())) return;

                                    const year = d.getFullYear();
                                    const month = d.getMonth() + 1;
                                    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
                                    const monthLabel = monthNames[month - 1] + ' ' + year;

                                    if (!monthMap.has(monthKey)) {
                                        monthMap.set(monthKey, {
                                            key: monthKey,
                                            label: monthLabel,
                                            totalIn: 0,
                                            totalOut: 0,
                                            weeksMap: new Map(),
                                        });
                                    }

                                    const monthBucket = monthMap.get(monthKey)!;

                                    const weekNumber = getWeekOfYear(d);
                                    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
                                    const weekLabel = `Semaine ${weekNumber}`;

                                    if (!monthBucket.weeksMap.has(weekKey)) {
                                        monthBucket.weeksMap.set(weekKey, {
                                            key: weekKey,
                                            label: weekLabel,
                                            items: [],
                                            totalIn: 0,
                                            totalOut: 0,
                                        });
                                    }

                                    const weekBucket = monthBucket.weeksMap.get(weekKey)!;
                                    weekBucket.items.push(tx);

                                    if (tx.direction === 'in') monthBucket.totalIn += tx.amount;
                                    else monthBucket.totalOut += tx.amount;

                                    if (tx.direction === 'in') weekBucket.totalIn += tx.amount;
                                    else weekBucket.totalOut += tx.amount;
                                });

                                const months: MonthBucket[] = Array.from(monthMap.values())
                                    .map((m) => ({
                                        key: m.key,
                                        label: m.label,
                                        totalIn: m.totalIn,
                                        totalOut: m.totalOut,
                                        net: m.totalIn - m.totalOut,
                                        weeks: Array.from(m.weeksMap.values()).sort((a, b) => (a.key < b.key ? -1 : 1)),
                                    }))
                                    .sort((a, b) => (a.key < b.key ? -1 : 1));

                                return (
                                    <div className="space-y-4">
                                        {months.map((month) => (
                                            <div
                                                key={month.key}
                                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
                                            >
                                                {/* HEADER MOIS */}
                                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{month.label}</h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {month.weeks.length} semaine(s) avec échéances
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        <span className="inline-flex items-center rounded-full border border-emerald-100/60 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-200">
                                                            IN :&nbsp;
                                                            {formatAmount(month.totalIn, 'MAD')}
                                                        </span>

                                                        <span className="inline-flex items-center rounded-full border border-rose-100/60 bg-rose-50 px-2 py-1 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/40 dark:text-rose-200">
                                                            OUT :&nbsp;
                                                            {formatAmount(month.totalOut, 'MAD')}
                                                        </span>

                                                        <span
                                                            className={`inline-flex items-center rounded-full border px-2 py-1 ${
                                                                month.net > 0
                                                                    ? 'border-emerald-100/60 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                                    : month.net < 0
                                                                      ? 'border-rose-100/60 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/40 dark:text-rose-200'
                                                                      : 'border-slate-200/60 bg-slate-50 text-slate-600 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-300'
                                                            }`}
                                                        >
                                                            Net :&nbsp;
                                                            {formatAmount(month.net, 'MAD')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* WEEKS */}
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    {month.weeks.map((week) => (
                                                        <div
                                                            key={week.key}
                                                            className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                                                        >
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                                        {week.label}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                        {week.items.length} échéance(s)
                                                                    </p>
                                                                </div>

                                                                <div className="flex flex-col items-end gap-0.5 text-[11px]">
                                                                    <span className="text-emerald-600 dark:text-emerald-300">
                                                                        IN : {formatAmount(week.totalIn, 'MAD')}
                                                                    </span>
                                                                    <span className="text-rose-500 dark:text-rose-300">
                                                                        OUT : {formatAmount(week.totalOut, 'MAD')}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto border-t border-slate-200 pt-2 dark:border-slate-700">
                                                                {week.items.map((tx) => {
                                                                    const isIn = tx.direction === 'in';
                                                                    const overdue = isOverdueTx(tx);

                                                                    return (
                                                                        <div
                                                                            key={tx.id}
                                                                            className="flex items-start justify-between gap-2 text-[11px]"
                                                                        >
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="text-slate-600 dark:text-slate-200">
                                                                                        {formatDate(tx.due_date)}
                                                                                    </span>

                                                                                    {overdue && (
                                                                                        <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/60 dark:text-red-200">
                                                                                            En retard
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                <div className="truncate text-slate-800 dark:text-slate-100">
                                                                                    {tx.label || '(Sans libellé)'}
                                                                                </div>

                                                                                <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                                                                    {tx.client?.company_name ||
                                                                                        tx.provider?.name ||
                                                                                        tx.context ||
                                                                                        'Non rattaché'}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex flex-shrink-0 flex-col items-end">
                                                                                <span
                                                                                    className={`font-semibold ${
                                                                                        isIn
                                                                                            ? 'text-emerald-600 dark:text-emerald-300'
                                                                                            : 'text-rose-600 dark:text-rose-300'
                                                                                    }`}
                                                                                >
                                                                                    {formatAmount(tx.amount, tx.currency)}
                                                                                </span>

                                                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                                    {tx.status === 'planned'
                                                                                        ? 'Prévu'
                                                                                        : overdue
                                                                                          ? 'En retard'
                                                                                          : tx.status === 'paid'
                                                                                            ? 'Payé'
                                                                                            : 'Annulé'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
