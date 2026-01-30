import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Shield } from 'lucide-react';
import React from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

export default function CreatePermission() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('permissions.store'));
    };

    return (
        <>
            <Head title="Créer une permission" />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Permissions', href: '/permissions' },
                        { title: 'Créer', href: '/permissions/create' },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* ─────── Formulaire ─────── */}
                        <div className="col-span-12 lg:col-span-7 xl:col-span-6">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Créer une nouvelle permission</h1>

                                <form onSubmit={submit} className="space-y-6">
                                    {/* Nom de la permission */}
                                    <FieldText
                                        id="name"
                                        label="Nom de la permission"
                                        value={data.name}
                                        onChange={(v) => setData('name', v)}
                                        error={errors.name}
                                        placeholder="Ex : create_users, edit_products, view_reports"
                                    />

                                    {/* Actions */}
                                    <div className="flex justify-between pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => window.history.back()}
                                            className="bg-muted hover:bg-muted/80 text-slate-700 dark:text-slate-300"
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
                                            {processing ? 'Création…' : 'Créer la permission'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* ─────── Panneau bonnes pratiques ─────── */}
                        <div className="col-span-12 lg:col-span-5 xl:col-span-6">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Bonnes pratiques</h2>

                                <p className="text-slate-600 dark:text-slate-300">
                                    Les permissions définissent des actions précises qu’un utilisateur peut réaliser. Utilise un nommage cohérent :
                                </p>

                                <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                    {['create', 'read', 'update', 'delete'].map((action) => (
                                        <li key={action}>
                                            <code className="rounded bg-slate-100 px-1 py-0.5 text-sm dark:bg-slate-800">{action}_[ressource]</code>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-6 rounded-md border border-blue-100 bg-blue-50 p-4 dark:border-blue-600/40 dark:bg-blue-900/30">
                                    <h3 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-300">Conseil</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-200">
                                        Préfère des permissions granulaires que tu pourras combiner, plutôt qu’une seule permission trop large à
                                        découper plus tard.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>
        </>
    );
}

/* ─────── Champ texte réutilisable ─────── */
function FieldText({
    id,
    label,
    value,
    onChange,
    error,
    placeholder,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    placeholder?: string;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <Shield className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    id={id}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    className={`block w-full rounded-lg border bg-white py-3 pr-3 pl-10 dark:bg-slate-800 ${
                        error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'
                    } focus:border-red-500 focus:ring-1 focus:ring-red-500`}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
