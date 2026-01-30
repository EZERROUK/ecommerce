import ModernDatePicker from '@/components/ModernDatePicker';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { PageProps, Pagination } from '@/types';
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
    Clock,
    Eye,
    FileText,
    Filter,
    Mail,
    MoreHorizontal,
    Pencil,
    Phone,
    Plus,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Tag,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */
interface Client {
    id: string;
    company_name: string;
    contact_name?: string;
    email: string;
    phone?: string;
    ice?: string;
    tax_regime: 'normal' | 'auto_entrepreneur' | 'exonere';
    is_tva_subject: boolean;
    is_active: boolean;
    deleted_at?: string;
    quotes_count: number;
    orders_count: number;
    created_at: string;
}

interface ClientFilterType {
    field: 'search' | 'company_name' | 'contact_name' | 'email' | 'ice' | 'tax_regime' | 'status' | 'date';
    value: string;
    value2?: string;
    operator: 'contains' | 'equals' | 'date_range';
}

interface ClientFilters {
    search?: string;
    company_name?: string;
    contact_name?: string;
    email?: string;
    ice?: string;
    tax_regime?: string;
    status?: string;
    date_start?: string;
    date_end?: string;
    per_page?: number; // ✅ important pour garder "Tous"
}

interface Flash {
    success?: string;
    error?: string;
}

