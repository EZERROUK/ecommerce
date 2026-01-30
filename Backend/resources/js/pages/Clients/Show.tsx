import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building,
    Building2,
    Calendar,
    CreditCard,
    FileText,
    Hash,
    Info,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Receipt,
    Shield,
    User,
    Users,
} from 'lucide-react';
import React, { JSX, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

// Types et props (inchangés)
type Tab = 'details' | 'fiscal' | 'quotes' | 'orders' | 'notes';

interface Client {
    id: number;
    company_name: string;
    contact_name?: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    postal_code?: string;
    country: string;
    ice?: string;
    rc?: string;
    patente?: string;
    cnss?: string;
    if_number?: string;
    tax_regime: 'normal' | 'auto_entrepreneur' | 'exonere';
    is_tva_subject: boolean;
    is_active: boolean;
    notes?: string;
    created_at: string;
    updated_at?: string;
    creator?: { id: number; name: string } | null;
    updater?: { id: number; name: string } | null;
    quotes: Array<{
        id: number;
        quote_number: string;
        status: string;
        total_ttc: number;
        currency_code: string;
        created_at: string;
    }>;
    orders: Array<{
        id: number;
        order_number: string;
        status: string;
        total_ttc: number;
        currency_code: string;
        created_at: string;
    }>;
}

interface Props {
    client: Client;
}

// Hook pour gérer les permissions
const useCan = () => {
    const { props } = usePage<{ auth?: { roles?: string[]; permissions?: string[] } }>();
    const roles = props.auth?.roles ?? [];
    const perms = props.auth?.permissions;
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const set = useMemo(() => new Set(perms ?? []), [perms]);
    const can = (p?: string) => !p || isSuperAdmin || set.has(p);
    return { can, isSuperAdmin };
};

// Composant principal
export default function ClientShow({ client }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const { can } = useCan(); // Utilisation des permissions

    // Données dérivées
    const isDeleted = !client.is_active;
    const created = new Date(client.created_at);
    const updated = client.updated_at ? new Date(client.updated_at) : null;

    const getTaxRegimeLabel = (regime: string) => {
        const labels = {
            normal: 'Normal',
            auto_entrepreneur: 'Auto-entrepreneur',
            exonere: 'Exonéré',
        };
        return labels[regime as keyof typeof labels] || regime;
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'red' | 'green' | 'secondary' | 'default'> = {
            draft: 'secondary',
            sent: 'default',
            viewed: 'default',
            accepted: 'green',
            rejected: 'red',
            expired: 'secondary',
            converted: 'green',
            pending: 'secondary',
            confirmed: 'green',
            processing: 'default',
            shipped: 'default',
            delivered: 'green',
            cancelled: 'red',
        };
        return variants[status] || 'secondary';
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            draft: 'Brouillon',
            sent: 'Envoyé',
            viewed: 'Consulté',
            accepted: 'Accepté',
            rejected: 'Refusé',
            expired: 'Expiré',
            converted: 'Converti',
            pending: 'En attente',
            confirmed: 'Confirmé',
            processing: 'En cours',
            shipped: 'Expédié',
            delivered: 'Livré',
            cancelled: 'Annulé',
        };
        return labels[status as keyof typeof labels] || status;
    };

    return (
        <>
            <Head title={`Client – ${client.company_name}`} />

            <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Clients', href: '/clients' },
                        { title: client.company_name, href: route('clients.show', client.id) },
                    ]}
                >
                    <div className="p-6">
                        <div className="flex flex-col items-start gap-6 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-xl backdrop-blur-md sm:px-5 sm:py-5 lg:flex-row dark:border-slate-700 dark:bg-white/5">
                            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                <Building2 className="h-12 w-12 text-slate-400" />
                            </div>

                            <div className="flex-1 space-y-2">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{client.company_name}</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{client.contact_name || 'Aucun contact'}</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-medium">Email :</span> {client.email}
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-medium">Ville :</span> {client.city}
                                </p>
                                {isDeleted ? <Badge text="Inactif" color="red" /> : <Badge text="Actif" color="green" />}
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:w-auto">
                                <Link href={route('clients.index')} className="w-full sm:w-auto">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                        <ArrowLeft className="mr-1 h-4 w-4" />
                                        Retour
                                    </Button>
                                </Link>
                                {can('client_edit') && !isDeleted && (
                                    <Link href={route('clients.edit', client.id)} className="w-full sm:w-auto">
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
                    </div>

                    {/* -------- Onglets -------- */}
                    <div className="flex-grow px-6 pt-2 pb-6">
                        <div className="grid min-h-[350px] grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md md:grid-cols-4 dark:border-slate-700 dark:bg-white/5">
                            {/* liste des tabs */}
                            <div className="flex flex-col border-r border-slate-200 dark:border-slate-700">
                                {(['details', 'fiscal', 'quotes', 'orders', 'notes'] as Tab[]).map((tab) => (
                                    <TabButton key={tab} tab={tab} active={activeTab} setActive={setActiveTab} />
                                ))}
                            </div>

                            {/* contenu */}
                            <div className="overflow-y-auto p-6 text-slate-700 md:col-span-3 dark:text-slate-300">
                                {activeTab === 'details' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail icon={Building2} label="Entreprise" value={client.company_name} />
                                        <Detail icon={User} label="Contact" value={client.contact_name || '—'} />
                                        <Detail icon={Mail} label="Email" value={client.email} />
                                        <Detail icon={Phone} label="Téléphone" value={client.phone || '—'} />
                                        <Detail
                                            icon={MapPin}
                                            label="Adresse"
                                            value={`${client.address}, ${client.postal_code || ''} ${client.city}`}
                                        />
                                        <Detail icon={MapPin} label="Pays" value={client.country} />

                                        {/* 📌 Dates + auteurs */}
                                        <Detail
                                            icon={Calendar}
                                            label="Créé"
                                            value={`${created.toLocaleString('fr-FR')}${client.creator?.name ? ` • par ${client.creator.name}` : ''}`}
                                        />

                                        {updated && (
                                            <Detail
                                                icon={Calendar}
                                                label="Dernière modification"
                                                value={`${updated.toLocaleString('fr-FR')}${client.updater?.name ? ` • par ${client.updater.name}` : ''}`}
                                            />
                                        )}
                                    </div>
                                )}

                                {activeTab === 'fiscal' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <Detail icon={Hash} label="ICE" value={client.ice || '—'} />
                                            <Detail icon={Hash} label="RC" value={client.rc || '—'} />
                                            <Detail icon={Hash} label="Patente" value={client.patente || '—'} />
                                            <Detail icon={Hash} label="CNSS" value={client.cnss || '—'} />
                                            <Detail icon={Hash} label="Identifiant fiscal" value={client.if_number || '—'} />
                                            <Detail icon={Receipt} label="Régime fiscal" value={getTaxRegimeLabel(client.tax_regime)} />
                                            <Detail
                                                icon={Shield}
                                                label="TVA"
                                                value={
                                                    client.is_tva_subject ? (
                                                        <Badge text="Assujetti" color="green" />
                                                    ) : (
                                                        <Badge text="Non assujetti" color="secondary" />
                                                    )
                                                }
                                            />
                                            <Detail
                                                icon={Users}
                                                label="Statut client"
                                                value={client.is_active ? <Badge text="Actif" color="green" /> : <Badge text="Inactif" color="red" />}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'quotes' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                                <FileText className="h-5 w-5" />
                                                Devis ({client.quotes?.length ?? 0})
                                            </h2>
                                            {can('quote_create') && (
                                                <Link href={route('quotes.create', { client_id: client.id })}>
                                                    <Button variant="outline">Nouveau devis</Button>
                                                </Link>
                                            )}
                                        </div>

                                        {!client.quotes?.length ? (
                                            <EmptyState title="Aucun devis" description="Ce client n’a pas encore de devis." />
                                        ) : (
                                            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                                        <tr className="text-left text-slate-600 dark:text-slate-300">
                                                            <th className="px-4 py-3">N°</th>
                                                            <th className="px-4 py-3">Statut</th>
                                                            <th className="px-4 py-3">Total</th>
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3 text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-transparent">
                                                        {client.quotes.map((q) => (
                                                            <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                                    {q.quote_number}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <Badge text={getStatusLabel(q.status)} color={getStatusBadge(q.status)} />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="inline-flex items-center gap-2">
                                                                        <CreditCard className="h-4 w-4 text-slate-400" />
                                                                        {formatMoney(q.total_ttc, q.currency_code)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">{formatDate(q.created_at)}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    {can('quote_show') ? (
                                                                        <Link href={route('quotes.show', q.id)}>
                                                                            <Button variant="secondary">Voir</Button>
                                                                        </Link>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400">—</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'orders' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                                <Building className="h-5 w-5" />
                                                Commandes ({client.orders?.length ?? 0})
                                            </h2>
                                        </div>

                                        {!client.orders?.length ? (
                                            <EmptyState title="Aucune commande" description="Ce client n’a pas encore de commandes." />
                                        ) : (
                                            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                                        <tr className="text-left text-slate-600 dark:text-slate-300">
                                                            <th className="px-4 py-3">N°</th>
                                                            <th className="px-4 py-3">Statut</th>
                                                            <th className="px-4 py-3">Total</th>
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3 text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-transparent">
                                                        {client.orders.map((o) => (
                                                            <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                                    {o.order_number}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <Badge text={getStatusLabel(o.status)} color={getStatusBadge(o.status)} />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="inline-flex items-center gap-2">
                                                                        <CreditCard className="h-4 w-4 text-slate-400" />
                                                                        {formatMoney(o.total_ttc, o.currency_code)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">{formatDate(o.created_at)}</td>
                                                                <td className="px-4 py-3 text-right">
                                                                    {can('order_show') ? (
                                                                        <Link href={route('orders.show', o.id)}>
                                                                            <Button variant="secondary">Voir</Button>
                                                                        </Link>
                                                                    ) : (
                                                                        <span className="text-xs text-slate-400">—</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'notes' && (
                                    <div className="space-y-4">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                            <Info className="h-5 w-5" />
                                            Notes
                                        </h2>

                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-white/5">
                                            {client.notes ? (
                                                <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-200">{client.notes}</p>
                                            ) : (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Aucune note enregistrée.</p>
                                            )}
                                        </div>
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

// UI helpers inchangés
const Badge = ({ text, color }: { text: string; color: 'red' | 'green' | 'secondary' | 'default' }) => (
    <span
        className={`inline-block rounded-full px-2 py-1 text-xs font-medium tracking-wide select-none ${
            color === 'red'
                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                : color === 'green'
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
        }`}
    >
        {text}
    </span>
);

const Detail = ({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Icon className="mt-1 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
            <div className="text-sm font-medium break-all text-slate-900 dark:text-white/90">{value}</div>
        </div>
    </div>
);

const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR');
};

const formatMoney = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${amount.toFixed(2)} ${currency}`;
    }
};

const EmptyState = ({ title, description }: { title: string; description?: string }) => (
    <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
        {description && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</div>}
    </div>
);

const TabButton = ({ tab, active, setActive }: { tab: Tab; active: Tab; setActive: (t: Tab) => void }) => {
    const icons: Record<Tab, JSX.Element> = {
        details: <Info className="mr-2 inline h-4 w-4" />,
        fiscal: <Receipt className="mr-2 inline h-4 w-4" />,
        quotes: <FileText className="mr-2 inline h-4 w-4" />,
        orders: <Building className="mr-2 inline h-4 w-4" />,
        notes: <FileText className="mr-2 inline h-4 w-4" />,
    };
    const labels: Record<Tab, string> = {
        details: 'Détails',
        fiscal: 'Informations fiscales',
        quotes: 'Devis',
        orders: 'Commandes',
        notes: 'Notes',
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
        >
            {icons[tab]} {labels[tab]}
        </button>
    );
};
