import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Filter,
    MousePointerClick,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Tag,
    Ticket as TicketIcon,
    Trash2,
    Users,
    X,
    Eye,
    Power,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { ticketPriorityLabelFr, ticketStatusLabelFr } from '@/lib/tickets';

type TicketStatus =
    | 'new'
    | 'open'
    | 'pending_customer'
    | 'pending_internal'
    | 'on_hold'
    | 'resolved'
    | 'closed'
    | 'cancelled';

type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
};

type TicketRow = {
    id: number;
    code?: string | null;
    title?: string | null;
    status: TicketStatus;
    priority: TicketPriority;
    client?: { id: number; company_name: string; contact_name?: string | null } | null;
    assigned_to?: { id: number; name: string } | null;
    created_at?: string | null;
    updated_at?: string | null;
    last_activity_at?: string | null;
};

type Filters = {
    search?: string;
    status?: TicketStatus | '';
    priority?: TicketPriority | '';
    assigned_to_user_id?: number | string | '';
    per_page?: number | string;
    page?: number;
};

type Agent = { id: number; name: string };

type Props = {
    tickets: Pagination<TicketRow>;
    filters: Filters;
    agents: Agent[];
    meta: { statuses: TicketStatus[]; priorities: TicketPriority[] };
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

const badge = (v: string) => 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-100';

function pageWindow(current: number, last: number): Array<number | '…'> {
    const radius = 2;
    const pages: Array<number | '…'> = [];
    const start = Math.max(1, current - radius);
    const end = Math.min(last, current + radius);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push('…');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < last - 1) pages.push('…');
    if (end < last) pages.push(last);
    return pages;
}

