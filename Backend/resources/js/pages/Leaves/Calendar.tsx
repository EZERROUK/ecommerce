import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';

import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import frLocale from '@fullcalendar/core/locales/fr';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Filter, Plus, SlidersHorizontal, X } from 'lucide-react';

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

const ALL = '__all__';

type FilterField = 'status' | 'leave_type_id' | 'department_id' | 'employee_id';
type FilterType = { field: FilterField; value: string };

type CalendarView = 'month' | 'week' | 'year';

const statusLabel: Record<string, string> = {
    pending_manager: 'En attente manager',
    pending_hr: 'En attente RH',
    approved: 'Approuvée',
    rejected: 'Refusée',
    cancelled: 'Annulée',
};

export default function LeaveCalendarPage() {
    const { props } = usePage<{
        canViewAll: boolean;
        meEmployeeId?: number | null;
        departments: Department[];
        employees: Employee[];
        leaveTypes: LeaveType[];
    }>();

    const calendarRef = useRef<FullCalendar | null>(null);
    const [monthLabel, setMonthLabel] = useState<string>('');
    const [range, setRange] = useState<{ start: string; end: string } | null>(null);

    const [view, setView] = useState<CalendarView>('month');

    const [employeeId, setEmployeeId] = useState<string>(props.canViewAll ? ALL : props.meEmployeeId ? String(props.meEmployeeId) : ALL);
    const [departmentId, setDepartmentId] = useState<string>(ALL);
    const [leaveTypeId, setLeaveTypeId] = useState<string>(ALL);
    const [status, setStatus] = useState<string>(ALL);
    const [events, setEvents] = useState<EventInput[]>([]);
    const [loading, setLoading] = useState(false);

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<FilterField>('status');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [activeFilters, setActiveFilters] = useState<FilterType[]>(() => {
        const out: FilterType[] = [];
        // si l'utilisateur est limité, on reflète le filtre employé par défaut
        if (!props.canViewAll && props.meEmployeeId) {
            out.push({ field: 'employee_id', value: String(props.meEmployeeId) });
        }
        return out;
    });

    const startStr = range?.start ?? '';
    const endStr = range?.end ?? '';

    useEffect(() => {
        if (!startStr || !endStr) return;
        const params = new URLSearchParams();
        params.set('start', startStr);
        params.set('end', endStr);
        if (employeeId !== ALL) params.set('employee_id', employeeId);
        if (departmentId !== ALL) params.set('department_id', departmentId);
        if (leaveTypeId !== ALL) params.set('leave_type_id', leaveTypeId);
        if (status !== ALL) params.set('status', status);

        setLoading(true);
        fetch(route('leaves.events', Object.fromEntries(params.entries())), {
            headers: { Accept: 'application/json' },
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return (await r.json()) as EventInput[];
            })
            .then(setEvents)
            .finally(() => setLoading(false));
    }, [startStr, endStr, employeeId, departmentId, leaveTypeId, status]);

    const goPrev = () => (calendarRef.current as any)?.getApi?.().prev?.();
    const goNext = () => (calendarRef.current as any)?.getApi?.().next?.();

    const setCalendarView = (next: CalendarView) => {
        setView(next);
        const api = (calendarRef.current as any)?.getApi?.();
        if (!api) return;
        if (next === 'month') api.changeView('dayGridMonth');
        else if (next === 'week') api.changeView('timeGridWeek');
        else api.changeView('multiMonthYear');
    };

    const onDatesSet = (arg: DatesSetArg) => {
        setMonthLabel(arg.view.title);
        const start = String(arg.startStr).slice(0, 10);
        const end = String(arg.endStr).slice(0, 10);
        setRange({ start, end });
    };

    const onEventClick = (arg: EventClickArg) => {
        const id = arg.event.id;
        if (!id) return;
        router.visit(route('leaves.requests.show', id));
    };

    const filterOptions = useMemo(
        () => [
            { value: 'status' as const, label: 'Statut' },
            { value: 'leave_type_id' as const, label: 'Type' },
            { value: 'department_id' as const, label: 'Département' },
            { value: 'employee_id' as const, label: 'Employé' },
        ],
        [],
    );

    const leaveTypeLabelById = useMemo(() => {
        const m = new Map<string, string>();
        props.leaveTypes.forEach((lt) => m.set(String(lt.id), lt.name_fr));
        return m;
    }, [props.leaveTypes]);

    const departmentLabelById = useMemo(() => {
        const m = new Map<string, string>();
        props.departments.forEach((d) => m.set(String(d.id), d.name));
        return m;
    }, [props.departments]);

    const employeeLabelById = useMemo(() => {
        const m = new Map<string, string>();
        props.employees.forEach((e) => m.set(String(e.id), `${e.first_name} ${e.last_name}`.trim()));
        return m;
    }, [props.employees]);

    const applyFiltersToState = (list: FilterType[]) => {
        const byField = new Map<FilterField, string>();
        for (const f of list) {
            if (!f.value) continue;
            byField.set(f.field, f.value);
        }
        setStatus(byField.get('status') ?? ALL);
        setLeaveTypeId(byField.get('leave_type_id') ?? ALL);
        setDepartmentId(byField.get('department_id') ?? ALL);
        setEmployeeId(byField.get('employee_id') ?? (props.canViewAll ? ALL : props.meEmployeeId ? String(props.meEmployeeId) : ALL));
    };

    const addFilter = () => {
        if (!currentFilterValue) return;
        const next = [...activeFilters.filter((f) => f.field !== currentFilterField), { field: currentFilterField, value: currentFilterValue }];
        setActiveFilters(next);
        setCurrentFilterValue('');
        applyFiltersToState(next);
    };

    const removeFilter = (i: number) => {
        const next = activeFilters.filter((_, idx) => idx !== i);
        setActiveFilters(next);
        applyFiltersToState(next);
    };

    const clearAllFilters = () => {
        setActiveFilters([]);
        setCurrentFilterValue('');
        applyFiltersToState([]);
    };

    return (
        <>
            <Head title="Congés — Calendrier">{/* FullCalendar est chargé via NPM + Vite (ESM). */}</Head>

            <AppLayout
                breadcrumbs={[
                    { title: 'Congés', href: route('leaves.requests.index') },
                    { title: 'Calendrier', href: route('leaves.calendar') },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6">
                        <div className="mb-6 flex items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendrier des congés</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{monthLabel || '—'}</p>
                            </div>
                        </div>

                        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex flex-wrap justify-between gap-4">
                                <div className="flex w-full flex-col gap-4 lg:w-auto">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button onClick={() => setShowFilterPanel(!showFilterPanel)}>
                                            <Filter className="h-4 w-4" />
                                            {showFilterPanel ? 'Masquer les filtres' : 'Afficher les filtres'}
                                        </Button>

                                        {activeFilters.length > 0 && (
                                            <Button variant="outline" onClick={clearAllFilters} className="gap-1.5">
                                                <X className="h-4 w-4" /> Effacer filtres
                                            </Button>
                                        )}

                                        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                                            <button
                                                type="button"
                                                onClick={() => setCalendarView('month')}
                                                className={`px-3 py-2 text-sm font-medium ${view === 'month' ? 'bg-gradient-to-r from-red-600 to-red-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}
                                            >
                                                Mois
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCalendarView('week')}
                                                className={`px-3 py-2 text-sm font-medium ${view === 'week' ? 'bg-gradient-to-r from-red-600 to-red-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}
                                            >
                                                Semaine
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCalendarView('year')}
                                                className={`px-3 py-2 text-sm font-medium ${view === 'year' ? 'bg-gradient-to-r from-red-600 to-red-500 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}
                                            >
                                                Année
                                            </button>
                                        </div>
                                    </div>

                                    {showFilterPanel && (
                                        <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-2xl dark:border-slate-700 dark:bg-slate-800">
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                <SlidersHorizontal className="h-4 w-4" /> Filtrer le calendrier
                                            </h3>

                                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
                                                <select
                                                    value={currentFilterField}
                                                    onChange={(e) => {
                                                        setCurrentFilterField(e.target.value as FilterField);
                                                        setCurrentFilterValue('');
                                                    }}
                                                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                >
                                                    {filterOptions.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </select>

                                                <div className="sm:col-span-3">
                                                    {currentFilterField === 'status' ? (
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="">Sélectionner un statut</option>
                                                            <option value="pending_manager">En attente manager</option>
                                                            <option value="pending_hr">En attente RH</option>
                                                            <option value="approved">Approuvée</option>
                                                            <option value="rejected">Refusée</option>
                                                            <option value="cancelled">Annulée</option>
                                                        </select>
                                                    ) : currentFilterField === 'leave_type_id' ? (
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="">Sélectionner un type</option>
                                                            {props.leaveTypes.map((lt) => (
                                                                <option key={lt.id} value={String(lt.id)}>
                                                                    {lt.name_fr}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : currentFilterField === 'department_id' ? (
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="">Sélectionner un département</option>
                                                            {props.departments.map((d) => (
                                                                <option key={d.id} value={String(d.id)}>
                                                                    {d.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                            disabled={!props.canViewAll}
                                                            title={!props.canViewAll ? 'Filtre employé indisponible' : undefined}
                                                        >
                                                            <option value="">Sélectionner un employé</option>
                                                            {props.employees.map((emp) => (
                                                                <option key={emp.id} value={String(emp.id)}>
                                                                    {emp.first_name} {emp.last_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>

                                            <Button onClick={addFilter} disabled={!currentFilterValue}>
                                                Ajouter le filtre
                                            </Button>
                                        </div>
                                    )}

                                    {activeFilters.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {activeFilters.map((f, i) => {
                                                const label = filterOptions.find((o) => o.value === f.field)?.label ?? f.field;
                                                const displayValue =
                                                    f.field === 'status'
                                                        ? (statusLabel[f.value] ?? f.value)
                                                        : f.field === 'leave_type_id'
                                                          ? (leaveTypeLabelById.get(f.value) ?? f.value)
                                                          : f.field === 'department_id'
                                                            ? (departmentLabelById.get(f.value) ?? f.value)
                                                            : (employeeLabelById.get(f.value) ?? f.value);

                                                return (
                                                    <span
                                                        key={`${f.field}-${f.value}`}
                                                        className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200"
                                                    >
                                                        <span className="font-medium">{label}:</span>
                                                        {displayValue}
                                                        <button onClick={() => removeFilter(i)}>
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="ml-auto flex items-center gap-3">
                                    <Button variant="outline" onClick={goPrev}>
                                        <ChevronLeft className="h-4 w-4" /> Précédent
                                    </Button>
                                    <Button variant="outline" onClick={goNext}>
                                        Suivant <ChevronRight className="h-4 w-4" />
                                    </Button>

                                    <div className="relative min-w-[220px]">
                                        <Select
                                            value={status}
                                            onValueChange={(v) => {
                                                // maintien de compat: quand on change via select rapide, on sync les chips
                                                const next: FilterType[] =
                                                    v === ALL
                                                        ? activeFilters.filter((f) => f.field !== 'status')
                                                        : [...activeFilters.filter((f) => f.field !== 'status'), { field: 'status', value: v }];
                                                setActiveFilters(next);
                                                setStatus(v);
                                            }}
                                        >
                                            <SelectTrigger className="rounded-lg border border-slate-200 bg-slate-50 text-sm dark:border-slate-700 dark:bg-slate-800">
                                                <SelectValue placeholder="Statut" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={ALL}>Tous statuts</SelectItem>
                                                <SelectItem value="pending_manager">En attente manager</SelectItem>
                                                <SelectItem value="pending_hr">En attente RH</SelectItem>
                                                <SelectItem value="approved">Approuvée</SelectItem>
                                                <SelectItem value="rejected">Refusée</SelectItem>
                                                <SelectItem value="cancelled">Annulée</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <ChevronDown className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-400" />
                                    </div>

                                    <Button
                                        asChild
                                        className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600"
                                    >
                                        <Link href={route('leaves.requests.create')}>
                                            <Plus className="mr-1 h-4 w-4" /> Nouvelle demande
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                            <div className="flex items-center justify-between px-2 pb-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <CalendarDays className="h-4 w-4" />
                                    {loading ? 'Chargement…' : `${events.length} évènement(s)`}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Cliquez sur un évènement pour ouvrir la demande.</div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                                <FullCalendar
                                    ref={calendarRef as any}
                                    plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    views={{
                                        multiMonthYear: { type: 'multiMonth', duration: { years: 1 } },
                                    }}
                                    locale={frLocale as any}
                                    allDayText="24H"
                                    headerToolbar={false}
                                    height="auto"
                                    dayMaxEventRows={3}
                                    weekends
                                    nowIndicator
                                    events={events}
                                    datesSet={onDatesSet}
                                    eventClick={onEventClick}
                                />
                            </div>

                            <div className="mt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('leaves.requests.index')}>Voir les demandes</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
