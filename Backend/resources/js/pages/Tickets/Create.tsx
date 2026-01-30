import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus } from 'lucide-react';
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

type ClientRow = { id: number; company_name: string; contact_name?: string | null };

type Props = {
    clients: ClientRow[];
    meta: { statuses: TicketStatus[]; priorities: TicketPriority[] };
};

type FormData = {
    client_id: string;
    title: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
};

export default function TicketCreate() {
    const { props } = usePage<Props>();

    const clients = props.clients ?? [];
    const meta = props.meta;

    const { data, setData, post, processing, errors, clearErrors } = useForm<FormData>({
        client_id: '',
        title: '',
        description: '',
        priority: 'medium',
        status: 'new',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('tickets.store'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Ticket créé'),
            onError: () => toast.error('Erreur lors de la création'),
        });
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <>
            <Head title="Créer un ticket" />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Tickets', href: '/tickets' },
                        { title: 'Créer', href: '' },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        <div className="col-span-12">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md md:p-8 dark:border-slate-700 dark:bg-white/5">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Nouveau ticket</h1>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Création back-office</p>
                                    </div>
                                    <Button asChild variant="outline" className="gap-2">
                                        <Link href={route('tickets.index')}>
                                            <ArrowLeft className="h-4 w-4" />
                                            Retour
                                        </Link>
                                    </Button>
                                </div>

                            {hasErrors && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <strong>Erreur(s) :</strong>
                                            <ul className="mt-2 list-inside list-disc space-y-1">
                                                {Object.entries(errors as Record<string, string>).map(([k, v]) => (
                                                    <li key={k}>{v}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <Button type="button" size="sm" variant="outline" onClick={() => clearErrors()}>
                                            Fermer
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Client *</label>
                                    <Select value={data.client_id || 'none'} onValueChange={(v) => setData('client_id', v === 'none' ? '' : v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sélectionner…</SelectItem>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.company_name}{c.contact_name ? ` — ${c.contact_name}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Titre *</label>
                                    <Input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Ex: Problème de facture" />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Description *</label>
                                    <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={6} />
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Priorité</label>
                                        <Select value={data.priority} onValueChange={(v) => setData('priority', v as TicketPriority)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {meta.priorities.map((p) => (
                                                    <SelectItem key={p} value={p}>
                                                        {ticketPriorityLabelFr(p)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Statut</label>
                                        <Input
                                            value={ticketStatusLabelFr('new')}
                                            readOnly
                                            disabled
                                            className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Créer
                                    </Button>
                                </div>
                            </form>
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>
        </>
    );
}
