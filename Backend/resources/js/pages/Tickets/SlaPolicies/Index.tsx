import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, Filter, MousePointerClick, Pencil, Plus, Power, Search, SlidersHorizontal, Tag, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { ticketPriorityLabelFr } from '@/lib/tickets';

type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
};

type PolicyRow = {
    id: number;
    name: string;
    priority: TicketPriority | null;
    first_response_minutes: number;
    resolution_minutes: number;
    is_active: boolean;
};

type Props = {
    policies: Pagination<PolicyRow>;
    meta: { priorities: TicketPriority[] };
    filters?: { search?: string; priority?: TicketPriority | ''; is_active?: boolean | '' | 0 | 1 | '0' | '1'; per_page?: number | string; page?: number };
    flash?: { success?: string; error?: string };
    auth?: { roles?: any; permissions?: any };
};

const useCan = () => {
    const { props } = usePage<any>();
    const auth = (props as any)?.auth;
    const rolesRaw = auth?.roles ?? [];
    const roles: string[] = rolesRaw.map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean);
    const permsRaw = auth?.permissions ?? [];
    const perms: string[] = permsRaw.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean);
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const set = useMemo(() => new Set(perms), [perms]);
    const can = (p?: string) => !p || isSuperAdmin || set.has(p);
    return { can, isSuperAdmin };
};

const flashBox = {
    success: 'mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-100',
    error: 'mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100',
};

