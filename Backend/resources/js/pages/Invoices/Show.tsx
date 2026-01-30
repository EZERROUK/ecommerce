import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    Calendar,
    ChevronDown,
    Clock,
    CopyPlus,
    CreditCard,
    Download,
    FileText,
    Info,
    Loader2,
    Package,
    Receipt,
    RefreshCw,
    RotateCcw,
    Send,
    Shield,
} from 'lucide-react';
import React, { JSX, useCallback, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

/* ------------------------------------------------------------------ */
/* Types & Props                                                      */
/* ------------------------------------------------------------------ */
type Tab = 'details' | 'items' | 'notes' | 'history';

/** ⚠️ Aligné sur le backend (Invoice.php / Controller) */
type InvoiceStatus = 'draft' | 'sent' | 'issued' | 'paid' | 'partially_paid' | 'cancelled' | 'refunded';

interface InvoiceItem {
    id: number;
    product_name_snapshot: string;
    product_sku_snapshot: string;
    quantity: number;
    unit_price_ht_snapshot: number | null;
    tax_rate_snapshot: number | null;
    /** Fallbacks injectés côté backend */
    unit_price_ht?: number | null;
    tax_rate?: number | null;
    product?: { name: string; sku: string } | null;
}

interface InvoiceStatusHistory {
    from_status: InvoiceStatus | null;
    to_status: InvoiceStatus;
    comment?: string;
    created_at: string;
    user?: { name: string } | null;
}

interface Invoice {
    id: number | string;
    invoice_number: string;
    status: InvoiceStatus;
    invoice_date: string;
    due_date: string | null;
    currency_code: string;
    currency_symbol?: string;
    client: { id: number | string; company_name: string; contact_name?: string | null };
    items: InvoiceItem[];
    terms_conditions?: string | null;
    notes?: string | null;
    internal_notes?: string | null;
    /** Clé snake_case renvoyée par Laravel */
    status_histories?: InvoiceStatusHistory[];
    /** État dérivé renvoyé par le BE */
    is_overdue?: boolean;

    // Montants pour l'encaissement
    total_ttc?: number;
    paid_amount?: number;
    remaining_amount?: number;
}

interface Props extends PageProps<{ invoice: Invoice }> {}

type MoneyFormatter = (n?: number | string | null) => string;

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

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */
export default function InvoiceShow({ invoice }: Props) {
    const { can } = useCan();

    /* ───────── state pour les onglets et menus ───────── */
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);

    /* ───────── state pour le commentaire (statuts / send / reopen / mark-paid) ───────── */
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<InvoiceStatus | null>(null);
    const [pendingAction, setPendingAction] = useState<'status' | 'reopen' | 'send' | 'mark-paid' | null>(null);
    const [comment, setComment] = useState('');
    const [changingStatus, setChangingStatus] = useState(false);

    /* ───────── state pour le modal d'encaissement ───────── */
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number>(invoice.remaining_amount ?? 0);
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
    const [paymentRef, setPaymentRef] = useState<string>('');
    const [paymentLabel, setPaymentLabel] = useState<string>(`Encaissement ${invoice.invoice_number}`);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    /* ----------------------------- Helpers --------------------------- */
    const statusLabel: Record<InvoiceStatus, string> = {
        draft: 'Brouillon',
        sent: 'Envoyée',
        issued: 'Émise',
        paid: 'Payée',
        partially_paid: 'Partiellement payée',
        cancelled: 'Annulée',
        refunded: 'Remboursée',
    };

    const statusColor: Record<InvoiceStatus, 'red' | 'green' | 'secondary' | 'default' | 'orange'> = {
        draft: 'secondary',
        sent: 'default',
        issued: 'default',
        paid: 'green',
        partially_paid: 'orange',
        cancelled: 'secondary',
        refunded: 'red',
    };

    /** ⚠️ Transitions strictement alignées sur InvoiceController::changeStatus() */
    const transitions: Partial<Record<InvoiceStatus, InvoiceStatus[]>> = {
        draft: ['sent', 'issued', 'cancelled'],
        sent: ['issued', 'paid', 'partially_paid', 'cancelled'],
        issued: ['paid', 'partially_paid', 'cancelled'],
        partially_paid: ['paid', 'cancelled'],
        paid: ['refunded'],
        cancelled: [],
        refunded: [],
    };

    /* --------- Formatter numéraire ---------------------------------- */
    const numberFormatter = useMemo(
        () =>
            new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        [],
    );

    const currency = invoice.currency_symbol || invoice.currency_code;
    const fmt: MoneyFormatter = useCallback(
        (n?: number | string | null) => {
            const num = Number(n);
            return !isFinite(num) ? '-' : `${numberFormatter.format(num)} ${currency}`;
        },
        [numberFormatter, currency],
    );

    /* ------ Totaux --------------------------------------------------- */
    const totals = useMemo(() => {
        return invoice.items.reduce(
            (acc, it) => {
                const unit = it.unit_price_ht_snapshot ?? it.unit_price_ht ?? 0;
                const ht = unit * it.quantity;
                const tax = (ht * (it.tax_rate_snapshot ?? it.tax_rate ?? 0)) / 100;
                return { sub: acc.sub + ht, tva: acc.tva + tax };
            },
            { sub: 0, tva: 0 },
        );
    }, [invoice.items]);

    const totalTtcBase = invoice.total_ttc ?? totals.sub + totals.tva;
    let paidAmtRaw = invoice.paid_amount ?? 0;
    let remainingBase = invoice.remaining_amount ?? totalTtcBase - paidAmtRaw;

    // 🧾 Cas particulier : facture remboursée → on n'affiche plus d'encaissement
    if (invoice.status === 'refunded') {
        paidAmtRaw = 0;
        remainingBase = 0;
    }

    const totalTtc = totalTtcBase;
    const remaining = remainingBase;
    const paidAmt = paidAmtRaw;

    /* ------------------------- Permissions Check -------------------- */
    const canEdit = can('invoice_edit') && invoice.status === 'draft';
    const canExport = can('invoice_export');
    const canDuplicate = can('invoice_duplicate');
    const canSend = can('invoice_send') && (invoice.status === 'draft' || invoice.status === 'cancelled');
    const canMarkPaid = can('invoice_mark_paid') && (['sent', 'issued', 'partially_paid'].includes(invoice.status) || !!invoice.is_overdue);
    const canSendReminder = can('invoice_send_reminder') && !!invoice.is_overdue;
    const canChangeStatus = can('invoice_change_status');
    const canReopen = can('invoice_reopen') && invoice.status === 'refunded';

    // 🆕 Encaisser : toujours visible si permission, même si tout est payé (bouton grisé dans ce cas)
    const canRecordPayment = can('invoice_mark_paid');

    /* ------------------------- Actions (avec permissions) ------------ */
    const exportPdf = () => {
        if (!canExport) {
            alert('Permission manquante: invoice_export');
            return;
        }
        window.open(route('invoices.export-pdf', invoice.id), '_blank', 'noopener');
    };

    const duplicateInvoice = () => {
        if (!canDuplicate) {
            alert('Permission manquante: invoice_duplicate');
            return;
        }
        router.post(route('invoices.duplicate', invoice.id));
    };

    const sendReminder = () => {
        if (!canSendReminder) {
            alert('Permission manquante: invoice_send_reminder');
            return;
        }
        if (!confirm('Envoyer un rappel de paiement au client ?')) return;
        router.post(
            route('invoices.send-reminder', invoice.id),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    /* → Actions modifiées pour utiliser la popup commentaire */
    const startSend = () => {
        if (!canSend) {
            alert('Permission manquante: invoice_send');
            return;
        }
        setPendingAction('send');
        setComment('');
        setCommentModalOpen(true);
    };

    const startMarkAsPaid = () => {
        if (!canMarkPaid) {
            alert('Permission manquante: invoice_mark_paid');
            return;
        }
        setPendingAction('mark-paid');
        setComment('');
        setCommentModalOpen(true);
    };

    const startReopen = () => {
        if (!canReopen) {
            alert('Permission manquante: invoice_reopen');
            return;
        }
        setPendingAction('reopen');
        setComment('');
        setCommentModalOpen(true);
    };

    /* → 1. L'utilisateur choisit un nouveau statut */
    const startStatusChange = (newStatus: InvoiceStatus) => {
        if (!canChangeStatus) {
            alert('Permission manquante: invoice_change_status');
            return;
        }
        setPendingStatus(newStatus);
        setPendingAction('status');
        setComment('');
        setStatusMenuOpen(false);
        setCommentModalOpen(true);
    };

    /* → 2. Il valide le commentaire */
    const submitAction = () => {
        setChangingStatus(true);

        const needs: Record<NonNullable<typeof pendingAction>, string> = {
            reopen: 'invoice_reopen',
            send: 'invoice_send',
            'mark-paid': 'invoice_mark_paid',
            status: 'invoice_change_status',
        } as const;

        if (pendingAction && !can(needs[pendingAction])) {
            setChangingStatus(false);
            alert(`Permission manquante: ${needs[pendingAction]}`);
            return;
        }

        if (pendingAction === 'reopen') {
            router.post(
                route('invoices.reopen', invoice.id),
                { comment },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setChangingStatus(false);
                        setCommentModalOpen(false);
                        setPendingAction(null);
                        setComment('');
                    },
                },
            );
        } else if (pendingAction === 'send') {
            router.post(
                route('invoices.send', invoice.id),
                { comment },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setChangingStatus(false);
                        setCommentModalOpen(false);
                        setPendingAction(null);
                        setComment('');
                    },
                },
            );
        } else if (pendingAction === 'mark-paid') {
            router.post(
                route('invoices.mark-paid', invoice.id),
                { comment },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setChangingStatus(false);
                        setCommentModalOpen(false);
                        setPendingAction(null);
                        setComment('');
                    },
                },
            );
        } else if (pendingAction === 'status' && pendingStatus) {
            router.post(
                route('invoices.change-status', invoice.id),
                { status: pendingStatus, comment },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setChangingStatus(false);
                        setCommentModalOpen(false);
                        setPendingStatus(null);
                        setPendingAction(null);
                        setComment('');
                    },
                },
            );
        }
    };

    /* → Contenu dynamique du modal commentaire */
    const getModalContent = () => {
        switch (pendingAction) {
            case 'reopen':
                return {
                    title: 'Réouvrir la facture',
                    placeholder: 'Raison de la réouverture (optionnel)…',
                    action: 'Réouvrir',
                };
            case 'send':
                return {
                    title: 'Envoyer la facture',
                    placeholder: "Commentaire sur l'envoi (optionnel)…",
                    action: 'Envoyer',
                };
            case 'mark-paid':
                return {
                    title: 'Marquer comme payée',
                    placeholder: 'Commentaire sur le paiement (optionnel)…',
                    action: 'Marquer payée',
                };
            case 'status':
                return {
                    title: 'Changer le statut',
                    placeholder: 'Ajouter un commentaire (optionnel)…',
                    action: 'Valider',
                };
            default:
                return {
                    title: 'Commentaire',
                    placeholder: 'Ajouter un commentaire (optionnel)…',
                    action: 'Valider',
                };
        }
    };

    const handleSubmitPayment = () => {
        setPaymentProcessing(true);
        router.post(
            route('invoices.record-payment', invoice.id),
            {
                amount: paymentAmount,
                paid_at: paymentDate,
                payment_method: paymentMethod,
                label: paymentLabel,
                reference: paymentRef,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setPaymentProcessing(false);
                    setPaymentModalOpen(false);
                },
            },
        );
    };

    /* ------------------------------ Render --------------------------- */
    return (
        <>
            <Head title={`Facture – ${invoice.invoice_number}`} />

            <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Factures', href: '/invoices' },
                        { title: invoice.invoice_number, href: route('invoices.show', invoice.id) },
                    ]}
                >
                    {/* ===== En-tête ===== */}
                    <div className="px-6 pt-6 pb-1">
                        <Header
                            invoice={invoice}
                            totals={totals}
                            fmt={fmt}
                            statusLabel={statusLabel}
                            statusColor={statusColor}
                            exportPdf={exportPdf}
                            duplicateInvoice={duplicateInvoice}
                            startSend={startSend}
                            startMarkAsPaid={startMarkAsPaid}
                            sendReminder={sendReminder}
                            startReopen={startReopen}
                            transitions={transitions}
                            statusMenuOpen={statusMenuOpen}
                            setStatusMenuOpen={setStatusMenuOpen}
                            startStatusChange={startStatusChange}
                            canEdit={canEdit}
                            canExport={canExport}
                            canDuplicate={canDuplicate}
                            canSend={canSend}
                            canMarkPaid={canMarkPaid}
                            canSendReminder={canSendReminder}
                            canChangeStatus={canChangeStatus}
                            canReopen={canReopen}
                            canRecordPayment={canRecordPayment}
                            openPaymentModal={() => {
                                setPaymentAmount(remaining);
                                setPaymentModalOpen(true);
                            }}
                            totalTtc={totalTtc}
                            paidAmt={paidAmt}
                            remaining={remaining}
                        />
                    </div>

                    {/* ===== Contenu ===== */}
                    <div className="flex flex-grow flex-col p-6">
                        <div className="grid min-h-[350px] flex-1 grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-xl md:grid-cols-4 dark:border-slate-700 dark:bg-white/5">
                            {/* Tabs */}
                            <div className="flex flex-col border-r border-slate-200 dark:border-slate-700">
                                {(['details', 'items', 'notes', 'history'] as Tab[]).map((tab) => (
                                    <TabButton key={tab} tab={tab} active={activeTab} setActive={setActiveTab} />
                                ))}
                            </div>

                            {/* Panels */}
                            <div className="overflow-y-auto p-6 text-slate-700 md:col-span-3 dark:text-slate-300">
                                {activeTab === 'details' && (
                                    <DetailsPanel
                                        invoice={invoice}
                                        totals={totals}
                                        fmt={fmt}
                                        statusLabel={statusLabel}
                                        statusColor={statusColor}
                                        totalTtc={totalTtc}
                                        paidAmt={paidAmt}
                                        remaining={remaining}
                                    />
                                )}

                                {activeTab === 'items' && <ItemsPanel invoice={invoice} fmt={fmt} />}

                                {activeTab === 'notes' && <NotesPanel invoice={invoice} />}

                                {activeTab === 'history' && <HistoryPanel histories={invoice.status_histories ?? []} statusLabel={statusLabel} />}
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>

            {/* ─────────── Modal Commentaire (statuts/send/reopen/mark-paid) ─────────── */}
            {commentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{getModalContent().title}</h2>

                        <textarea
                            rows={4}
                            className="w-full resize-none rounded border border-slate-300 bg-white/90 p-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900/30"
                            placeholder={getModalContent().placeholder}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setCommentModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={submitAction} disabled={changingStatus}>
                                {changingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {getModalContent().action}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─────────── Modal Encaissement ─────────── */}
            {paymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Enregistrer un encaissement</h2>

                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            <div>
                                Total TTC : <strong>{fmt(totalTtc)}</strong>
                            </div>
                            <div>
                                Déjà encaissé : <strong>{fmt(paidAmt)}</strong>
                            </div>
                            <div>
                                Reste à encaisser : <strong>{fmt(remaining)}</strong>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Montant à encaisser</label>
                                <input
                                    type="number"
                                    min={0.01}
                                    max={remaining}
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value || '0'))}
                                    className="w-full rounded border border-slate-300 bg-white/90 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/30"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Date de paiement</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full rounded border border-slate-300 bg-white/90 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/30"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Moyen de paiement</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full rounded border border-slate-300 bg-white/90 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/30"
                                >
                                    <option value="">— Non précisé —</option>
                                    <option value="cash">Espèces</option>
                                    <option value="bank_transfer">Virement</option>
                                    <option value="card">Carte bancaire</option>
                                    <option value="check">Chèque</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Libellé (optionnel)</label>
                                <input
                                    type="text"
                                    value={paymentLabel}
                                    onChange={(e) => setPaymentLabel(e.target.value)}
                                    className="w-full rounded border border-slate-300 bg-white/90 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/30"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Référence (banque, etc.) (optionnel)</label>
                                <input
                                    type="text"
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    className="w-full rounded border border-slate-300 bg-white/90 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/30"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={handleSubmitPayment} disabled={paymentProcessing || paymentAmount <= 0}>
                                {paymentProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer l&apos;encaissement
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Sous-composants                                                    */
/* ------------------------------------------------------------------ */

/* ----------------------- HEADER ----------------------------------- */
const Header = ({
    invoice,
    totals: _totals,
    fmt,
    statusLabel,
    statusColor,
    exportPdf,
    duplicateInvoice,
    startSend,
    startMarkAsPaid,
    sendReminder,
    startReopen,
    transitions,
    statusMenuOpen,
    setStatusMenuOpen,
    startStatusChange,
    canEdit: _canEdit,
    canExport,
    canDuplicate,
    canSend,
    canMarkPaid,
    canSendReminder,
    canChangeStatus,
    canReopen,
    canRecordPayment,
    openPaymentModal,
    totalTtc,
    paidAmt,
    remaining,
}: {
    invoice: Invoice;
    totals: { sub: number; tva: number };
    fmt: MoneyFormatter;
    statusLabel: Record<InvoiceStatus, string>;
    statusColor: Record<InvoiceStatus, 'red' | 'green' | 'secondary' | 'default' | 'orange'>;
    exportPdf: () => void;
    duplicateInvoice: () => void;
    startSend: () => void;
    startMarkAsPaid: () => void;
    sendReminder: () => void;
    startReopen: () => void;
    transitions: Partial<Record<InvoiceStatus, InvoiceStatus[]>>;
    statusMenuOpen: boolean;
    setStatusMenuOpen: (b: boolean) => void;
    startStatusChange: (s: InvoiceStatus) => void;
    canEdit: boolean;
    canExport: boolean;
    canDuplicate: boolean;
    canSend: boolean;
    canMarkPaid: boolean;
    canSendReminder: boolean;
    canChangeStatus: boolean;
    canReopen: boolean;
    canRecordPayment: boolean;
    openPaymentModal: () => void;
    totalTtc: number;
    paidAmt: number;
    remaining: number;
}) => {
    // 🆕 : on centralise le clic sur un statut
    const handleStatusClick = (s: InvoiceStatus) => {
        // Cas spécial : "Partiellement payée" → on ouvre directement le modal d'encaissement
        if (s === 'partially_paid') {
            setStatusMenuOpen(false);
            openPaymentModal();
            return;
        }

        // Tous les autres statuts continuent d'utiliser le flux standard changeStatus + commentaire
        startStatusChange(s);
    };

    return (
        <div className="flex flex-col items-start gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md lg:flex-row dark:border-slate-700 dark:bg-white/5">
            {/* Icône */}
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <Receipt className="h-12 w-12 text-slate-400" />
            </div>

            {/* Infos */}
            <div className="flex-1 space-y-2">
                <h1 className="dark:text:white text-2xl font-bold text-slate-900 dark:text-white">{invoice.invoice_number}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {invoice.client.company_name}
                    {invoice.client.contact_name && ` – ${invoice.client.contact_name}`}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Calendar className="h-4 w-4" /> {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('fr-FR') : '-'} •{' '}
                    <Clock className="h-4 w-4" /> Échéance le {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '-'}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <Badge text={statusLabel[invoice.status]} color={statusColor[invoice.status]} />
                    {invoice.is_overdue && <Badge text="En retard" color="red" />}

                    <Badge text={`TTC : ${fmt(totalTtc)}`} color="default" />
                    <Badge text={`Encaissé : ${fmt(paidAmt)}`} color="default" />
                    <Badge text={`Reste : ${fmt(remaining)}`} color="orange" />
                </div>
            </div>

            {/* Actions */}
            <div className="flex w-full flex-col gap-2 sm:w-auto">
                <Link href={route('invoices.index')} className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Retour
                    </Button>
                </Link>

                {/* Export PDF */}
                {canExport && (
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={exportPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter&nbsp;PDF
                    </Button>
                )}

                {/* Dupliquer */}
                {canDuplicate && (
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={duplicateInvoice}>
                        <CopyPlus className="mr-2 h-4 w-4" />
                        Dupliquer
                    </Button>
                )}

                {/* Envoyer (draft|cancelled) */}
                {canSend && (
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={startSend}>
                        <Send className="mr-2 h-4 w-4" />
                        Envoyer
                    </Button>
                )}

                {/* Marquer payée direct */}
                {canMarkPaid && (
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={startMarkAsPaid}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Marquer payée
                    </Button>
                )}

                {/* 🆕 Encaisser (paiement partiel / complet) – toujours visible, grisé si tout payé */}
                {canRecordPayment && (
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={openPaymentModal} disabled={remaining <= 0.01}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Encaisser
                    </Button>
                )}

                {/* Rappel paiement */}
                {canSendReminder && (
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={sendReminder}>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Rappel paiement
                    </Button>
                )}

                {/* Rembourser (paid → refunded) */}
                {invoice.status === 'paid' && canChangeStatus && (
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => startStatusChange('refunded')}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Rembourser
                    </Button>
                )}

                {/* Réouvrir (refunded → draft) */}
                {canReopen && (
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={startReopen}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Réouvrir
                    </Button>
                )}

                {/* Menu Changer statut (options dynamiques alignées BE) */}
                {canChangeStatus && transitions[invoice.status]?.length ? (
                    <div className="relative">
                        <Button
                            variant="outline"
                            className="flex w-full items-center justify-between sm:w-auto"
                            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                        >
                            Changer&nbsp;statut
                            <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>

                        {statusMenuOpen && (
                            <ul className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                {transitions[invoice.status]!.map((s) => (
                                    <li key={s}>
                                        <button
                                            onClick={() => handleStatusClick(s)}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            {statusLabel[s]}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

/* -------------------- PANEL — Détails ----------------------------- */
const DetailsPanel = ({
    invoice,
    totals: _totals,
    fmt,
    statusLabel,
    statusColor,
    totalTtc,
    paidAmt,
    remaining,
}: {
    invoice: Invoice;
    totals: { sub: number; tva: number };
    fmt: MoneyFormatter;
    statusLabel: Record<InvoiceStatus, string>;
    statusColor: Record<InvoiceStatus, 'red' | 'green' | 'secondary' | 'default' | 'orange'>;
    totalTtc: number;
    paidAmt: number;
    remaining: number;
}) => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Detail icon={Building2} label="Client" value={invoice.client.company_name} />
        <Detail
            icon={Calendar}
            label="Date facture"
            value={invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('fr-FR') : '-'}
        />
        <Detail icon={Calendar} label="Date d'échéance" value={invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '-'} />
        <Detail
            icon={Receipt}
            label="Statut"
            value={
                <div className="flex items-center gap-2">
                    <Badge text={statusLabel[invoice.status]} color={statusColor[invoice.status]} />
                    {invoice.is_overdue && <Badge text="En retard" color="red" />}
                </div>
            }
        />
        <Detail icon={FileText} label="Nombre d'articles" value={invoice.items.length} />
        <Detail icon={Shield} label="Total TTC" value={fmt(totalTtc)} />
        <Detail icon={Shield} label="Encaissé" value={fmt(paidAmt)} />
        <Detail icon={Shield} label="Reste à encaisser" value={fmt(remaining)} />
    </div>
);

/* -------------------- PANEL — Articles ---------------------------- */
const ItemsPanel = ({ invoice, fmt }: { invoice: Invoice; fmt: MoneyFormatter }) => {
    const rows = invoice.items.map((it) => {
        const unit = it.unit_price_ht_snapshot ?? it.unit_price_ht ?? 0;
        const ht = unit * it.quantity;
        const tax = (ht * (it.tax_rate_snapshot ?? it.tax_rate ?? 0)) / 100;
        const ttc = ht + tax;
        return { ...it, unit, ht, tax, ttc };
    });

    return rows.length ? (
        <>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-left dark:bg-slate-700/30">
                            <th className="px-3 py-2">Désignation</th>
                            <th className="px-3 py-2">SKU</th>
                            <th className="px-3 py-2 text-right">Qté</th>
                            <th className="px-3 py-2 text-right">PU&nbsp;HT</th>
                            <th className="px-3 py-2 text-right">TVA&nbsp;%</th>
                            <th className="px-3 py-2 text-right">Total&nbsp;HT</th>
                            <th className="px-3 py-2 text-right">Total&nbsp;TTC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="border-b border-slate-200 last:border-0 dark:border-slate-700">
                                <td className="px-3 py-2">{r.product_name_snapshot || r.product?.name}</td>
                                <td className="px-3 py-2">{r.product_sku_snapshot || r.product?.sku}</td>
                                <td className="px-3 py-2 text-right">{r.quantity}</td>
                                <td className="px-3 py-2 text-right">{fmt(r.unit)}</td>
                                <td className="px-3 py-2 text-right">{r.tax_rate_snapshot ?? r.tax_rate ?? 0}</td>
                                <td className="px-3 py-2 text-right">{fmt(r.ht)}</td>
                                <td className="px-3 py-2 text-right">{fmt(r.ttc)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totaux */}
            <div className="mt-4 space-y-1 text-right">
                <div className="text-sm">
                    Sous-total&nbsp;HT&nbsp;: <span className="font-medium">{fmt(rows.reduce((s, r) => s + r.ht, 0))}</span>
                </div>
                <div className="text-sm">
                    TVA&nbsp;: <span className="font-medium">{fmt(rows.reduce((s, r) => s + r.tax, 0))}</span>
                </div>
                <div className="text-lg font-bold">Total&nbsp;TTC&nbsp;: {fmt(rows.reduce((s, r) => s + r.ttc, 0))}</div>
            </div>
        </>
    ) : (
        <p className="text-slate-500 italic dark:text-slate-400">Aucun article.</p>
    );
};

/* -------------------- PANEL — Notes ------------------------------- */
const NotesPanel = ({ invoice }: { invoice: Invoice }) => (
    <>
        {invoice.terms_conditions || invoice.notes || invoice.internal_notes ? (
            <div className="space-y-6">
                {invoice.terms_conditions && <Section title="Conditions générales" content={invoice.terms_conditions} />}
                {invoice.notes && <Section title="Notes client" content={invoice.notes} />}
                {invoice.internal_notes && <Section title="Notes internes" content={invoice.internal_notes} />}
            </div>
        ) : (
            <p className="text-slate-500 italic dark:text-slate-400">Aucune note.</p>
        )}
    </>
);

/* -------------------- PANEL — Historique -------------------------- */
const HistoryPanel = ({ histories, statusLabel }: { histories: InvoiceStatusHistory[]; statusLabel: Record<InvoiceStatus, string> }) =>
    histories.length ? (
        <ul className="space-y-4">
            {histories.map((h, idx) => (
                <li key={idx} className="border-b border-slate-200 pb-2 text-sm dark:border-slate-700">
                    <div className="font-medium">
                        {h.from_status ? statusLabel[h.from_status] : 'Nouveau'}
                        {' → '}
                        {statusLabel[h.to_status]}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {h.user?.name ?? 'Système'} • {new Date(h.created_at).toLocaleString('fr-FR')}
                    </div>
                    {h.comment && <div className="mt-1 text-slate-600 italic dark:text-slate-300">{h.comment}</div>}
                </li>
            ))}
        </ul>
    ) : (
        <p className="text-slate-500 italic dark:text-slate-400">Aucun changement de statut.</p>
    );

/* ------------------------------------------------------------------ */
/* Petits helpers UI                                                  */
/* ------------------------------------------------------------------ */
const Badge = ({ text, color }: { text: string; color: 'red' | 'green' | 'secondary' | 'default' | 'orange' }) => (
    <span
        className={`inline-block rounded-full px-2 py-1 text-xs font-medium tracking-wide select-none ${
            color === 'red'
                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                : color === 'green'
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                  : color === 'orange'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
        }`}
    >
        {text}
    </span>
);

const Detail = ({ icon: Icon, label, value }: { icon: typeof Info; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Icon className="mt-1 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
            <div className="text-sm font-medium break-all text-slate-900 dark:text-white/90">{value}</div>
        </div>
    </div>
);

const TabButton = ({ tab, active, setActive }: { tab: Tab; active: Tab; setActive: (t: Tab) => void }) => {
    const icons: Record<Tab, JSX.Element> = {
        details: <Info className="mr-2 inline h-4 w-4" />,
        items: <Package className="mr-2 inline h-4 w-4" />,
        notes: <FileText className="mr-2 inline h-4 w-4" />,
        history: <Clock className="mr-2 inline h-4 w-4" />,
    };
    const labels: Record<Tab, string> = {
        details: 'Détails',
        items: 'Articles',
        notes: 'Notes',
        history: 'Historique',
    };
    const isActive = active === tab;
    return (
        <button
            onClick={() => setActive(tab)}
            className={`flex w-full items-center px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                    ? 'rounded-l-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-inner'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
            }`}
        >
            {icons[tab]} {labels[tab]}
        </button>
    );
};

const Section = ({ title, content }: { title: string; content: string }) => (
    <div>
        <h3 className="mb-2 border-b border-slate-200 pb-1 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">{title}</h3>
        <p className="text-sm whitespace-pre-line">{content}</p>
    </div>
);
