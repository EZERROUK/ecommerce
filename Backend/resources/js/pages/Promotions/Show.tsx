import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Banknote, Calendar, Hash, Info, KeyRound, Layers, Package, Pencil, Percent, Power, Shield, Tag } from 'lucide-react';
import React, { JSX, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type PromotionType = 'order' | 'category' | 'product' | 'bogo';
type ApplyScope = 'order' | 'category' | 'product';

type Tab = 'details' | 'conditions' | 'rule' | 'targeting';

type Promotion = {
    id: number;
    name: string;
    description?: string | null;
    type: PromotionType;
    apply_scope: ApplyScope;
    priority?: number | null;
    is_active: boolean;
    is_exclusive: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
    days_of_week?: number | null;
    min_subtotal?: number | string | null;
    min_quantity?: number | string | null;
    stop_further_processing?: boolean;
    action?: {
        action_type: string;
        value: number | string | null;
        max_discount_amount?: number | string | null;
    } | null;
    code?: string | null;
    categories?: Array<{ id: number; name: string }>;
    products?: Array<{ id: string; name: string; sku?: string | null }>;
};

interface Props {
    promotion: Promotion;
}

const useCan = () => {
    const { props } = usePage<{ auth?: { roles?: string[]; permissions?: string[] } }>();
    const roles = props.auth?.roles ?? [];
    const perms = props.auth?.permissions;
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const set = useMemo(() => new Set(perms ?? []), [perms]);
    const can = (p?: string) => !p || isSuperAdmin || set.has(p);
    return { can, isSuperAdmin };
};

const DAYS = [
    { key: 0, label: 'Di' },
    { key: 1, label: 'Lu' },
    { key: 2, label: 'Ma' },
    { key: 3, label: 'Me' },
    { key: 4, label: 'Je' },
    { key: 5, label: 'Ve' },
    { key: 6, label: 'Sa' },
];

const hasDay = (mask: number, d: number) => (mask & (1 << d)) !== 0;

const formatDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR');
};

const getTypeLabel = (t: PromotionType) => ({ order: 'Commande', category: 'Catégorie', product: 'Produit', bogo: 'BOGO' })[t] ?? t;

const getScopeLabel = (s: ApplyScope) => ({ order: 'Order', category: 'Category', product: 'Product' })[s] ?? s;

const formatMoney = (v: unknown, currency = 'MAD') => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return '—';
    try {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n);
    } catch {
        return `${n} ${currency}`;
    }
};

const formatAction = (p: Promotion) => {
    const a = p.action;
    if (!a) return '—';
    const v = a.value;
    if (a.action_type === 'percent') return `${Number(v)}%`;
    if (a.action_type === 'fixed') return formatMoney(v);
    // autres types possibles côté backend (bogo_*)
    return `${a.action_type}${v != null ? `: ${v}` : ''}`;
};

