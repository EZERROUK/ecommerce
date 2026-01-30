import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import React from 'react';

export default function HolidaysEditPage() {
    const { props } = usePage<{ item: any }>();
    const item = props.item;

    const { data, setData, patch, processing, errors } = useForm({
        name: item.name ?? '',
        date: item.date ?? '',
        is_recurring: !!item.is_recurring,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('leaves.admin.holidays.update', { holiday: item.id }));
    };

    const destroyOne = () => {
        if (!confirm('Supprimer ce jour férié ?')) return;
        router.delete(route('leaves.admin.holidays.destroy', { holiday: item.id }));
    };

    return (
        <>
            <Head title="Modifier jour férié" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Congés', href: '/leaves/calendar' },
                    { title: 'Jours fériés', href: '/leaves/admin/holidays' },
                    { title: `#${item.id}`, href: `/leaves/admin/holidays/${item.id}/edit` },
                ]}
            >
                <div className="mx-auto w-full max-w-3xl px-4 py-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-xl font-semibold">Modifier un jour férié</h1>
                        <Link
                            className="text-sm underline"
                            href={route('leaves.admin.holidays.index', { year: String(item.date ?? '').slice(0, 4) })}
                        >
                            Retour
                        </Link>
                    </div>

                    <form onSubmit={submit} className="rounded border bg-white p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-600">Nom</label>
                                <input
                                    className="mt-1 w-full rounded border px-2 py-2 text-sm"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <div className="mt-1 text-xs text-red-600">{errors.name}</div>}
                            </div>

                            <div>
                                <label className="text-xs text-slate-600">Date</label>
                                <input
                                    className="mt-1 w-full rounded border px-2 py-2 text-sm"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                />
                                {errors.date && <div className="mt-1 text-xs text-red-600">{errors.date}</div>}
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <input type="checkbox" checked={data.is_recurring} onChange={(e) => setData('is_recurring', e.target.checked)} />
                                <span className="text-sm">Récurrent (chaque année)</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                type="submit"
                                className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                disabled={processing}
                            >
                                {processing ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                            <button type="button" className="text-sm text-red-700 underline" onClick={destroyOne}>
                                Supprimer
                            </button>
                        </div>
                    </form>
                </div>
            </AppLayout>
        </>
    );
}
