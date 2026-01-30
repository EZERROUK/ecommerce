import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, MessageSquarePlus, Paperclip, Pencil, Save, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { route } from 'ziggy-js';
import { ticketPriorityLabelFr, ticketStatusLabelFr } from '@/lib/tickets';

type TicketStatus =
    | 'new'
    | 'open'
    | 'pending_customer'
    | 'pending_internal'
    | 'on_hold'
    | 'resolved'
    | 'closed'
    | 'cancelled';

type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

type Agent = { id: number; name: string };

type TicketDTO = {
    id: number;
    code?: string | null;
    title?: string | null;
    description?: string | null;
    status: TicketStatus;
    priority: TicketPriority;
    client?: { id: number; company_name: string; contact_name?: string | null; email?: string | null; phone?: string | null } | null;
    assigned_to?: { id: number; name: string } | null;
    first_response_due_at?: string | null;
    resolution_due_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    last_activity_at?: string | null;
};

type CommentDTO = {
    id: number;
    visibility: 'public' | 'internal';
    sender_type: 'client' | 'staff';
    sender?: { id: number; name: string } | null;
    body?: string | null;
    created_at?: string | null;
};

type AttachmentDTO = {
    id: number;
    original_name: string;
    mime_type?: string | null;
    size: number;
    uploaded_by?: { id: number; name: string } | null;
    created_at?: string | null;
    download_url: string;
    delete_url?: string;
};

type Props = {
    ticket: TicketDTO;
    comments: CommentDTO[];
    attachments?: AttachmentDTO[];
    agents: Agent[];
    meta: { statuses: TicketStatus[]; priorities: TicketPriority[] };
    auth?: { roles?: any; permissions?: any };
};

const useCan = () => {
    const { props } = usePage<any>();
    const auth = (props as any)?.auth;
    const rolesRaw = auth?.roles ?? [];
    const roles: string[] = rolesRaw.map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean);
    const permsRaw = auth?.permissions ?? [];
    const perms: string[] = permsRaw.map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean);
    const isSuperAdmin = roles.includes('SuperAdmin') || roles.includes('super-admin');
    const set = useMemo(() => new Set(perms), [perms]);
    const can = (p?: string) => !p || isSuperAdmin || set.has(p);
    return { can };
};

const pill = (variant: 'indigo' | 'green' | 'amber' | 'red' | 'slate' = 'slate') => {
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
    const map: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
        green: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
        red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200',
        slate: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-100',
    };
    return `${base} ${map[variant]}`;
};

const statusColor = (s: TicketStatus) => {
    if (s === 'resolved' || s === 'closed') return 'green';
    if (s === 'cancelled') return 'red';
    if (s === 'on_hold' || s === 'pending_customer' || s === 'pending_internal') return 'amber';
    return 'indigo';
};

const priorityColor = (p: TicketPriority) => {
    if (p === 'critical') return 'red';
    if (p === 'high') return 'amber';
    if (p === 'medium') return 'indigo';
    return 'slate';
};

