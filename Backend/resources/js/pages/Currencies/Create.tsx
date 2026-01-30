import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import React from 'react';
import { route } from 'ziggy-js';

export default function CreateCurrency() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        symbol: '',
        name: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('currencies.store'));
    };

    return (
        <>
            <Head title="Créer une devise" />
            <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Devises', href: '/currencies' }, { title: 'Créer' }]}>
                <div className="grid grid-cols-12 gap-6 p-6">
                    {/* Formulaire */}
                    <div className="col-span-12 lg:col-span-8 xl:col-span-7">
                        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Nouvelle devise</h1>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Nom */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Nom <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                                </div>

                                {/* Code ISO */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Code ISO <span className="text-xs text-gray-400">(ex: EUR)</span> <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        maxLength={3}
                                        minLength={2}
                                        required
                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 uppercase focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                    />
                                    {errors.code && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code}</p>}
                                </div>

                                {/* Symbole */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Symbole <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.symbol}
                                        onChange={(e) => setData('symbol', e.target.value)}
                                        maxLength={5}
                                        required
                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                    />
                                    {errors.symbol && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.symbol}</p>}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-between pt-4">
                                    <Button type="button" variant="secondary" onClick={() => history.back()}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Création…' : 'Créer la devise'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Aide */}
                    <div className="col-span-12 lg:col-span-4 xl:col-span-5">
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />À propos des devises
                            </h2>
                            <div className="space-y-3 text-justify text-sm text-slate-700 dark:text-slate-300">
                                <p>Ajoutez une devise que vous souhaitez utiliser dans vos opérations, factures ou devis.</p>
                                <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                    <Info className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <p>
                                        Le code doit être au format ISO 4217 (ex: EUR, USD, MAD). Le symbole (€, $, د.م., ...) est utilisé dans
                                        l’interface utilisateur.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
