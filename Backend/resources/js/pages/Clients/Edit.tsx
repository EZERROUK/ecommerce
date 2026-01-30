// resources/js/pages/Clients/Edit.tsx
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Info } from 'lucide-react';
import React from 'react';
import toast from 'react-hot-toast';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export interface Client {
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
}

interface Props {
    client: Client;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function EditClient({ client }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        company_name: client.company_name,
        contact_name: client.contact_name ?? '',
        email: client.email,
        phone: client.phone ?? '',
        address: client.address,
        city: client.city,
        postal_code: client.postal_code ?? '',
        country: client.country,
        ice: client.ice ?? '',
        rc: client.rc ?? '',
        patente: client.patente ?? '',
        cnss: client.cnss ?? '',
        if_number: client.if_number ?? '',
        tax_regime: client.tax_regime,
        is_tva_subject: client.is_tva_subject,
        is_active: client.is_active,
        notes: client.notes ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('clients.update', client.id), {
            onSuccess: () => toast.success('Client mis à jour avec succès !'),
            onError: () => toast.error('Erreur lors de la mise à jour'),
        });
    };

    /* ------------------------------------------------------------------ */
    /* Render                                                             */
    /* ------------------------------------------------------------------ */
    return (
        <>
            <Head title={`Modifier – ${client.company_name}`} />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Clients', href: '/clients' },
                        { title: client.company_name, href: route('clients.show', client.id) },
                        { title: 'Modifier' },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* ────────── Formulaire ────────── */}
                        <div className="col-span-12 lg:col-span-8 xl:col-span-7">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Modifier {client.company_name}</h1>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Erreurs */}
                                    {Object.keys(errors).length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                                        >
                                            <strong>Erreur(s) :</strong>
                                            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                                                {Object.entries(errors).map(([f, m]) => (
                                                    <li key={f}>{m}</li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}

                                    {/* ───── Informations générales ───── */}
                                    <Section title="Informations générales">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <InputLabeled
                                                label="Nom de l’entreprise"
                                                required
                                                value={data.company_name}
                                                onChange={(v) => setData('company_name', v)}
                                                error={errors.company_name}
                                            />
                                            <InputLabeled
                                                label="Nom du contact"
                                                value={data.contact_name}
                                                onChange={(v) => setData('contact_name', v)}
                                                error={errors.contact_name}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <InputLabeled
                                                type="email"
                                                label="Email"
                                                required
                                                value={data.email}
                                                onChange={(v) => setData('email', v)}
                                                error={errors.email}
                                            />
                                            <InputLabeled
                                                label="Téléphone"
                                                placeholder="+212 6 12 34 56 78"
                                                value={data.phone}
                                                onChange={(v) => setData('phone', v)}
                                                error={errors.phone}
                                            />
                                        </div>
                                    </Section>

                                    {/* ───── Adresse ───── */}
                                    <Section title="Adresse">
                                        <TextareaLabeled
                                            label="Adresse"
                                            required
                                            value={data.address}
                                            onChange={(v) => setData('address', v)}
                                            error={errors.address}
                                        />

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <InputLabeled
                                                label="Ville"
                                                required
                                                value={data.city}
                                                onChange={(v) => setData('city', v)}
                                                error={errors.city}
                                            />
                                            <InputLabeled
                                                label="Code postal"
                                                value={data.postal_code}
                                                onChange={(v) => setData('postal_code', v)}
                                                error={errors.postal_code}
                                            />
                                            <InputLabeled
                                                label="Pays"
                                                required
                                                value={data.country}
                                                onChange={(v) => setData('country', v)}
                                                error={errors.country}
                                            />
                                        </div>
                                    </Section>

                                    {/* ───── Informations fiscales ───── */}
                                    <Section title="Informations fiscales marocaines">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <InputLabeled
                                                label="ICE (15 chiffres)"
                                                maxLength={15}
                                                value={data.ice}
                                                onChange={(v) => setData('ice', v)}
                                                error={errors.ice}
                                            />
                                            <InputLabeled
                                                label="Registre de Commerce"
                                                value={data.rc}
                                                onChange={(v) => setData('rc', v)}
                                                error={errors.rc}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <InputLabeled
                                                label="Patente"
                                                value={data.patente}
                                                onChange={(v) => setData('patente', v)}
                                                error={errors.patente}
                                            />
                                            <InputLabeled label="CNSS" value={data.cnss} onChange={(v) => setData('cnss', v)} error={errors.cnss} />
                                            <InputLabeled
                                                label="Identifiant Fiscal"
                                                value={data.if_number}
                                                onChange={(v) => setData('if_number', v)}
                                                error={errors.if_number}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Régime fiscal <span className="text-red-500">*</span>
                                                </label>
                                                <Select value={data.tax_regime} onValueChange={(v) => setData('tax_regime', v as any)}>
                                                    <SelectTrigger className="border-slate-300 bg-white text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                        <SelectValue placeholder="Régime fiscal" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="auto_entrepreneur">Auto-entrepreneur</SelectItem>
                                                        <SelectItem value="exonere">Exonéré</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <CheckboxLabeled
                                                label="Assujetti à la TVA"
                                                checked={data.is_tva_subject}
                                                onChange={(chk) => setData('is_tva_subject', chk)}
                                            />
                                        </div>
                                    </Section>

                                    {/* ───── Paramètres ───── */}
                                    <Section title="Paramètres">
                                        <CheckboxLabeled
                                            label="Client actif"
                                            checked={data.is_active}
                                            onChange={(chk) => setData('is_active', chk)}
                                        />

                                        <TextareaLabeled
                                            label="Notes internes"
                                            placeholder="Notes internes sur ce client…"
                                            value={data.notes}
                                            onChange={(v) => setData('notes', v)}
                                            error={errors.notes}
                                        />
                                    </Section>

                                    {/* ───── Actions ───── */}
                                    <div className="flex justify-between pt-4">
                                        <Button
                                            type="button"
                                            onClick={() => history.back()}
                                            className="border-0 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
                                            ) : (
                                                <Check className="mr-2 h-4 w-4" />
                                            )}
                                            {processing ? 'Mise à jour…' : 'Mettre à jour'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* ────────── Panneau d’aide ────────── */}
                        <div className="col-span-12 lg:col-span-4 xl:col-span-5">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Conseils</h2>
                                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                    <p>Modifiez les informations nécessaires puis enregistrez.</p>
                                    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                        <ul className="list-inside list-disc space-y-1">
                                            <li>Assurez-vous que l’ICE et l’email restent uniques.</li>
                                            <li>Utilisez le champ notes pour le suivi interne.</li>
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

/* ------------------------------------------------------------------ */
/* Helpers UI                                                         */
/* ------------------------------------------------------------------ */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4">
        <h3 className="border-b border-slate-200 pb-1 text-lg font-semibold text-slate-900 dark:border-slate-700 dark:text-white">{title}</h3>
        {children}
    </div>
);

const InputLabeled = (props: {
    label: string;
    error?: string;
    onChange: (v: string) => void;
    type?: string;
    value: string;
    required?: boolean;
    placeholder?: string;
    maxLength?: number;
}) => (
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

const TextareaLabeled = (props: {
    label: string;
    error?: string;
    onChange: (v: string) => void;
    value: string;
    required?: boolean;
    placeholder?: string;
}) => (
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

const CheckboxLabeled = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center space-x-2 select-none">
        <Checkbox checked={checked} onCheckedChange={(c) => onChange(!!c)} />
        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </label>
);
