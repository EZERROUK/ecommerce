import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Banknote, Calendar, Check, Hash, Info, KeyRound as KeyIcon, Loader2, Percent, Shield, Tag } from 'lucide-react';
import React, { useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

/* ------------------------------------------------------------------ */
/* Types / Form state                                                 */
/* ------------------------------------------------------------------ */
type PromotionType = 'order' | 'category' | 'product' | 'bogo';
type ApplyScope = 'order' | 'category' | 'product';
type ActionType = 'percent' | 'fixed';

type PageProps = {
    categories?: { id: number; name: string }[];
    products?: { id: string; name: string; sku: string }[];
    promotion: {
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
        action_type?: ActionType | null;
        value?: number | null;
        code?: string | null;
        days_of_week?: number | null;
        min_subtotal?: number | string | null;
        min_quantity?: number | string | null;
        stop_further_processing?: boolean | null;
        category_ids?: number[];
        product_ids?: string[];
    };
};

interface FormState {
    name: string;
    description: string;
    type: PromotionType;
    apply_scope: ApplyScope;
    priority: number | ''; // '' pour permettre la saisie vide
    is_active: boolean;
    is_exclusive: boolean;
    starts_at: string; // datetime-local
    ends_at: string; // datetime-local
    action_type: ActionType;
    value: number | ''; // '' pendant la saisie
    code: string;

    // conditions
    days_of_week: number; // bitmask 0..127
    min_subtotal: number | '';
    min_quantity: number | '';
    stop_further_processing: boolean;

    // ciblage
    category_ids: number[];
    product_ids: string[];
}

/* ------------------------------------------------------------------ */
/* Utils                                                              */
/* ------------------------------------------------------------------ */
const clamp2 = (v: number) => Math.round(v * 100) / 100;

// bit position by ISO-like order: 0=Sun,1=Mon,...6=Sat
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
const toggleDay = (mask: number, d: number) => mask ^ (1 << d);

const toNumberOrEmpty = (v: unknown): number | '' => {
    if (v === null || v === undefined || v === '') return '';
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : '';
};

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function EditPromotion() {
    const { props } = usePage<PageProps>();
    const categories = props.categories ?? [];
    const products = props.products ?? [];
    const promotion = props.promotion;

    // garder si besoin d'un default timezone plus tard (non utilisé)
    useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

    // Important: generic élargi pour supporter les erreurs serveur "actions.0.value"
    const form = useForm<FormState & Record<string, any>>({
        name: promotion.name ?? '',
        description: promotion.description ?? '',
        type: promotion.type ?? 'order',
        apply_scope: promotion.apply_scope ?? 'order',
        priority: typeof promotion.priority === 'number' ? promotion.priority : 100,
        is_active: !!promotion.is_active,
        is_exclusive: !!promotion.is_exclusive,
        starts_at: promotion.starts_at ?? '',
        ends_at: promotion.ends_at ?? '',
        action_type: (promotion.action_type as ActionType) ?? 'percent',
        value: typeof promotion.value === 'number' ? promotion.value : 10,
        code: promotion.code ?? '',

        days_of_week: typeof promotion.days_of_week === 'number' ? promotion.days_of_week : 0b0000000,
        min_subtotal: toNumberOrEmpty(promotion.min_subtotal),
        min_quantity: toNumberOrEmpty(promotion.min_quantity),
        stop_further_processing: !!promotion.stop_further_processing,

        category_ids: promotion.category_ids ?? [],
        product_ids: promotion.product_ids ?? [],
    });

    const { data, setData, processing, errors, transform, patch, setError, clearErrors, recentlySuccessful } = form;

    const serverErrors = errors as Record<string, string | undefined>;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        clearErrors();

        if (!data.name.trim()) {
            setError('name', 'Le nom est requis.');
            return;
        }
        const val = typeof data.value === 'number' ? data.value : Number(data.value);
        if (!Number.isFinite(val) || val < 0) {
            setError('value', 'Renseignez une valeur de remise valide.');
            return;
        }

        transform((f) => ({
            name: (f.name as string).trim(),
            description: (f.description as string) || null,
            type: f.type,
            apply_scope: f.apply_scope,
            priority: Number(f.priority) || 100,
            is_active: !!f.is_active,
            is_exclusive: !!f.is_exclusive,
            starts_at: f.starts_at || null,
            ends_at: f.ends_at || null,

            days_of_week: Number.isFinite(f.days_of_week) ? f.days_of_week : null,
            min_subtotal: f.min_subtotal === '' ? null : clamp2(Number(f.min_subtotal)),
            min_quantity: f.min_quantity === '' ? null : Number(f.min_quantity),
            stop_further_processing: !!f.stop_further_processing,

            actions: [{ action_type: f.action_type, value: clamp2(Number(f.value)) }],
            code: typeof f.code === 'string' && f.code.trim() ? (f.code as string).trim() : null,

            // n’envoyer que ce qui est pertinent
            category_ids: f.apply_scope === 'category' ? (f.category_ids ?? []) : [],
            product_ids: f.apply_scope === 'product' ? (f.product_ids ?? []) : [],
        }));

        patch(route('promotions.update', promotion.id), {
            preserveScroll: true,
            onSuccess: () => {
                router.visit(route('promotions.index'), { preserveScroll: false });
            },
            onError: () => {
                toast.error('Erreur lors de la mise à jour.');
            },
        });
    };

    // Icônes dynamiques pour type/value: Percent pour %, Banknote pour montant
    const DiscountTypeIcon: LucideIcon = data.action_type === 'percent' ? Percent : Banknote;
    const ValueIcon: LucideIcon = data.action_type === 'percent' ? Percent : Banknote;

    return (
        <>
            <Head title="Modifier une promotion" />
            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />
                <AppLayout
                    breadcrumbs={[
                        { title: 'Promotions', href: '/promotions' },
                        { title: 'Modifier', href: '' },
                    ]}
                >
                    <HeaderSimple />

                    <div className="grid grid-cols-12 gap-6 p-6">
                        <div className="col-span-12">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                {recentlySuccessful && (
                                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                                        Modifications enregistrées.
                                    </div>
                                )}

                                {Object.keys(errors).length > 0 && (
                                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                                        <strong>Veuillez corriger :</strong>
                                        <ul className="mt-2 list-inside list-disc text-sm">
                                            {Object.entries(errors).map(([k, m]) => (
                                                <li key={k}>{m as string}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-10">
                                    {/* Infos générales */}
                                    <section className="space-y-6">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                                            <Tag className="h-5 w-5 text-red-600" /> Informations générales
                                        </h2>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                                            <TextField
                                                label="Nom *"
                                                icon={Tag}
                                                value={data.name}
                                                onChange={(v) => setData('name', v)}
                                                error={errors.name as string | undefined}
                                                placeholder="WELCOME10, SOLDES..., etc."
                                            />

                                            <NumberField
                                                label="Priorité"
                                                icon={Hash}
                                                value={data.priority}
                                                step="1"
                                                min={0}
                                                onChange={(v) => setData('priority', v === '' ? '' : Math.max(0, Math.trunc(v as number)))}
                                                help="Plus petit = appliqué en premier"
                                            />

                                            <SelectBlock
                                                label="Type de promotion"
                                                icon={Shield}
                                                value={data.type}
                                                onChange={(v) => {
                                                    const vt = v as PromotionType;
                                                    setData('type', vt);
                                                    const nextScope: ApplyScope =
                                                        vt === 'order'
                                                            ? 'order'
                                                            : vt === 'category'
                                                              ? 'category'
                                                              : vt === 'product'
                                                                ? 'product'
                                                                : data.apply_scope;
                                                    setData('apply_scope', nextScope);
                                                    if (nextScope === 'order') {
                                                        setData('category_ids', []);
                                                        setData('product_ids', []);
                                                    }
                                                }}
                                                options={[
                                                    { value: 'order', label: 'Commande (tout le panier)' },
                                                    { value: 'category', label: 'Catégorie' },
                                                    { value: 'product', label: 'Produit' },
                                                    { value: 'bogo', label: 'BOGO' },
                                                ]}
                                            />

                                            <SelectBlock
                                                label="Portée d’application"
                                                icon={Shield}
                                                value={data.apply_scope}
                                                onChange={(v) => {
                                                    const scope = v as ApplyScope;
                                                    setData('apply_scope', scope);
                                                    if (scope === 'order') {
                                                        setData('category_ids', []);
                                                        setData('product_ids', []);
                                                    }
                                                }}
                                                options={[
                                                    { value: 'order', label: 'Order' },
                                                    { value: 'category', label: 'Category' },
                                                    { value: 'product', label: 'Product' },
                                                ]}
                                            />
                                        </div>

                                        <TextareaBlock
                                            label="Description"
                                            value={data.description}
                                            onChange={(v) => setData('description', v)}
                                            placeholder="Contexte / conditions…"
                                        />
                                    </section>

                                    {/* Validité & conditions */}
                                    <section className="space-y-6">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                                            <Calendar className="h-5 w-5 text-red-600" /> Validité & conditions
                                        </h2>

                                        {/* Débute / Se termine / Jours */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                            <DateTimeField label="Débute le" value={data.starts_at} onChange={(v) => setData('starts_at', v)} />
                                            <DateTimeField label="Se termine le" value={data.ends_at} onChange={(v) => setData('ends_at', v)} />
                                            <div>
                                                <Label>Jours d’application</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {DAYS.map((d) => {
                                                        const active = hasDay(data.days_of_week, d.key);
                                                        return (
                                                            <button
                                                                key={d.key}
                                                                type="button"
                                                                onClick={() => setData('days_of_week', toggleDay(data.days_of_week, d.key))}
                                                                className={`rounded-full border px-3 py-1 text-sm ${
                                                                    active
                                                                        ? 'border-red-600 bg-red-600 text-white'
                                                                        : 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                                                }`}
                                                                aria-pressed={active}
                                                            >
                                                                {d.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {errors.days_of_week && <p className="mt-1 text-xs text-red-500">{errors.days_of_week as string}</p>}
                                            </div>
                                        </div>

                                        {/* Conditions min */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                            <NumberField
                                                label="Sous-total minimum (optionnel)"
                                                icon={Banknote}
                                                value={data.min_subtotal}
                                                step="0.01"
                                                min={0}
                                                suffix="MAD"
                                                onChange={(v) => setData('min_subtotal', v === '' ? '' : Math.max(0, clamp2(v as number)))}
                                                error={errors.min_subtotal as string | undefined}
                                            />

                                            <NumberField
                                                label="Quantité minimum (optionnel)"
                                                icon={Hash}
                                                value={data.min_quantity}
                                                step="1"
                                                min={0}
                                                onChange={(v) => setData('min_quantity', v === '' ? '' : Math.max(0, Math.trunc(v as number)))}
                                                error={errors.min_quantity as string | undefined}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-6">
                                            <CheckboxField label="Active" checked={data.is_active} onChange={(v) => setData('is_active', v)} />
                                            <CheckboxField
                                                label="Exclusive (stoppe les autres promotions)"
                                                checked={data.is_exclusive}
                                                onChange={(v) => setData('is_exclusive', v)}
                                            />
                                            <CheckboxField
                                                label="Arrêter le traitement des autres promotions"
                                                checked={data.stop_further_processing}
                                                onChange={(v) => setData('stop_further_processing', v)}
                                            />
                                        </div>
                                    </section>

                                    {/* Ciblage cat/produit */}
                                    {data.apply_scope !== 'order' && (
                                        <section className="space-y-4">
                                            <h3 className="flex items-center gap-2 text-base font-semibold">
                                                <Shield className="h-4 w-4 text-red-600" />
                                                Ciblage {data.apply_scope === 'category' ? 'catégories' : 'produits'}
                                            </h3>

                                            {data.apply_scope === 'category' ? (
                                                <PickerBox<number>
                                                    label="Sélectionnez les catégories"
                                                    options={(categories ?? []).map((c) => ({ id: c.id, label: c.name }))}
                                                    value={data.category_ids}
                                                    onChange={(ids) => setData('category_ids', ids)}
                                                />
                                            ) : (
                                                <PickerBox<string>
                                                    label="Sélectionnez les produits"
                                                    options={(products ?? []).map((p) => ({ id: p.id, label: `${p.name} · ${p.sku}` }))}
                                                    value={data.product_ids}
                                                    onChange={(ids) => setData('product_ids', ids)}
                                                />
                                            )}
                                        </section>
                                    )}

                                    {/* Règle de remise */}
                                    <section className="space-y-6">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                                            <DiscountTypeIcon className="h-5 w-5 text-red-600" /> Règle de remise
                                        </h2>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                            <SelectBlock
                                                label="Type de remise"
                                                icon={DiscountTypeIcon}
                                                value={data.action_type}
                                                onChange={(v) => setData('action_type', v as ActionType)}
                                                options={[
                                                    { value: 'percent', label: '% (pourcentage)' },
                                                    { value: 'fixed', label: 'Montant fixe (MAD)' },
                                                ]}
                                            />

                                            <NumberField
                                                label={data.action_type === 'percent' ? 'Valeur (%)' : 'Valeur (montant)'}
                                                icon={ValueIcon}
                                                value={data.value}
                                                step="0.01"
                                                min={0}
                                                suffix={data.action_type === 'fixed' ? 'MAD' : undefined}
                                                onChange={(v) => setData('value', v === '' ? '' : clamp2(Math.max(0, v as number)))}
                                                error={serverErrors['actions.0.value'] ?? (errors as Partial<Record<'value', string>>).value}
                                            />

                                            <TextField
                                                label="Code promo (optionnel)"
                                                icon={KeyIcon}
                                                value={data.code}
                                                onChange={(v) => setData('code', v)}
                                                placeholder="Ex: WELCOME10"
                                            />
                                        </div>

                                        <p className="flex items-center gap-2 text-xs text-slate-500">
                                            <Info className="h-4 w-4" /> Si un code est renseigné, la promotion ne s’applique que via ce code.
                                        </p>
                                    </section>

                                    {/* Actions */}
                                    <div className="flex justify-between pt-4">
                                        <Button type="button" variant="ghost" onClick={() => window.history.back()}>
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Annuler
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-white shadow-md hover:from-red-500 hover:to-red-600"
                                        >
                                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            {processing ? 'Enregistrement…' : 'Enregistrer les modifications'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* UI blocks                                                          */
/* ------------------------------------------------------------------ */
const HeaderSimple = () => (
    <div className="mb-6 flex flex-col px-6 pt-6 md:flex-row md:items-center md:justify-between">
        <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
                <Tag className="h-6 w-6 text-red-600" /> Modifier une promotion
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Mettez à jour les informations générales, la validité et la règle de remise.</p>
        </div>
    </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{children}</label>
);

function TextField({
    label,
    icon: Icon,
    value,
    onChange,
    error,
    placeholder,
}: {
    label: string;
    icon: LucideIcon;
    value: string;
    onChange: (v: string) => void;
    error?: string | false;
    placeholder?: string;
}) {
    return (
        <div>
            <Label>{label}</Label>
            <div className="relative">
                <Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={[
                        'pl-9',
                        'focus-visible:border-red-500/60 focus-visible:ring-2 focus-visible:ring-red-500/40',
                        'dark:focus-visible:border-red-500/60 dark:focus-visible:ring-red-500/40',
                        'dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-400',
                        error ? 'border-red-500 text-red-600 dark:border-red-600 dark:text-red-300' : '',
                    ].join(' ')}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function NumberField({
    label,
    icon: Icon,
    value,
    onChange,
    error,
    step = '1',
    help,
    min,
    suffix,
}: {
    label: string;
    icon: LucideIcon;
    value: number | '';
    onChange: (v: number | '') => void;
    error?: string | false;
    step?: string;
    help?: string;
    min?: number;
    suffix?: string;
}) {
    const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === '') {
            onChange('');
            return;
        }
        let n = Number(raw.replace(',', '.'));
        if (!Number.isFinite(n)) return;
        if (typeof min === 'number') n = Math.max(min, n);
        onChange(Math.round(n * 100) / 100);
    };

    return (
        <div>
            <Label>{label}</Label>
            <div className="relative">
                <Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    type="number"
                    inputMode="decimal"
                    step={step}
                    value={value === '' ? '' : String(value)}
                    onChange={handle}
                    onBlur={(e) => {
                        const raw = e.target.value;
                        if (raw === '') return;
                        const n = Number(raw.replace(',', '.'));
                        if (Number.isFinite(n)) onChange(Math.round(n * 100) / 100);
                    }}
                    className={[
                        'pl-9',
                        suffix ? 'pr-14' : '',
                        'focus-visible:border-red-500/60 focus-visible:ring-2 focus-visible:ring-red-500/40',
                        'dark:focus-visible:border-red-500/60 dark:focus-visible:ring-red-500/40',
                        'dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-400',
                        error ? 'border-red-500 text-red-600 dark:border-red-600 dark:text-red-300' : '',
                    ].join(' ')}
                />
                {suffix && (
                    <span className="absolute top-1/2 right-2 -translate-y-1/2 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                        {suffix}
                    </span>
                )}
            </div>
            {help && <p className="mt-1 text-xs text-slate-500">{help}</p>}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function TextareaBlock({
    label,
    value,
    onChange,
    error,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string | false;
    placeholder?: string;
}) {
    return (
        <div>
            <Label>{label}</Label>
            <Textarea
                rows={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={[
                    'resize-none',
                    'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400',
                    'dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-400',
                    'focus-visible:border-red-500/60 focus-visible:ring-2 focus-visible:ring-red-500/40',
                    'dark:focus-visible:border-red-500/60 dark:focus-visible:ring-red-500/40',
                    'dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]',
                    error ? 'border-red-500 text-red-700 dark:border-red-600 dark:text-red-300' : '',
                ].join(' ')}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function SelectBlock({
    label,
    icon: Icon,
    value,
    onChange,
    options,
}: {
    label: string;
    icon: LucideIcon;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string; disabled?: boolean }[];
}) {
    return (
        <div>
            <Label>{label}</Label>
            <div className="relative">
                <Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger
                        className={[
                            'pl-9',
                            'dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100',
                            'focus-visible:border-red-500/60 focus-visible:ring-2 focus-visible:ring-red-500/40',
                            'dark:focus-visible:border-red-500/60 dark:focus-visible:ring-red-500/40',
                        ].join(' ')}
                    >
                        <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((o) => (
                            <SelectItem key={o.value} value={o.value} disabled={!!o.disabled}>
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

function DateTimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div>
            <Label>{label}</Label>
            <div className="relative">
                <Input
                    ref={ref}
                    type="datetime-local"
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={[
                        'pr-10',
                        'focus-visible:border-red-500/60 focus-visible:ring-2 focus-visible:ring-red-500/40',
                        'dark:focus-visible:border-red-500/60 dark:focus-visible:ring-red-500/40',
                        'dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-400',
                    ].join(' ')}
                />
                <Calendar
                    className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 cursor-pointer text-slate-400"
                    onClick={() => ref.current?.showPicker?.()}
                />
            </div>
        </div>
    );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-2 select-none">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
            <span className="text-sm">{label}</span>
        </label>
    );
}

/* ------------- Sélecteur multi simple & robuste (no crash) ---------- */
function PickerBox<T extends string | number>({
    label,
    options = [],
    value = [],
    onChange,
}: {
    label: string;
    options?: { id: T; label: string }[];
    value?: T[];
    onChange: (ids: T[]) => void;
}) {
    const safeOptions = options ?? [];
    const safeValue = value ?? [];
    const hasOptions = (safeOptions?.length ?? 0) > 0;

    const toggle = (id: T) => {
        const set = new Set(safeValue as T[]);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        onChange(Array.from(set));
    };

    return (
        <div>
            <Label>{label}</Label>
            {!hasOptions ? (
                <div className="text-sm text-slate-500">Aucune option disponible.</div>
            ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {safeOptions.map((opt) => {
                        const active = (safeValue as T[]).includes(opt.id);
                        return (
                            <button
                                key={String(opt.id)}
                                type="button"
                                onClick={() => toggle(opt.id)}
                                className={`rounded border px-3 py-2 text-left ${
                                    active
                                        ? 'border-red-600 bg-red-600 text-white'
                                        : 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                }`}
                                aria-pressed={active}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
            <div className="mt-2 text-xs text-slate-500">{safeValue.length} sélectionné(s)</div>
        </div>
    );
}
