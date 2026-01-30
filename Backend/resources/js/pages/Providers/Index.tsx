import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Provider {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    contact_person: string | null;
    is_active: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props extends PageProps {
    providers: {
        data: Provider[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ providers, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const safePaginationLabel = (label: string) => {
        // Les labels Laravel Pagination peuvent contenir des entités HTML (ex: &laquo;)
        // et parfois du markup. On normalise en texte simple.
        return label
            .replace(/<[^>]*>/g, '')
            .replace(/&laquo;/g, '«')
            .replace(/&raquo;/g, '»')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#0?39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    };

    const handleSearch = () => {
        router.get(
            route('providers.index'),
            {
                search: searchTerm,
                status: selectedStatus,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleRestore = (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir restaurer ce fournisseur ?')) {
            router.post(route('providers.restore', id));
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
            router.delete(route('providers.destroy', id));
        }
    };

    return (
        <>
            <Head title="Fournisseurs" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Fournisseurs</h1>
                        <p className="mt-1 text-sm text-gray-600">Gérez vos fournisseurs et leurs informations de contact</p>
                    </div>
                    <Link
                        href={route('providers.create')}
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        ➕ Nouveau fournisseur
                    </Link>
                </div>

                {/* Filtres */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Recherche</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nom, email, contact..."
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedStatus('');
                                router.get(route('providers.index'));
                            }}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Réinitialiser
                        </button>
                        <button
                            onClick={handleSearch}
                            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                        >
                            Filtrer
                        </button>
                    </div>
                </div>

                {/* Tableau */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Fournisseur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Adresse</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Statut</th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Date création</th>
                                <th className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {providers.data.map((provider) => (
                                <tr key={provider.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                                            {provider.contact_person && (
                                                <div className="text-sm text-gray-500">Contact: {provider.contact_person}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {provider.email && <div>📧 {provider.email}</div>}
                                            {provider.phone && <div>📞 {provider.phone}</div>}
                                            {!provider.email && !provider.phone && <span className="text-gray-400">Non renseigné</span>}
                                        </div>
                                    </td>
                                    <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-900">{provider.address || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                    provider.deleted_at
                                                        ? 'bg-red-100 text-red-800'
                                                        : provider.is_active
                                                          ? 'bg-green-100 text-green-800'
                                                          : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                            >
                                                {provider.deleted_at ? 'Supprimé' : provider.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                        {new Date(provider.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                        {provider.deleted_at ? (
                                            <button onClick={() => handleRestore(provider.id)} className="mr-3 text-green-600 hover:text-green-900">
                                                Restaurer
                                            </button>
                                        ) : (
                                            <>
                                                <Link
                                                    href={route('providers.show', provider.id)}
                                                    className="mr-3 text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Voir
                                                </Link>
                                                <Link
                                                    href={route('providers.edit', provider.id)}
                                                    className="mr-3 text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Modifier
                                                </Link>
                                                <button onClick={() => handleDelete(provider.id)} className="text-red-600 hover:text-red-900">
                                                    Supprimer
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {providers.data.length === 0 && (
                        <div className="py-12 text-center">
                            <div className="text-gray-500">
                                <div className="mb-4 text-4xl">🏢</div>
                                <h3 className="text-lg font-medium">Aucun fournisseur</h3>
                                <p className="mt-1">Commencez par créer votre premier fournisseur.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {providers.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-lg border-t border-gray-200 bg-white px-4 py-3 shadow sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            {providers.links[0].url && (
                                <Link
                                    href={providers.links[0].url!}
                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Précédent
                                </Link>
                            )}
                            {providers.links[providers.links.length - 1].url && (
                                <Link
                                    href={providers.links[providers.links.length - 1].url!}
                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Suivant
                                </Link>
                            )}
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Affichage de <span className="font-medium">{(providers.current_page - 1) * providers.per_page + 1}</span> à{' '}
                                    <span className="font-medium">{Math.min(providers.current_page * providers.per_page, providers.total)}</span> sur{' '}
                                    <span className="font-medium">{providers.total}</span> résultats
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                                    {providers.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                                                link.active
                                                    ? 'z-10 border-indigo-500 bg-indigo-50 text-indigo-600'
                                                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                            } ${index === 0 ? 'rounded-l-md' : ''} ${index === providers.links.length - 1 ? 'rounded-r-md' : ''}`}
                                        >
                                            {safePaginationLabel(link.label)}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
