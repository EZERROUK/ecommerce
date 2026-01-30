import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    ClipboardList,
    FileText,
    Image as ImageIcon,
    Info,
    Pencil,
    Power,
    User,
    UserCircle2,
    Users,
} from 'lucide-react';
import React, { JSX, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Tab = 'infos' | 'membres' | 'audit';

interface EmployeeMini {
    id: number;
    first_name: string;
    last_name: string;
    photo?: string | null;
}

interface UserMini {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
    description?: string | null;
    department_head?: number | null;

    head?: EmployeeMini | null;
    employees?: EmployeeMini[];
    employees_count?: number;

    creator?: UserMini | null;

    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
}

/* ------------------------------ Permissions ------------------------------ */
const useCan = () => {
    const { props } = usePage<{ auth?: { roles?: string[]; permissions?: string[] } }>();
    const roles = props.auth?.roles ?? [];
    const perms = props.auth?.permissions;
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const set = useMemo(() => new Set(perms ?? []), [perms]);
    const can = (p?: string) => !p || isSuperAdmin || set.has(p);
    return { can };
};

/* ------------------------------ UI helpers ------------------------------ */
const Badge = ({ text, color }: { text: string; color: 'red' | 'green' | 'secondary' | 'default' }) => (
    <span
        className={`inline-block rounded-full px-2 py-1 text-xs font-medium tracking-wide select-none ${
            color === 'red'
                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                : color === 'green'
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
        }`}
    >
        {text}
    </span>
);

const Detail = ({
    icon: Icon,
    label,
    value,
    mono = false,
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) => (
    <div className="flex items-start gap-3">
        <Icon className="mt-1 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
            <div className={`text-sm font-medium break-words text-slate-900 dark:text-white/90 ${mono ? 'font-mono' : ''}`}>{value}</div>
        </div>
    </div>
);

const TabButton = ({ tab, active, setActive }: { tab: Tab; active: Tab; setActive: (t: Tab) => void }) => {
    const icons: Record<Tab, JSX.Element> = {
        infos: <Info className="mr-2 inline h-4 w-4" />,
        membres: <Users className="mr-2 inline h-4 w-4" />,
        audit: <User className="mr-2 inline h-4 w-4" />,
    };

    const labels: Record<Tab, string> = {
        infos: 'Informations',
        membres: 'Membres',
        audit: 'Audit',
    };

    const isActive = active === tab;

    return (
        <button
            onClick={() => setActive(tab)}
            className={`flex w-full items-center px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                    ? 'rounded-l-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-inner'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
            }`}
        >
            {icons[tab]} {labels[tab]}
        </button>
    );
};

/* ------------------------------ Utils ------------------------------ */
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const statusBadge = (deleted_at?: string | null) => (deleted_at ? <Badge text="Désactivé" color="red" /> : <Badge text="Actif" color="green" />);

/* ------------------------------ Component ------------------------------ */
export default function DepartmentShow({ department }: { department: Department }) {
    const { can } = useCan();
    const [activeTab, setActiveTab] = useState<Tab>('infos');

    const employeesCount = department.employees_count ?? department.employees?.length ?? 0;

    const headLabel = department.head ? `${department.head.first_name} ${department.head.last_name}` : 'Non assigné';

    return (
        <>
            <Head title={`Département – ${department.name}`} />

            <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Départements', href: '/departments' },
                        { title: department.name, href: route('departments.show', department.id) },
                    ]}
                >
                    {/* Header */}
                    <div className="p-6">
                        <div className="flex flex-col items-start gap-6 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-xl backdrop-blur-md lg:flex-row dark:border-slate-700 dark:bg-white/5">
                            <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                <Building2 className="h-12 w-12 text-slate-400" />
                            </div>

                            <div className="flex-1 space-y-2">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{department.name}</h1>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-medium">Chef de département :</span> {headLabel}
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-medium">Effectif :</span> {employeesCount}
                                </p>
                                {statusBadge(department.deleted_at)}
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:w-auto">
                                <Link href={route('departments.index')}>
                                    <Button variant="outline">
                                        <ArrowLeft className="mr-1 h-4 w-4" />
                                        Retour
                                    </Button>
                                </Link>

                                {can('department_edit') && !department.deleted_at && (
                                    <Link href={route('departments.edit', department.id)}>
                                        <Button className="bg-gradient-to-r from-red-600 to-red-500 text-white">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-6 pb-6">
                        <div className="grid min-h-[420px] grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-xl md:grid-cols-4 dark:border-slate-700 dark:bg-white/5">
                            <div className="border-r border-slate-200 dark:border-slate-700">
                                {(['infos', 'membres', 'audit'] as Tab[]).map((tab) => (
                                    <TabButton key={tab} tab={tab} active={activeTab} setActive={setActiveTab} />
                                ))}
                            </div>

                            <div className="overflow-y-auto p-6 md:col-span-3">
                                {/* Infos */}
                                {activeTab === 'infos' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail icon={Building2} label="Nom" value={department.name} />
                                        <Detail icon={User} label="Chef de département" value={headLabel} />
                                        <Detail icon={ClipboardList} label="Effectif" value={employeesCount} />
                                        <Detail icon={Power} label="Statut" value={statusBadge(department.deleted_at)} />
                                        <div className="sm:col-span-2">
                                            <Detail icon={FileText} label="Description" value={department.description?.trim() || '—'} />
                                        </div>
                                    </div>
                                )}

                                {/* Membres */}
                                {activeTab === 'membres' && (
                                    <div className="space-y-4">
                                        {!department.employees?.length ? (
                                            <p className="text-sm text-slate-500">Aucun employé dans ce département.</p>
                                        ) : (
                                            <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                                                {department.employees.map((emp) => (
                                                    <li key={emp.id} className="flex items-center gap-3 bg-slate-50/50 p-3 dark:bg-slate-800/30">
                                                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                                            {emp.photo ? (
                                                                <img
                                                                    src={`/storage/${emp.photo}`}
                                                                    alt={`${emp.first_name} ${emp.last_name}`}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <ImageIcon className="h-5 w-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {emp.first_name} {emp.last_name}
                                                            </div>
                                                        </div>
                                                        <Link href={route('employees.show', emp.id)}>
                                                            <Button size="sm" variant="outline">
                                                                Voir
                                                            </Button>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {/* Audit */}
                                {activeTab === 'audit' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail icon={UserCircle2} label="Créé par" value={department.creator?.name ?? '—'} />
                                        <Detail icon={Calendar} label="Créé le" value={fmtDate(department.created_at)} />
                                        <Detail icon={Calendar} label="Dernière mise à jour" value={fmtDate(department.updated_at)} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>
        </>
    );
}