export default function PromotionShow({ promotion }: Props) {
    const { can } = useCan();

    const [activeTab, setActiveTab] = useState<Tab>('details');

    const categories = promotion.categories ?? [];
    const products = promotion.products ?? [];

    const daysMask = typeof promotion.days_of_week === 'number' ? promotion.days_of_week : null;
    const daysLabel =
        daysMask == null
            ? '—'
            : DAYS.filter((d) => hasDay(daysMask, d.key))
                  .map((d) => d.label)
                  .join(', ') || 'Aucun';

    const canEdit = can('promotion_edit');

    return (
        <>
            <Head title={`Promotion – ${promotion.name}`} />

            <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Promotions', href: '/promotions' },
                        { title: promotion.name, href: route('promotions.show', promotion.id) },
                    ]}
                >
                    <div className="space-y-6 p-6">
                        {/* Header card */}
                        <div className="flex flex-col items-start gap-6 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-xl backdrop-blur-md sm:px-5 sm:py-5 lg:flex-row dark:border-slate-700 dark:bg-white/5">
                            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                <Tag className="h-9 w-9 text-slate-400" />
                            </div>

                            <div className="flex-1 space-y-2">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{promotion.name}</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{promotion.description || 'Aucune description'}</p>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    {promotion.is_active ? (
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            <Power className="mr-1 h-3 w-3" />
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">Inactive</Badge>
                                    )}
                                    {promotion.is_exclusive && (
                                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Exclusive</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:w-auto">
                                <Link href={route('promotions.index')} className="w-full sm:w-auto">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                        <ArrowLeft className="mr-1 h-4 w-4" />
                                        Retour
                                    </Button>
                                </Link>
                                {canEdit && (
                                    <Link href={route('promotions.edit', promotion.id)} className="w-full sm:w-auto">
                                        <Button
                                            size="lg"
                                            className="group relative flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-sm font-semibold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 focus:ring-2 focus:ring-red-500 sm:w-auto"
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* -------- Onglets (même structure que Clients/Show) -------- */}
                        <div className="grid min-h-[350px] grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md md:grid-cols-4 dark:border-slate-700 dark:bg-white/5">
                            {/* liste des tabs */}
                            <div className="flex flex-col border-r border-slate-200 dark:border-slate-700">
                                {(['details', 'conditions', 'rule', 'targeting'] as Tab[]).map((tab) => (
                                    <TabButton key={tab} tab={tab} active={activeTab} setActive={setActiveTab} />
                                ))}
                            </div>

                            {/* contenu */}
                            <div className="overflow-y-auto p-6 text-slate-700 md:col-span-3 dark:text-slate-300">
                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                            <Info className="h-5 w-5" />
                                            Détails
                                        </h2>

                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                                            <InfoRow icon={Shield} label="Type" value={getTypeLabel(promotion.type)} />
                                            <InfoRow icon={Shield} label="Portée" value={getScopeLabel(promotion.apply_scope)} />
                                            <InfoRow icon={Hash} label="Priorité" value={promotion.priority ?? '—'} />
                                            <InfoRow
                                                icon={Power}
                                                label="Statut"
                                                value={
                                                    promotion.is_active ? (
                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                            Inactive
                                                        </Badge>
                                                    )
                                                }
                                            />
                                            <InfoRow
                                                icon={Shield}
                                                label="Exclusivité"
                                                value={
                                                    promotion.is_exclusive ? (
                                                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Exclusive</Badge>
                                                    ) : (
                                                        'Non'
                                                    )
                                                }
                                            />
                                            <InfoRow icon={Info} label="Description" value={promotion.description || '—'} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'conditions' && (
                                    <div className="space-y-6">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                            <Calendar className="h-5 w-5" />
                                            Conditions
                                        </h2>

                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                                            <InfoRow icon={Calendar} label="Débute" value={formatDateTime(promotion.starts_at)} />
                                            <InfoRow icon={Calendar} label="Se termine" value={formatDateTime(promotion.ends_at)} />
                                            <InfoRow icon={Calendar} label="Jours" value={daysLabel} />
                                            <InfoRow
                                                icon={Banknote}
                                                label="Sous-total min."
                                                value={
                                                    promotion.min_subtotal != null && promotion.min_subtotal !== ''
                                                        ? formatMoney(promotion.min_subtotal)
                                                        : '—'
                                                }
                                            />
                                            <InfoRow
                                                icon={Hash}
                                                label="Quantité min."
                                                value={
                                                    promotion.min_quantity != null && promotion.min_quantity !== ''
                                                        ? String(promotion.min_quantity)
                                                        : '—'
                                                }
                                            />
                                            <InfoRow
                                                icon={Shield}
                                                label="Stop traitement"
                                                value={promotion.stop_further_processing ? 'Oui' : 'Non'}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'rule' && (
                                    <div className="space-y-6">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                            {promotion.action?.action_type === 'percent' ? (
                                                <Percent className="h-5 w-5" />
                                            ) : (
                                                <Banknote className="h-5 w-5" />
                                            )}
                                            Règle de remise
                                        </h2>

                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                            <InfoRow icon={Shield} label="Action" value={promotion.action?.action_type ?? '—'} />
                                            <InfoRow icon={Percent} label="Valeur" value={formatAction(promotion)} />
                                            <InfoRow icon={KeyRound} label="Code" value={promotion.code || '—'} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'targeting' && (
                                    <div className="space-y-6">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                            <Layers className="h-5 w-5" />
                                            Ciblage
                                        </h2>

                                        {promotion.apply_scope === 'category' ? (
                                            <div>
                                                <div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Catégories</div>
                                                {!categories.length ? (
                                                    <div className="text-sm text-slate-500">Aucune catégorie sélectionnée.</div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {categories.map((c) => (
                                                            <span
                                                                key={c.id}
                                                                className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                                                            >
                                                                {c.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : promotion.apply_scope === 'product' ? (
                                            <div>
                                                <div className="mb-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <Package className="h-4 w-4" /> Produits
                                                </div>
                                                {!products.length ? (
                                                    <div className="text-sm text-slate-500">Aucun produit sélectionné.</div>
                                                ) : (
                                                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                                            <thead className="bg-slate-50 dark:bg-slate-800">
                                                                <tr className="text-left text-slate-600 dark:text-slate-300">
                                                                    <th className="px-4 py-3">Produit</th>
                                                                    <th className="px-4 py-3">SKU</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-transparent">
                                                                {products.map((p) => (
                                                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                                            {p.name}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                                            {p.sku || '—'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-500">Portée: commande (pas de ciblage spécifique).</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>
        </>
    );
}

const TabButton = ({ tab, active, setActive }: { tab: Tab; active: Tab; setActive: (t: Tab) => void }) => {
    const icons: Record<Tab, JSX.Element> = {
        details: <Info className="mr-2 inline h-4 w-4" />,
        conditions: <Calendar className="mr-2 inline h-4 w-4" />,
        rule: <Percent className="mr-2 inline h-4 w-4" />,
        targeting: <Layers className="mr-2 inline h-4 w-4" />,
    };

    const labels: Record<Tab, string> = {
        details: 'Détails',
        conditions: 'Conditions',
        rule: 'Règle',
        targeting: 'Ciblage',
    };

    const isActive = active === tab;

    return (
        <button
            onClick={() => setActive(tab)}
            className={`flex w-full items-center px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                    ? 'rounded-l-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-inner'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
            } `}
            type="button"
        >
            {icons[tab]} {labels[tab]}
        </button>
    );
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="mt-1 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
                <div className="text-sm font-medium break-words text-slate-900 dark:text-white/90">{value}</div>
            </div>
        </div>
    );
}