interface Props
    extends PageProps<{
        clients: Pagination<Client>;
        filters: ClientFilters;
        sort: 'company_name' | 'contact_name' | 'email' | 'created_at' | 'quotes_count' | 'orders_count';
        dir: 'asc' | 'desc';
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
/*                            UTILITY FUNCTIONS                              */
/* -------------------------------------------------------------------------- */
const formatDateToYMD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateFromYMD = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */
export default function ClientsIndex({ clients, filters, sort, dir, flash }: Props) {
    const { can } = useCan();

    /* ------------------------------ Per page ------------------------------ */
    const currentPerPage = useMemo(() => {
        if (typeof filters?.per_page === 'number') return filters.per_page;
        return clients.per_page ?? 15;
    }, [filters?.per_page, clients.per_page]);

    /* ------------------------------ UI STATE ------------------------------ */
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<ClientFilterType['field']>('search');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [currentFilterOperator, setCurrentFilterOperator] = useState<ClientFilterType['operator']>('contains');

    const [activeFilters, setActiveFilters] = useState<ClientFilterType[]>(() => {
        const arr: ClientFilterType[] = [];

        // ✅ On garde "search" comme une seule valeur (pas split par mots)
        if (filters.search) {
            arr.push({ field: 'search', value: filters.search, operator: 'contains' });
        }

        if (filters.company_name) {
            arr.push({ field: 'company_name', value: filters.company_name, operator: 'contains' });
        }
        if (filters.contact_name) {
            arr.push({ field: 'contact_name', value: filters.contact_name, operator: 'contains' });
        }
        if (filters.email) {
            arr.push({ field: 'email', value: filters.email, operator: 'contains' });
        }
        if (filters.ice) {
            arr.push({ field: 'ice', value: filters.ice, operator: 'contains' });
        }
        if (filters.tax_regime) {
            arr.push({ field: 'tax_regime', value: filters.tax_regime, operator: 'equals' });
        }
        if (filters.status) {
            arr.push({ field: 'status', value: filters.status, operator: 'equals' });
        }
        if (filters.date_start && filters.date_end) {
            arr.push({
                field: 'date',
                value: filters.date_start,
                value2: filters.date_end,
                operator: 'date_range',
            });
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
    const inertiaOpts = {
        preserveScroll: true,
        preserveState: true,
        only: ['clients', 'filters', 'sort', 'dir', 'flash'],
    };

    const buildQueryPayload = (filtersList: ClientFilterType[], extra: Record<string, any> = {}) => {
        const payload: Record<string, any> = { ...extra };

        // ✅ IMPORTANT : on conserve per_page = -1 (ne pas supprimer)
        // Laravel gère le cas -1 côté controller maintenant

        // Gestion des filtres
        filtersList.forEach((filter) => {
            switch (filter.field) {
                case 'search':
                    payload.search = filter.value;
                    break;

                case 'company_name':
                    payload.company_name = filter.value;
                    break;

                case 'contact_name':
                    payload.contact_name = filter.value;
                    break;

                case 'email':
                    payload.email = filter.value;
                    break;

                case 'ice':
                    payload.ice = filter.value;
                    break;

                case 'tax_regime':
                    payload.tax_regime = filter.value;
                    break;

                case 'status':
                    payload.status = filter.value;
                    break;

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

    const go = (filtersList: ClientFilterType[], extra: Record<string, any> = {}) => {
        const payload = buildQueryPayload(filtersList, extra);
        router.get(route('clients.index'), payload, inertiaOpts);
    };

    /* --------------------------- Filters CRUD ---------------------------- */
    const addFilter = () => {
        if (currentFilterField === 'date') {
            if (startDate && endDate) {
                const newFilter: ClientFilterType = {
                    field: 'date',
                    value: formatDateToYMD(startDate),
                    value2: formatDateToYMD(endDate),
                    operator: 'date_range',
                };

                const next = [...activeFilters.filter((f) => f.field !== 'date'), newFilter];
                setActiveFilters(next);
                go(next, { page: 1, per_page: currentPerPage, sort, dir });
            }
        } else if (currentFilterValue) {
            const newFilter: ClientFilterType = {
                field: currentFilterField,
                value: currentFilterValue,
                operator: currentFilterOperator,
            };

            const next = [...activeFilters.filter((f) => f.field !== currentFilterField), newFilter];
            setActiveFilters(next);
            setCurrentFilterValue('');
            go(next, { page: 1, per_page: currentPerPage, sort, dir });
        }
    };

    const removeFilter = (idx: number) => {
        const filterToRemove = activeFilters[idx];
        if (filterToRemove.field === 'date') {
            setStartDate(null);
            setEndDate(null);
        }
        const next = activeFilters.filter((_, i) => i !== idx);
        setActiveFilters(next);
        go(next, { page: 1, per_page: currentPerPage, sort, dir });
    };

    const resetFilters = () => {
        setActiveFilters([]);
        setStartDate(null);
        setEndDate(null);
        setCurrentFilterValue('');

        router.get(route('clients.index'), { page: 1, per_page: currentPerPage }, inertiaOpts);
    };

    /* ----------------------- Pagination & Tri --------------------------- */
    const changePage = (p: number) => go(activeFilters, { page: p, per_page: currentPerPage, sort, dir });

    const changePer = (n: number) => go(activeFilters, { page: 1, per_page: n, sort, dir });

    const changeSort = (field: 'company_name' | 'contact_name' | 'email' | 'created_at' | 'quotes_count' | 'orders_count') => {
        const newDir = sort === field ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
        go(activeFilters, { page: 1, per_page: currentPerPage, sort: field, dir: newDir });
    };

    /* ------------------------------- CRUD -------------------------------- */
    const restoreOne = (id: string) => {
        if (!can('client_restore')) return alert('Permission manquante: client_restore');
        if (confirm('Restaurer ce client ?')) router.post(route('clients.restore', { id }), {}, { preserveScroll: true });
    };

    const deleteOne = (id: string) => {
        if (!can('client_delete')) return alert('Permission manquante: client_delete');
        if (confirm('Supprimer ce client ?')) router.delete(route('clients.destroy', { client: id }), { preserveScroll: true });
    };

    /* ---------------------------- Selection ----------------------------- */
    const toggleSelect = (id: string) => {
        const client = clients.data.find((c) => c.id === id);
        const isActive = !client?.deleted_at;

        if (isActive && !can('client_delete')) return;
        if (!isActive && !can('client_restore')) return;

        setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
    };

    const toggleSelectAll = () => {
        if (!clients.data.length) return;

        const canBulkDelete = can('client_delete');
        const canBulkRestore = can('client_restore');

        // sélection seulement des lignes actionnables
        const selectableIds = clients.data
            .filter((client) => {
                const active = !client.deleted_at;
                if (active && !canBulkDelete) return false;
                if (!active && !canBulkRestore) return false;
                return true;
            })
            .map((c) => c.id);

        if (!selectableIds.length) return;

        const allSelectableSelected = selectableIds.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelectableSelected ? [] : selectableIds);
    };

    const anyInactive = selectedIds.some((id) => !!clients.data.find((c) => c.id === id)?.deleted_at);
    const anyActive = selectedIds.some((id) => !clients.data.find((c) => c.id === id)?.deleted_at);

    /* ---------------------- Bulk actions ---------------------- */
    const restoreSelected = () => {
        if (!can('client_restore')) return alert('Permission manquante: client_restore');
        if (!selectedIds.length) return;
        if (!confirm(`Restaurer ${selectedIds.length} client(s) ?`)) return;

        Promise.all(selectedIds.map((id) => router.post(route('clients.restore', { id }), {}, { preserveScroll: true }))).then(() =>
            setSelectedIds([]),
        );
    };

    const deleteSelected = () => {
        if (!can('client_delete')) return alert('Permission manquante: client_delete');
        if (!selectedIds.length) return;
        if (!confirm(`Supprimer ${selectedIds.length} client(s) ?`)) return;

        Promise.all(selectedIds.map((id) => router.delete(route('clients.destroy', { client: id }), { preserveScroll: true }))).then(() =>
            setSelectedIds([]),
        );
    };

    /* -------------------------- UI Permissions -------------------------- */
    const canCreate = can('client_create');
    const canBulkDelete = can('client_delete');
    const canBulkRestore = can('client_restore');

    const showActionsColumn = useMemo(() => {
        if (clients.data.length === 0) return false;
        return clients.data.some((client) => {
            const isActive = !client.deleted_at;
            const canShow = can('client_show');
            const canEdit = can('client_edit');
            const canDel = can('client_delete') && isActive;
            const canRes = can('client_restore') && !isActive;
            return canShow || canEdit || canDel || canRes;
        });
    }, [clients.data, can]);

    const showCheckboxHeader = useMemo(() => {
        return clients.data.some((client) => {
            const isActive = !client.deleted_at;
            if (isActive && canBulkDelete) return true;
            if (!isActive && canBulkRestore) return true;
            return false;
        });
    }, [clients.data, canBulkDelete, canBulkRestore]);

    /* -------------------- Pagination window -------------------- */
    const windowPages = useMemo<(number | '…')[]>(() => {
        const pages: (number | '…')[] = [];
        const MAX = 5;
        const c = clients.current_page || 1;
        const l = clients.last_page || 1;

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
    }, [clients.current_page, clients.last_page]);

    /* -------------------------------------------------------------------- */
    const filterOptions = [
        { value: 'search', label: 'Recherche globale' },
        { value: 'company_name', label: "Nom de l'entreprise" },
        { value: 'contact_name', label: 'Nom du contact' },
        { value: 'email', label: 'Email' },
        { value: 'ice', label: 'ICE' },
        { value: 'tax_regime', label: 'Régime fiscal' },
        { value: 'status', label: 'Statut' },
        { value: 'date', label: 'Date de création' },
    ];

    const operatorOptions = {
        text: [
            { value: 'contains', label: 'Contient' },
            { value: 'equals', label: 'Égal à' },
        ],
    };

    const getFilterDisplayValue = (filter: ClientFilterType) => {
        if (filter.operator === 'date_range' && filter.value2) {
            const start = parseDateFromYMD(filter.value).toLocaleDateString('fr-FR');
            const end = parseDateFromYMD(filter.value2).toLocaleDateString('fr-FR');
            return `${start} - ${end}`;
        }
        return filter.value;
    };

    const getOperatorLabel = (operator?: ClientFilterType['operator']) => {
        if (!operator) return '';
        const allOperators = [...operatorOptions.text];
        const found = allOperators.find((op) => op.value === operator);
        return found ? found.label : operator;
    };

    const getTaxRegimeLabel = (regime: string) =>
        ({
            normal: 'Normal',
            auto_entrepreneur: 'Auto-entrepreneur',
            exonere: 'Exonéré',
        })[regime as 'normal' | 'auto_entrepreneur' | 'exonere'] ?? regime;

    /* -------------------------------------------------------------------- */
    /*                                RENDER                                */
    /* -------------------------------------------------------------------- */
    return (
        <>
            <Head title="Clients" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Clients', href: '/clients' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        {/* ----------------------- Flash ----------------------- */}
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

                        {/* ----------------------- Header ----------------------- */}
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des clients</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Gérez vos clients et leurs informations fiscales</p>
                            </div>
                        </div>

                        {/* ----------------------- Tools ----------------------- */}
                        <div className="relative z-50 mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                {/* Filter block */}
                                <div className="flex w-full flex-col gap-4 lg:w-auto">
                                    <div className="flex items-center gap-3">
                                        <Button onClick={() => setShowFilterPanel(!showFilterPanel)}>
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
                                        <div className="relative z-[60] w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-2xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les clients
                                            </h3>

                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <select
                                                    value={currentFilterField}
                                                    onChange={(e) => {
                                                        setCurrentFilterField(e.target.value as ClientFilterType['field']);
                                                        setCurrentFilterValue('');
                                                        setCurrentFilterOperator('contains');
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
                                                {currentFilterField === 'date' ? (
                                                    <div className="relative z-[70] flex flex-wrap items-center gap-3">
                                                        <div className="min-w-[180px] flex-1">
                                                            <ModernDatePicker
                                                                selected={startDate}
                                                                onChange={(date) => setStartDate(date)}
                                                                placeholder="Date de début"
                                                                selectsStart={true}
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
                                                                selectsEnd={true}
                                                                startDate={startDate}
                                                                endDate={endDate}
                                                                minDate={startDate}
                                                                className="relative z-[80] w-full"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : currentFilterField === 'tax_regime' ? (
                                                    <select
                                                        value={currentFilterValue}
                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Sélectionner un régime</option>
                                                        <option value="normal">Normal</option>
                                                        <option value="auto_entrepreneur">Auto-entrepreneur</option>
                                                        <option value="exonere">Exonéré</option>
                                                    </select>
                                                ) : currentFilterField === 'status' ? (
                                                    <select
                                                        value={currentFilterValue}
                                                        onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Sélectionner un statut</option>
                                                        <option value="active">Actif</option>
                                                        <option value="inactive">Inactif</option>
                                                        <option value="deleted">Désactivé (supprimé)</option>
                                                    </select>
                                                ) : (
                                                    <div className="relative">
                                                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                                                            placeholder={`Filtrer par ${
                                                                filterOptions.find((o) => o.value === currentFilterField)?.label.toLowerCase() || ''
                                                            }`}
                                                            className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                onClick={addFilter}
                                                disabled={currentFilterField === 'date' ? !startDate || !endDate : !currentFilterValue}
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
                                                    <button onClick={() => removeFilter(i)}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right block - Rows per page + Add button */}
                                <div className="ml-auto flex items-center gap-3">
                                    <div className="relative min-w-[220px]">
                                        <select
                                            value={currentPerPage}
                                            onChange={(e) => changePer(Number(e.target.value))}
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
                                        <Link href={route('clients.create')}>
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" /> Nouveau client
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ----------------------- Table ----------------------- */}
                        <div className="relative z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                    <tr>
                                        {showCheckboxHeader && (
                                            <th className="w-[50px] px-3 py-3 text-center">
                                                <input type="checkbox" onChange={toggleSelectAll} className="rounded border-slate-300 text-red-600" />
                                            </th>
                                        )}
                                        <th className="cursor-pointer px-6 py-3 text-left" onClick={() => changeSort('company_name')}>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Entreprise {sort === 'company_name' && (dir === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        <th className="cursor-pointer px-6 py-3 text-left" onClick={() => changeSort('contact_name')}>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Contact {sort === 'contact_name' && (dir === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4" />
                                                ICE / Régime
                                            </div>
                                        </th>
                                        <th className="cursor-pointer px-6 py-3 text-center" onClick={() => changeSort('quotes_count')}>
                                            <div className="flex items-center justify-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Devis/Commandes {sort === 'quotes_count' && (dir === 'asc' ? '▲' : '▼')}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                Statut
                                            </div>
                                        </th>
                                        <th className="cursor-pointer px-6 py-3 text-center" onClick={() => changeSort('created_at')}>
                                            <div className="flex items-center justify-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Créé {sort === 'created_at' && (dir === 'asc' ? '▲' : '▼')}
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
                                    {clients.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={showActionsColumn ? 8 : 7}
                                                className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                    <div>
                                                        <p className="font-medium">Aucun client trouvé</p>
                                                        <p className="text-xs">Aucun client ne correspond aux critères de recherche</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        clients.data.map((client) => {
                                            const isActive = !client.deleted_at;
                                            const canShow = can('client_show');
                                            const canEdit = can('client_edit');
                                            const canDel = can('client_delete') && isActive;
                                            const canRes = can('client_restore') && !isActive;

                                            const canSelectRow = (isActive && can('client_delete')) || (!isActive && can('client_restore'));
                                            const showRowActions = canShow || canEdit || canDel || canRes;

                                            return (
                                                <tr
                                                    key={client.id}
                                                    className={`${client.deleted_at ? 'bg-red-50 dark:bg-red-900/10' : ''} transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                                                >
                                                    {showCheckboxHeader && (
                                                        <td className="px-6 py-4 text-center">
                                                            {canSelectRow ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedIds.includes(client.id)}
                                                                    onChange={() => toggleSelect(client.id)}
                                                                    className="rounded border-slate-300 text-red-600"
                                                                />
                                                            ) : (
                                                                <span className="inline-block w-4" />
                                                            )}
                                                        </td>
                                                    )}

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Building2 className="h-5 w-5 text-slate-400" />
                                                            <div>
                                                                <div className="font-medium text-slate-900 dark:text-white">
                                                                    {client.company_name}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    <Mail className="h-3 w-3" />
                                                                    {client.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-white">
                                                                {client.contact_name || '—'}
                                                            </div>
                                                            {client.phone && (
                                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    <Phone className="h-3 w-3" />
                                                                    {client.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <code className="block rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                                                                {client.ice || "Pas d'ICE"}
                                                            </code>
                                                            <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                {getTaxRegimeLabel(client.tax_regime)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                                {client.quotes_count}
                                                            </span>
                                                            <span className="text-slate-400">/</span>
                                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                                {client.orders_count}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        {client.deleted_at ? (
                                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                Désactivé
                                                            </span>
                                                        ) : client.is_active ? (
                                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                Actif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                                                Inactif
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-sm text-slate-900 dark:text-white">
                                                            {new Date(client.created_at).toLocaleDateString('fr-FR', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                            })}
                                                        </div>
                                                    </td>

                                                    {showActionsColumn && (
                                                        <td className="px-6 py-4 text-center">
                                                            {showRowActions ? (
                                                                <div className="flex justify-center gap-2">
                                                                    {client.deleted_at ? (
                                                                        canRes && (
                                                                            <button
                                                                                onClick={() => restoreOne(client.id)}
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
                                                                                    href={route('clients.show', client.id)}
                                                                                    className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                                    aria-label="Voir"
                                                                                >
                                                                                    <Eye className="h-5 w-5" />
                                                                                </Link>
                                                                            )}
                                                                            {canEdit && (
                                                                                <Link
                                                                                    href={route('clients.edit', client.id)}
                                                                                    className="rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800/30 dark:hover:text-yellow-300"
                                                                                    aria-label="Modifier"
                                                                                >
                                                                                    <Pencil className="h-5 w-5" />
                                                                                </Link>
                                                                            )}
                                                                            {canDel && (
                                                                                <button
                                                                                    onClick={() => deleteOne(client.id)}
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

                            {/* --------------------- Pagination --------------------- */}
                            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-300">
                                        Affichage de {clients.from || 0} à {clients.to || 0} sur {clients.total || 0} clients
                                    </span>
                                </div>

                                {(clients.last_page || 1) > 1 && (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={(clients.current_page || 1) === 1}
                                            onClick={() => changePage(1)}
                                            aria-label="Première page"
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={(clients.current_page || 1) === 1}
                                            onClick={() => changePage((clients.current_page || 1) - 1)}
                                            aria-label="Page précédente"
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
                                                    variant={p === (clients.current_page || 1) ? 'default' : 'outline'}
                                                    onClick={() => changePage(p as number)}
                                                >
                                                    {p}
                                                </Button>
                                            ),
                                        )}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={(clients.current_page || 1) === (clients.last_page || 1)}
                                            onClick={() => changePage((clients.current_page || 1) + 1)}
                                            aria-label="Page suivante"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={(clients.current_page || 1) === (clients.last_page || 1)}
                                            onClick={() => changePage(clients.last_page || 1)}
                                            aria-label="Dernière page"
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
