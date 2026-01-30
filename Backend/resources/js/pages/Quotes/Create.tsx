/* ------------------------------------------------------------------ */
/* resources/js/Pages/Quotes/Create.tsx                               */
/* Aligned to Cart Create.tsx structure & dark-modern UI               */
/* ------------------------------------------------------------------ */

import type { FormDataConvertible } from '@inertiajs/core';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, Check, FileText, Package2 as Package, Percent, Plus, Save, Tag, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface Client {
    id: number;
    company_name: string;
    contact_name?: string;
}
interface Currency {
    code: string;
    symbol: string;
    name: string;
}
interface Product {
    id: string | number;
    name: string;
    sku: string;
    price: number;
    tax_rate?: { rate: number };
}

export interface QuoteItemForm {
    product_id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number; // percent
    [key: string]: FormDataConvertible;
}

type QuoteFormData = {
    client_id: string;
    currency_code: string;
    quote_date: string;
    valid_until: string;
    terms_conditions: string;
    notes: string;
    internal_notes: string;
    items: QuoteItemForm[];
    promo_code?: string;
};

/** Réponse d'aperçu promos */
type PreviewPromotion = {
    name: string;
    amount: number;
    lines_breakdown?: Array<{ index: number; amount: number }>;
};

type PromoPreview = {
    subtotal?: number;
    tax_total?: number;
    grand_total?: number;
    discount_total?: number;
    grand_total_after?: number;
    applied_promotions?: PreviewPromotion[];
    lines_total_discounts?: number[];
    error?: string;
    message?: string;
};

