import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import {
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Filter,
    MessageSquare,
    Search,
    SlidersHorizontal,
    Star,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';

type Flash = { success?: string; error?: string; info?: string };

type ProductLite = { id: string; name: string; slug?: string | null };

type ReviewRow = {
    id: string;
    product_id: string;
    author_name: string;
    author_email?: string | null;
    rating: number;
    comment: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    moderated_at?: string | null;
    moderation_note?: string | null;
    product?: ProductLite | null;
};

type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
};

const badge = (s: ReviewRow['status']) => {
    switch (s) {
        case 'approved':
            return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200';
        case 'rejected':
            return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200';
        default:
            return 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    }
};

const Stars = ({ value }: { value: number }) => (
    <div className="flex items-center gap-0.5" aria-label={`${value} sur 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`h-4 w-4 ${n <= Math.round(value) ? 'fill-current text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} />
        ))}
    </div>
);

export default function ProductReviewsIndex() {
    const { props } = usePage() as any;

    const raw = (props.reviews ?? {
        data: [] as ReviewRow[],
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0,
        total: 0,
        per_page: 15,
    }) as Pagination<ReviewRow>;

    const filters = (props.filters ?? {}) as { search?: string; status?: string; per_page?: number };
    const statuses = (props.statuses ?? ['pending', 'approved', 'rejected']) as string[];
    const flash = (props.flash ?? {}) as Flash;

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [searchValue, setSearchValue] = useState(filters.search ?? '');
    const [statusValue, setStatusValue] = useState(filters.status ?? '');
    const [rowsPerPage, setRowsPerPage] = useState<number>(filters.per_page ?? raw.per_page ?? 15);

    const [showSuccess, setShowSuccess] = useState(!!flash?.success);
    const [showError, setShowError] = useState(!!flash?.error);
    const [showInfo, setShowInfo] = useState(!!flash?.info);

    const canDelete = useMemo(() => {
        const auth = (props.auth ?? {}) as any;
        const roles: string[] = auth.roles ?? [];
        const perms: string[] = auth.permissions ?? [];
        return roles.includes('SuperAdmin') || perms.includes('product_review_delete');
    }, [props.auth]);

    useEffect(() => {
        if (flash?.success) {
            setShowSuccess(true);
            const t = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    useEffect(() => {
        if (flash?.error) {
            setShowError(true);
            const t = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.error]);

    useEffect(() => {
        if (flash?.info) {
            setShowInfo(true);
            const t = setTimeout(() => setShowInfo(false), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.info]);

    const go = (extra: Record<string, any> = {}) => {
        router.get(
            route('product-reviews.index'),
            {
                search: searchValue || undefined,
                status: statusValue || undefined,
                per_page: rowsPerPage,
                ...extra,
            },
            { preserveScroll: true, preserveState: true, only: ['reviews', 'filters', 'statuses', 'flash'] },
        );
    };

    const confirmApprove = (r: ReviewRow) => {
        if (!confirm('Approuver cet avis ?')) return;
        router.post(route('product-reviews.approve', { review: r.id }), {}, { preserveScroll: true });
    };

    const confirmReject = (r: ReviewRow) => {
        if (!confirm('Refuser cet avis ?')) return;
        router.post(route('product-reviews.reject', { review: r.id }), {}, { preserveScroll: true });
    };

    const confirmDelete = (r: ReviewRow) => {
        if (!confirm('Supprimer définitivement cet avis ?')) return;
        router.delete(route('product-reviews.destroy', { review: r.id }), { preserveScroll: true });
    };

    const rows = raw.data ?? [];

    const title = useMemo(() => {
        if (!statusValue) return 'Avis & commentaires';
        if (statusValue === 'approved') return 'Avis approuvés';
        if (statusValue === 'rejected') return 'Avis refusés';
        return 'Avis en attente';
    }, [statusValue]);

    return (
        <>
            <Head title="Avis & commentaires" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Avis & commentaires', href: '/product-reviews' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 w-full px-4 py-6">
                        {/* FLASH */}
                        {flash?.success && showSuccess && (
                            <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                <p className="flex-1 font-medium">{flash.success}</p>
                                <button onClick={() => setShowSuccess(false)} className="text-green-500 hover:text-green-700 dark:text-green-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        {flash?.error && showError && (
                            <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <p className="flex-1 font-medium">{flash.error}</p>
                                <button onClick={() => setShowError(false)} className="text-red-500 hover:text-red-700 dark:text-red-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        {flash?.info && showInfo && (
                            <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100">
                                <MessageSquare className="h-5 w-5 flex-shrink-0" />
                                <p className="flex-1 font-medium">{flash.info}</p>
                                <button onClick={() => setShowInfo(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        {/* TITLE */}
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Modération des avis clients (affichés côté boutique après validation)
                                </p>
                            </div>
                        </div>

                        {/* FILTER / TOOLS */}
                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                <div className="flex w-full flex-col gap-4 lg:w-auto">
                                    <div className="flex items-center gap-3">
                                        <Button onClick={() => setShowFilterPanel(!showFilterPanel)}>
                                            <Filter className="h-4 w-4" />
                                            {showFilterPanel ? 'Masquer les filtres' : 'Afficher les filtres'}
                                        </Button>

                                        {(searchValue || statusValue) && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSearchValue('');
                                                    setStatusValue('');
                                                    go({ page: 1, search: undefined, status: undefined });
                                                }}
                                                className="gap-1.5"
                                            >
                                                <X className="h-4 w-4" /> Effacer filtres
                                            </Button>
                                        )}
                                    </div>

                                    {showFilterPanel && (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-2xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer les avis
                                            </h3>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <div className="sm:col-span-2">
                                                    <div className="relative flex">
                                                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                        <input
                                                            value={searchValue}
                                                            onChange={(e) => setSearchValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && go({ page: 1 })}
                                                            placeholder="Produit, nom, email, contenu…"
                                                            className="flex-1 rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                    </div>
                                                </div>
                                                <select
                                                    value={statusValue}
                                                    onChange={(e) => setStatusValue(e.target.value)}
                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                >
                                                    <option value="">Tous</option>
                                                    {statuses.map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mt-3">
                                                <Button onClick={() => go({ page: 1 })}>Appliquer</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="ml-auto flex items-center gap-3">
                                    <div className="relative min-w-[220px]">
                                        <select
                                            value={rowsPerPage}
                                            onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setRowsPerPage(v);
                                                go({ page: 1, per_page: v });
                                            }}
                                            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        >
                                            {[10, 15, 20, 50].map((n) => (
                                                <option key={n} value={n}>
                                                    {n} lignes par page
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                                <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Produit</th>
                                        <th className="px-6 py-3 text-left">Auteur</th>
                                        <th className="w-[160px] px-6 py-3 text-left">Note</th>
                                        <th className="px-6 py-3 text-left">Commentaire</th>
                                        <th className="w-[140px] px-6 py-3 text-center">Statut</th>
                                        <th className="w-[120px] px-6 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td className="px-6 py-6 text-slate-500" colSpan={6}>
                                                Aucun avis.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((r) => (
                                            <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {r.product?.name ?? r.product_id}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString('fr-FR')}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">{r.author_name}</div>
                                                    {r.author_email && <div className="text-xs text-slate-500">{r.author_email}</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Stars value={r.rating} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="line-clamp-2 text-slate-700 dark:text-slate-200">{r.comment}</div>
                                                    {r.moderation_note && (
                                                        <div className="mt-1 text-xs text-slate-500">Note: {r.moderation_note}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge(r.status)}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {r.status === 'pending' ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                onClick={() => confirmApprove(r)}
                                                                title="Approuver"
                                                                aria-label="Approuver"
                                                                className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/40 dark:text-green-200 dark:hover:bg-green-900/20"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                onClick={() => confirmReject(r)}
                                                                title="Refuser"
                                                                aria-label="Refuser"
                                                                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-200 dark:hover:bg-red-900/20"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                            {canDelete && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() => confirmDelete(r)}
                                                                    title="Supprimer"
                                                                    aria-label="Supprimer"
                                                                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            {canDelete ? (
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    onClick={() => confirmDelete(r)}
                                                                    title="Supprimer"
                                                                    aria-label="Supprimer"
                                                                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            ) : (
                                                                <div className="text-center text-xs text-slate-500">—</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* PAGINATION */}
                            <div className="flex flex-col items-center justify-between gap-3 p-4 text-sm text-slate-600 sm:flex-row dark:text-slate-300">
                                <div>
                                    {raw.from ?? 0}–{raw.to ?? 0} / {raw.total ?? 0}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" disabled={raw.current_page <= 1} onClick={() => go({ page: 1 })}>
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" disabled={raw.current_page <= 1} onClick={() => go({ page: raw.current_page - 1 })}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="px-2 text-xs">
                                        Page {raw.current_page} / {raw.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        disabled={raw.current_page >= raw.last_page}
                                        onClick={() => go({ page: raw.current_page + 1 })}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={raw.current_page >= raw.last_page}
                                        onClick={() => go({ page: raw.last_page })}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
