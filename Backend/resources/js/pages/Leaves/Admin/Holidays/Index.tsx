import ParticlesBackground from '@/components/ParticlesBackground';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

export default function HolidaysIndexPage() {
    const { props } = usePage<{ items: any; year: number }>();
    const rows = props.items?.data ?? [];

    const [year, setYear] = useState<number>(props.year);

    const breadcrumbs = useMemo(
        () => [
            { title: 'Congés', href: route('leaves.requests.index') },
            { title: 'Jours fériés', href: route('leaves.admin.holidays.index', { year: props.year }) },
        ],
        [props.year],
    );

    const goToYear = (y: number) => {
        setYear(y);
        router.get(
            route('leaves.admin.holidays.index'),
            { year: y },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const destroyOne = (id: number) => {
        if (!confirm('Supprimer ce jour férié ?')) return;
        router.delete(route('leaves.admin.holidays.destroy', { holiday: id }), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Congés — Jours fériés" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jours fériés</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Année {props.year}</p>
                            </div>
                        </div>

                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href={route('leaves.requests.index')}>Retour aux demandes</Link>
                                    </Button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="outline" onClick={() => goToYear(year - 1)}>
                                        <ChevronLeft className="h-4 w-4" />
                                        {year - 1}
                                    </Button>
                                    <div className="w-28">
                                        <Input
                                            type="number"
                                            value={year}
                                            onChange={(e) => setYear(Number(e.target.value))}
                                            onBlur={() => goToYear(year)}
                                            className="border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                    </div>
                                    <Button variant="outline" onClick={() => goToYear(year + 1)}>
                                        {year + 1}
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        asChild
                                        className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600"
                                    >
                                        <Link href={route('leaves.admin.holidays.create', { year: props.year })}>
                                            <Plus className="mr-1 h-4 w-4" /> Nouveau
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Liste</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{rows.length} jour(s) férié(s)</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                                        <tr className="text-left text-slate-600 dark:text-slate-300">
                                            <th className="px-6 py-3 font-medium">Date</th>
                                            <th className="px-6 py-3 font-medium">Nom</th>
                                            <th className="px-6 py-3 font-medium">Récurrent</th>
                                            <th className="px-6 py-3 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {rows.map((r: any) => (
                                            <tr key={r.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                                                <td className="px-6 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{r.date}</td>
                                                <td className="px-6 py-3 text-slate-900 dark:text-white">{r.name}</td>
                                                <td className="px-6 py-3">
                                                    <Badge variant={r.is_recurring ? 'default' : 'secondary'}>{r.is_recurring ? 'Oui' : 'Non'}</Badge>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" variant="outline" asChild>
                                                            <Link href={route('leaves.admin.holidays.edit', { holiday: r.id })}>Modifier</Link>
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => destroyOne(r.id)}>
                                                            Supprimer
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {rows.length === 0 && (
                                            <tr>
                                                <td className="py-14 text-center text-slate-600 dark:text-slate-400" colSpan={4}>
                                                    Aucun jour férié pour cette année.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
