import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { route } from 'ziggy-js';
import { ticketPriorityLabelFr } from '@/lib/tickets';

type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

type Policy = {
    id: number;
    name: string;
    priority: TicketPriority;
    first_response_minutes: number;
    resolution_minutes: number;
    is_active: boolean;
};

type Props = {
    policy: Policy;
    meta: { priorities: TicketPriority[] };
};

type FormData = {
    name: string;
    priority: TicketPriority;
    first_response_minutes: number;
    resolution_minutes: number;
    is_active: boolean;
};

export default function TicketSlaPolicyEdit() {
    const { props } = usePage<Props>();
    const policy = props.policy;
    const priorities = props.meta?.priorities ?? ['low', 'medium', 'high', 'critical'];

    const { data, setData, patch, processing, errors } = useForm<FormData>({
        name: policy.name,
        priority: policy.priority,
        first_response_minutes: policy.first_response_minutes,
        resolution_minutes: policy.resolution_minutes,
        is_active: policy.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('tickets.sla-policies.update', { policy: policy.id }), {
            preserveScroll: true,
            onSuccess: () => toast.success('Politique SLA mise à jour'),
            onError: () => toast.error('Erreur lors de la mise à jour'),
        });
    };

    return (
        <>
            <Head title="Modifier une politique SLA" />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Tickets', href: '/tickets' },
                        { title: 'SLA', href: '/tickets/sla-policies' },
                        { title: 'Modifier', href: '' },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        <div className="col-span-12">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md md:p-8 dark:border-slate-700 dark:bg-white/5">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Modifier la politique SLA</h1>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{policy.name}</p>
                                    </div>
                                    <Button asChild variant="outline" className="gap-2">
                                        <Link href={route('tickets.sla-policies.index')}>
                                            <ArrowLeft className="h-4 w-4" />
                                            Retour
                                        </Link>
                                    </Button>
                                </div>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Nom *</label>
                                        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Priorité *</label>
                                        <Select value={data.priority} onValueChange={(v) => setData('priority', v as TicketPriority)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {priorities.map((p) => (
                                                    <SelectItem key={p} value={p}>
                                                        {ticketPriorityLabelFr(p)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.priority && <p className="mt-1 text-xs text-red-600">{errors.priority}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">1ère réponse (minutes) *</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={data.first_response_minutes}
                                                onChange={(e) => setData('first_response_minutes', Number(e.target.value))}
                                            />
                                            {errors.first_response_minutes && (
                                                <p className="mt-1 text-xs text-red-600">{errors.first_response_minutes}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Résolution (minutes) *</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={data.resolution_minutes}
                                                onChange={(e) => setData('resolution_minutes', Number(e.target.value))}
                                            />
                                            {errors.resolution_minutes && <p className="mt-1 text-xs text-red-600">{errors.resolution_minutes}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Active *</label>
                                        <Select value={data.is_active ? '1' : '0'} onValueChange={(v) => setData('is_active', v === '1')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Oui</SelectItem>
                                                <SelectItem value="0">Non</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.is_active && <p className="mt-1 text-xs text-red-600">{errors.is_active}</p>}
                                    </div>

                                    <div className="pt-2">
                                        <Button type="submit" disabled={processing} className="gap-2">
                                            <Save className="h-4 w-4" />
                                            Enregistrer
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
