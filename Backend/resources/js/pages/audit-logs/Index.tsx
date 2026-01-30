import ModernDatePicker from '@/components/ModernDatePicker';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Database,
    Download,
    Edit,
    Eye,
    FileDown,
    Filter,
    LogIn,
    LogOut,
    Minus,
    Plus,
    Search,
    Send,
    SlidersHorizontal,
    Tag,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import { getActionColor, getActionIcon, getSubjectTypeName, translateActionDescription } from '@/utils/activity-translations';

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */
interface ActivityLog {
    id: number;
    log_name?: string | null;
    event?: string | null;
    description: string;
    subject_type: string;
    subject_id: string;
    causer: { name: string; email: string } | null;
    properties: Record<string, any> | null;
    created_at: string;
}

interface Props {
    logs: {
        data: ActivityLog[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        per_page: number;
    };
    filters?: {
        user?: string;
        action?: string;
        subject_type?: string;
        search?: string;
        start_date?: string;
        end_date?: string;
        sort?: string;
        direction?: string;
        per_page?: number;
    };
}

type FilterType = { field: 'user' | 'action' | 'subject_type' | 'search' | 'date'; value: string };

/* -------------------------------------------------------------------------- */
/* COMPONENTS */
/* -------------------------------------------------------------------------- */
const ActionIcon = ({ iconName, className = 'w-4 h-4' }: { iconName: string; className?: string }) => {
    const icons = {
        Plus,
        Edit,
        Trash2,
        LogIn,
        LogOut,
        Eye,
        Send,
        Download,
        Check,
        X,
        Activity,
    };

    const IconComponent = icons[iconName as keyof typeof icons] || Activity;
    return <IconComponent className={className} />;
};

const ActionDisplay = ({ log }: { log: ActivityLog }) => {
    const translatedAction = translateActionDescription(log.description, log.subject_type, log.event);
    const actionColor = getActionColor(translatedAction);
    const actionIcon = getActionIcon(translatedAction);
    const subjectName = getSubjectTypeName(log.subject_type);

    return (
        <div className="flex flex-col gap-1">
            <div className={`flex items-center gap-2 text-sm font-medium ${actionColor}`}>
                <ActionIcon iconName={actionIcon} className="h-4 w-4" />
                {translatedAction}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Tag className="h-3 w-3" />
                <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700">{subjectName}</span>
                <span className="text-slate-400">#{log.subject_id}</span>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------------------------------- */
export default function AuditLogsIndex({ logs, filters = {} }: Props) {
    /* ------------------------------ STATES -------------------------------- */
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [currentFilterField, setCurrentFilterField] = useState<FilterType['field']>('search');
    const [currentFilterValue, setCurrentFilterValue] = useState('');
    const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(filters.start_date ? new Date(filters.start_date) : null);
    const [endDate, setEndDate] = useState<Date | null>(filters.end_date ? new Date(filters.end_date) : null);
    const [expanded, setExpanded] = useState<number[]>([]);

    /* ------------------------------ FILTERS -------------------------------- */
    const filterOptions = [
        { value: 'search', label: 'Recherche globale' },
        { value: 'user', label: 'Utilisateur' },
        { value: 'action', label: 'Action' },
        { value: 'subject_type', label: "Type d'objet" },
        { value: 'date', label: 'Plage de dates' },
    ];

    const buildPayloadFromFilters = (filtersList: FilterType[]) => {
        const payload: Record<string, any> = {
            page: 1,
            per_page: logs.per_page,
        };

        filtersList.forEach((filter) => {
            if (filter.field === 'date') {
                if (startDate) payload.start_date = startDate.toISOString().split('T')[0];
                if (endDate) payload.end_date = endDate.toISOString().split('T')[0];
            } else {
                payload[filter.field] = filter.value;
            }
        });

        return payload;
    };

    const addFilter = () => {
        let newFilters: FilterType[] = activeFilters;

        if (currentFilterField === 'date') {
            if (startDate && endDate) {
                const dateRange = `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`;
                newFilters = [...activeFilters.filter((f) => f.field !== 'date'), { field: 'date', value: dateRange }];
                setActiveFilters(newFilters);
                applyFiltersWithData(newFilters);
            }
            return;
        }

        if (!currentFilterValue.trim()) return;

        newFilters = [
            ...activeFilters.filter((f) => f.field !== currentFilterField),
            { field: currentFilterField, value: currentFilterValue.trim() },
        ];

        setActiveFilters(newFilters);
        setCurrentFilterValue('');
        applyFiltersWithData(newFilters);
    };

    const removeFilter = (i: number) => {
        const filterToRemove = activeFilters[i];
        if (filterToRemove?.field === 'date') {
            setStartDate(null);
            setEndDate(null);
        }
        const newFilters = activeFilters.filter((_, idx) => idx !== i);
        setActiveFilters(newFilters);
        applyFiltersWithRemovedFilter(newFilters);
    };

    const clearAllFilters = () => {
        setActiveFilters([]);
        setStartDate(null);
        setEndDate(null);
        setCurrentFilterValue('');
        resetFilters();
    };

    /* -------------------------- MEMO HELPERS ------------------------------ */
    const hasFilter = useMemo(() => activeFilters.length > 0, [activeFilters]);

    const windowPages = useMemo(() => {
        const win = 5;
        const { current_page: c, last_page: l } = logs;
        const out: (number | '…')[] = [];

        if (l <= win + 2) {
            for (let i = 1; i <= l; i++) out.push(i);
        } else {
            out.push(1);
            const s = Math.max(2, c - 1);
            const e = Math.min(l - 1, c + 1);
            if (s > 2) out.push('…');
            for (let i = s; i <= e; i++) out.push(i);
            if (e < l - 1) out.push('…');
            out.push(l);
        }
        return out;
    }, [logs]);

    // ✅ IMPORTANT : pas de "as const" ici, sinon "only" devient readonly et TypeScript gueule
    const inertiaOpts = {
        preserveScroll: true,
        preserveState: true,
        only: ['logs', 'filters'] as string[],
    };

    /* ------------------------------ ACTIONS ------------------------------- */
    const applyFiltersWithData = (filtersList: FilterType[]) => {
        const payload = buildPayloadFromFilters(filtersList);
        router.get(route('audit-logs.index'), payload, inertiaOpts);
    };

    const applyFiltersWithRemovedFilter = (filtersList: FilterType[]) => {
        const payload = buildPayloadFromFilters(filtersList);
        router.get(route('audit-logs.index'), payload, inertiaOpts);
    };

    const resetFilters = () => {
        router.get(route('audit-logs.index'), { per_page: logs.per_page, page: 1 }, inertiaOpts);
    };

    const changePage = (p: number) => {
        const payload = buildPayloadFromFilters(activeFilters);
        payload.page = p;
        router.get(route('audit-logs.index'), payload, inertiaOpts);
    };

    const changePer = (n: number) => {
        const payload = buildPayloadFromFilters(activeFilters);
        payload.per_page = n;
        payload.page = 1;
        router.get(route('audit-logs.index'), payload, inertiaOpts);
    };

    const exportCsv = () => {
        const payload = buildPayloadFromFilters(activeFilters);
        delete payload.page;
        delete payload.per_page;
        window.open(route('audit-logs.export', payload), '_blank');
    };

    const toggleRow = (id: number) => setExpanded((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

    /* ---------------------------------------------------------------------- */
    /* RENDER */
    /* ---------------------------------------------------------------------- */
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: "Journaux d'activité", href: '/audit-logs' },
            ]}
        >
            <Head title="Journal d'activités" />

            <div className="relative">
                <ParticlesBackground />
                <div className="relative z-10 w-full px-4 py-6">
                    <div className="mb-6 flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Journal d'activités</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Suivi et traçabilité de toutes les actions du système</p>
                        </div>
                    </div>

                    <div className="relative z-40 mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                        <div className="flex flex-wrap justify-between gap-4">
                            <div className="flex w-full flex-col gap-4 lg:w-auto">
                                <div className="flex items-center gap-3">
                                    <Button onClick={() => setShowFilterPanel(!showFilterPanel)}>
                                        <Filter className="h-4 w-4" />
                                        {showFilterPanel ? 'Masquer les filtres' : 'Afficher les filtres'}
                                    </Button>
                                    {hasFilter && (
                                        <Button variant="outline" onClick={clearAllFilters} className="gap-1.5">
                                            <X className="h-4 w-4" />
                                            Effacer filtres
                                        </Button>
                                    )}
                                </div>

                                {showFilterPanel && (
                                    <div className="relative z-50 w-full rounded-lg border border-slate-200 bg-slate-50 p-4 lg:max-w-xl dark:border-slate-700 dark:bg-slate-800">
                                        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                            <SlidersHorizontal className="h-4 w-4" />
                                            Filtrer les journaux
                                        </h3>

                                        <div className="mb-3">
                                            <select
                                                value={currentFilterField}
                                                onChange={(e) => setCurrentFilterField(e.target.value as FilterType['field'])}
                                                className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                            >
                                                {filterOptions.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {currentFilterField !== 'date' ? (
                                            <div className="mb-3">
                                                {currentFilterField === 'action' ? (
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="">Sélectionner une action</option>
                                                            <option value="created">Création</option>
                                                            <option value="updated">Modification</option>
                                                            <option value="deleted">Suppression</option>
                                                            <option value="restored">Restauration</option>
                                                            <option value="status_toggled">Changement de statut</option>
                                                            <option value="delete_blocked">Suppression refusée</option>
                                                            <option value="restore_blocked">Restauration refusée</option>
                                                            <option value="login">Connexion</option>
                                                            <option value="logout">Déconnexion</option>
                                                            <option value="viewed">Consultation</option>
                                                            <option value="sent">Envoi</option>
                                                            <option value="downloaded">Téléchargement</option>
                                                            <option value="approved">Approbation</option>
                                                        </select>
                                                        <Button onClick={addFilter} disabled={!currentFilterValue}>
                                                            Ajouter
                                                        </Button>
                                                    </div>
                                                ) : currentFilterField === 'subject_type' ? (
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="">Sélectionner un type d'objet</option>
                                                            <option value="App\Models\User">Utilisateur</option>
                                                            <option value="App\Models\Employee">Employé</option>
                                                            <option value="App\Models\Department">Département</option>
                                                            <option value="App\Models\Product">Produit</option>
                                                            <option value="App\Models\Order">Commande</option>
                                                            <option value="App\Models\Category">Catégorie</option>
                                                            <option value="App\Models\Setting">Paramètre</option>
                                                        </select>
                                                        <Button onClick={addFilter} disabled={!currentFilterValue}>
                                                            Ajouter
                                                        </Button>
                                                    </div>
                                                ) : currentFilterField === 'user' ? (
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        >
                                                            <option value="">Sélectionner un utilisateur</option>
                                                            <option value="__system__">Système (actions automatiques)</option>
                                                        </select>
                                                        <input
                                                            value={currentFilterValue !== '__system__' ? currentFilterValue : ''}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                                                            placeholder="Ou saisir nom/email utilisateur"
                                                            className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                        <Button onClick={addFilter} disabled={!currentFilterValue}>
                                                            Ajouter
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="relative flex">
                                                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                        <input
                                                            value={currentFilterValue}
                                                            onChange={(e) => setCurrentFilterValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                                                            placeholder={`Filtrer par ${currentFilterField}`}
                                                            className="flex-1 rounded-lg border bg-white py-2 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                                        />
                                                        <Button onClick={addFilter} disabled={!currentFilterValue} className="ml-2">
                                                            Ajouter
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative mb-3 flex flex-wrap items-center gap-3">
                                                <div className="min-w-[180px] flex-1">
                                                    <ModernDatePicker
                                                        selected={startDate}
                                                        onChange={(date) => setStartDate(date)}
                                                        placeholder="Date de début"
                                                        showTimeSelect={true}
                                                        selectsStart={true}
                                                        startDate={startDate}
                                                        endDate={endDate}
                                                        className="w-full text-xs"
                                                    />
                                                </div>

                                                <div className="flex items-center px-2">
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">à</span>
                                                </div>

                                                <div className="min-w-[180px] flex-1">
                                                    <ModernDatePicker
                                                        selected={endDate}
                                                        onChange={(date) => setEndDate(date)}
                                                        placeholder="Date de fin"
                                                        showTimeSelect={true}
                                                        selectsEnd={true}
                                                        startDate={startDate}
                                                        endDate={endDate}
                                                        minDate={startDate}
                                                        className="w-full text-xs"
                                                    />
                                                </div>

                                                <Button
                                                    disabled={!startDate || !endDate}
                                                    onClick={addFilter}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-xs text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                                                >
                                                    Ajouter
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeFilters.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {activeFilters.map((f, i) => (
                                            <span
                                                key={i}
                                                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 text-sm text-indigo-700 shadow-sm dark:border-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-200"
                                            >
                                                <span className="font-medium">{filterOptions.find((o) => o.value === f.field)?.label}:</span>
                                                {f.value}
                                                <button
                                                    onClick={() => removeFilter(i)}
                                                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-indigo-200 dark:hover:bg-indigo-800"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="ml-auto flex items-center gap-3">
                                <div className="relative min-w-[220px]">
                                    <select
                                        value={logs.per_page}
                                        onChange={(e) => changePer(Number(e.target.value))}
                                        className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    >
                                        {[5, 10, 20, 50].map((n) => (
                                            <option key={n} value={n}>
                                                {n} lignes par page
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-slate-400" />
                                </div>

                                <Button
                                    onClick={exportCsv}
                                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:from-red-500 hover:to-red-600"
                                >
                                    <FileDown className="h-4 w-4" />
                                    Exporter
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                            <thead className="bg-slate-100 text-xs text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Date & Heure
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Utilisateur
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4" />
                                            Action & Objet
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left">
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4" />
                                            Détails
                                        </div>
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <Activity className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                                <div>
                                                    <p className="font-medium">Aucune activité trouvée</p>
                                                    <p className="text-xs">Aucun journal ne correspond aux critères de recherche</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {logs.data.map((log) => (
                                    <tr key={log.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{new Date(log.created_at).toLocaleDateString('fr-FR')}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(log.created_at).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.causer ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-xs font-medium text-white">
                                                        {log.causer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">{log.causer.name}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{log.causer.email}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-gray-500 to-gray-600 text-xs text-white">
                                                        <Database className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Système</span>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">Action automatique</div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <ActionDisplay log={log} />
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.properties && Object.keys(log.properties).length > 0 ? (
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => toggleRow(log.id)}
                                                        className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                                                    >
                                                        {expanded.includes(log.id) ? (
                                                            <>
                                                                <Minus className="h-4 w-4" />
                                                                Masquer les détails
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="h-4 w-4" />
                                                                Voir les détails
                                                            </>
                                                        )}
                                                    </button>

                                                    {expanded.includes(log.id) && (
                                                        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                                                            <pre className="max-h-48 overflow-y-auto px-3 py-2 font-mono text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                                                                {JSON.stringify(log.properties, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic dark:text-slate-500">Aucun détail disponible</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 sm:flex-row dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-600 dark:text-slate-300">
                                    Affichage de <span className="font-medium">{logs.from}</span> à <span className="font-medium">{logs.to}</span> sur{' '}
                                    <span className="font-medium">{logs.total}</span> résultats
                                </span>
                            </div>

                            {logs.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="outline" disabled={logs.current_page === 1} onClick={() => changePage(1)}>
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={logs.current_page === 1}
                                        onClick={() => changePage(logs.current_page - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    {windowPages.map((p, idx) =>
                                        p === '…' ? (
                                            <span key={idx} className="px-2 text-slate-400 select-none">
                                                …
                                            </span>
                                        ) : (
                                            <Button
                                                key={p}
                                                size="sm"
                                                variant={p === logs.current_page ? 'default' : 'outline'}
                                                onClick={() => changePage(p as number)}
                                            >
                                                {p}
                                            </Button>
                                        ),
                                    )}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={logs.current_page === logs.last_page}
                                        onClick={() => changePage(logs.current_page + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={logs.current_page === logs.last_page}
                                        onClick={() => changePage(logs.last_page)}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