interface Props {
    clients: Client[];
    products: Product[];
    currencies: Currency[];
    prefillClientId?: number | null;
    duplicateQuote?: {
        client_id: number;
        currency_code: string;
        quote_date: string;
        valid_until: string;
        terms_conditions?: string;
        notes?: string;
        internal_notes?: string;
        items: Array<{
            product_id: string | number;
            quantity: number;
            unit_price_ht?: number;
            unit_price_ht_snapshot?: number;
            tax_rate?: number;
            tax_rate_snapshot?: number;
        }>;
    } | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const getCsrfToken = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content || '';

const getCookie = (name: string) => {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
};

const normalizeDuplicateItems = (items: Props['duplicateQuote'] extends { items: infer _I } ? any[] : any[]): QuoteItemForm[] => {
    return (items || []).map((it: any) => ({
        product_id: String(it.product_id),
        quantity: Number(it.quantity) || 1,
        unit_price_ht: Number(it.unit_price_ht ?? it.unit_price_ht_snapshot ?? 0),
        tax_rate: Number(it.tax_rate ?? it.tax_rate_snapshot ?? 0),
    }));
};

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */
export default function CreateQuote({ clients, products, currencies, prefillClientId = null, duplicateQuote = null }: Props) {
    /* ---------- form ---------- */
    const { data, setData, post, processing, errors, reset } = useForm<QuoteFormData>({
        client_id: (duplicateQuote?.client_id ?? prefillClientId)?.toString() ?? '',
        currency_code: duplicateQuote?.currency_code ?? currencies?.[0]?.code ?? 'MAD',
        quote_date: duplicateQuote?.quote_date ?? new Date().toISOString().slice(0, 10),
        valid_until: duplicateQuote?.valid_until ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        terms_conditions: duplicateQuote?.terms_conditions ?? '',
        notes: duplicateQuote?.notes ?? '',
        internal_notes: duplicateQuote?.internal_notes ?? '',
        items: duplicateQuote?.items ? normalizeDuplicateItems(duplicateQuote.items as any) : [],
        promo_code: '',
    });

    /* ---------- items state (UI) ---------- */
    const [items, setItems] = useState<QuoteItemForm[]>(data.items);
    const [promo, setPromo] = useState<PromoPreview | null>(null);
    const [loadingPromo, setLoadingPromo] = useState(false);

    const productsIndex = useMemo(() => {
        const m = new Map<string, Product>();
        for (const p of products) m.set(String(p.id), p);
        return m;
    }, [products]);

    /* ---------- CRUD items ---------- */
    const addItem = () => {
        const arr: QuoteItemForm[] = [...items, { product_id: '', quantity: 1, unit_price_ht: 0, tax_rate: 0 }];
        setItems(arr);
        setData('items', arr);
    };

    const removeItem = (i: number) => {
        const arr = [...items];
        arr.splice(i, 1);
        setItems(arr);
        setData('items', arr);
    };

    const updateItem = (i: number, f: keyof QuoteItemForm, v: any) => {
        const arr = [...items];
        if (f === 'product_id') {
            const id = String(v);
            arr[i].product_id = id;
            const p = productsIndex.get(id);
            if (p) {
                arr[i].unit_price_ht = Number(p.price) || 0;
                arr[i].tax_rate = Number((p as any).tax_rate?.rate ?? 0);
            } else {
                arr[i].unit_price_ht = 0;
                arr[i].tax_rate = 0;
            }
        } else if (f === 'quantity') {
            arr[i].quantity = Math.max(0, Number(v) || 0);
        } else if (f === 'unit_price_ht') {
            arr[i].unit_price_ht = Math.max(0, Number(v) || 0);
        }
        setItems(arr);
        setData('items', arr);
    };

    /* ---------- totals (calcul local, avant remises — fallback) ---------- */
    const localTotals = useMemo(() => {
        let sub = 0,
            tva = 0;
        items.forEach((it) => {
            const ht = Number(it.quantity) * Number(it.unit_price_ht);
            sub += ht;
            tva += (ht * Number(it.tax_rate)) / 100;
        });
        return { sub, tva, ttc: sub + tva };
    }, [items]);

    const cur = currencies.find((c) => c.code === data.currency_code);
    const fmt = (n: number) =>
        `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur?.symbol ?? data.currency_code}`;

    /* ---------- steps ---------- */
    const step1 = !!data.client_id;
    const step2 = items.length > 0 && items.every((it) => it.product_id && it.quantity > 0);
    const step3 = step2;
    const steps = [
        { id: 1, title: 'Informations générales', icon: Building2, complete: step1, active: true },
        { id: 2, title: 'Articles', icon: Package, complete: step2, active: step1 },
        { id: 3, title: 'Notes et finalisation', icon: FileText, complete: step3, active: step2 },
    ];

    /* ---------- promo preview (debounce) ---------- */
    const previewPromos = async () => {
        if (!step2 || !step1) {
            setPromo(null);
            return;
        }
        try {
            setLoadingPromo(true);

            const payload = {
                code: data.promo_code?.trim()?.toUpperCase() || null,
                client_id: Number(data.client_id) || undefined,
                currency_code: data.currency_code,
                items: items.map((it) => ({
                    product_id: String(it.product_id),
                    quantity: Number(it.quantity) || 0,
                    unit_price_ht: Number(it.unit_price_ht) || 0,
                    tax_rate: Number(it.tax_rate) || 0,
                })),
            };

            const url = route('quotes.promotions.preview.transient');

            const res = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
                },
                body: JSON.stringify(payload),
            });

            // Tente JSON propre — si 419/HTML, gestion ci-dessous
            let json: PromoPreview | null = null;
            const text = await res.text();
            try {
                json = text ? JSON.parse(text) : null;
            } catch {
                json = null;
            }

