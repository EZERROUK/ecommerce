// resources/js/pages/Clients/Create.tsx
import type { FormDataConvertible } from '@inertiajs/core';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, Plus } from 'lucide-react';
import React from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/* Form data                                                          */
/* ------------------------------------------------------------------ */
type TaxRegime = 'normal' | 'auto_entrepreneur' | 'exonere';

// ✅ Important : `useForm<T>()` attend un type avec une signature d’index.
// On utilise `FormDataConvertible` (Inertia) pour éviter les types `never` (récursion de FormDataKeys).
interface FormData extends Record<string, FormDataConvertible> {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    ice: string;
    rc: string;
    patente: string;
    cnss: string;
    if_number: string;
    tax_regime: TaxRegime;
    is_tva_subject: boolean;
    is_active: boolean;
    notes: string;
}

export default function CreateClient() {
    const { data, setData, post, processing, errors, clearErrors } = useForm<FormData>({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Maroc',
        ice: '',
        rc: '',
        patente: '',
        cnss: '',
        if_number: '',
        tax_regime: 'normal',
        is_tva_subject: true,
        is_active: true,
        notes: '',
    });

    type FieldKey = keyof FormData;
    const setField = <K extends FieldKey>(key: K, value: FormData[K]) =>
        (setData as unknown as (key: string, value: FormDataConvertible) => void)(key as string, value as unknown as FormDataConvertible);
    const errorFor = (key: FieldKey) => (errors as Record<string, string | undefined>)[key as string];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('clients.store'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Client créé avec succès'),
            onError: () => toast.error('Erreur lors de la création'),
        });
    };

    const hasErrors = Object.keys(errors).length > 0;

    /* ------------------------------------------------------------------ */
    /* Render                                                             */
    /* ------------------------------------------------------------------ */
    return (
        <>
            <Head title="Créer un client" />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Clients', href: '/clients' },
                        { title: 'Créer', href: '' },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* ────────── Formulaire ────────── */}
                        <div className="col-span-12 lg:col-span-8 xl:col-span-7">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Nouveau client</h1>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Affichage erreurs */}
                                    {hasErrors && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <strong>Erreur(s) dans le formulaire :</strong>
                                                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                                                        {Object.entries(errors as Record<string, string>).map(([field, msg]) => (
                                                            <li key={field}>{msg}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <Button type="button" variant="outline" className="h-8 px-3" onClick={() => clearErrors()}>
                                                    <span className="text-xs">Fermer</span>
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ────────── Bloc Infos générales ────────── */}
                                    <Section title="Informations générales">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <InputLabeled
                                                label="Nom de l’entreprise"
                                                required
                                                value={data.company_name}
                                                onChange={(v) => setField('company_name', v)}
                                                error={errorFor('company_name')}
                                            />
                                            <InputLabeled
                                                label="Nom du contact"
                                                value={data.contact_name}
                                                onChange={(v) => setField('contact_name', v)}
                                                error={errorFor('contact_name')}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <InputLabeled
                                                type="email"
                                                label="Email"
                                                required
                                                value={data.email}
                                                onChange={(v) => setField('email', v)}
                                                error={errorFor('email')}
                                            />
                                            <InputLabeled
                                                label="Téléphone"
                                                placeholder="+212 6 12 34 56 78"
                                                value={data.phone}
                                                onChange={(v) => setField('phone', v)}
                                                error={errorFor('phone')}
                                            />
                                        </div>
                                    </Section>

                                    {/* ────────── Bloc Adresse ────────── */}
                                    <Section title="Adresse">
                                        <TextareaLabeled
                                            label="Adresse"
                                            required
                                            value={data.address}
                                            onChange={(v) => setField('address', v)}
                                            error={errorFor('address')}
                                        />

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <InputLabeled
                                                label="Ville"
                                                required
                                                value={data.city}
                                                onChange={(v) => setField('city', v)}
                                                error={errorFor('city')}
                                            />
                                            <InputLabeled
                                                label="Code postal"
                                                value={data.postal_code}
                                                onChange={(v) => setField('postal_code', v)}
                                                error={errorFor('postal_code')}
                                            />
                                            <InputLabeled
                                                label="Pays"
                                                required
                                                value={data.country}
                                                onChange={(v) => setField('country', v)}
                                                error={errorFor('country')}
                                            />
                                        </div>
                                    </Section>

                                    {/* ────────── Bloc Infos fiscales ────────── */}
                                    <Section title="Informations fiscales marocaines">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <InputLabeled
                                                label="ICE (15 chiffres)"
                                                maxLength={15}
                                                placeholder="001234567890123"
                                                value={data.ice}
                                                onChange={(v) => setField('ice', v)}
                                                error={errorFor('ice')}
                                            />
                                            <InputLabeled
                                                label="Registre de Commerce"
                                                value={data.rc}
                                                onChange={(v) => setField('rc', v)}
                                                error={errorFor('rc')}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <InputLabeled
                                                label="Patente"
                                                value={data.patente}
                                                onChange={(v) => setField('patente', v)}
                                                error={errorFor('patente')}
                                            />
                                            <InputLabeled
                                                label="CNSS"
                                                value={data.cnss}
                                                onChange={(v) => setField('cnss', v)}
                                                error={errorFor('cnss')}
                                            />
                                            <InputLabeled
                                                label="Identifiant Fiscal"
                                                value={data.if_number}
                                                onChange={(v) => setField('if_number', v)}
                                                error={errorFor('if_number')}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* Régime fiscal */}
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Régime fiscal <span className="text-red-500">*</span>
                                                </label>
                                                <Select value={data.tax_regime} onValueChange={(v) => setField('tax_regime', v as TaxRegime)}>
                                                    <SelectTrigger className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                        <SelectValue placeholder="Régime fiscal" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="auto_entrepreneur">Auto-entrepreneur</SelectItem>
                                                        <SelectItem value="exonere">Exonéré</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errorFor('tax_regime') && <p className="mt-1 text-xs text-red-600">{errorFor('tax_regime')}</p>}
                                            </div>

                                            {/* TVA */}
                                            <div className="pt-7">
                                                <CheckboxLabeled
                                                    label="Assujetti à la TVA"
                                                    checked={data.is_tva_subject}
                                                    onChange={(chk) => setField('is_tva_subject', chk)}
                                                />
                                            </div>
                                        </div>
                                    </Section>

                                    {/* ────────── Bloc Paramètres ────────── */}
                                    <Section title="Paramètres">
                                        <CheckboxLabeled
                                            label="Client actif"
                                            checked={data.is_active}
                                            onChange={(chk) => setField('is_active', chk)}
                                        />

                                        <TextareaLabeled
                                            label="Notes internes"
                                            placeholder="Notes internes sur ce client…"
                                            value={data.notes}
                                            onChange={(v) => setField('notes', v)}
                                            error={errorFor('notes')}
                                        />
                                    </Section>

                                    {/* ────────── Actions ────────── */}
                                    <div className="flex justify-between pt-4">
                                        <Button
                                            type="button"
                                            onClick={() => window.history.back()}
                                            className="border-0 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Annuler
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="group relative flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 focus:ring-2 focus:ring-red-500"
                                        >
                                            {processing ? (
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : (
                                                <Plus className="mr-2 h-4 w-4" />
                                            )}
                                            {processing ? 'Création…' : 'Créer le client'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* ────────── Panneau d’aide ────────── */}
                        <div className="col-span-12 lg:col-span-4 xl:col-span-5">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Guide de création</h2>

                                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                    <p>Remplissez les informations générales, puis les détails fiscaux marocains.</p>

                                    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                        <div className="space-y-2">
                                            <p className="font-medium">Conseils :</p>
                                            <ul className="list-inside list-disc space-y-1">
                                                <li>ICE et email doivent être uniques.</li>
                                                <li>Activez le client uniquement s’il est opérationnel.</li>
                                                <li>Renseignez les notes pour le suivi interne.</li>
                                            </ul>
                                        </div>
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

/* ------------------------------------------------------------------ */
/* Sous-composants UI                                                 */
/* ------------------------------------------------------------------ */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="border-b border-slate-200 pb-1 text-lg font-semibold text-slate-900 dark:border-slate-700 dark:text-white">{title}</h3>
            {children}
        </div>
    );
}

function InputLabeled(props: {
    label: string;
    error?: string;
    onChange: (v: string) => void;
    type?: string;
    value: string;
    required?: boolean;
    placeholder?: string;
    maxLength?: number;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {props.label}
                {props.required && <span className="text-red-500">*</span>}
            </label>
            <Input
                type={props.type ?? 'text'}
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder={props.placeholder}
                maxLength={props.maxLength}
                required={props.required}
                className={`border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${props.error ? 'border-red-500' : ''}`}
            />
            {props.error && <p className="mt-1 text-xs text-red-600">{props.error}</p>}
        </div>
    );
}

function TextareaLabeled(props: {
    label: string;
    error?: string;
    onChange: (v: string) => void;
    value: string;
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {props.label}
                {props.required && <span className="text-red-500">*</span>}
            </label>
            <Textarea
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder={props.placeholder}
                required={props.required}
                className={`border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white ${props.error ? 'border-red-500' : ''}`}
            />
            {props.error && <p className="mt-1 text-xs text-red-600">{props.error}</p>}
        </div>
    );
}

function CheckboxLabeled({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center space-x-2 select-none">
            <Checkbox checked={checked} onCheckedChange={(c) => onChange(Boolean(c))} />
            <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
        </label>
    );
}
