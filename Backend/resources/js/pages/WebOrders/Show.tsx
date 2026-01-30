import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';

type WebOrderItem = {
    id: number;
    product_id: string;
    product_name_snapshot: string;
    product_sku_snapshot?: string | null;
    unit_price_ht_snapshot: number | string;
    tax_rate_snapshot: number | string;
    quantity: number;
    line_total_ht: number | string;
    line_tax_amount: number | string;
    line_total_ttc: number | string;
};

type WebOrderStatusHistory = {
    id: number;
    from_status: string | null;
    to_status: string;
    comment: string | null;
    created_at: string;
    user?: { id: number; name: string } | null;
};

type WebOrder = {
    id: number;
    order_number: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_method: 'cod';
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: {
        address1: string;
        address2?: string;
        city: string;
        postal_code?: string;
        country?: string;
    };
    subtotal_ht: number | string;
    total_tax: number | string;
    total_ttc: number | string;
    currency_code: string;
    notes?: string | null;
    created_at: string;
    deleted_at?: string | null;
    items: WebOrderItem[];
    status_histories?: WebOrderStatusHistory[];
};

const num = (v: number | string | null | undefined) => Number(v ?? 0);
const fmtMoney = (n: number | string, code: string) =>
    `${num(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`;

const statusLabel = (status: WebOrder['status']) => {
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

export default function WebOrdersShow() {
    const { props } = usePage() as any;
    const order = props.order as WebOrder;
    const statuses = (props.statuses ?? ['pending', 'confirmed', 'cancelled']) as WebOrder['status'][];

    const [status, setStatus] = useState<WebOrder['status']>(order.status);
    const [comment, setComment] = useState<string>('');

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

    const canEdit = useMemo(() => {
        const auth = (props.auth ?? {}) as any;
        const roles: string[] = auth.roles ?? [];
        const perms: string[] = auth.permissions ?? [];
        return roles.includes('SuperAdmin') || perms.includes('web_order_edit');
    }, [props.auth]);

    const submitStatus = () => {
        if (!canEdit) return;
        if (!comment.trim()) {
            alert('Veuillez ajouter un commentaire (obligatoire).');
            return;
        }
        if (!confirm(`Mettre à jour le statut vers "${statusLabel(status)}" ?`)) return;
        router.post(
            route('web-orders.change-status', { id: order.id }),
            { status, comment: comment.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setComment('');
                    router.visit(route('web-orders.index'));
                },
            },
        );
    };

    const confirmArchive = () => {
        if (!canDelete) return;
        if (!confirm(`Archiver la commande ${order.order_number} ?`)) return;
        router.delete(route('web-orders.destroy', { id: order.id }), { preserveScroll: true });
    };

    const confirmRestore = () => {
        if (!canRestore) return;
        if (!confirm(`Restaurer la commande ${order.order_number} ?`)) return;
        router.post(route('web-orders.restore', { id: order.id }), {}, { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Commandes Web', href: '/web-orders' },
                { title: order.order_number, href: `/web-orders/${order.id}` },
            ]}
        >
            <Head title={order.order_number} />
            <ParticlesBackground />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('web-orders.index')}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">{order.order_number}</h1>
                            <div className="text-sm text-gray-600">Créée le {new Date(order.created_at).toLocaleString('fr-FR')}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {order.deleted_at ? (
                            canRestore ? (
                                <Button variant="outline" onClick={confirmRestore}>
                                    <RotateCcw className="mr-2 h-4 w-4" /> Restaurer
                                </Button>
                            ) : null
                        ) : canDelete ? (
                            <Button variant="destructive" onClick={confirmArchive}>
                                <Trash2 className="mr-2 h-4 w-4" /> Archiver
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-xl border bg-white p-5 dark:bg-neutral-900">
                            <h2 className="mb-3 font-semibold">Articles</h2>
                            <div className="divide-y">
                                {order.items?.map((it) => (
                                    <div key={it.id} className="flex items-start justify-between gap-4 py-3">
                                        <div>
                                            <div className="font-medium">{it.product_name_snapshot}</div>
                                            <div className="text-xs text-gray-500">
                                                SKU: {it.product_sku_snapshot || '—'} • Qté: {it.quantity}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold">{fmtMoney(it.line_total_ttc, order.currency_code)}</div>
                                            <div className="text-xs text-gray-500">TVA: {num(it.tax_rate_snapshot).toFixed(2)}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-3">
                                <div className="flex items-center justify-between sm:block">
                                    <div className="text-gray-600">Sous-total HT</div>
                                    <div className="font-semibold">{fmtMoney(order.subtotal_ht, order.currency_code)}</div>
                                </div>
                                <div className="flex items-center justify-between sm:block">
                                    <div className="text-gray-600">TVA</div>
                                    <div className="font-semibold">{fmtMoney(order.total_tax, order.currency_code)}</div>
                                </div>
                                <div className="flex items-center justify-between sm:block">
                                    <div className="text-gray-600">Total TTC</div>
                                    <div className="font-bold">{fmtMoney(order.total_ttc, order.currency_code)}</div>
                                </div>
                            </div>
                        </div>

                        {order.notes ? (
                            <div className="rounded-xl border bg-white p-5 dark:bg-neutral-900">
                                <h2 className="mb-2 font-semibold">Notes</h2>
                                <div className="text-sm whitespace-pre-wrap text-gray-700">{order.notes}</div>
                            </div>
                        ) : null}
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-xl border bg-white p-5 dark:bg-neutral-900">
                            <h2 className="mb-3 font-semibold">Statut</h2>
                            <div className="flex items-center gap-2">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    className="flex-1 rounded-md border px-3 py-2"
                                    disabled={!canEdit}
                                >
                                    {statuses.map((s) => (
                                        <option key={s} value={s}>
                                            {statusLabel(s)}
                                        </option>
                                    ))}
                                </select>
                                <Button onClick={submitStatus} disabled={!canEdit}>
                                    Mettre à jour
                                </Button>
                            </div>

                            <div className="mt-3">
                                <label className="text-sm text-gray-600">Commentaire (obligatoire)</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                    rows={3}
                                    placeholder="Ex: Appel client effectué, commande confirmée…"
                                    disabled={!canEdit}
                                />
                            </div>

                            {order.deleted_at ? <div className="mt-2 text-xs text-red-600">Commande archivée (soft-deleted).</div> : null}
                        </div>

                        <div className="rounded-xl border bg-white p-5 dark:bg-neutral-900">
                            <h2 className="mb-3 font-semibold">Historique statut</h2>
                            <div className="space-y-3">
                                {(order.status_histories ?? []).length === 0 ? (
                                    <div className="text-sm text-gray-500">Aucun changement enregistré.</div>
                                ) : (
                                    (order.status_histories ?? []).map((h) => (
                                        <div key={h.id} className="rounded-lg border p-3">
                                            <div className="text-sm font-medium">
                                                {h.from_status ? statusLabel(h.from_status as any) : 'Nouveau'} → {statusLabel(h.to_status as any)}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {new Date(h.created_at).toLocaleString('fr-FR')}
                                                {h.user?.name ? ` • ${h.user.name}` : ''}
                                            </div>
                                            {h.comment ? <div className="mt-2 text-sm whitespace-pre-wrap text-gray-700">{h.comment}</div> : null}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-white p-5 dark:bg-neutral-900">
                            <h2 className="mb-3 font-semibold">Client</h2>
                            <div className="text-sm">
                                <div className="font-medium">{order.customer_name}</div>
                                <div className="text-gray-600">{order.customer_email}</div>
                                <div className="text-gray-600">{order.customer_phone}</div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-white p-5 dark:bg-neutral-900">
                            <h2 className="mb-3 font-semibold">Livraison</h2>
                            <div className="text-sm text-gray-700">
                                <div>{order.shipping_address?.address1}</div>
                                {order.shipping_address?.address2 ? <div>{order.shipping_address.address2}</div> : null}
                                <div>
                                    {order.shipping_address?.postal_code ? `${order.shipping_address.postal_code} ` : ''}
                                    {order.shipping_address?.city}
                                </div>
                                <div>{order.shipping_address?.country || '—'}</div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