export default function TicketShow() {
    const { can } = useCan();
    const { props } = usePage<Props>();

    const ticket = props.ticket;
    const comments = props.comments ?? [];
    const attachments = props.attachments ?? [];
    const agents = props.agents ?? [];
    const meta = props.meta;

    const [status, setStatus] = useState<TicketStatus>(ticket.status);
    const [assigned, setAssigned] = useState<string>(ticket.assigned_to?.id ? String(ticket.assigned_to.id) : '');

    const canInternal = can('ticket_comment_internal');
    const canPublic = can('ticket_comment_public');

    const [visibility, setVisibility] = useState<'public' | 'internal'>(canPublic ? 'public' : 'internal');
    const [body, setBody] = useState('');

    const canAttach = can('ticket_attachment_add');
    const canDeleteAttachment = can('ticket_attachment_delete');
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);

    const formatBytes = (bytes: number) => {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
        const value = bytes / Math.pow(1024, idx);
        return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
    };

    const saveStatus = () => {
        router.post(
            route('tickets.change-status', { ticket: ticket.id }),
            { status },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Statut mis à jour'),
                onError: () => toast.error('Erreur statut'),
            },
        );
    };

    const saveAssign = () => {
        router.post(
            route('tickets.assign', { ticket: ticket.id }),
            { assigned_to_user_id: assigned || null },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Assignation mise à jour'),
                onError: () => toast.error('Erreur assignation'),
            },
        );
    };

    const addComment = () => {
        if (!body.trim()) return;
        router.post(
            route('tickets.comment', { ticket: ticket.id }),
            { visibility, body },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Commentaire ajouté');
                    setBody('');
                },
                onError: () => toast.error('Erreur commentaire'),
            },
        );
    };

    const uploadAttachment = () => {
        if (!attachmentFile) return;

        router.post(
            route('tickets.attachments.upload', { ticket: ticket.id }),
            { file: attachmentFile },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Pièce jointe ajoutée');
                    setAttachmentFile(null);
                    setFileInputKey((k) => k + 1);
                },
                onError: () => toast.error("Erreur d'upload"),
            },
        );
    };

    const deleteAttachment = (a: AttachmentDTO) => {
        if (!a.delete_url) return;
        if (!confirm('Supprimer cette pièce jointe ?')) return;

        router.delete(a.delete_url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Pièce jointe supprimée'),
            onError: () => toast.error('Erreur suppression'),
        });
    };

    return (
        <>
            <Head title={`Ticket ${ticket.code ?? `#${ticket.id}`}`} />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Tickets', href: '/tickets' },
                        { title: ticket.code ?? `#${ticket.id}`, href: '' },
                    ]}
                >
                    <div className="p-6">
                        {/* Header card */}
                        <div className="mb-6 flex flex-col items-start gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-xl backdrop-blur-md sm:px-5 sm:py-5 lg:flex-row lg:items-center dark:border-slate-700 dark:bg-white/5">
                            <div className="flex-1 space-y-2">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {ticket.code ?? `#${ticket.id}`} — {ticket.title ?? '(sans titre)'}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <span className={pill(statusColor(ticket.status) as any)}>{ticketStatusLabelFr(ticket.status)}</span>
                                    <span className={pill(priorityColor(ticket.priority) as any)}>{ticketPriorityLabelFr(ticket.priority)}</span>
                                    <span className="text-xs">Client: {ticket.client?.company_name ?? '—'}</span>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:w-auto">
                                <Link href={route('tickets.index')} className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <ArrowLeft className="mr-1 h-4 w-4" />
                                        Retour
                                    </Button>
                                </Link>

                                {can('ticket_edit') && (
                                    <Link href={route('tickets.edit', { ticket: ticket.id })} className="w-full sm:w-auto">
                                        <Button className="group relative flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 focus:ring-2 focus:ring-red-500 sm:w-auto">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Description</h2>
                                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{ticket.description ?? '-'}</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Conversation</h2>
                                    </div>

                                    <div className="space-y-3">
                                        {comments.map((c) => (
                                            <div key={c.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                    <div>
                                                        {c.sender?.name ?? c.sender_type} • <span className={pill('slate')}>{c.visibility}</span>
                                                    </div>
                                                    <div>{c.created_at ?? ''}</div>
                                                </div>
                                                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{c.body ?? ''}</div>
                                            </div>
                                        ))}

                                        {comments.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">Aucun commentaire.</div>}
                                    </div>

                                    {(canPublic || canInternal) && (
                                        <div className="mt-5 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                                            <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">Ajouter un commentaire</div>
                                                <div className="w-full md:w-60">
                                                    <Select
                                                        value={visibility}
                                                        onValueChange={(v) => setVisibility(v as any)}
                                                        disabled={!canInternal && visibility === 'internal'}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {canPublic && <SelectItem value="public">public</SelectItem>}
                                                            {canInternal && <SelectItem value="internal">internal</SelectItem>}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Votre message…" />
                                            <div className="mt-2">
                                                <Button type="button" onClick={addComment} className="gap-2">
                                                    <MessageSquarePlus className="h-4 w-4" />
                                                    Envoyer
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Actions</h2>

                                    <div className="space-y-3">
                                        {can('ticket_change_status') && (
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Statut</label>
                                                <div className="flex gap-2">
                                                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {meta.statuses.map((s) => (
                                                                <SelectItem key={s} value={s}>
                                                                    {ticketStatusLabelFr(s)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button type="button" variant="outline" onClick={saveStatus} className="gap-2">
                                                        <Save className="h-4 w-4" />
                                                        OK
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {can('ticket_assign') && (
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Assigné à</label>
                                                <div className="flex gap-2">
                                                    <Select value={assigned || 'none'} onValueChange={(v) => setAssigned(v === 'none' ? '' : v)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Non assigné</SelectItem>
                                                            {agents.map((a) => (
                                                                <SelectItem key={a.id} value={String(a.id)}>
                                                                    {a.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button type="button" variant="outline" onClick={saveAssign} className="gap-2">
                                                        <Save className="h-4 w-4" />
                                                        OK
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Infos</h2>
                                    <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                        <div>Client: {ticket.client?.company_name ?? '-'}</div>
                                        <div>Contact: {ticket.client?.contact_name ?? '-'}</div>
                                        <div>Email: {ticket.client?.email ?? '-'}</div>
                                        <div>Téléphone: {ticket.client?.phone ?? '-'}</div>
                                        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">Créé: {ticket.created_at ?? '-'}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Dernière activité: {ticket.last_activity_at ?? ticket.updated_at ?? '-'}</div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">SLA</h2>
                                    <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                        <div>Réponse avant: {ticket.first_response_due_at ?? '-'}</div>
                                        <div>Résolution avant: {ticket.resolution_due_at ?? '-'}</div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Pièces jointes</h2>
                                        <Paperclip className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                    </div>

                                    {canAttach && (
                                        <div className="mb-3 space-y-2">
                                            <Input
                                                key={fileInputKey}
                                                type="file"
                                                onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                                            />
                                            <Button type="button" onClick={uploadAttachment} disabled={!attachmentFile} className="gap-2">
                                                <Upload className="h-4 w-4" />
                                                Uploader
                                            </Button>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                PDF, images, Office, CSV, ZIP — max 20MB
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {attachments.map((a) => (
                                            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800">
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate font-medium text-slate-900 dark:text-white">{a.original_name}</div>
                                                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                        {formatBytes(a.size)}
                                                        {a.uploaded_by?.name ? ` • ${a.uploaded_by.name}` : ''}
                                                        {a.created_at ? ` • ${a.created_at}` : ''}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-2">
                                                    <a
                                                        className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                                                        href={a.download_url}
                                                    >
                                                        Télécharger
                                                    </a>
                                                    {canDeleteAttachment && a.delete_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteAttachment(a)}
                                                            className="text-xs font-medium text-red-600 hover:underline dark:text-red-300"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {attachments.length === 0 && (
                                            <div className="text-sm text-slate-500 dark:text-slate-400">Aucune pièce jointe.</div>
                                        )}
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
