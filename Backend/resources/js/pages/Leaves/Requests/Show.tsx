import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, CheckCircle2, CircleX, Clock, FileText, History, Paperclip, RotateCcw, Tag, User, Users } from 'lucide-react';
import React, { JSX, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

const statusLabel: Record<string, string> = {
    pending_manager: 'En attente manager',
    pending_hr: 'En attente RH',
    approved: 'Approuvée',
    rejected: 'Refusée',
    cancelled: 'Annulée',
};

const statusPill = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300';
    if (status === 'rejected') return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300';
    if (status === 'cancelled') return 'bg-slate-100 text-slate-800 dark:bg-slate-500/10 dark:text-slate-300';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300';
};

const shortDate = (value: unknown) => {
    if (!value) return '—';
    const raw = String(value);
    const iso = raw.length >= 10 ? raw.slice(0, 10) : raw;
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    }
    const dt = new Date(raw);
    if (!Number.isNaN(dt.getTime())) {
        return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dt);
    }
    return raw;
};

type ActionKey = 'cancel' | 'manager_approve' | 'manager_reject' | 'hr_approve' | 'hr_reject';

const actionConfig: Record<ActionKey, { title: string; description: string; routeName: string; variant: any; icon: any }> = {
    cancel: {
        title: 'Annuler la demande',
        description: 'L’annulation est enregistrée dans l’historique.',
        routeName: 'leaves.requests.cancel',
        variant: 'outline',
        icon: RotateCcw,
    },
    manager_approve: {
        title: 'Approuver (manager)',
        description: 'Passe la demande à l’étape suivante.',
        routeName: 'leaves.requests.manager_approve',
        variant: 'default',
        icon: CheckCircle2,
    },
    manager_reject: {
        title: 'Refuser (manager)',
        description: 'La demande sera refusée.',
        routeName: 'leaves.requests.manager_reject',
        variant: 'destructive',
        icon: CircleX,
    },
    hr_approve: {
        title: 'Approuver (RH)',
        description: 'Valide définitivement la demande et impacte le solde.',
        routeName: 'leaves.requests.hr_approve',
        variant: 'default',
        icon: CheckCircle2,
    },
    hr_reject: {
        title: 'Refuser (RH)',
        description: 'La demande sera refusée.',
        routeName: 'leaves.requests.hr_reject',
        variant: 'destructive',
        icon: CircleX,
    },
};

type Tab = 'resume' | 'justificatif' | 'historique';