export default function TicketSlaPoliciesIndex() {
    const { can } = useCan();
    const { props } = usePage<Props>();

    const paginator = props.policies;
    const rows = paginator?.data ?? [];
    const flash = props.flash;
    const filters = props.filters ?? {};
    const meta = props.meta;

    const [showSuccess, setShowSuccess] = useState(true);
    const [showError, setShowError] = useState(true);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    const [search, setSearch] = useState(filters.search ?? '');
    const [priority, setPriority] = useState<string>(filters.priority ? String(filters.priority) : '');
    const [isActive, setIsActive] = useState<string>(
        typeof filters.is_active === 'boolean' ? (filters.is_active ? '1' : '0') : (filters.is_active as any) ? String(filters.is_active) : '',
    );

    const perPage = useMemo(() => {
        const fromFilters = filters.per_page;
        if (typeof fromFilters !== 'undefined' && fromFilters !== null && fromFilters !== '') return Number(fromFilters);
        return Number((paginator as any)?.per_page ?? 10);
    }, [filters.per_page, paginator]);

    const currentPage = Number(paginator?.current_page ?? 1);
    const lastPage = Number(paginator?.last_page ?? 1);

    const hasFilters = Boolean((search ?? '').trim() || priority || isActive);

    const apply = (extra: Record<string, any> = {}) => {
        router.get(
            route('tickets.sla-policies.index'),
            {
                search: (search ?? '').trim() || undefined,
                priority: priority || undefined,
                is_active: isActive === '' ? undefined : isActive === '1',
                per_page: perPage,
                page: extra.page ?? 1,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setPriority('');
        setIsActive('');
        router.get(route('tickets.sla-policies.index'), { per_page: perPage, page: 1 }, { preserveScroll: true, preserveState: true });
    };

    const pages = useMemo(() => {
        const win = 5;
        const out: (number | '…')[] = [];
        if (lastPage <= win + 2) {
            for (let i = 1; i <= lastPage; i++) out.push(i);
        } else {
            out.push(1);
            const s = Math.max(2, currentPage - 1);
            const e = Math.min(lastPage - 1, currentPage + 1);
            if (s > 2) out.push('…');
            for (let i = s; i <= e; i++) out.push(i);
            if (e < lastPage - 1) out.push('…');
            out.push(lastPage);
        }
        return out;
    }, [currentPage, lastPage]);

    const destroy = (policyId: number) => {
        if (!confirm('Supprimer cette politique SLA ? (suppression logique)')) return;
        router.delete(route('tickets.sla-policies.destroy', { policy: policyId }), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Politiques SLA" />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Tickets', href: '/tickets' },
                    { title: 'SLA', href: '/tickets/sla-policies' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        {flash?.success && showSuccess && (
                            <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                <p className="flex-1 font-medium">{flash.success}</p>
                                <button onClick={() => setShowSuccess(false)} className="text-green-500 hover:text-green-700 dark:text-green-300" aria-label="Fermer">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        {flash?.error && showError && (
                            <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <p className="flex-1 font-medium">{flash.error}</p>
                                <button onClick={() => setShowError(false)} className="text-red-500 hover:text-red-700 dark:text-red-300" aria-label="Fermer">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Politiques SLA</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Configuration des délais par priorité</p>
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

                                        {hasFilters && (
                                            <Button variant="outline" onClick={clearFilters} className="gap-1.5">
                                                <X className="h-4 w-4" /> Effacer filtres
                                            </Button>
                                        )}
                                    </div>

                                    {showFilterPanel && (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les politiques SLA
                                            </h3>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <div className="relative sm:col-span-2">
                                                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                    <input
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && apply({ page: 1 })}
                                                        placeholder="Rechercher par nom..."
                                                        className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    />
                                                </div>

                                                <div>
                                                    <select
                                                        value={priority}
                                                        onChange={(e) => setPriority(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Toutes priorités</option>
                                                        {meta.priorities.map((p) => (
                                                            <option key={p} value={p}>
                                                                {ticketPriorityLabelFr(p)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <select
                                                        value={isActive}
                                                        onChange={(e) => setIsActive(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Tous statuts</option>
                                                        <option value="1">Actif</option>
                                                        <option value="0">Inactif</option>
                                                    </select>
                                                </div>

                                                <div className="sm:col-span-3">
                                                    <Button onClick={() => apply({ page: 1 })} className="w-full">
                                                        Appliquer
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="ml-auto flex items-center gap-3">
                                    <div className="relative min-w-[220px]">
                                        <select
                                            value={String(perPage)}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                router.get(
                                                    route('tickets.sla-policies.index'),
                                                    {
                                                        search: (search ?? '').trim() || undefined,
                                                        priority: priority || undefined,
                                                        is_active: isActive === '' ? undefined : isActive === '1',
                                                        per_page: v,
                                                        page: 1,
                                                    },
                                                    { preserveScroll: true, preserveState: true },
                                                );
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

                                    {can('ticket_manage_sla') && (
                                        <Link href={route('tickets.sla-policies.create')}>
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" /> Nouvelle politique
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                    <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="h-4 w-4" /> Nom
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="h-4 w-4" /> Priorité
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" /> 1ère réponse
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" /> Résolution
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Power className="h-4 w-4" /> Actif
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
                                            rows.map((p) => (
                                            <tr key={p.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                                                    {p.priority ? ticketPriorityLabelFr(p.priority) : 'Toutes'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-200">{p.first_response_minutes} min</td>
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-200">{p.resolution_minutes} min</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                            p.is_active
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200'
                                                        }`}
                                                    >
                                                        {p.is_active ? 'Oui' : 'Non'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {can('ticket_manage_sla') && (
                                                            <Link
                                                                href={route('tickets.sla-policies.edit', { policy: p.id })}
                                                                className="inline-flex rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                aria-label="Modifier"
                                                                title="Modifier"
                                                            >
                                                                <Pencil className="h-5 w-5" />
                                                            </Link>
                                                        )}

                                                        {can('ticket_manage_sla') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => destroy(p.id)}
                                                                className="inline-flex rounded-full p-1 text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                                                                aria-label="Supprimer"
                                                                title="Supprimer"
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
                                                        <Tag className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                        <div>
                                                            <p className="font-medium">Aucune politique trouvée</p>
                                                            <p className="text-xs">Aucune politique ne correspond aux critères de recherche</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-300">
                                        Affichage de {paginator.from ?? 0} à {paginator.to ?? 0} sur {paginator.total ?? 0} politiques
                                    </span>
                                </div>

                                {lastPage > 1 && (
                                    <div className="flex items-center gap-1">
                                        <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => apply({ page: 1 })}>
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === 1}
                                            onClick={() => apply({ page: Math.max(1, currentPage - 1) })}
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
                                                    onClick={() => apply({ page: p })}
                                                >
                                                    {p}
                                                </Button>
                                            ),
                                        )}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === lastPage}
                                            onClick={() => apply({ page: Math.min(lastPage, currentPage + 1) })}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={currentPage === lastPage} onClick={() => apply({ page: lastPage })}>
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
