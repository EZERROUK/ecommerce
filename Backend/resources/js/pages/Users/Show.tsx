import { Head } from '@inertiajs/react';
import { ArrowLeft, Pencil, ShieldCheck, User, UserCog } from 'lucide-react';
import React from 'react';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
    };
    userRoles: string[];
}

export default function ShowUser({ user, userRoles }: Props) {
    const isDeleted = Boolean(user.deleted_at);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title={`Utilisateur – ${user.name}`} />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Utilisateurs', href: '/users' },
                        { title: user.name, href: `/users/${user.id}` },
                    ]}
                >
                    <div className="p-6">
                        {/* Header */}
                        <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center">
                            <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:mb-0 dark:text-white">Détails de l'utilisateur</h1>
                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => window.history.back()}
                                    className="bg-muted hover:bg-muted/80 text-slate-700 dark:text-slate-300"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Retour
                                </Button>
                                {!isDeleted && (
                                    <Button className="group relative flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 focus:ring-2 focus:ring-red-500">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Informations principales */}
                            <div className="lg:col-span-2">
                                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-medium text-slate-900 dark:border-slate-700 dark:text-white">
                                        Informations personnelles
                                    </h2>

                                    <Info label="Nom complet" value={user.name} />
                                    <Info label="Adresse email" value={user.email} />
                                    <Info
                                        label="Statut du compte"
                                        value={isDeleted ? <Badge color="red">Compte supprimé</Badge> : <Badge color="green">Compte actif</Badge>}
                                    />

                                    {/* Rôles */}
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Rôles attribués</h3>
                                        <div className="mt-2">
                                            {userRoles.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {userRoles.map((role) => (
                                                        <Badge key={role} color="blue">
                                                            {role}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-500 italic dark:text-slate-400">Aucun rôle attribué</span>
                                            )}
                                        </div>
                                    </div>

                                    <Info label="Date de création" value={formatDate(user.created_at)} />
                                    <Info label="Dernière modification" value={formatDate(user.updated_at)} />

                                    {isDeleted && (
                                        <div className="mt-6 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-600/40 dark:bg-red-900/30">
                                            <h3 className="mb-2 text-sm font-medium text-red-800 dark:text-red-300">Compte supprimé</h3>
                                            <p className="text-sm text-red-700 dark:text-red-200">
                                                Ce compte utilisateur a été supprimé le {formatDate(user.deleted_at!)}. Les données sont conservées
                                                mais l'accès est désactivé.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Panneau latéral */}
                            <div className="lg:col-span-1">
                                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-medium text-slate-900 dark:border-slate-700 dark:text-white">
                                        Informations système
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                                                <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Profil utilisateur</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">ID: {user.id}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                                                <UserCog className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Permissions</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Via {userRoles.length} rôle{userRoles.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                                                <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Sécurité</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {isDeleted ? 'Accès désactivé' : 'Accès autorisé'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-600/40 dark:bg-blue-900/30">
                                        <h3 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-300">Note d'information</h3>
                                        <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-200">
                                            <li>• Lecture seule — modification via l'édition</li>
                                            <li>• Les rôles déterminent les permissions</li>
                                            <li>• Les dates sont affichées en fuseau local</li>
                                            <li>• Statut basé sur la suppression logique</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>
        </>
    );
}

/* ---------- Sous-composants ---------- */
function Info({ label, value }: { label: string; value: React.ReactNode | string | number }) {
    return (
        <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</h3>
            <p className="mt-1 text-lg font-medium text-slate-800 dark:text-white">{value}</p>
        </div>
    );
}

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'blue' | 'green' | 'red' }) {
    const colorMap = {
        gray: 'bg-slate-100 text-slate-800 dark:bg-slate-700/40 dark:text-slate-200',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color]}`}>{children}</span>;
}
