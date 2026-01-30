import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useMemo } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import {
    ArrowLeft,
    Building2,
    Calendar,
    ChevronDown,
    CreditCard,
    FileText,
    Hash,
    Info,
    TrendingDown,
    TrendingUp,
    User as UserIcon,
    Wallet,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type ExpenseCategory = {
    id: number;
    name: string;
    code?: string | null;
};

type ClientLite = {
    id: number;
    company_name: string;
};

type ProviderLite = {
    id: number;
    name: string;
};

type PageProps = {
    expenseCategories: ExpenseCategory[];
    clients: ClientLite[];
    providers: ProviderLite[];
};

type Direction = 'in' | 'out';
type FormStatus = 'paid' | 'planned'; // aligné avec la Request: planned / paid / overdue / canceled

/* -------------------------------------------------------------------------- */
/*                               PAGE COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function CreateFinancialTransaction() {
    const { props } = usePage<PageProps>();
    const expenseCategories = props.expenseCategories ?? [];
    const clients = props.clients ?? [];
    const providers = props.providers ?? [];

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        date: new Date().toISOString().slice(0, 10), // date "visuelle" pour l'UX
        direction: 'in' as Direction,
        amount: '' as unknown as number | string,
        payment_method: '',
        label: '',
        notes: '',
        expense_category_id: '',
        client_id: '',
        provider_id: '',
        status: 'paid' as FormStatus,
        due_date: '',
        paid_at: '',
        reference: '',
    });

    // Transform avant envoi vers Laravel
    transform((form) => {
        const baseDate = form.date || null;
        const isPaid = form.status === 'paid';

        return {
            // On envoie tous les champs, Laravel ignorera ceux qui ne sont pas fillable
            ...form,

            // amount → number
            amount: Number(form.amount || 0),

            // expense_category_id → number|null
            expense_category_id: form.expense_category_id ? Number(form.expense_category_id) : null,

            // client_id → number|null
            client_id: form.client_id ? Number(form.client_id) : null,

            // provider_id → number|null
            provider_id: form.provider_id ? Number(form.provider_id) : null,

            // due_date / paid_at : on utilise la date "générale" comme fallback
            due_date: !isPaid ? form.due_date || baseDate || null : form.due_date || null,

            paid_at: isPaid ? form.paid_at || baseDate || null : form.paid_at || null,
        };
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('financial.transactions.store'), {
            onSuccess: () => reset(),
        });
    };

    const isOut = useMemo(() => data.direction === 'out', [data.direction]);
    const isIn = useMemo(() => data.direction === 'in', [data.direction]);

    /* -------------------------------------------------------------------------- */
    /*                                   UI                                       */
    /* -------------------------------------------------------------------------- */

    return (
        <>
            <Head title="Nouvelle opération financière" />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Trésorerie & paiements', href: '/financial/transactions' },
                        { title: 'Nouvelle opération', href: '/financial/transactions/create' },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* ----------------------------- FORMULAIRE ----------------------------- */}
                        <div className="col-span-12 lg:col-span-8 xl:col-span-8">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Nouvelle opération financière</h1>
                                <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                                    Enregistre un <span className="font-semibold">encaissement</span> (entrée d&apos;argent) ou un{' '}
                                    <span className="font-semibold">décaissement</span> (sortie : livraison, coursier, agios, etc.) pour suivre ta
                                    trésorerie réelle.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* ------------------------ Bloc 1 : Infos principales ------------------------ */}
                                    <section className="space-y-4">
                                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            <Wallet className="h-4 w-4" />
                                            Informations principales
                                        </h2>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* Date "générale" de l'opération (sert de fallback) */}
                                            <Field
                                                id="date"
                                                label="Date de l'opération"
                                                type="date"
                                                Icon={Calendar}
                                                value={data.date}
                                                onChange={(v) => setData('date', v)}
                                                error={errors.date}
                                            />

                                            {/* Direction : encaissement / décaissement */}
                                            <FieldSelect
                                                id="direction"
                                                label="Type d'opération"
                                                value={data.direction}
                                                onChange={(v) => setData('direction', v as Direction)}
                                                options={[
                                                    { value: 'in', label: 'Encaissement (entrée)' },
                                                    { value: 'out', label: 'Décaissement (sortie)' },
                                                ]}
                                                error={errors.direction}
                                                icon={
                                                    isIn ? (
                                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                                    ) : (
                                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            {/* Montant */}
                                            <NumberField
                                                id="amount"
                                                label="Montant"
                                                value={Number(data.amount || 0)}
                                                onChange={(v) => setData('amount', v)}
                                                error={errors.amount}
                                            />

                                            {/* Moyen de paiement */}
                                            <FieldSelect
                                                id="payment_method"
                                                label="Moyen de paiement"
                                                value={data.payment_method}
                                                onChange={(v) => setData('payment_method', v)}
                                                options={[
                                                    { value: '', label: '— Sélectionner —' },
                                                    { value: 'cash', label: 'Espèces' },
                                                    { value: 'bank_transfer', label: 'Virement' },
                                                    { value: 'card', label: 'Carte bancaire' },
                                                    { value: 'check', label: 'Chèque' },
                                                    { value: 'other', label: 'Autre' },
                                                ]}
                                                error={errors.payment_method}
                                                icon={<CreditCard className="h-4 w-4" />}
                                            />

                                            {/* Statut (planned / paid) */}
                                            <FieldSelect
                                                id="status"
                                                label="Statut"
                                                value={data.status}
                                                onChange={(v) => setData('status', v as FormStatus)}
                                                options={[
                                                    { value: 'paid', label: 'Payée / encaissée' },
                                                    { value: 'planned', label: 'Prévue / en attente' },
                                                ]}
                                                error={errors.status}
                                            />
                                        </div>

                                        {/* Libellé & notes */}
                                        <Field
                                            id="label"
                                            label={
                                                isIn
                                                    ? 'Libellé (ex: encaissement client, vente en ligne...)'
                                                    : 'Libellé (ex: frais de livraison, agios bancaires...)'
                                            }
                                            Icon={FileText}
                                            value={data.label}
                                            onChange={(v) => setData('label', v)}
                                            error={errors.label}
                                        />

                                        <Textarea
                                            id="notes"
                                            label="Notes internes (facultatif)"
                                            value={data.notes}
                                            onChange={(v) => setData('notes', v)}
                                            error={errors.notes}
                                        />
                                    </section>

                                    {/* -------------------- Bloc 2 : Catégorisation / dépense -------------------- */}
                                    <section className="space-y-4">
                                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            <Info className="h-4 w-4" />
                                            Catégorisation
                                        </h2>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* Si ENCaissement → choix du client */}
                                            {isIn && (
                                                <FieldSelect
                                                    id="client_id"
                                                    label="Client (facultatif)"
                                                    value={data.client_id}
                                                    onChange={(v) => setData('client_id', v)}
                                                    options={[
                                                        { value: '', label: '— Aucun client —' },
                                                        ...clients.map((c) => ({
                                                            value: String(c.id),
                                                            label: c.company_name,
                                                        })),
                                                    ]}
                                                    error={errors.client_id}
                                                    icon={<UserIcon className="h-4 w-4" />}
                                                />
                                            )}

                                            {/* Si DÉcaissement → fournisseur */}
                                            {isOut && (
                                                <FieldSelect
                                                    id="provider_id"
                                                    label="Fournisseur (facultatif)"
                                                    value={data.provider_id}
                                                    onChange={(v) => setData('provider_id', v)}
                                                    options={[
                                                        { value: '', label: '— Aucun fournisseur —' },
                                                        ...providers.map((p) => ({
                                                            value: String(p.id),
                                                            label: p.name,
                                                        })),
                                                    ]}
                                                    error={errors.provider_id}
                                                    icon={<Building2 className="h-4 w-4" />}
                                                />
                                            )}

                                            {/* Si DÉcaissement → catégorie de dépense */}
                                            {isOut && (
                                                <FieldSelect
                                                    id="expense_category_id"
                                                    label="Catégorie de dépense"
                                                    value={data.expense_category_id}
                                                    onChange={(v) => setData('expense_category_id', v)}
                                                    options={[
                                                        { value: '', label: '— Sélectionner une catégorie —' },
                                                        ...expenseCategories.map((cat) => ({
                                                            value: String(cat.id),
                                                            label: cat.code ? `${cat.code} — ${cat.name}` : cat.name,
                                                        })),
                                                    ]}
                                                    error={errors.expense_category_id}
                                                    icon={<Wallet className="h-4 w-4" />}
                                                />
                                            )}

                                            {/* Référence bancaire / interne */}
                                            <Field
                                                id="reference"
                                                label="Référence (banque, facture, etc.)"
                                                Icon={Hash}
                                                required={false}
                                                value={data.reference}
                                                onChange={(v) => setData('reference', v)}
                                                error={errors.reference}
                                            />
                                        </div>
                                    </section>

                                    {/* ---------------------- Bloc 3 : Échéance / paiement --------------------- */}
                                    <section className="space-y-4">
                                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            <Calendar className="h-4 w-4" />
                                            Échéance & paiement
                                        </h2>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <Field
                                                id="due_date"
                                                label="Échéance (si en attente)"
                                                type="date"
                                                required={false}
                                                value={data.due_date || ''}
                                                onChange={(v) => setData('due_date', v)}
                                                error={errors.due_date}
                                            />

                                            <Field
                                                id="paid_at"
                                                label="Date de paiement (facultatif)"
                                                type="date"
                                                required={false}
                                                value={data.paid_at || ''}
                                                onChange={(v) => setData('paid_at', v)}
                                                error={errors.paid_at}
                                            />
                                        </div>
                                    </section>

                                    {/* --------------------------- Actions / submit --------------------------- */}
                                    <div className="flex justify-between pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => window.history.back()}
                                            className="bg-muted hover:bg-muted/80 text-slate-700 dark:text-slate-300"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Annuler
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="group relative flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 focus:ring-2 focus:ring-red-500"
                                        >
                                            {processing ? (
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : null}
                                            {processing ? 'Enregistrement…' : "Enregistrer l'opération"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* ------------------------------- COLONNE AIDE ------------------------------- */}
                        <div className="col-span-12 lg:col-span-4 xl:col-span-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Guide trésorerie</h2>

                                <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
                                    <div>
                                        <h3 className="mb-2 font-semibold text-slate-800 dark:text-slate-200">💰 Encaissements vs Décaissements</h3>
                                        <ul className="space-y-1 pl-4">
                                            <li>
                                                • <strong>Encaissement</strong> = entrée d&apos;argent (vente, encaissement facture,
                                                remboursement...).
                                            </li>
                                            <li>
                                                • <strong>Décaissement</strong> = sortie d&apos;argent (livraison, coursier, agios, abonnement,
                                                charges...).
                                            </li>
                                            <li>
                                                • Le module calculera ton <strong>solde net</strong> sur la période.
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                        <h3 className="mb-2 font-semibold text-blue-800 dark:text-blue-200">🧾 Catégories de dépenses</h3>
                                        <p className="mb-2 text-xs">
                                            Les catégories (Livraison, Coursier, Banque, Abonnements, etc.) te permettent d&apos;analyser où part ton
                                            argent.
                                        </p>
                                        <ul className="space-y-1 pl-4 text-xs">
                                            <li>• Catégories simples et parlantes.</li>
                                            <li>• Sépare bien logistique / bancaire / marketing / charges fixes.</li>
                                            <li>• Plus tard : rapports par catégorie, par mois, par fournisseur…</li>
                                        </ul>
                                    </div>

                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                                        <h3 className="mb-2 font-semibold text-emerald-800 dark:text-emerald-200">📊 Santé de l&apos;entreprise</h3>
                                        <p className="mb-2 text-xs">
                                            En combinant <strong>factures</strong> + <strong>encaissements/décaissements</strong>, ton dashboard
                                            pourra afficher :
                                        </p>
                                        <ul className="space-y-1 pl-4 text-xs">
                                            <li>• Cash disponible vs charges récurrentes</li>
                                            <li>• Mois bénéficiaires vs mois compliqués</li>
                                            <li>• Postes de dépenses à optimiser</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*                        COMPOSANTS DE FORMULAIRES DE BASE                   */
/* -------------------------------------------------------------------------- */

interface FieldProps {
    id: string;
    label: string;
    Icon?: any;
    type?: React.HTMLInputTypeAttribute;
    required?: boolean;
    value: string;
    onChange: (v: string) => void;
    autoComplete?: string;
    error?: string | false;
}

function Field({ id, label, Icon, type = 'text', required = true, value, onChange, autoComplete, error }: FieldProps) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {Icon ? <Icon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" /> : null}
                <input
                    id={id}
                    name={id}
                    type={type}
                    required={required}
                    value={value ?? ''}
                    autoComplete={autoComplete}
                    onChange={(e) => onChange(e.target.value)}
                    className={`block w-full rounded-lg border py-3 ${Icon ? 'pl-10' : 'pl-3'} bg-white pr-3 dark:bg-slate-800 ${
                        error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'
                    } focus:border-red-500 focus:ring-1 focus:ring-red-500`}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

function NumberField({
    id,
    label,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
    value: number;
    onChange: (v: number) => void;
    error?: string | false;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <input
                id={id}
                name={id}
                type="number"
                step="0.01"
                value={Number.isFinite(value) ? value : 0}
                onChange={(e) => onChange(parseFloat(e.target.value || '0'))}
                className={`block w-full rounded-lg border bg-white px-3 py-3 dark:bg-slate-800 ${
                    error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'
                } focus:border-red-500 focus:ring-1 focus:ring-red-500`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

function Textarea({
    id,
    label,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string | false;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <textarea
                id={id}
                name={id}
                rows={4}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className={`block w-full rounded-lg border bg-white px-3 py-3 dark:bg-slate-800 ${
                    error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'
                } focus:border-red-500 focus:ring-1 focus:ring-red-500`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

function FieldSelect({
    id,
    label,
    value,
    onChange,
    options,
    error,
    icon,
}: {
    id: string;
    label: string;
    value: string | number;
    onChange: (v: any) => void;
    options: { value: string | number; label: string }[];
    error?: string | false;
    icon?: React.ReactNode;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <div className="relative">
                {icon ? <div className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">{icon}</div> : null}
                <select
                    id={id}
                    name={id}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`block w-full rounded-lg border py-3 ${icon ? 'pl-10' : 'pl-3'} appearance-none bg-white pr-10 dark:bg-slate-800 ${
                        error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'
                    } focus:border-red-500 focus:ring-1 focus:ring-red-500`}
                >
                    {options.map((opt) => (
                        <option key={`${id}-${opt.value}`} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
