// resources/js/Pages/TaxRates/Edit.tsx
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { TaxRate } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Info, Save } from 'lucide-react';
import React from 'react';
import { route } from 'ziggy-js';

interface Props {
    taxRate: TaxRate;
}

export default function TaxRateEdit({ taxRate }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: taxRate.name,
        rate: taxRate.rate.toString(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('taxrates.update', taxRate.id));
    };

    return (
        <>
            <Head title={`Modifier taux de TVA — ${taxRate.name}`} />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Taux de TVA', href: '/tax-rates' },
                    { title: taxRate.name, href: route('taxrates.show', taxRate.id) },
                    { title: 'Éditer' },
                ]}
            >
                <div className="grid grid-cols-12 gap-6 p-6">
                    {/* Formulaire principal */}
                    <div className="col-span-12 lg:col-span-8 xl:col-span-7">
                        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Modifier le taux de TVA</h1>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Nom */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Nom <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                                </div>

                                {/* Taux */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Taux (%) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        max={100}
                                        value={data.rate}
                                        onChange={(e) => setData('rate', e.target.value)}
                                        required
                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                    />
                                    {errors.rate && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rate}</p>}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-between pt-4">
                                    <Button type="button" variant="secondary" onClick={() => history.back()}>
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

                    {/* Panneau d'information */}
                    <div className="col-span-12 lg:col-span-4 xl:col-span-5">
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />À propos des taux de TVA
                            </h2>
                            <div className="space-y-3 text-justify text-sm text-slate-700 dark:text-slate-300">
                                <p>
                                    Les taux de TVA sont appliqués sur les ventes de biens et services. Certains produits essentiels peuvent
                                    bénéficier de taux réduits.
                                </p>
                                <p>Voici quelques exemples en vigueur au Maroc :</p>
                                <ul className="list-disc space-y-1 pl-5">
                                    <li>Taux normal : 20%</li>
                                    <li>Taux réduit : 10%</li>
                                    <li>Taux super réduit : 7%</li>
                                    <li>Taux particulier : 14%</li>
                                </ul>
                                <div className="mt-4 flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                    <Info className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <p>Définissez un taux de TVA conforme au produit ou service vendu pour garantir la conformité fiscale.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
