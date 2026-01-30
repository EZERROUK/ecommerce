import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';

export default function LeaveTypesCreatePage() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name_fr: '',
        name_ar: '',
        requires_balance: true as boolean,
        requires_attachment: false as boolean,
        is_active: true as boolean,
        sort_order: 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('leaves.admin.leave-types.store'));
    };

    return (
        <>
            <Head title="Créer type de congé" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Congés', href: '/leaves/calendar' },
                    { title: 'Types', href: '/leaves/admin/leave-types' },
                    { title: 'Créer', href: '/leaves/admin/leave-types/create' },
                ]}
            >
                <div className="mx-auto w-full max-w-3xl px-4 py-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-xl font-semibold">Créer un type</h1>
                        <Link className="text-sm underline" href={route('leaves.admin.leave-types.index')}>
                            Retour
                        </Link>
                    </div>

                    <form onSubmit={submit} className="rounded border bg-white p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-xs text-slate-600">Code</label>
                                <input
                                    className="mt-1 w-full rounded border px-2 py-2 text-sm"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                />
                                {errors.code && <div className="mt-1 text-xs text-red-600">{errors.code}</div>}
                            </div>
                            <div>
                                <label className="text-xs text-slate-600">Ordre</label>
                                <input
                                    className="mt-1 w-full rounded border px-2 py-2 text-sm"
                                    type="number"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', Number(e.target.value))}
                                />
                                {errors.sort_order && <div className="mt-1 text-xs text-red-600">{errors.sort_order}</div>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-600">Nom (FR)</label>
                                <input
                                    className="mt-1 w-full rounded border px-2 py-2 text-sm"
                                    value={data.name_fr}
                                    onChange={(e) => setData('name_fr', e.target.value)}
                                />
                                {errors.name_fr && <div className="mt-1 text-xs text-red-600">{errors.name_fr}</div>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-600">Nom (AR)</label>
                                <input
                                    className="mt-1 w-full rounded border px-2 py-2 text-sm"
                                    value={data.name_ar}
                                    onChange={(e) => setData('name_ar', e.target.value)}
                                />
                                {errors.name_ar && <div className="mt-1 text-xs text-red-600">{errors.name_ar}</div>}
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.requires_balance}
                                    onChange={(e) => setData('requires_balance', e.target.checked)}
                                />
                                Nécessite solde
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={data.requires_attachment}
                                    onChange={(e) => setData('requires_attachment', e.target.checked)}
                                />
                                Justificatif requis
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                                Actif
                            </label>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                type="submit"
                                className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                disabled={processing}
                            >
                                {processing ? 'Enregistrement…' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </div>
            </AppLayout>
        </>
    );
}
