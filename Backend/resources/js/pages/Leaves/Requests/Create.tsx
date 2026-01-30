import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Info, Paperclip, Send, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

type Department = { id: number; name: string };

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    department_id?: number | null;
    department?: Department | null;
};

type LeaveType = {
    id: number;
    code: string;
    name_fr: string;
    name_ar?: string | null;
    requires_attachment: boolean;
    requires_balance: boolean;
};

type LeaveBalanceInfo = {
    requires_balance: boolean;
    year: number;
    employee_id: number;
    leave_type_id: number;
    allocated_days?: number;
    used_days?: number;
    remaining_days?: number;
};

function formatDays(n: number): string {
    if (!Number.isFinite(n)) return '0';
    const isInt = Math.abs(n - Math.round(n)) < 1e-9;
    return isInt ? String(Math.round(n)) : n.toFixed(2);
}

export default function LeaveRequestCreatePage() {
    const { props } = usePage<{
        canViewAll: boolean;
        meEmployeeId?: number | null;
        employees: Employee[];
        leaveTypes: LeaveType[];
    }>();

    const { data, setData, post, processing, errors } = useForm({
        employee_id: (props.canViewAll ? String(props.employees[0]?.id ?? '') : String(props.meEmployeeId ?? '')) as string,
        leave_type_id: '' as string,
        start_date: '' as string,
        end_date: '' as string,
        start_half_day: 'none' as 'none' | 'am' | 'pm',
        end_half_day: 'none' as 'none' | 'am' | 'pm',
        reason: '' as string,
        attachment: null as File | null,
        days_count: '' as string,
    });

    const [clientError, setClientError] = useState<string | null>(null);
    const [balance, setBalance] = useState<LeaveBalanceInfo | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [balanceError, setBalanceError] = useState<string | null>(null);

    const leaveType = useMemo(() => {
        const id = data.leave_type_id ? Number(data.leave_type_id) : null;
        return props.leaveTypes.find((x) => x.id === id);
    }, [data.leave_type_id, props.leaveTypes]);

    const selectedYear = useMemo(() => {
        const base = data.start_date || data.end_date;
        if (base && /^\d{4}-\d{2}-\d{2}$/.test(base)) {
            return Number(base.slice(0, 4));
        }
        return new Date().getFullYear();
    }, [data.start_date, data.end_date]);

    useEffect(() => {
        setBalance(null);
        setBalanceError(null);

        if (!data.leave_type_id) return;

        const employeeId = props.canViewAll ? Number(data.employee_id || 0) : Number(props.meEmployeeId || 0);
        if (!employeeId) return;

        const leaveTypeId = Number(data.leave_type_id || 0);
        if (!leaveTypeId) return;

        if (leaveType && !leaveType.requires_balance) {
            setBalance({ requires_balance: false, year: selectedYear, employee_id: employeeId, leave_type_id: leaveTypeId });
            return;
        }

        const params = new URLSearchParams();
        params.set('leave_type_id', String(leaveTypeId));
        params.set('year', String(selectedYear));
        if (props.canViewAll) params.set('employee_id', String(employeeId));

        const controller = new AbortController();
        setBalanceLoading(true);

        fetch(route('leaves.requests.balance', Object.fromEntries(params.entries())), {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return (await r.json()) as LeaveBalanceInfo;
            })
            .then((json) => setBalance(json))
            .catch((err) => {
                if (err?.name === 'AbortError') return;
                setBalanceError('Impossible de charger le solde.');
            })
            .finally(() => setBalanceLoading(false));

        return () => controller.abort();
    }, [data.employee_id, data.leave_type_id, leaveType, props.canViewAll, props.meEmployeeId, selectedYear]);

    const errorMessages = useMemo(() => Object.values(errors).filter(Boolean) as string[], [errors]);

    const isBlockedByMissingEmployees = props.canViewAll && props.employees.length === 0;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        setClientError(null);

        if (isBlockedByMissingEmployees) {
            setClientError('Aucun employé disponible. Ajoutez un employé ou vérifiez vos permissions.');
            return;
        }

        if (!data.leave_type_id) {
            setClientError('Type de congé requis.');
            return;
        }

        if (!data.start_date || !data.end_date) {
            setClientError('Période (date début/fin) requise.');
            return;
        }

        if (leaveType?.requires_attachment && !data.attachment) {
            setClientError('Justificatif requis pour ce type de congé.');
            return;
        }

        post(route('leaves.requests.store'), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Nouvelle demande de congé" />
            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Congés', href: route('leaves.requests.index') },
                    { title: 'Nouvelle demande', href: '/leaves/requests/create' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 p-6">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nouvelle demande de congé</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Créer une demande de congé (période, type, optionnellement justificatif).
                            </p>
                        </div>

                        {(clientError || errorMessages.length > 0 || isBlockedByMissingEmployees) && (
                            <div
                                className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                                role="alert"
                            >
                                <div className="font-semibold">Erreur(s) dans le formulaire</div>
                                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                                    {clientError && <li>{clientError}</li>}
                                    {isBlockedByMissingEmployees && <li>Aucun employé n'est disponible pour la sélection.</li>}
                                    {errorMessages.map((m, idx) => (
                                        <li key={idx}>{m}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 lg:col-span-8 xl:col-span-7">
                                <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Informations de la demande</h2>

                                    <form onSubmit={submit} className="space-y-6">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    <Users className="mr-1 inline h-4 w-4" />
                                                    Employé {props.canViewAll ? <span className="text-red-500">*</span> : null}
                                                </label>

                                                {props.canViewAll ? (
                                                    <select
                                                        value={data.employee_id}
                                                        onChange={(e) => {
                                                            setClientError(null);
                                                            setData('employee_id', e.target.value);
                                                        }}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                        required
                                                        disabled={isBlockedByMissingEmployees}
                                                    >
                                                        <option value="">Sélectionner un employé</option>
                                                        {props.employees.map((emp) => (
                                                            <option key={emp.id} value={String(emp.id)}>
                                                                {emp.first_name} {emp.last_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        disabled
                                                        value="Vous"
                                                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                    />
                                                )}

                                                {errors.employee_id && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.employee_id}</p>
                                                )}
                                                {!props.canViewAll && (
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        Vous créez une demande pour vous.
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Type de congé <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={data.leave_type_id}
                                                    onChange={(e) => {
                                                        setClientError(null);
                                                        setData('leave_type_id', e.target.value);
                                                    }}
                                                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    required
                                                >
                                                    <option value="">Sélectionner un type</option>
                                                    {props.leaveTypes.map((lt) => (
                                                        <option key={lt.id} value={String(lt.id)}>
                                                            {lt.name_fr}
                                                        </option>
                                                    ))}
                                                </select>
                                                {leaveType?.requires_attachment && (
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        Justificatif obligatoire pour ce type.
                                                    </p>
                                                )}
                                                {errors.leave_type_id && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.leave_type_id}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">Solde</div>

                                            {!data.leave_type_id ? (
                                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                    Sélectionnez un type de congé pour afficher le solde.
                                                </div>
                                            ) : balanceLoading ? (
                                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Chargement du solde…</div>
                                            ) : balanceError ? (
                                                <div className="mt-1 text-sm text-red-600 dark:text-red-400">{balanceError}</div>
                                            ) : balance?.requires_balance === false ? (
                                                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                                    Ce type est sans solde (non décompté).
                                                </div>
                                            ) : balance?.requires_balance ? (
                                                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                                    <div>
                                                        Solde restant ({balance.year}) :{' '}
                                                        <span className="font-semibold">{formatDays(Number(balance.remaining_days ?? 0))} jours</span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                        Alloué : {formatDays(Number(balance.allocated_days ?? 0))} • Utilisé :{' '}
                                                        {formatDays(Number(balance.used_days ?? 0))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">—</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <CalendarDays className="mr-1 inline h-4 w-4" />
                                                Période <span className="text-red-500">*</span>
                                            </label>

                                            {errors.days_count && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{errors.days_count}</p>}

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Date début
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={data.start_date}
                                                        onChange={(e) => {
                                                            setClientError(null);
                                                            setData('start_date', e.target.value);
                                                        }}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                        required
                                                    />
                                                    {errors.start_date && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start_date}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Date fin
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={data.end_date}
                                                        onChange={(e) => {
                                                            setClientError(null);
                                                            setData('end_date', e.target.value);
                                                        }}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                        required
                                                    />
                                                    {errors.end_date && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end_date}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Demi-journée début
                                                    </label>
                                                    <select
                                                        value={data.start_half_day}
                                                        onChange={(e) => {
                                                            setClientError(null);
                                                            setData('start_half_day', e.target.value as any);
                                                        }}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    >
                                                        <option value="none">Aucune</option>
                                                        <option value="am">Matin</option>
                                                        <option value="pm">Après-midi</option>
                                                    </select>
                                                    {errors.start_half_day && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start_half_day}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Demi-journée fin
                                                    </label>
                                                    <select
                                                        value={data.end_half_day}
                                                        onChange={(e) => {
                                                            setClientError(null);
                                                            setData('end_half_day', e.target.value as any);
                                                        }}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    >
                                                        <option value="none">Aucune</option>
                                                        <option value="am">Matin</option>
                                                        <option value="pm">Après-midi</option>
                                                    </select>
                                                    {errors.end_half_day && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end_half_day}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Motif</label>
                                            <textarea
                                                rows={4}
                                                value={data.reason}
                                                onChange={(e) => {
                                                    setClientError(null);
                                                    setData('reason', e.target.value);
                                                }}
                                                placeholder="Ex : rendez-vous médical…"
                                                className="w-full resize-none rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                            />
                                            {errors.reason && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reason}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <Paperclip className="mr-1 inline h-4 w-4" />
                                                Pièce jointe
                                            </label>
                                            <input
                                                type="file"
                                                required={Boolean(leaveType?.requires_attachment)}
                                                onChange={(e) => {
                                                    setClientError(null);
                                                    setData('attachment', (e.target as HTMLInputElement).files?.[0] ?? null);
                                                }}
                                                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                            />
                                            {leaveType?.requires_attachment && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Obligatoire pour ce type.</p>
                                            )}
                                            {errors.attachment && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.attachment}</p>}
                                        </div>

                                        <div className="flex justify-between pt-4">
                                            <Button type="button" variant="secondary" onClick={() => router.visit(route('leaves.requests.index'))}>
                                                Annuler
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing || isBlockedByMissingEmployees}
                                                className="bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-600"
                                            >
                                                <Send className="mr-1 h-4 w-4" />
                                                {processing ? 'Envoi…' : 'Créer la demande'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <div className="col-span-12 lg:col-span-4 xl:col-span-5">
                                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />À propos des demandes
                                    </h2>

                                    <div className="space-y-3 text-justify text-sm text-slate-700 dark:text-slate-300">
                                        <p>
                                            Une demande peut être refusée automatiquement si la période est invalide, chevauche une autre demande, ou
                                            si un justificatif est requis.
                                        </p>

                                        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                            <ul className="list-inside list-disc space-y-1 text-xs">
                                                <li>Choisir un type de congé</li>
                                                <li>Saisir une période cohérente</li>
                                                <li>Ajouter un justificatif si demandé</li>
                                                <li>Le calcul des jours se fait côté serveur</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
