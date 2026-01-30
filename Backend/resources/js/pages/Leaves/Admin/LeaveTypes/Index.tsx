import ParticlesBackground from '@/components/ParticlesBackground';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

export default function LeaveTypesIndexPage() {
    const { props } = usePage<{ items: any }>();
    const rows = props.items?.data ?? [];

    const breadcrumbs = useMemo(
        () => [
            { title: 'Congés', href: route('leaves.requests.index') },
            { title: 'Types', href: route('leaves.admin.leave-types.index') },
        ],
        [],
    );

    return (
        <>
            <Head title="Congés — Types" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Types de congés</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Configuration des types (soldes, justificatifs, activation).
                                </p>
                            </div>
                        </div>

                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href={route('leaves.requests.index')}>Retour aux demandes</Link>
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        asChild
                                        className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600"
                                    >
                                        <Link href={route('leaves.admin.leave-types.create')}>
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
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{rows.length} type(s)</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                                        <tr className="text-left text-slate-600 dark:text-slate-300">
                                            <th className="px-6 py-3 font-medium">Code</th>
                                            <th className="px-6 py-3 font-medium">Nom (FR)</th>
                                            <th className="px-6 py-3 font-medium">Solde</th>
                                            <th className="px-6 py-3 font-medium">Justificatif</th>
                                            <th className="px-6 py-3 font-medium">Actif</th>
                                            <th className="px-6 py-3 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {rows.map((r: any) => (
                                            <tr key={r.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                                                <td className="px-6 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{r.code}</td>
                                                <td className="px-6 py-3 text-slate-900 dark:text-white">{r.name_fr}</td>
                                                <td className="px-6 py-3">
                                                    <Badge variant={r.requires_balance ? 'default' : 'secondary'}>
                                                        {r.requires_balance ? 'Avec solde' : 'Sans solde'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <Badge variant={r.requires_attachment ? 'default' : 'secondary'}>
                                                        {r.requires_attachment ? 'Requis' : 'Optionnel'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <Badge variant={r.is_active ? 'default' : 'outline'}>{r.is_active ? 'Actif' : 'Inactif'}</Badge>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={route('leaves.admin.leave-types.edit', r.id)}>Modifier</Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}

                                        {rows.length === 0 && (
                                            <tr>
                                                <td className="py-14 text-center text-slate-600 dark:text-slate-400" colSpan={6}>
                                                    Aucun type.
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