const TabButton = ({ tab, active, setActive }: { tab: Tab; active: Tab; setActive: (t: Tab) => void }) => {
    const icons: Record<Tab, JSX.Element> = {
        resume: <FileText className="mr-2 inline h-4 w-4" />,
        justificatif: <Paperclip className="mr-2 inline h-4 w-4" />,
        historique: <History className="mr-2 inline h-4 w-4" />,
    };
    const labels: Record<Tab, string> = {
        resume: 'Résumé',
        justificatif: 'Justificatif',
        historique: 'Historique',
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

export default function LeaveRequestShowPage() {
    const { props } = usePage<{ item: any; flash?: { success?: string; error?: string } }>();
    const item = props.item;

    const [activeTab, setActiveTab] = useState<Tab>('resume');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionKey, setActionKey] = useState<ActionKey | null>(null);
    const [comment, setComment] = useState('');

    const openAction = (key: ActionKey) => {
        setActionKey(key);
        setComment('');
        setDialogOpen(true);
    };

    const submitAction = () => {
        if (!actionKey) return;
        const cfg = actionConfig[actionKey];
        router.post(route(cfg.routeName, item.id), { comment: comment || undefined }, { preserveScroll: true });
        setDialogOpen(false);
    };

    const status = String(item?.status ?? '');
    const canCancel = status !== 'cancelled' && status !== 'rejected' && status !== 'approved';
    const canManager = status === 'pending_manager';
    const canHr = status === 'pending_hr';

    const employeeName = item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : '—';
    const leaveTypeName = item.leave_type?.name_fr ?? item.leaveType?.name_fr ?? '—';
    const period = `De ${shortDate(item.start_date)} à ${shortDate(item.end_date)}`;
    const departmentName = item.employee?.department?.name;
    const attachmentPath = item?.attachment_path ? String(item.attachment_path) : '';

    const dialogCfg = useMemo(() => (actionKey ? actionConfig[actionKey] : null), [actionKey]);

    const initials = useMemo(() => {
        const parts = String(employeeName || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        if (!parts.length || employeeName === '—') return 'CG';
        const a = (parts[0]?.[0] ?? '').toUpperCase();
        const b = (parts[1]?.[0] ?? '').toUpperCase();
        return `${a}${b}`.slice(0, 2) || 'CG';
    }, [employeeName]);

    return (
        <>
            <Head title="Congé — Détail" />

            <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Congés', href: route('leaves.requests.index') },
                        {
                            title: `Demande #${item?.id ?? ''}`,
                            href: item?.id ? route('leaves.requests.show', item.id) : route('leaves.requests.index'),
                        },
                    ]}
                >
                    {/* Header card */}
                    <div className="p-6">
                        <div className="flex flex-col items-start gap-6 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-xl backdrop-blur-md sm:px-5 sm:py-5 lg:flex-row dark:border-slate-700 dark:bg-white/5">
                            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                <div className="text-3xl font-bold text-slate-700 dark:text-slate-200">{initials}</div>
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Demande #{item?.id}</h1>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(status)}`}>
                                        {statusLabel[status] ?? status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-medium">Employé :</span> {employeeName}
                                    {departmentName ? <span className="text-slate-500 dark:text-slate-400"> · {departmentName}</span> : null}
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-medium">Type :</span> {leaveTypeName}
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-medium">Période :</span> {period}
                                </p>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:w-auto">
                                <Link href={route('leaves.requests.index')} className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <ArrowLeft className="mr-1 h-4 w-4" /> Retour
                                    </Button>
                                </Link>

                                <div className="grid grid-cols-1 gap-2">
                                    <Button variant="outline" disabled={!canCancel} onClick={() => openAction('cancel')} className="justify-start">
                                        <RotateCcw className="mr-2 h-4 w-4" /> Annuler
                                    </Button>

                                    <Button
                                        variant="default"
                                        disabled={!canManager}
                                        onClick={() => openAction('manager_approve')}
                                        className="justify-start"
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approuver (manager)
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        disabled={!canManager}
                                        onClick={() => openAction('manager_reject')}
                                        className="justify-start"
                                    >
                                        <CircleX className="mr-2 h-4 w-4" /> Refuser (manager)
                                    </Button>

                                    <Button variant="default" disabled={!canHr} onClick={() => openAction('hr_approve')} className="justify-start">
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approuver (RH)
                                    </Button>
                                    <Button variant="destructive" disabled={!canHr} onClick={() => openAction('hr_reject')} className="justify-start">
                                        <CircleX className="mr-2 h-4 w-4" /> Refuser (RH)
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {(props.flash?.success || props.flash?.error) && (
                            <div className="mt-4">
                                <Alert variant={props.flash?.error ? 'destructive' : 'default'}>
                                    <AlertTitle>{props.flash?.error ? 'Erreur' : 'Succès'}</AlertTitle>
                                    <AlertDescription>{props.flash?.error ?? props.flash?.success}</AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </div>

                    {/* -------- Tabs -------- */}
                    <div className="flex-grow px-6 pt-2 pb-6">
                        <div className="grid min-h-[420px] grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md md:grid-cols-4 dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-col overflow-y-auto border-r border-slate-200 dark:border-slate-700">
                                {(['resume', 'justificatif', 'historique'] as Tab[]).map((t) => (
                                    <TabButton key={t} tab={t} active={activeTab} setActive={setActiveTab} />
                                ))}
                            </div>

                            <div className="overflow-y-auto p-6 text-slate-700 md:col-span-3 dark:text-slate-300">
                                {activeTab === 'resume' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail icon={User} label="Employé" value={employeeName} />
                                        <Detail icon={Users} label="Département" value={departmentName ?? '—'} />
                                        <Detail icon={Tag} label="Type" value={leaveTypeName} />
                                        <Detail icon={CalendarDays} label="Période" value={period} mono />
                                        <Detail icon={Clock} label="Jours" value={item?.days_count ?? '—'} />
                                        <Detail
                                            icon={FileText}
                                            label="Demi-journées"
                                            value={
                                                item?.start_half_day && item?.end_half_day
                                                    ? `Début: ${item.start_half_day} · Fin: ${item.end_half_day}`
                                                    : '—'
                                            }
                                        />
                                        <Detail icon={FileText} label="Motif" value={item?.reason || '—'} />
                                    </div>
                                )}

                                {activeTab === 'justificatif' && (
                                    <div className="space-y-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            Le justificatif est optionnel selon le type de congé.
                                        </div>

                                        {attachmentPath ? (
                                            <div className="flex flex-col gap-3">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white/90">Fichier</div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        asChild
                                                        className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600"
                                                    >
                                                        <a href={`/storage/${attachmentPath}`} target="_blank" rel="noreferrer">
                                                            <Paperclip className="mr-2 h-4 w-4" /> Ouvrir / Télécharger
                                                        </a>
                                                    </Button>
                                                    <div className="text-xs break-all text-slate-500 dark:text-slate-400">{attachmentPath}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
                                                Aucun justificatif.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'historique' && (
                                    <div className="space-y-3">
                                        {Array.isArray(item?.actions) && item.actions.length > 0 ? (
                                            item.actions.map((a: any) => (
                                                <div key={a.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="font-medium text-slate-900 dark:text-white/90">{a.action}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{a.created_at}</div>
                                                    </div>
                                                    {a.comment ? <div className="mt-2 text-sm">{a.comment}</div> : null}
                                                    {a.user ? (
                                                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">par {a.user.name}</div>
                                                    ) : null}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
                                                Aucun historique.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{dialogCfg?.title ?? 'Action'}</DialogTitle>
                                <DialogDescription>{dialogCfg?.description}</DialogDescription>
                            </DialogHeader>

                            <div>
                                <div className="mb-2 text-sm font-medium">Commentaire (optionnel)</div>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={4}
                                    placeholder="Ajouter un commentaire…"
                                />
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Fermer
                                </Button>
                                <Button variant={dialogCfg?.variant ?? 'default'} onClick={submitAction}>
                                    {dialogCfg?.icon && <dialogCfg.icon className="mr-2 h-4 w-4" />}
                                    Confirmer
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </AppLayout>
            </div>
        </>
    );
}
