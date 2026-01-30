import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import { Eye, RefreshCcw, RotateCcw, Search, Trash2 } from 'lucide-react';

type WebOrderRow = {
    id: number;
    order_number: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total_ttc: number | string;
    currency_code: string;
    items_count: number;
    created_at: string;
    deleted_at?: string | null;
};

type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
};

const num = (v: number | string | null | undefined) => Number(v ?? 0);
const fmtMoney = (n: number | string, code: string) =>
    `${num(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`;

const statusLabel = (status: WebOrderRow['status']) => {
    switch (status) {
        case 'confirmed':
            return 'Confirmée';
        case 'processing':
            return 'En préparation';
        case 'shipped':
            return 'Expédiée';
        case 'delivered':
            return 'Livrée';
        case 'cancelled':
            return 'Annulée';
        default:
            return 'En attente';
    }
};

const badge = (status: WebOrderRow['status']) => {
    switch (status) {
        case 'delivered':
            return 'bg-emerald-100 text-emerald-700';
        case 'confirmed':
            return 'bg-green-100 text-green-700';
        case 'processing':
            return 'bg-blue-100 text-blue-700';
        case 'shipped':
            return 'bg-indigo-100 text-indigo-700';
        case 'cancelled':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
};

export default function WebOrdersIndex() {
    const { props } = usePage() as any;

    const raw = (props.orders ?? {
        data: [] as WebOrderRow[],
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0,
        total: 0,
        per_page: 15,
    }) as Pagination<WebOrderRow>;

    const filters = (props.filters ?? {}) as {
        search?: string;
        status?: string;
        with_trashed?: boolean;
        only_trashed?: boolean;
        per_page?: number;
    };

    const statuses = (props.statuses ?? ['pending', 'confirmed', 'cancelled']) as string[];

    const [searchValue, setSearchValue] = useState(filters.search ?? '');
    const [statusValue, setStatusValue] = useState(filters.status ?? '');
    const [withTrashed, setWithTrashed] = useState(Boolean(filters.with_trashed));
    const [onlyTrashed, setOnlyTrashed] = useState(Boolean(filters.only_trashed));

    const rows = raw.data ?? [];

    const go = (extra: Record<string, any> = {}) => {
        router.get(
            route('web-orders.index'),
            {
                search: searchValue || undefined,
                status: statusValue || undefined,
                with_trashed: onlyTrashed || withTrashed ? 1 : undefined,
                only_trashed: onlyTrashed ? 1 : undefined,
                per_page: raw.per_page,
                ...extra,
            },
            { preserveScroll: true, preserveState: true, only: ['orders', 'filters', 'statuses'] },
        );
    };

    const confirmArchive = (o: WebOrderRow) => {
        if (!confirm(`Archiver la commande ${o.order_number} ?`)) return;
        router.delete(route('web-orders.destroy', { id: o.id }), { preserveScroll: true });
    };

    const confirmRestore = (o: WebOrderRow) => {
        if (!confirm(`Restaurer la commande ${o.order_number} ?`)) return;
        router.post(route('web-orders.restore', { id: o.id }), {}, { preserveScroll: true });
    };

    const canRestore = useMemo(() => {
        const auth = (props.auth ?? {}) as any;
        const roles: string[] = auth.roles ?? [];
        const perms: string[] = auth.permissions ?? [];
        return roles.includes('SuperAdmin') || perms.includes('web_order_restore');
    }, [props.auth]);

    const canDelete = useMemo(() => {
        const auth = (props.auth ?? {}) as any;
        const roles: string[] = auth.roles ?? [];
        const perms: string[] = auth.permissions ?? [];
        return roles.includes('SuperAdmin') || perms.includes('web_order_delete');
    }, [props.auth]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Commandes Web', href: '/web-orders' }]}>
            <Head title="Commandes Web" />
            <ParticlesBackground />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Commandes Web</h1>
                    <Button variant="outline" onClick={() => go()}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Rafraîchir
                    </Button>
                </div>

                <div className="rounded-xl border bg-white/70 p-4 backdrop-blur dark:bg-neutral-900/60">
                    <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-600">Recherche</label>
                            <div className="relative">
                                <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                                <input
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full rounded-md border px-3 py-2 pl-9"
                                    placeholder="N° commande, nom, email, téléphone…"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Statut</label>
                            <select
                                value={statusValue}
                                onChange={(e) => setStatusValue(e.target.value)}
                                className="w-full rounded-md border px-3 py-2"
                            >
                                <option value="">Tous</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={withTrashed}
                                        onChange={(e) => {
                                            setWithTrashed(e.target.checked);
                                            if (!e.target.checked) setOnlyTrashed(false);
                                        }}
                                    />
                                    Inclure archivées
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={onlyTrashed}
                                        onChange={(e) => {
                                            setOnlyTrashed(e.target.checked);
                                            if (e.target.checked) setWithTrashed(true);
                                        }}
                                    />
                                    Archivées uniquement
                                </label>
                            </div>

                            <Button onClick={() => go({ page: 1 })}>Filtrer</Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-white dark:bg-neutral-900">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-gray-200">
                            <tr>
                                <th className="p-3 text-left">Commande</th>
                                <th className="p-3 text-left">Client</th>
                                <th className="p-3 text-left">Statut</th>
                                <th className="p-3 text-right">Total</th>
                                <th className="p-3 text-right">Articles</th>
                                <th className="p-3 text-left">Créée</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td className="p-6 text-center text-gray-500" colSpan={7}>
                                        Aucune commande.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((o) => (
                                    <tr key={o.id} className="border-t">
                                        <td className="p-3">
                                            <div className="font-semibold">{o.order_number}</div>
                                            {o.deleted_at ? <div className="text-xs text-red-600">Archivée</div> : null}
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium">{o.customer_name}</div>
                                            <div className="text-xs text-gray-500">{o.customer_email}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${badge(o.status)}`}>
                                                {statusLabel(o.status)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-semibold">{fmtMoney(o.total_ttc, o.currency_code)}</td>
                                        <td className="p-3 text-right">{o.items_count}</td>
                                        <td className="p-3 text-gray-600">{new Date(o.created_at).toLocaleString('fr-FR')}</td>
                                        <td className="p-3">
                                            <div className="flex justify-end gap-2">
                                                <Link href={route('web-orders.show', { id: o.id })}>
                                                    <Button variant="outline" size="sm" title="Voir">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {o.deleted_at ? (
                                                    canRestore ? (
                                                        <Button variant="outline" size="sm" title="Restaurer" onClick={() => confirmRestore(o)}>
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    ) : null
                                                ) : canDelete ? (
                                                    <Button variant="destructive" size="sm" title="Archiver" onClick={() => confirmArchive(o)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="flex items-center justify-between border-t p-4 text-sm text-gray-600">
                        <div>
                            {raw.from}–{raw.to} sur {raw.total}
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                className="rounded-md border px-2 py-1 text-sm"
                                value={raw.per_page}
                                onChange={(e) => go({ page: 1, per_page: Number(e.target.value) })}
                                title="Résultats par page"
                            >
                                {[15, 30, 50].map((n) => (
                                    <option key={n} value={n}>
                                        {n}/page
                                    </option>
                                ))}
                            </select>
                            <Button variant="outline" size="sm" disabled={raw.current_page <= 1} onClick={() => go({ page: raw.current_page - 1 })}>
                                Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={raw.current_page >= raw.last_page}
                                onClick={() => go({ page: raw.current_page + 1 })}
                            >
                                Suivant
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