export default function TicketsIndex() {
    const { can } = useCan();
    const { props } = usePage<Props>();

    const tickets = props.tickets;
    const filters = props.filters ?? {};
    const agents = props.agents ?? [];
    const meta = props.meta;
    const flash = props.flash;

    const [showSuccess, setShowSuccess] = useState(true);
    const [showError, setShowError] = useState(true);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState<TicketStatus | ''>((filters.status as any) ?? '');
    const [priority, setPriority] = useState<TicketPriority | ''>((filters.priority as any) ?? '');
    const [assigned, setAssigned] = useState<string>(filters.assigned_to_user_id ? String(filters.assigned_to_user_id) : '');

    const [perPage, setPerPage] = useState<string>(filters.per_page ? String(filters.per_page) : String(tickets.per_page ?? 15));

    const hasActiveFilters = Boolean((search ?? '').trim() || status || priority || assigned);

    const apply = (extra: { page?: number } = {}) => {
        router.get(
            route('tickets.index'),
            {
                search: (search ?? '').trim() || undefined,
                status: status || undefined,
                priority: priority || undefined,
                assigned_to_user_id: assigned || undefined,
                per_page: perPage || undefined,
                page: extra.page ?? 1,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const clearAllFilters = () => {
        setSearch('');
        setStatus('');
        setPriority('');
        setAssigned('');
        router.get(route('tickets.index'), { per_page: perPage || undefined, page: 1 }, { preserveScroll: true, preserveState: true });
    };

    const destroy = (ticketId: number) => {
        if (!confirm('Supprimer ce ticket ? (suppression logique)')) return;

        router.delete(route('tickets.destroy', { ticket: ticketId }), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Tickets" />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Tickets', href: '/tickets' },
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
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des tickets</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Helpdesk et support client</p>
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

                                        {hasActiveFilters && (
                                            <Button variant="outline" onClick={clearAllFilters} className="gap-1.5">
                                                <X className="h-4 w-4" /> Effacer filtres
                                            </Button>
                                        )}
                                    </div>

                                    {showFilterPanel && (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-3xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les tickets
                                            </h3>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                                                <div className="relative sm:col-span-2">
                                                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                    <input
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && apply({ page: 1 })}
                                                        placeholder="Rechercher (code, titre, client…)"
                                                        className="w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    />
                                                </div>

                                                <div>
                                                    <select
                                                        value={status}
                                                        onChange={(e) => setStatus((e.target.value as any) || '')}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Tous statuts</option>
                                                        {meta.statuses.map((s) => (
                                                            <option key={s} value={s}>
                                                                {ticketStatusLabelFr(s)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <select
                                                        value={priority}
                                                        onChange={(e) => setPriority((e.target.value as any) || '')}
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
                                                        value={assigned}
                                                        onChange={(e) => setAssigned(e.target.value)}
                                                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                    >
                                                        <option value="">Tous agents</option>
                                                        {agents.map((a) => (
                                                            <option key={a.id} value={String(a.id)}>
                                                                {a.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="sm:col-span-5">
                                                    <Button onClick={() => apply({ page: 1 })} className="w-full">
                                                        Appliquer
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {hasActiveFilters && (
                                        <div className="flex flex-wrap gap-2">
                                            {(search ?? '').trim() ? (
                                                <span className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
                                                    <span className="font-medium">Recherche:</span>
                                                    {(search ?? '').trim()}
                                                    <button
                                                        onClick={() => {
                                                            setSearch('');
                                                            router.get(
                                                                route('tickets.index'),
                                                                {
                                                                    status: status || undefined,
                                                                    priority: priority || undefined,
                                                                    assigned_to_user_id: assigned || undefined,
                                                                    per_page: perPage || undefined,
                                                                    page: 1,
                                                                },
                                                                { preserveScroll: true, preserveState: true },
                                                            );
                                                        }}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ) : null}

                                            {status ? (
                                                <span className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
                                                    <span className="font-medium">Statut:</span>
                                                    {ticketStatusLabelFr(status)}
                                                    <button
                                                        onClick={() => {
                                                            setStatus('');
                                                            router.get(
                                                                route('tickets.index'),
                                                                {
                                                                    search: (search ?? '').trim() || undefined,
                                                                    priority: priority || undefined,
                                                                    assigned_to_user_id: assigned || undefined,
                                                                    per_page: perPage || undefined,
                                                                    page: 1,
                                                                },
                                                                { preserveScroll: true, preserveState: true },
                                                            );
                                                        }}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ) : null}

                                            {priority ? (
                                                <span className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
                                                    <span className="font-medium">Priorité:</span>
                                                    {ticketPriorityLabelFr(priority)}
                                                    <button
                                                        onClick={() => {
                                                            setPriority('');
                                                            router.get(
                                                                route('tickets.index'),
                                                                {
                                                                    search: (search ?? '').trim() || undefined,
                                                                    status: status || undefined,
                                                                    assigned_to_user_id: assigned || undefined,
                                                                    per_page: perPage || undefined,
                                                                    page: 1,
                                                                },
                                                                { preserveScroll: true, preserveState: true },
                                                            );
                                                        }}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ) : null}

                                            {assigned ? (
                                                <span className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
                                                    <span className="font-medium">Agent:</span>
                                                    {agents.find((a) => String(a.id) === String(assigned))?.name ?? assigned}
                                                    <button
                                                        onClick={() => {
                                                            setAssigned('');
                                                            router.get(
                                                                route('tickets.index'),
                                                                {
                                                                    search: (search ?? '').trim() || undefined,
                                                                    status: status || undefined,
                                                                    priority: priority || undefined,
                                                                    per_page: perPage || undefined,
                                                                    page: 1,
                                                                },
                                                                { preserveScroll: true, preserveState: true },
                                                            );
                                                        }}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ) : null}
                                        </div>
                                    )}
                                </div>

                                <div className="ml-auto flex items-center gap-3">
                                    <div className="relative min-w-[220px]">
                                        <select
                                            value={perPage}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setPerPage(v);
                                                router.get(
                                                    route('tickets.index'),
                                                    {
                                                        search: (search ?? '').trim() || undefined,
                                                        status: status || undefined,
                                                        priority: priority || undefined,
                                                        assigned_to_user_id: assigned || undefined,
                                                        per_page: v || undefined,
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

                                    {can('ticket_create') && (
                                        <Link href={route('tickets.create')}>
                                            <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600">
                                                <Plus className="mr-1 h-4 w-4" /> Nouveau ticket
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
                                                    <Tag className="h-4 w-4" /> Code
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left">
                                                <div className="flex items-center gap-2">
                                                    <TicketIcon className="h-4 w-4" /> Titre
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" /> Client
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Power className="h-4 w-4" /> Statut
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" /> Priorité
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" /> Assigné
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
                                        {tickets.data.map((t) => (
                                            <tr key={t.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-200">{t.code ?? `#${t.id}`}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900 dark:text-white">{t.title ?? '(sans titre)'}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">MAJ: {t.last_activity_at ?? t.updated_at ?? '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-200">{t.client?.company_name ?? '-'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={badge(t.status)}>{ticketStatusLabelFr(t.status)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={badge(t.priority)}>{ticketPriorityLabelFr(t.priority)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 dark:text-slate-200">{t.assigned_to?.name ?? '-'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {can('ticket_show') && (
                                                            <Link
                                                                href={route('tickets.show', { ticket: t.id })}
                                                                className="inline-flex rounded-full p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:hover:text-blue-300"
                                                                aria-label="Voir"
                                                                title="Voir"
                                                            >
                                                                <Eye className="h-5 w-5" />
                                                            </Link>
                                                        )}

                                                        {can('ticket_edit') && (
                                                            <Link
                                                                href={route('tickets.edit', { ticket: t.id })}
                                                                className="inline-flex rounded-full p-1 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-900 dark:text-yellow-400 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-300"
                                                                aria-label="Modifier"
                                                                title="Modifier"
                                                            >
                                                                <Pencil className="h-5 w-5" />
                                                            </Link>
                                                        )}

                                                        {can('ticket_delete') && (
                                                            <button
                                                                onClick={() => destroy(t.id)}
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
                                        ))}

                                        {tickets.data.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <TicketIcon className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                        <div>
                                                            <p className="font-medium">Aucun ticket trouvé</p>
                                                            <p className="text-xs">Aucun ticket ne correspond aux critères de recherche</p>
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
                                        Affichage de {tickets.from ?? 0} à {tickets.to ?? 0} sur {tickets.total ?? 0} tickets
                                    </span>
                                </div>

                                {(() => {
                                    const currentPage = Number(tickets.current_page ?? 1);
                                    const lastPage = Number(tickets.last_page ?? 1);
                                    const pages = pageWindow(currentPage, lastPage);
                                    if (lastPage <= 1) return null;

                                    return (
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
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