            if (res.status === 419) {
                // Tentative de refresh CSRF
                const apiOrigin = new URL(url, window.location.origin).origin;
                await fetch(`${apiOrigin}/sanctum/csrf-cookie`, { credentials: 'include' });
                const res2 = await fetch(url, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                        'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
                    },
                    body: JSON.stringify(payload),
                });
                const text2 = await res2.text();
                try {
                    json = text2 ? JSON.parse(text2) : null;
                } catch {
                    json = null;
                }
                if (!res2.ok || !json) throw new Error(`Erreur ${res2.status}`);
            }

            if (!json) {
                console.error('Erreur de prévisualisation des promotions', { status: res.status, body: text });
                setPromo(null);
                return;
            }

            setPromo(json);
        } catch (e: any) {
            console.error(e);
            setPromo(null);
            toast.error(e?.message || 'Erreur lors de la prévisualisation des promotions');
        } finally {
            setLoadingPromo(false);
        }
    };

    // debounce 300ms
    useEffect(() => {
        const t = setTimeout(previewPromos, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.client_id, data.currency_code, data.promo_code, JSON.stringify(items)]);

    /* ---------- submit ---------- */
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!step2) {
            toast.error('Sélectionnez un client, complétez les dates et ajoutez au moins un article');
            return;
        }
        post(route('quotes.store'), {
            onSuccess: () => {
                toast.success('Devis créé avec succès.');
                reset();
                setItems([]);
                setPromo(null);
            },
            onError: () => toast.error('Erreur lors de la création.'),
            preserveScroll: true,
        });
    };

    /* ---------------------------------------------------------------- */
    /* Render                                                           */
    /* ---------------------------------------------------------------- */
    return (
        <>
            <Head title="Créer un devis" />
            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />
                <AppLayout
                    breadcrumbs={[
                        { title: 'Devis', href: '/quotes' },
                        { title: 'Créer', href: '' },
                    ]}
                >
                    <HeaderCreate steps={steps} />

                    {Object.keys(errors).length > 0 && (
                        <div className="mx-6 mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                            <strong>Veuillez corriger :</strong>
                            <ul className="mt-2 list-inside list-disc text-sm">
                                {Object.entries(errors).map(([k, m]) => (
                                    <li key={k}>{String(m)}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-8 p-6">
                        {/* Étape 1 */}
                        <StepCard title="Informations générales" icon={Building2} complete={step1}>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <SelectBlock
                                    label="Client *"
                                    value={data.client_id}
                                    onChange={(v) => setData('client_id', v)}
                                    options={clients.map((c) => ({ value: String(c.id), label: c.company_name }))}
                                    error={errors.client_id as string}
                                />
                                <SelectBlock
                                    label="Devise"
                                    value={data.currency_code}
                                    onChange={(v) => setData('currency_code', v)}
                                    options={currencies.map((c) => ({ value: c.code, label: `${c.name} (${c.symbol})` }))}
                                />
                                <div className="flex flex-col">
                                    <Label>Date du devis *</Label>
                                    <DateInput value={data.quote_date} onChange={(v) => setData('quote_date', v)} />
                                    {errors.quote_date && <p className="mt-1 text-xs text-red-500">{String(errors.quote_date)}</p>}
                                </div>
                                <div className="flex flex-col">
                                    <Label>Échéance *</Label>
                                    <DateInput value={data.valid_until} onChange={(v) => setData('valid_until', v)} />
                                    {errors.valid_until && <p className="mt-1 text-xs text-red-500">{String(errors.valid_until)}</p>}
                                </div>
                                <div className="flex flex-col">
                                    <Label>Aperçu</Label>
                                    <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                                        <span className="text-xs text-slate-600 dark:text-slate-300">Nouvelle création</span>
                                    </div>
                                </div>
                            </div>
                        </StepCard>

                        {/* Étape 2 */}
                        <StepCard
                            title="Articles"
                            icon={Package}
                            complete={step2}
                            disabled={!step1}
                            actions={
                                <Button variant="outline" onClick={addItem} disabled={!step1}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Ajouter
                                </Button>
                            }
                        >
                            {!step1 && <Empty msg="Complétez d'abord les informations générales" />}
                            {step1 && items.length === 0 && <Empty msg="Aucun article." />}

                            {step1 && items.length > 0 && (
                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-600 dark:bg-[#0a0420] dark:text-slate-300">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Produit</th>
                                                <th className="w-24 px-4 py-3 text-center">Qté</th>
                                                <th className="w-36 px-4 py-3 text-center">PU HT</th>
                                                <th className="w-28 px-4 py-3 text-center">TVA %</th>
                                                <th className="w-40 px-4 py-3 text-right">Total HT</th>
                                                <th className="w-10" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {items.map((it, idx) => {
                                                const lineHT = it.quantity * it.unit_price_ht;
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#0a0420]/60">
                                                        <td className="px-4 py-2">
                                                            <Select value={it.product_id} onValueChange={(v) => updateItem(idx, 'product_id', v)}>
                                                                <SelectTrigger className="h-9 w-full border-0 bg-transparent px-0 focus:ring-0">
                                                                    <SelectValue placeholder="Sélectionner…" />
                                                                </SelectTrigger>
                                                                <SelectContent className="max-h-72">
                                                                    {products.map((p) => (
                                                                        <SelectItem key={String(p.id)} value={String(p.id)}>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">{p.name}</span>
                                                                                <span className="text-xs text-slate-500">
                                                                                    SKU : {p.sku} · ID: {String(p.id)}
                                                                                </span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>

                                                        <td className="px-4 py-2 text-center">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={it.quantity}
                                                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                                className="border-0 bg-transparent text-center focus:bg-white dark:focus:bg-[#0a0420]"
                                                            />
                                                        </td>

                                                        <td className="px-4 py-2 text-center">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={it.unit_price_ht}
                                                                onChange={(e) => updateItem(idx, 'unit_price_ht', e.target.value)}
                                                                className="border-0 bg-transparent text-center focus:bg-white dark:focus:bg-[#0a0420]"
                                                            />
                                                        </td>

                                                        <td className="px-4 py-2 text-center">
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={it.tax_rate}
                                                                    disabled
                                                                    readOnly
                                                                    className="border-0 bg-slate-50 pr-6 text-center opacity-60 dark:bg-slate-800"
                                                                />
                                                                <Percent className="absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-2 text-right font-medium">{fmt(lineHT)}</td>

                                                        <td className="px-2 py-2 text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeItem(idx)}
                                                                className="hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {items.length > 0 && <TotalsBox localTotals={localTotals} promo={promo} fmt={fmt} loadingPromo={loadingPromo} />}
                        </StepCard>

                        {/* Étape 3 */}
                        <StepCard title="Notes et finalisation" icon={FileText} complete={step3} disabled={!step2}>
                            {!step2 && <Empty msg="Ajoutez d'abord des articles" />}
                            {step2 && (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="flex flex-col">
                                        <Label>Code promo</Label>
                                        <div className="relative">
                                            <Tag className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={data.promo_code ?? ''}
                                                onChange={(e) => setData('promo_code', e.target.value.toUpperCase())}
                                                placeholder="EX: RENTREE10"
                                                className="pl-9 uppercase"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Saisissez le code puis attendez la prévisualisation automatique.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <Label>Conditions</Label>
                                            <Textarea
                                                rows={3}
                                                value={data.terms_conditions}
                                                onChange={(e) => setData('terms_conditions', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Notes (visibles client)</Label>
                                            <Textarea rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Notes internes</Label>
                                            <Textarea
                                                rows={3}
                                                value={data.internal_notes}
                                                onChange={(e) => setData('internal_notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </StepCard>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" type="button" onClick={() => window.history.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !step2}
                                className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-600"
                            >
                                <Save className="mr-2 h-4 w-4" /> {processing ? 'Création…' : 'Créer le devis'}
                            </Button>
                        </div>
                    </form>
                </AppLayout>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Sous-composants                                                    */
/* ------------------------------------------------------------------ */
const HeaderCreate = ({ steps }: { steps: any[] }) => (
    <div className="mb-6 flex flex-col px-6 pt-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
                <FileText className="h-6 w-6 text-emerald-600" /> Créer un devis
            </h1>
        </div>
        <div className="mt-4 hidden md:mt-0 md:flex">
            <StepProgress steps={steps} />
        </div>
    </div>
);

const StepProgress = ({ steps }: { steps: any[] }) => (
    <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 dark:bg-slate-800">
        {steps.map((s, i) => (
            <React.Fragment key={s.id}>
                <div className="flex items-center gap-2">
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            s.complete ? 'bg-green-500 text-white' : s.active ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-400'
                        }`}
                    >
                        {s.complete ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                    </div>
                    <span className={`${s.complete ? 'text-green-400' : s.active ? 'text-white' : 'text-slate-400'} text-sm font-medium`}>
                        {s.title}
                    </span>
                </div>
                {i < steps.length - 1 && <div className={`h-0.5 w-8 ${steps[i + 1].active ? 'bg-green-400' : 'bg-slate-600'}`} />}
            </React.Fragment>
        ))}
    </div>
);

const StepCard = ({
    title,
    icon: Icon,
    complete,
    disabled = false,
    children,
    actions,
}: {
    title: string;
    icon: any;
    complete: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    actions?: React.ReactNode;
}) => (
    <div
        className={`rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
        <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${complete ? 'bg-green-500' : 'bg-emerald-500'} text-white`}>
                    {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                {title}
            </h2>
            {actions}
        </div>
        {children}
    </div>
);

const Empty = ({ msg }: { msg: string }) => <p className="py-6 text-center text-slate-500 dark:text-slate-400">{msg}</p>;

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{children}</label>
);

function SelectBlock({
    label,
    value,
    onChange,
    options,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    error?: string;
}) {
    return (
        <div>
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                    {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

const DateInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div className="relative">
            <Input
                ref={ref}
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:h-6 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
            />
            <Calendar
                className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 cursor-pointer text-slate-400"
                onClick={() => ref.current?.showPicker?.()}
            />
        </div>
    );
};

/** Boîte de totaux (comme Panier) avec fallback local et aperçu promo */
function TotalsBox({
    localTotals,
    promo,
    fmt,
    loadingPromo,
}: {
    localTotals: { sub: number; tva: number; ttc: number };
    promo: PromoPreview | null;
    fmt: (n: number) => string;
    loadingPromo: boolean;
}) {
    const sub = typeof promo?.subtotal === 'number' ? promo!.subtotal : localTotals.sub;
    const tva = typeof promo?.tax_total === 'number' ? promo!.tax_total : localTotals.tva;
    const ttc = typeof promo?.grand_total === 'number' ? promo!.grand_total : localTotals.ttc;
    const disc = typeof promo?.discount_total === 'number' ? promo!.discount_total : 0;
    const after = typeof promo?.grand_total_after === 'number' ? promo!.grand_total_after : ttc - disc;

    return (
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <TotalRow label="Sous-total HT :" value={fmt(sub)} />
                    <TotalRow label="TVA :" value={fmt(tva)} />
                    <TotalRow label="Total TTC :" value={fmt(ttc)} />
                    <div className="border-t border-dashed border-slate-300 pt-2 dark:border-slate-700">
                        <TotalRow label={loadingPromo ? 'Remises (calcul...)' : 'Remises :'} value={`- ${fmt(disc)}`} />
                        <TotalRow label="Total TTC après remises :" value={fmt(after)} bold />
                    </div>

                    {!!promo?.applied_promotions?.length && (
                        <div className="pt-2 text-xs text-slate-600 dark:text-slate-300">
                            <div className="mb-1 font-medium">Promotions appliquées :</div>
                            <ul className="list-inside list-disc space-y-0.5">
                                {promo.applied_promotions.map((p, i) => (
                                    <li key={i}>
                                        {p.name}
                                        {typeof p.amount === 'number' ? ` — - ${fmt(p.amount)}` : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const TotalRow = ({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) => (
    <div className={`flex justify-between ${bold ? 'text-lg font-bold' : ''}`}>
        <span>{label}</span>
        <span>{value}</span>
    </div>
);
