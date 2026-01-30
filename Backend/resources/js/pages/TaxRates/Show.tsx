// resources/js/Pages/TaxRates/Show.tsx
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { PageProps, TaxRate } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Info, Pencil, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

interface Props
    extends PageProps<{
        taxRate: TaxRate;
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

export default function ShowTaxRate({ taxRate }: Props) {
    const isDeleted = !!taxRate.deleted_at;
    const rateNumber = Number(taxRate.rate);

    const { can } = useCan();
    const permsKey: string = (usePage() as any).props?.auth?.permissions?.join(',') ?? '';

    const canEdit = can('taxrate_edit') && !isDeleted;
    const canRestore = can('taxrate_restore') && isDeleted;

    const handleRestore = () => {
        if (!canRestore) {
            alert('Permission manquante: taxrate_restore');
            return;
        }
        router.post(route('taxrates.restore', { id: taxRate.id }), {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Taux de TVA — ${taxRate.name}`} />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Taux de TVA', href: '/tax-rates' },
                    {
                        title: taxRate.name,
                        href: '',
                    },
                ]}
            >
                <div className="space-y-6 p-6">
                    {/* Header */}
                    <div className="flex flex-col justify-between sm:flex-row sm:items-center" key={permsKey}>
                        <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:mb-0 dark:text-white">Détails du taux de TVA</h1>
                        <div className="flex gap-3">
                            <Link href={route('taxrates.index')}>
                                <Button variant="secondary">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Retour
                                </Button>
                            </Link>

                            {canEdit && (
                                <Link href={route('taxrates.edit', taxRate.id)}>
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

                    <div className="grid grid-cols-12 gap-6">
                        {/* Informations principales */}
                        <div className="col-span-12 lg:col-span-8 xl:col-span-7">
                            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="border-b border-slate-200 pb-4 text-lg font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                                    Informations générales
                                </h2>

                                <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                                    <div>
                                        <div className="font-medium text-slate-500 dark:text-slate-400">Nom</div>
                                        <div className="text-base">{taxRate.name}</div>
                                    </div>

                                    <div>
                                        <div className="font-medium text-slate-500 dark:text-slate-400">Taux (%)</div>
                                        <div className="text-base">{rateNumber.toFixed(2)}</div>
                                    </div>

                                    <div>
                                        <div className="font-medium text-slate-500 dark:text-slate-400">Statut</div>
                                        <div className="mt-1">
                                            {isDeleted ? (
                                                <span className="inline-flex items-center rounded-full bg-red-600/10 px-2.5 py-0.5 text-xs font-medium text-red-600">
                                                    Désactivé
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-green-600/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
                                                    Actif
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-medium text-slate-500 dark:text-slate-400">Créé le</div>
                                        <div>
                                            {new Date(taxRate.created_at).toLocaleString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>

                                    {taxRate.updated_at && (
                                        <div>
                                            <div className="font-medium text-slate-500 dark:text-slate-400">Dernière mise à jour</div>
                                            <div>
                                                {new Date(taxRate.updated_at).toLocaleString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* À propos de la TVA */}
                        <div className="col-span-12 lg:col-span-4 xl:col-span-5">
                            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />À propos de la TVA
                                </h2>
                                <div className="space-y-3 text-justify text-sm text-slate-700 dark:text-slate-300">
                                    <p>
                                        La Taxe sur la Valeur Ajoutée (TVA) est un impôt indirect sur la consommation appliqué à la plupart des biens
                                        et services.
                                    </p>
                                    <p>
                                        Le taux de TVA correspond au pourcentage appliqué au prix hors taxe pour obtenir le prix toutes taxes
                                        comprises (TTC).
                                    </p>
                                    <p className="font-semibold">Taux courants au Maroc :</p>
                                    <ul className="list-disc space-y-1 pl-5">
                                        <li>Taux normal : 20%</li>
                                        <li>Taux réduit : 10% (produits alimentaires, eau, électricité)</li>
                                        <li>Taux super-réduit : 7% (agriculture, hôtellerie...)</li>
                                        <li>Taux particulier : 14% (services spécifiques)</li>
                                    </ul>
                                    <p>
                                        Une gestion rigoureuse des taux est essentielle pour assurer la conformité fiscale et une facturation
                                        correcte.
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
