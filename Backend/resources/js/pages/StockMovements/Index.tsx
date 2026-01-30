import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ClipboardSignature,
    DollarSign,
    Eye,
    Filter,
    Hash,
    Layers,
    MoreHorizontal,
    Package,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    ShieldAlert,
    SlidersHorizontal,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import ModernDatePicker from '@/components/ModernDatePicker';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface StockMovement {
    id: number;
    product: { id: string; name: string; sku: string };
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    formatted_quantity?: string;
    reference: string | null;
    total_cost: string | null;
    currency?: { code: string; symbol: string };
    user: { id: number; name: string };
    movement_date: string;
    type_label?: string;
    deleted_at?: string | null;
}

interface Filters {
    search?: string;
    type?: string;
    product_id?: string;
    start_date?: string;
    end_date?: string;
    sort?: 'movement_date' | 'quantity' | 'total_cost';
    direction?: 'asc' | 'desc';
    per_page?: number;
}

interface Pagination<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

interface Flash {
    success?: string;
    error?: string;
}

interface Props
    extends PageProps<{
        movements: Pagination<StockMovement>;
        filters: Filters;
        products: { id: string; name: string; sku: string }[];
        flash?: Flash;
    }> {}

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

/* ------------------------------------------------------------------ */
/* Utils (déclarées en function pour être hoistées)                   */
/* ------------------------------------------------------------------ */
function dateYMD(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseYMD(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function StockMovementsIndex({ movements, filters, products, flash }: Props) {
    const { can } = useCan();

    /* ---------------- état UI ---------------- */
    const [showFilters, setShowFilters] = useState(false);
    const [field, setField] = useState<'search' | 'type' | 'product' | 'date'>('search');
    const [value, setValue] = useState('');
    const [start, setStart] = useState<Date | null>(filters.start_date ? parseYMD(filters.start_date) : null);
    const [end, setEnd] = useState<Date | null>(filters.end_date ? parseYMD(filters.end_date) : null);

    const [chips, setChips] = useState<any[]>(() => {
        const arr: any[] = [];
        if (filters.search) filters.search.split(/\s+/).forEach((v) => arr.push({ field: 'search', value: v }));
        if (filters.type) arr.push({ field: 'type', value: filters.type });
        if (filters.product_id) arr.push({ field: 'product', value: filters.product_id });
        if (filters.start_date && filters.end_date) arr.push({ field: 'date', value: filters.start_date, value2: filters.end_date });
        return arr;
    });

    const [showSuccess, setShowSuccess] = useState(!!flash?.success);
    const [showError, setShowError] = useState(!!flash?.error);

    useEffect(() => {
        if (flash?.success) {
            const t = setTimeout(() => setShowSuccess(false), 5_000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);
    useEffect(() => {
        if (flash?.error) {
            const t = setTimeout(() => setShowError(false), 5_000);
            return () => clearTimeout(t);
        }
    }, [flash?.error]);

    /* ---------------- Inertia helpers ---------------- */
    // ⚠️ Pas de `as const` ici, pour éviter l’array readonly
    const iOpts = { preserveScroll: true, preserveState: true, only: ['movements', 'filters', 'flash'] as string[] };

    const payload = (list: any[], extra = {}) => {
        const p: any = { ...extra };
        list.forEach((f) => {
            if (f.field === 'search')
                p.search = list
                    .filter((s) => s.field === 'search')
                    .map((s) => s.value)
                    .join(' ');
            if (f.field === 'type') p.type = f.value;
            if (f.field === 'product') p.product_id = f.value;
            if (f.field === 'date') {
                p.start_date = f.value;
                p.end_date = f.value2;
            }
        });
        return p;
    };
    const go = (list: any[], extra = {}) => router.get(route('stock-movements.index'), payload(list, extra), iOpts);

    /* ---------------- gestion des filtres ---------------- */
    const addChip = () => {
        if (field === 'date') {
            if (start && end) {
                const n = { field: 'date', value: dateYMD(start), value2: dateYMD(end) };
                const next = chips.filter((c) => c.field !== 'date').concat(n);
                setChips(next);
                go(next, { page: 1, per_page: movements.per_page });
            }
        } else if (value.trim()) {
            const n = { field, value: value.trim() };
            const next = chips.filter((c) => c.field !== field).concat(n);
            setChips(next);
            setValue('');
            go(next, { page: 1, per_page: movements.per_page });
        }
    };

    const rmChip = (idx: number) => {
        if (chips[idx].field === 'date') {
            setStart(null);
            setEnd(null);
        }
        const next = chips.filter((_, i) => i !== idx);
        setChips(next);
        go(next, { page: 1, per_page: movements.per_page });
    };

    const reset = () => {
        setChips([]);
        setStart(null);
        setEnd(null);
        setValue('');
        router.get(route('stock-movements.index'), { page: 1, per_page: movements.per_page }, iOpts);
    };

    /* ---------------- pagination / tri ---------------- */
    const changePage = (p: number) => go(chips, { page: p, per_page: movements.per_page, sort: filters.sort, direction: filters.direction });
    const changePer = (n: number) => go(chips, { page: 1, per_page: n, sort: filters.sort, direction: filters.direction });
    const changeSort = (col: Filters['sort']) => {
        const dir = filters.sort === col ? (filters.direction === 'asc' ? 'desc' : 'asc') : 'asc';
        go(chips, { page: 1, per_page: movements.per_page, sort: col, direction: dir });
    };

    const windowPages = useMemo<(number | '…')[]>(() => {
        const res: (number | '…')[] = [],
            MAX = 5,
            c = movements.current_page,
            l = movements.last_page;
        if (l <= MAX + 2) {
            for (let i = 1; i <= l; i++) res.push(i);
            return res;
        }
        res.push(1);
        let s = Math.max(2, c - Math.floor(MAX / 2)),
            e = s + MAX - 1;
        if (e >= l) {
            e = l - 1;
            s = e - MAX + 1;
        }
        if (s > 2) res.push('…');
        for (let i = s; i <= e; i++) res.push(i);
        if (e < l - 1) res.push('…');
        res.push(l);
        return res;
    }, [movements.current_page, movements.last_page]);

    /* ---------------- helpers ---------------- */
    const fields = [
        { value: 'search', label: 'Recherche globale' },
        { value: 'type', label: 'Type' },
        { value: 'product', label: 'Produit' },
        { value: 'date', label: 'Date du mouvement' },
    ];
    const typeLbl = { in: 'Entrée', out: 'Sortie', adjustment: 'Ajustement' };
    const badge = (t: StockMovement['type']) =>
        ({
            in: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            out: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            adjustment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        })[t];

    const chipText = (c: any) => {
        if (c.field === 'product') {
            const p = products.find((p) => p.id === c.value);
            return p ? `${p.sku} - ${p.name}` : c.value;
        }
        if (c.field === 'type') return (typeLbl as any)[c.value] ?? c.value;
        if (c.field === 'date') {
            const s = parseYMD(c.value).toLocaleDateString('fr-FR');
            const e = parseYMD(c.value2).toLocaleDateString('fr-FR');
            return `${s} – ${e}`;
        }
        return c.value;
    };

    /* -------------------------- UI Permissions -------------------------- */
    const canCreate = can('stock_movement_create');

    const showActionsColumn = useMemo(() => {
        if (!movements?.data?.length) return false;
        return movements.data.some((m) => {
            const canShow = can('stock_movement_show') && !m.deleted_at;
            const canEdit = can('stock_movement_edit') && !m.deleted_at;
            const canDel = can('stock_movement_delete') && !m.deleted_at;
            const canRes = can('stock_movement_restore') && !!m.deleted_at;
            return canShow || canEdit || canDel || canRes;
        });
    }, [movements?.data, can]);

    /* ------------------------------------------------------------------ */
    return (
        <>
            <Head title="Mouvements de stock" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Inventaire', href: '/stock-movements' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-0 w-full px-4 py-6">
                        {/* Flash messages */}
                        {flash?.success && showSuccess && (
                            <div className="mb-4 flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-100">
                                <ArrowUpRight className="h-5 w-5" />
                                <span className="flex-1 font-medium">{flash.success}</span>
                                <button onClick={() => setShowSuccess(false)}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {flash?.error && showError && (
                            <div className="mb-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-100">
                                <ShieldAlert className="h-5 w-5" />
                                <span className="flex-1 font-medium">{flash.error}</span>
                                <button onClick={() => setShowError(false)}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Header */}
                        <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Gestion des mouvements de stock</h1>
                        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">Suivi des entrées, sorties et ajustements</p>

                        {/* Barre d’outils */}
                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                {/* Filtres */}
                                <div className="flex w-full flex-col gap-4 lg:w-auto">
                                    <div className="flex items-center gap-3">
                                        <Button onClick={() => setShowFilters(!showFilters)}>
                                            <Filter className="h-4 w-4" />
                                            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
                                        </Button>
                                        {chips.length > 0 && (
                                            <Button variant="outline" onClick={reset} className="gap-1.5">
                                                <X className="h-4 w-4" /> Effacer
                                            </Button>
                                        )}
                                    </div>

                                    {showFilters && (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-2xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les mouvements
                                            </h3>

                                            {/* champ à filtrer */}
                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <select
                                                    value={field}
                                                    onChange={(e) => {
                                                        setField(e.target.value as any);
                                                        setValue('');
                                                    }}
                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                >
                                                    {fields.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* valeur du filtre */}
                                            <div className="mb-3">
                                                {field === 'date' ? (
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <ModernDatePicker
                                                            selected={start}
                                                            onChange={(d) => setStart(d)}
                                                            placeholder="Date de début"
                                                            selectsStart
                                                            startDate={start}
                                                            endDate={end}
                                                            className="min-w-[180px] flex-1"
                                                            popperClassName="z-[90]"
                                                        />
                                                        <span className="font-medium text-slate-500 dark:text-slate-400">à</span>
                                                        <ModernDatePicker
                                                            selected={end}
                                                            onChange={(d) => setEnd(d)}
                                                            placeholder="Date de fin"
                                                            selectsEnd
                                                            startDate={start}
                                                            endDate={end}
                                                            minDate={start}
                                                            className="min-w-[180px] flex-1"
                                                            popperClassName="z-[90]"
                                                        />
                                                    </div>
                                                ) : field === 'type' ? (
                                                    <select
                                                        value={value}
                                                        onChange={(e) => setValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Tous les types</option>
                                                        {Object.entries(typeLbl).map(([v, l]) => (
                                                            <option key={v} value={v}>
                                                                {l}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : field === 'product' ? (
                                                    <select
                                                        value={value}
                                                        onChange={(e) => setValue(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Tous les produits</option>
                                                        {products.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.sku} - {p.name}
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
                                                            placeholder="Filtrer…"
                                                            className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <Button onClick={addChip} disabled={field === 'date' ? !start || !end : !value.trim()} className="w-full">
                                                Ajouter le filtre
                                            </Button>
                                        </div>
                                    )}

                                    {/* chips actifs */}
                                    {chips.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {chips.map((c, i) => (
                                                <span
                                                    key={i}
                                                    className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                                >
                                                    <span className="font-medium">{fields.find((f) => f.value === c.field)?.label}</span>:{' '}
                                                    <span>{chipText(c)}</span>
                                                    <button onClick={() => rmChip(i)}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pagination / nouveau mouvement */}
                                <div className="ml-auto flex items-center gap-3">
                                    <div className="relative min-w-[220px]">
                                        <select
                                            value={movements.per_page}
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
                                        <Link href={route('stock-movements.create')}>
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" /> Nouveau mouvement
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* TABLE ------------------------------------------------------------------ */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                    <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                        <tr>
                                            <th className="cursor-pointer px-4 py-3" onClick={() => changeSort('movement_date')}>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Date {filters.sort === 'movement_date' && (filters.direction === 'asc' ? '▲' : '▼')}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4" />
                                                    Produit
                                                </div>
                                            </th>
                                            <th className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="h-4 w-4" />
                                                    Type
                                                </div>
                                            </th>
                                            <th className="cursor-pointer px-6 py-4" onClick={() => changeSort('quantity')}>
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4" />
                                                    Quantité {filters.sort === 'quantity' && (filters.direction === 'asc' ? '▲' : '▼')}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <ClipboardSignature className="h-4 w-4" />
                                                    Référence
                                                </div>
                                            </th>
                                            <th className="cursor-pointer px-6 py-4" onClick={() => changeSort('total_cost')}>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4" />
                                                    Coût total {filters.sort === 'total_cost' && (filters.direction === 'asc' ? '▲' : '▼')}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Utilisateur
                                                </div>
                                            </th>
                                            {showActionsColumn && (
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
                                        {movements.data.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={showActionsColumn ? 8 : 7}
                                                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                                                >
                                                    Aucun mouvement trouvé.
                                                </td>
                                            </tr>
                                        ) : (
                                            movements.data.map((m) => {
                                                const canShow = can('stock_movement_show') && !m.deleted_at;
                                                const canEdit = can('stock_movement_edit') && !m.deleted_at;
                                                const canDel = can('stock_movement_delete') && !m.deleted_at;
                                                const canRes = can('stock_movement_restore') && !!m.deleted_at;
                                                const showRowActions = canShow || canEdit || canDel || canRes;

                                                return (
                                                    <tr
                                                        key={m.id}
                                                        className={`${m.deleted_at ? 'bg-red-50 dark:bg-red-900/10' : ''} transition-colors hover:bg-slate-50 dark:hover:bg-slate-800`}
                                                    >
                                                        <td className="px-4 py-3">{new Date(m.movement_date).toLocaleDateString('fr-FR')}</td>
                                                        <td className="px-6 py-3">
                                                            <div className="font-medium text-slate-900 dark:text-white">{m.product.name}</div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">{m.product.sku}</div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge(m.type)}`}
                                                            >
                                                                {m.type_label ?? (typeLbl as any)[m.type]}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <span
                                                                className={
                                                                    m.quantity >= 0
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : 'text-red-600 dark:text-red-400'
                                                                }
                                                            >
                                                                {m.formatted_quantity ?? `${m.quantity > 0 ? '+' : ''}${m.quantity}`}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3">{m.reference || '-'}</td>
                                                        <td className="px-6 py-3">
                                                            {m.total_cost ? `${m.total_cost} ${m.currency?.symbol ?? ''}` : '-'}
                                                        </td>
                                                        <td className="px-6 py-3">{m.user.name}</td>

                                                        {showActionsColumn && (
                                                            <td className="px-6 py-3 text-center">
                                                                {showRowActions ? (
                                                                    <div className="flex justify-center gap-2">
                                                                        {canShow && (
                                                                            <Link
                                                                                href={route('stock-movements.show', m.id)}
                                                                                className="rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                                aria-label="Voir"
                                                                            >
                                                                                <Eye className="h-5 w-5" />
                                                                            </Link>
                                                                        )}
                                                                        {canEdit && (
                                                                            <Link
                                                                                href={route('stock-movements.edit', m.id)}
                                                                                className="rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-800/30 dark:hover:text-yellow-300"
                                                                                aria-label="Éditer"
                                                                            >
                                                                                <Pencil className="h-5 w-5" />
                                                                            </Link>
                                                                        )}
                                                                        {canDel && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (!can('stock_movement_delete')) {
                                                                                        alert('Permission manquante: stock_movement_delete');
                                                                                        return;
                                                                                    }
                                                                                    if (confirm('Supprimer ce mouvement ?')) {
                                                                                        router.delete(
                                                                                            route('stock-movements.destroy', { id: m.id }),
                                                                                            iOpts,
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                className="rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-800/30 dark:hover:text-red-300"
                                                                                aria-label="Supprimer"
                                                                            >
                                                                                <Trash2 className="h-5 w-5" />
                                                                            </button>
                                                                        )}
                                                                        {canRes && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (!can('stock_movement_restore')) {
                                                                                        alert('Permission manquante: stock_movement_restore');
                                                                                        return;
                                                                                    }
                                                                                    router.post(
                                                                                        route('stock-movements.restore', { id: m.id }),
                                                                                        {},
                                                                                        iOpts,
                                                                                    );
                                                                                }}
                                                                                className="rounded-full p-1 text-yellow-400 hover:text-yellow-300"
                                                                                aria-label="Restaurer"
                                                                            >
                                                                                <RotateCcw className="h-5 w-5" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic dark:text-slate-600">—</span>
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
                        </div>

                        {/* Pagination ------------------------------------------------------------------ */}
                        <div className="mt-4 flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 shadow-xl backdrop-blur-md sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <span>
                                Affichage de {movements.current_page === 0 ? 0 : (movements.current_page - 1) * movements.per_page + 1}
                                &nbsp;à&nbsp;{Math.min(movements.current_page * movements.per_page, movements.total)}
                                &nbsp;sur&nbsp;{movements.total} résultats
                            </span>

                            {movements.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={movements.current_page === 1}
                                        onClick={() => changePage(1)}
                                        aria-label="Première page"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={movements.current_page === 1}
                                        onClick={() => changePage(movements.current_page - 1)}
                                        aria-label="Page précédente"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {windowPages.map((p, i) =>
                                        p === '…' ? (
                                            <span key={i} className="px-2 select-none">
                                                …
                                            </span>
                                        ) : (
                                            <Button
                                                key={p}
                                                size="sm"
                                                variant={p === movements.current_page ? 'default' : 'outline'}
                                                onClick={() => changePage(p as number)}
                                            >
                                                {p}
                                            </Button>
                                        ),
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={movements.current_page === movements.last_page}
                                        onClick={() => changePage(movements.current_page + 1)}
                                        aria-label="Page suivante"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={movements.current_page === movements.last_page}
                                        onClick={() => changePage(movements.last_page)}
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
