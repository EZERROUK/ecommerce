/* --------------------------------------------------------------------------
   IMPORTS
   -------------------------------------------------------------------------- */
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, FileText, X as IconX, Layers, Plus, Truck, UploadCloud } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import type { Currency, PageProps } from '@/types';

/* --------------------------------------------------------------------------
   TYPES
   -------------------------------------------------------------------------- */
interface Product {
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
}

interface Provider {
    id: number;
    name: string;
}

interface Reason {
    id: number;
    name: string;
    type: 'in' | 'out' | 'adjustment' | 'all';
}

interface MovementFormData {
    product_id: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: string;
    reference: string;
    provider_id: string; // stocké en string pour le Select
    reason_id: string;
    unit_cost: string;
    currency_code: string;
    notes: string;
    movement_date: string;
    attachments: File[];
}

interface Props
    extends PageProps<{
        products: Product[];
        currencies: Currency[];
        providers: Provider[];
        reasons: Reason[];
    }> {}

/* --------------------------------------------------------------------------
   COMPONENT
   -------------------------------------------------------------------------- */
export default function CreateStockMovement({ products, currencies, providers, reasons }: Props) {
    /* ────────── Form state ────────── */
    const { data, setData, post, processing, errors } = useForm({
        product_id: '' as MovementFormData['product_id'],
        type: 'in' as MovementFormData['type'],
        quantity: '' as MovementFormData['quantity'],
        reference: '' as MovementFormData['reference'],
        provider_id: '' as MovementFormData['provider_id'],
        reason_id: '' as MovementFormData['reason_id'],
        unit_cost: '' as MovementFormData['unit_cost'],
        currency_code: (currencies[0]?.code ?? '') as MovementFormData['currency_code'],
        notes: '' as MovementFormData['notes'],
        movement_date: formatDateLocal(new Date()) as MovementFormData['movement_date'], // date locale (YYYY-MM-DD)
        attachments: [] as MovementFormData['attachments'],
    });

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [previews, setPreviews] = useState<string[]>([]);

    /* ────────── Pré-visu pièces jointes ────────── */
    useEffect(() => {
        const urls = data.attachments.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach(URL.revokeObjectURL);
    }, [data.attachments]);

    /* ────────── Motifs filtrés selon type ────────── */
    const filteredReasons = useMemo(() => reasons.filter((r) => r.type === 'all' || r.type === data.type), [reasons, data.type]);

    /* ────────── Handlers ────────── */
    const handleProductChange = (id: string) => {
        setData('product_id', id);
        setSelectedProduct(products.find((p) => p.id === id) ?? null);
    };

    const handleQuantity = (raw: string) => {
        const cleaned = raw.replace(/(?!^)-|[^0-9-]/g, '').replace(/^-{2,}/, '-');
        setData('quantity', cleaned);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setData('attachments', Array.from(e.target.files).slice(0, 5));
    };

    const handleSubmit: React.FormEventHandler = (e) => {
        e.preventDefault();
        post(route('stock-movements.store'), {
            forceFormData: true,
            onError: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        });
    };

    const qtyPlaceholder = {
        in: 'Quantité à ajouter (ex : 10)',
        out: 'Quantité à retirer (ex : 5)',
        adjustment: 'Ajustement (ex : +5 ou -3)',
    }[data.type];

    /* ---- Date picker helpers ---- */
    const movementDateRef = useRef<HTMLInputElement>(null);
    const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
        const el = ref.current as any;
        if (el?.showPicker) el.showPicker();
        else el?.focus();
    };

    /* ---------------------------------------------------------------------- */
    /*                                 RENDER                                 */
    /* ---------------------------------------------------------------------- */
    return (
        <>
            <Head title="Nouveau mouvement de stock" />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout breadcrumbs={[{ title: 'Inventaire', href: '/stock-movements' }, { title: 'Créer' }]}>
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* ──────── Formulaire ──────── */}
                        <div className="col-span-12 lg:col-span-8 xl:col-span-7">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Nouveau mouvement de stock</h1>

                                {/* erreurs */}
                                {Object.keys(errors).length > 0 && (
                                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                                        <strong>Erreur(s) dans le formulaire :</strong>
                                        <ul className="mt-2 list-inside list-disc text-sm">
                                            {Object.entries(errors).map(([f, m]) => (
                                                <li key={f}>{m}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Produit & type */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* Produit */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Produit <span className="text-red-500">*</span>
                                            </label>
                                            <Select value={data.product_id} onValueChange={handleProductChange}>
                                                <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                    <SelectValue placeholder="Sélectionner un produit" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60 overflow-y-auto">
                                                    {products.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.sku} — {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Type */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Type de mouvement <span className="text-red-500">*</span>
                                            </label>
                                            <Select value={data.type} onValueChange={(v) => setData('type', v as any)}>
                                                <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="in">Entrée</SelectItem>
                                                    <SelectItem value="out">Sortie</SelectItem>
                                                    <SelectItem value="adjustment">Ajustement</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Stock actuel */}
                                    {selectedProduct && (
                                        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                                            <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            <span className="text-blue-800 dark:text-blue-300">
                                                Stock actuel : <strong>{selectedProduct.stock_quantity}</strong> unités
                                            </span>
                                        </div>
                                    )}

                                    {/* Quantité & date */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Quantité <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9\\-]*"
                                                placeholder={qtyPlaceholder}
                                                required
                                                value={data.quantity}
                                                onChange={(e) => handleQuantity(e.target.value)}
                                                className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Date du mouvement <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    ref={movementDateRef}
                                                    type="date"
                                                    required
                                                    value={data.movement_date}
                                                    onChange={(e) => setData('movement_date', e.target.value)}
                                                    className="border-slate-300 bg-white pr-10 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => openPicker(movementDateRef)}
                                                    className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                                                    aria-label="Ouvrir le calendrier"
                                                    tabIndex={-1}
                                                >
                                                    <Calendar className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fournisseur & référence */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* Fournisseur */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Fournisseur</label>
                                            <Select value={data.provider_id} onValueChange={(v) => setData('provider_id', v)}>
                                                <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                    <SelectValue placeholder="Sélectionner un fournisseur" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60 overflow-y-auto">
                                                    {providers.map((p) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {/* Référence interne */}
                                        <InputField
                                            label={
                                                <span>
                                                    Référence&nbsp;
                                                    <small className="text-xs text-gray-400 dark:text-gray-500">| N° du BL |</small>
                                                </span>
                                            }
                                            value={data.reference}
                                            onChange={(v) => setData('reference', v)}
                                        />
                                    </div>

                                    {/* Motif */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Motif <span className="text-red-500">*</span>
                                        </label>
                                        <Select value={data.reason_id} onValueChange={(v) => setData('reason_id', v)}>
                                            <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                <SelectValue placeholder="Sélectionner un motif" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60 overflow-y-auto">
                                                {filteredReasons.map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Coût + Devise */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Coût unitaire</label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={data.unit_cost}
                                                    onChange={(e) => setData('unit_cost', e.target.value)}
                                                    className="border-slate-300 bg-white pr-10 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                />
                                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 dark:text-slate-400">
                                                    {currencies.find((c) => c.code === data.currency_code)?.symbol ?? '€'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Devise</label>
                                            <Select value={data.currency_code} onValueChange={(v) => setData('currency_code', v)}>
                                                <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                    <SelectValue placeholder="Devise" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currencies.map((c) => (
                                                        <SelectItem key={c.code} value={c.code}>
                                                            {c.symbol} ({c.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <TextareaField label="Notes" rows={3} value={data.notes} onChange={(v) => setData('notes', v)} />

                                    {/* Pièces jointes */}
                                    <Attachments
                                        files={data.attachments}
                                        previews={previews}
                                        onChange={handleFileChange}
                                        remove={(idx) =>
                                            setData(
                                                'attachments',
                                                data.attachments.filter((_, i) => i !== idx),
                                            )
                                        }
                                    />

                                    {/* Actions */}
                                    <div className="flex justify-between pt-4">
                                        <Button
                                            type="button"
                                            onClick={() => history.back()}
                                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Annuler
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="group flex items-center justify-center bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-600"
                                        >
                                            {processing ? (
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : (
                                                <Plus className="mr-2 h-4 w-4" />
                                            )}
                                            {processing ? 'Enregistrement…' : 'Enregistrer'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* ──────── Aide / Infos ──────── */}
                        <SideHelp />
                    </div>
                </AppLayout>
            </div>
        </>
    );
}

/* --------------------------------------------------------------------------
   SUB-COMPONENTS
   -------------------------------------------------------------------------- */
const InputField = ({
    label,
    value,
    onChange,
    placeholder = '',
    required = false,
}: {
    label: React.ReactNode;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    required?: boolean;
}) => (
    <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        <Input
            placeholder={placeholder}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
    </div>
);

const TextareaField = ({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) => (
    <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <Textarea
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
    </div>
);

const Attachments = ({
    files,
    previews,
    onChange,
    remove,
}: {
    files: File[];
    previews: string[];
    onChange: (e: any) => void;
    remove: (i: number) => void;
}) => (
    <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Pièces jointes</label>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-center hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800">
            <UploadCloud className="mb-2 h-6 w-6 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Cliquez ou déposez vos fichiers ici (max. 5)</p>
            <input type="file" multiple className="hidden" onChange={onChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
        </label>

        {previews.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
                {previews.map((_, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        {files[i]?.name}
                        <Button variant="ghost" size="icon" onClick={() => remove(i)}>
                            <IconX className="h-4 w-4" />
                        </Button>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

/* Encart d’aide */
const SideHelp = () => (
    <div className="col-span-12 lg:col-span-4 xl:col-span-5">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
            <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Guide d’utilisation</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
                Sélectionnez un produit, le type de mouvement, puis le motif adapté. Ajoutez vos justificatifs pour garder une trace complète.
            </p>
            <div className="mt-4 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                <Truck className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300">
                    Le coût unitaire est facultatif ; il sert uniquement à valoriser votre stock.
                </span>
            </div>
        </div>
    </div>
);

/* --------------------------------------------------------------------------
   UTILS
   -------------------------------------------------------------------------- */
function formatDateLocal(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
