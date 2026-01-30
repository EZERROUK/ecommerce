// resources/js/Pages/Currencies/Show.tsx
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { Currency, PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Info, Pencil, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

interface Props
    extends PageProps<{
        currency: Currency;
    }> {}

/* ------------------------------ Permissions ------------------------------ */
const useCan = () => {
    const { props } = usePage<{ auth?: { roles?: string[]; permissions?: string[] } }>();
    const roles = props.auth?.roles ?? [];
    const perms = props.auth?.permissions;
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const set = useMemo(() => new Set(perms ?? []), [perms]);
    const can = (p?: string) => !p || isSuperAdmin || set.has(p);
    return { can, isSuperAdmin };
};

export default function ShowCurrency({ currency }: Props) {
    const isDeleted = !!currency.deleted_at;

    const { can } = useCan();
    const permsKey: string = (usePage() as any).props?.auth?.permissions?.join(',') ?? '';

    const canEdit = can('currency_edit') && !isDeleted;
    const canRestore = can('currency_restore') && isDeleted;

    const handleRestore = () => {
        if (!canRestore) {
            alert('Permission manquante: currency_restore');
            return;
        }
        router.post(route('currencies.restore', { id: currency.id }), {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Devise — ${currency.name}`} />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Devises', href: '/currencies' },
                    {
                        title: currency.name,
                        href: '',
                    },
                ]}
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center" key={permsKey}>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Détails de la devise</h1>
                        <div className="flex gap-3">
                            <Link href={route('currencies.index')}>
                                <Button
                                    variant="secondary"
                                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Retour
                                </Button>
                            </Link>

                            {canEdit && (
                                <Link href={route('currencies.edit', currency.code)}>
                                    <Button className="group relative flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 focus:ring-2 focus:ring-red-500">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Button>
                                </Link>
                            )}

                            {canRestore && (
                                <Button variant="secondary" onClick={handleRestore}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restaurer
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Informations */}
                        <div className="lg:col-span-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Informations</h2>
                                <div className="space-y-4 text-slate-700 dark:text-slate-300">
                                    <div>
                                        <h3 className="text-sm font-medium">Nom</h3>
                                        <p className="mt-1 text-lg font-medium text-slate-900 dark:text-white">{currency.name}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium">Code</h3>
                                        <p className="mt-1 font-mono text-lg tracking-widest text-slate-900 dark:text-white">{currency.code}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium">Symbole</h3>
                                        <p className="mt-1 text-lg font-medium text-slate-900 dark:text-white">{currency.symbol}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium">Statut</h3>
                                        <p className="mt-1">
                                            {isDeleted ? (
                                                <span className="inline-flex items-center rounded-full bg-red-200 px-2.5 py-0.5 text-xs font-medium text-red-900 dark:bg-red-800 dark:text-red-100">
                                                    Désactivée
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-green-200 px-2.5 py-0.5 text-xs font-medium text-green-900 dark:bg-green-900 dark:text-green-100">
                                                    Active
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium">Créée le</h3>
                                        <p className="mt-1 text-sm">
                                            {currency.created_at
                                                ? new Date(currency.created_at).toLocaleDateString('fr-FR', {
                                                      day: '2-digit',
                                                      month: '2-digit',
                                                      year: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : '-'}
                                        </p>
                                    </div>
                                    {currency.updated_at && (
                                        <div>
                                            <h3 className="text-sm font-medium">Dernière mise à jour</h3>
                                            <p className="mt-1 text-sm">
                                                {new Date(currency.updated_at).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* À propos */}
                        <div className="lg:col-span-1">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />À propos des devises
                                </h2>
                                <div className="prose max-w-none text-sm text-slate-700 dark:text-slate-300" style={{ textAlign: 'justify' }}>
                                    <p className="mb-4">
                                        Une <b>devise</b> représente une unité monétaire (ex : MAD, EUR, USD). Elle est utilisée pour les montants,
                                        les conversions, et la facturation multidevise.
                                    </p>
                                    <ul className="mb-4 list-disc space-y-1 pl-5">
                                        <li>
                                            <b>Code</b> : format ISO 4217 (ex : MAD, USD, EUR).
                                        </li>
                                        <li>
                                            <b>Symbole</b> : utilisé dans l’interface (ex : €, $, د.م.).
                                        </li>
                                    </ul>
                                    <p>Les devises sont essentielles pour la gestion des prix, la conformité et l’export international.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
