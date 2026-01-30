import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import React from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Permission {
    id: number;
    name: string;
}
interface Props {
    permission: Permission;
}

export default function EditPermission({ permission }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        name: permission.name,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('permissions.update', permission.id));
    };

    return (
        <>
            <Head title={`Modifier la permission – ${permission.name}`} />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Permissions', href: '/permissions' },
                        { title: `Modifier – ${permission.name}`, href: route('permissions.edit', permission.id) },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* ─────── Formulaire ─────── */}
                        <div className="col-span-12 lg:col-span-7 xl:col-span-6">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Modifier la permission</h1>

                                <form onSubmit={submit} className="space-y-6">
                                    {/* Nom */}
                                    <FieldText
                                        id="name"
                                        label="Nom de la permission"
                                        value={data.name}
                                        onChange={(v) => setData('name', v)}
                                        error={errors.name}
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
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            {processing ? 'Mise à jour…' : 'Mettre à jour'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* ─────── Panneau impacts ─────── */}
                        <div className="col-span-12 lg:col-span-5 xl:col-span-6">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Impacts de la modification</h2>

                                <p className="text-slate-600 dark:text-slate-300">
                                    Changer le nom d’une permission impacte les rôles et le code qui l’utilisent.
                                </p>

                                <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 p-4 dark:border-amber-600/40 dark:bg-amber-900/30">
                                    <h3 className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-300">Attention</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-200">
                                        Mets aussi à jour les vérifications (policies, middleware…) si tu renomme cette permission.
                                    </p>
                                </div>

                                <h3 className="mt-6 text-sm font-medium text-slate-700 dark:text-slate-300">Points à vérifier après modification</h3>
                                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                    <li>Les rôles utilisant cette permission fonctionnent toujours.</li>
                                    <li>Les contrôles d’accès liés à cette permission sont à jour.</li>
                                    <li>Informe l’équipe dev si nécessaire.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>
        </>
    );
}

/* ─────── Champ texte ─────── */
function FieldText({
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
    error?: string;
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
