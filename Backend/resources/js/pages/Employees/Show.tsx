import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    Briefcase,
    Building2,
    Calendar,
    Clock3,
    CreditCard,
    Download,
    FileText,
    Image as ImageIcon,
    Info,
    Mail,
    MapPin,
    Paperclip,
    Pencil,
    Phone,
    Power,
    Shield,
    User,
    UserCircle2,
} from 'lucide-react';
import React, { JSX, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Tab = 'identite' | 'orga' | 'contrat' | 'planning' | 'pieces' | 'securite' | 'documents' | 'audit' | 'notes';

type EmployeeStatus = 'active' | 'inactive';
type EmploymentType = 'permanent' | 'fixed_term' | 'intern' | 'contractor' | 'apprentice';
type ContractType = 'full_time' | 'part_time' | 'temp' | 'freelance';
type PayFrequency = 'monthly' | 'weekly' | 'biweekly' | 'hourly';

interface Department {
    id: number;
    name: string;
}
interface UserMini {
    id: number;
    name: string;
}
interface EmployeeMini {
    id: number;
    first_name: string;
    last_name: string;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
const WEEK_ORDER: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
type DayConfig = { enabled?: boolean; start?: string; end?: string } | string;
type WorkSchedule = {
    weekly_hours?: number;
    monday?: DayConfig;
    tuesday?: DayConfig;
    wednesday?: DayConfig;
    thursday?: DayConfig;
    friday?: DayConfig;
    saturday?: DayConfig;
    sunday?: DayConfig;
    [k: string]: any;
} | null;

/** Payload tel qu'envoyé par Laravel (snake_case) **/
type EmployeeSnake = {
    id: number;
    first_name: string;
    last_name: string;
    employee_code?: string | null;
    cin?: string | null;
    cnss_number?: string | null;
    photo?: string | null;
    cv_path?: string | null;
    contract_path?: string | null;
    email: string;
    phone_number?: string | null;
    address?: string | null;
    date_of_birth?: string | null;

    position: string;
    department_id?: number | null;
    department?: Department | null;
    status: EmployeeStatus;
    hire_date: string;
    departure_date?: string | null;

    manager_id?: number | null;
    is_manager?: boolean;
    manager?: EmployeeMini | null;
    reports?: EmployeeMini[];
    location?: string | null;
    probation_end_date?: string | null;
    last_review_date?: string | null;
    notes?: string | null;

    employment_type?: EmploymentType;
    contract_type?: ContractType;
    work_schedule?: WorkSchedule;
    salary_gross?: string | number | null;
    salary_currency?: string | null;
    pay_frequency?: PayFrequency;
    hourly_rate?: string | number | null;
    bonus_target?: string | number | null;
    benefits?: string[] | Record<string, any> | null;
    cost_center?: string | null;

    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    bank_iban?: string | null;
    bank_rib?: string | null;

    created_at?: string;
    updated_at?: string | null;
    deleted_at?: string | null;
    created_by?: UserMini | null;

    /** Relation supplémentaire : département dont l’employé est le chef */
    department_head?: Department | null;
};

/** Objet normalisé (camelCase côté front) */
interface Employee extends Omit<EmployeeSnake, 'created_by' | 'department_head'> {
    createdBy?: UserMini | null;
    departmentHead?: Department | null;
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
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; // ✅ accepte Lucide et nos icônes custom
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
        identite: <Info className="mr-2 inline h-4 w-4" />,
        orga: <Briefcase className="mr-2 inline h-4 w-4" />,
        contrat: <Banknote className="mr-2 inline h-4 w-4" />,
        planning: <Clock3 className="mr-2 inline h-4 w-4" />,
        pieces: <Paperclip className="mr-2 inline h-4 w-4" />,
        securite: <Shield className="mr-2 inline h-4 w-4" />,
        documents: <Download className="mr-2 inline h-4 w-4" />,
        audit: <User className="mr-2 inline h-4 w-4" />,
        notes: <FileText className="mr-2 inline h-4 w-4" />,
    };
    const labels: Record<Tab, string> = {
        identite: 'Identité & Contact',
        orga: 'Poste & Organisation',
        contrat: 'Rémunération & Contrat',
        planning: 'Planning',
        pieces: 'Pièces',
        securite: 'Sécurité & Bancaire',
        documents: 'Documents PDF',
        audit: 'Audit',
        notes: 'Notes',
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
const fmtMoney = (n?: number | string | null, curr?: string | null) => {
    if (n === null || n === undefined || n === '') return '—';
    const num = typeof n === 'number' ? n : parseFloat(String(n));
    if (!Number.isFinite(num)) return '—';
    return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${curr ? ` ${curr}` : ''}`;
};
const statusBadge = (st: EmployeeStatus) => (st === 'active' ? <Badge text="Actif" color="green" /> : <Badge text="Inactif" color="red" />);

const dayLabels: Record<DayKey, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
};
function parseDayCfg(cfg: DayConfig): { enabled: boolean; start: string; end: string } {
    if (typeof cfg === 'string') {
        const [start, end] = cfg.split('-');
        return { enabled: true, start: start ?? '09:00', end: end ?? '17:00' };
    }
    return {
        enabled: (cfg as any)?.enabled ?? true,
        start: (cfg as any)?.start ?? '09:00',
        end: (cfg as any)?.end ?? '17:00',
    };
}
function diffHours(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const s = sh * 60 + sm,
        e = eh * 60 + em;
    const d = Math.max(0, e - s) / 60;
    return Math.round(d * 100) / 100;
}

/* ------------------------------ Normalisation ------------------------------ */
/** Accepte payload camelCase OU snake_case (Laravel toArray Eloquent) */
function normalizeEmployee(emp: EmployeeSnake | (EmployeeSnake & Employee)): Employee {
    const anyEmp = emp as any;
    return {
        ...emp,
        createdBy: anyEmp.createdBy ?? anyEmp.created_by ?? null,
        departmentHead: anyEmp.departmentHead ?? anyEmp.department_head ?? null,
    };
}

/* ------------------------------ Component ------------------------------ */
export default function EmployeeShow({ employee: rawEmployee }: { employee: EmployeeSnake }) {
    const employee = useMemo(() => normalizeEmployee(rawEmployee), [rawEmployee]);
    const { can } = useCan();
    const [activeTab, setActiveTab] = useState<Tab>('identite');
    const [docLang, setDocLang] = useState<'fr' | 'ar'>('fr');
    const [docIssuedAt, setDocIssuedAt] = useState<string>('');
    const [docPlace, setDocPlace] = useState<string>('');
    const [docSignatoryName, setDocSignatoryName] = useState<string>('');
    const [docSignatoryTitle, setDocSignatoryTitle] = useState<string>('');
    const [docBankName, setDocBankName] = useState<string>('');
    const [docBankAgency, setDocBankAgency] = useState<string>('');

    const docQuery = useMemo(() => {
        const q: Record<string, string> = {};
        if (docIssuedAt) q.issued_at = docIssuedAt;
        if (docPlace) q.place = docPlace;
        if (docSignatoryName) q.signatory_name = docSignatoryName;
        if (docSignatoryTitle) q.signatory_title = docSignatoryTitle;
        if (docBankName) q.bank_name = docBankName;
        if (docBankAgency) q.bank_agency = docBankAgency;
        return q;
    }, [docIssuedAt, docPlace, docSignatoryName, docSignatoryTitle, docBankName, docBankAgency]);

    const isDeleted = !!employee.deleted_at;
    const ws: WorkSchedule = employee.work_schedule ?? null;
    const weeklyHours = useMemo(() => {
        if (!ws) return null;
        try {
            let sum = 0;
            WEEK_ORDER.forEach((d) => {
                const raw = (ws as any)?.[d] as DayConfig | undefined;
                if (!raw) return;
                const parsed = parseDayCfg(raw);
                if (!parsed.enabled) return;
                sum += diffHours(parsed.start, parsed.end);
            });
            return Math.round(sum * 100) / 100;
        } catch {
            return null;
        }
    }, [ws]);

    const benefitsList = useMemo(() => {
        const b = employee.benefits;
        if (!b) return [];
        if (Array.isArray(b)) return b.map(String);
        return Object.entries(b).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
    }, [employee.benefits]);

    return (
        <>
            <Head title={`Employé – ${employee.first_name} ${employee.last_name}`} />

            <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Employés', href: '/employees' },
                        { title: `${employee.first_name} ${employee.last_name}`, href: route('employees.show', employee.id) },
                    ]}
                >
                    {/* Header card */}
                    <div className="p-6">
                        <div className="flex flex-col items-start gap-6 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-xl backdrop-blur-md sm:px-5 sm:py-5 lg:flex-row dark:border-slate-700 dark:bg-white/5">
                            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                {employee.photo ? (
                                    <img
                                        src={`/storage/${employee.photo}`}
                                        alt={`${employee.first_name} ${employee.last_name}`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="h-12 w-12 text-slate-400" />
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {employee.first_name} {employee.last_name}
                                </h1>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-medium">Poste :</span> {employee.position}
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-medium">Département :</span> {employee.department?.name ?? '—'}
                                </p>
                                {statusBadge(employee.status)}
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:w-auto">
                                <Link href={route('employees.index')} className="w-full sm:w-auto">
                                    <Button variant="outline" className="w-full sm:w-auto">
                                        <ArrowLeft className="mr-1 h-4 w-4" />
                                        Retour
                                    </Button>
                                </Link>
                                {can('employee_edit') && !isDeleted && (
                                    <Link href={route('employees.edit', employee.id)} className="w-full sm:w-auto">
                                        <Button className="group relative flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 focus:ring-2 focus:ring-red-500">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* -------- Tabs -------- */}
                    <div className="flex-grow px-6 pt-2 pb-6">
                        <div className="grid min-h-[420px] grid-cols-1 rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md md:grid-cols-4 dark:border-slate-700 dark:bg-white/5">
                            {/* liste des tabs */}
                            <div className="flex flex-col overflow-y-auto border-r border-slate-200 dark:border-slate-700">
                                {(['identite', 'orga', 'contrat', 'planning', 'pieces', 'documents', 'securite', 'audit', 'notes'] as Tab[]).map(
                                    (tab) => (
                                        <TabButton key={tab} tab={tab} active={activeTab} setActive={setActiveTab} />
                                    ),
                                )}
                            </div>

                            {/* contenu */}
                            <div className="overflow-y-auto p-6 text-slate-700 md:col-span-3 dark:text-slate-300">
                                {/* Identité & Contact */}
                                {activeTab === 'identite' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail icon={Info} label="Matricule" value={employee.employee_code ?? '—'} mono />
                                        <Detail icon={User} label="Nom complet" value={`${employee.first_name} ${employee.last_name}`} />
                                        <Detail icon={IdCardIcon} label="CIN" value={employee.cin ?? '—'} mono />
                                        <Detail icon={CreditCard} label="CNSS" value={employee.cnss_number ?? '—'} mono />
                                        <Detail icon={Mail} label="Email" value={employee.email} />
                                        <Detail icon={Phone} label="Téléphone" value={employee.phone_number || '—'} />
                                        <Detail icon={MapPin} label="Adresse" value={employee.address || '—'} />
                                        <Detail icon={Calendar} label="Date de naissance" value={fmtDate(employee.date_of_birth)} />
                                    </div>
                                )}

                                {/* Poste & Organisation */}
                                {activeTab === 'orga' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail icon={Briefcase} label="Poste" value={employee.position} />
                                        <Detail icon={Building2} label="Département" value={employee.department?.name ?? '—'} />
                                        <Detail
                                            icon={UserCircle2}
                                            label="Manager"
                                            value={employee.manager ? `${employee.manager.last_name} ${employee.manager.first_name}` : '—'}
                                        />
                                        <Detail icon={User} label="Est un Manager" value={employee.is_manager ? 'Vrai' : 'Faux'} />
                                        <Detail icon={Building2} label="Département dirigé" value={employee.departmentHead?.name ?? '—'} />
                                        <Detail icon={MapPin} label="Lieu / Site" value={employee.location || '—'} />
                                        <Detail icon={Calendar} label="Date d'embauche" value={fmtDate(employee.hire_date)} />
                                        <Detail icon={Calendar} label="Date de départ" value={fmtDate(employee.departure_date)} />
                                        <Detail icon={Calendar} label="Fin période d’essai" value={fmtDate(employee.probation_end_date)} />
                                        <Detail icon={Calendar} label="Dernière évaluation" value={fmtDate(employee.last_review_date)} />
                                        <Detail icon={Power} label="Statut" value={statusBadge(employee.status)} />
                                    </div>
                                )}

                                {/* Rémunération & Contrat */}
                                {activeTab === 'contrat' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail
                                            icon={Banknote}
                                            label="Salaire brut"
                                            value={fmtMoney(employee.salary_gross, employee.salary_currency ?? undefined)}
                                        />
                                        <Detail icon={Banknote} label="Devise" value={employee.salary_currency ?? '—'} />
                                        <Detail
                                            icon={Banknote}
                                            label="Fréquence de paie"
                                            value={
                                                {
                                                    monthly: 'Mensuelle',
                                                    weekly: 'Hebdomadaire',
                                                    biweekly: 'Bimensuelle',
                                                    hourly: 'Horaire',
                                                }[employee.pay_frequency ?? 'monthly']
                                            }
                                        />
                                        <Detail
                                            icon={Banknote}
                                            label="Taux horaire"
                                            value={fmtMoney(employee.hourly_rate, employee.salary_currency ?? undefined)}
                                        />
                                        <Detail
                                            icon={Banknote}
                                            label="Prime cible (annuelle)"
                                            value={fmtMoney(employee.bonus_target, employee.salary_currency ?? undefined)}
                                        />
                                        <Detail
                                            icon={Briefcase}
                                            label="Type d’emploi"
                                            value={
                                                {
                                                    permanent: 'CDI',
                                                    fixed_term: 'CDD',
                                                    intern: 'Stagiaire',
                                                    contractor: 'Prestataire',
                                                    apprentice: 'Apprenti',
                                                }[employee.employment_type ?? 'permanent']
                                            }
                                        />
                                        <Detail
                                            icon={Briefcase}
                                            label="Type de contrat"
                                            value={
                                                {
                                                    full_time: 'Temps plein',
                                                    part_time: 'Temps partiel',
                                                    temp: 'Temporaire',
                                                    freelance: 'Freelance',
                                                }[employee.contract_type ?? 'full_time']
                                            }
                                        />
                                        <Detail icon={Briefcase} label="Centre de coût" value={employee.cost_center || '—'} mono />
                                        <div className="sm:col-span-2">
                                            <Detail
                                                icon={Info}
                                                label="Avantages"
                                                value={
                                                    benefitsList.length > 0 ? (
                                                        <ul className="list-inside list-disc">
                                                            {benefitsList.map((b, i) => (
                                                                <li key={i}>{b}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        '—'
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Planning */}
                                {activeTab === 'planning' && (
                                    <div className="space-y-4">
                                        {!ws ? (
                                            <p className="text-sm text-slate-500">Aucun planning enregistré.</p>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <Clock3 className="h-4 w-4" />
                                                    <span className="text-sm">
                                                        Heures hebdomadaires estimées :{' '}
                                                        <strong>{(ws as any)?.weekly_hours ?? weeklyHours ?? '—'}h</strong>
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    {WEEK_ORDER.map((d) => {
                                                        const raw = (ws as any)?.[d] as DayConfig | undefined;
                                                        if (!raw) {
                                                            return (
                                                                <div
                                                                    key={d}
                                                                    className="rounded-lg border bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40"
                                                                >
                                                                    <div className="font-medium">{dayLabels[d]}</div>
                                                                    <div className="text-sm text-slate-500">—</div>
                                                                </div>
                                                            );
                                                        }
                                                        const parsed = parseDayCfg(raw);
                                                        return (
                                                            <div
                                                                key={d}
                                                                className="rounded-lg border bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40"
                                                            >
                                                                <div className="font-medium">{dayLabels[d]}</div>
                                                                {parsed.enabled ? (
                                                                    <div className="mt-1 text-sm">
                                                                        {parsed.start} → {parsed.end}{' '}
                                                                        <span className="text-slate-500">
                                                                            ({diffHours(parsed.start, parsed.end)}h)
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-sm text-slate-500">Repos</div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Pièces */}
                                {activeTab === 'pieces' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail
                                            icon={ImageIcon}
                                            label="Photo"
                                            value={
                                                employee.photo ? (
                                                    <a
                                                        className="text-indigo-600 hover:underline"
                                                        href={`/storage/${employee.photo}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Ouvrir l’image
                                                    </a>
                                                ) : (
                                                    '—'
                                                )
                                            }
                                        />
                                        <Detail
                                            icon={FileText}
                                            label="CV"
                                            value={
                                                employee.cv_path ? (
                                                    <a
                                                        className="text-indigo-600 hover:underline"
                                                        href={`/storage/${employee.cv_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        download
                                                    >
                                                        Télécharger le CV
                                                    </a>
                                                ) : (
                                                    '—'
                                                )
                                            }
                                        />
                                        <Detail
                                            icon={Paperclip}
                                            label="Contrat"
                                            value={
                                                employee.contract_path ? (
                                                    <a
                                                        className="text-indigo-600 hover:underline"
                                                        href={`/storage/${employee.contract_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        download
                                                    >
                                                        Télécharger le contrat
                                                    </a>
                                                ) : (
                                                    '—'
                                                )
                                            }
                                        />
                                    </div>
                                )}

                                {/* Sécurité & Bancaire */}
                                {activeTab === 'securite' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail icon={UserCircle2} label="Contact d'urgence (nom)" value={employee.emergency_contact_name || '—'} />
                                        <Detail icon={Phone} label="Contact d'urgence (tél.)" value={employee.emergency_contact_phone || '—'} />
                                        <Detail icon={CreditCard} label="IBAN" value={employee.bank_iban || '—'} mono />
                                        <Detail icon={CreditCard} label="RIB" value={employee.bank_rib || '—'} mono />
                                    </div>
                                )}

                                {/* Documents PDF */}
                                {activeTab === 'documents' && (
                                    <div className="space-y-6">
                                        <div className="text-sm text-slate-600 dark:text-slate-300">
                                            <p className="mb-2 font-medium text-slate-900 dark:text-white">Documents RH</p>
                                            <p className="text-xs">Générez et téléchargez des PDF côté serveur (données actuelles employé).</p>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-white/5">
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-7">
                                                <div>
                                                    <label className="text-xs text-slate-600 dark:text-slate-400">Langue</label>
                                                    <select
                                                        value={docLang}
                                                        onChange={(e) => setDocLang(e.target.value as 'fr' | 'ar')}
                                                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                    >
                                                        <option value="fr">FR</option>
                                                        <option value="ar">AR</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-600 dark:text-slate-400">Date d'édition</label>
                                                    <input
                                                        type="date"
                                                        value={docIssuedAt}
                                                        onChange={(e) => setDocIssuedAt(e.target.value)}
                                                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-600 dark:text-slate-400">Lieu (optionnel)</label>
                                                    <input
                                                        value={docPlace}
                                                        onChange={(e) => setDocPlace(e.target.value)}
                                                        placeholder="Casablanca"
                                                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-600 dark:text-slate-400">Signataire (nom)</label>
                                                    <input
                                                        value={docSignatoryName}
                                                        onChange={(e) => setDocSignatoryName(e.target.value)}
                                                        placeholder="Nom Prénom"
                                                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-600 dark:text-slate-400">Signataire (titre)</label>
                                                    <input
                                                        value={docSignatoryTitle}
                                                        onChange={(e) => setDocSignatoryTitle(e.target.value)}
                                                        placeholder="La Direction"
                                                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-600 dark:text-slate-400">Banque (optionnel)</label>
                                                    <input
                                                        value={docBankName}
                                                        onChange={(e) => setDocBankName(e.target.value)}
                                                        placeholder="Nom de la banque"
                                                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-600 dark:text-slate-400">Agence (optionnel)</label>
                                                    <input
                                                        value={docBankAgency}
                                                        onChange={(e) => setDocBankAgency(e.target.value)}
                                                        placeholder="Agence / Ville"
                                                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                            {/* Fiche Employé */}
                                            <div className="flex h-full flex-col gap-3 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 transition-shadow hover:shadow-md dark:border-blue-800 dark:from-blue-950/30 dark:to-blue-900/30">
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-lg bg-blue-600 p-2">
                                                        <FileText className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">Fiche Employé</h3>
                                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                            Toutes les informations détaillées de l'employé
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={route('employees.documents.employee-sheet', {
                                                        employee: employee.id,
                                                        lang: docLang,
                                                        _query: docQuery,
                                                    })}
                                                    className="mt-auto block w-full"
                                                >
                                                    <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Télécharger
                                                    </Button>
                                                </a>
                                            </div>

                                            {/* Attestation de Travail */}
                                            <div className="flex h-full flex-col gap-3 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-5 transition-shadow hover:shadow-md dark:border-green-800 dark:from-green-950/30 dark:to-green-900/30">
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-lg bg-green-600 p-2">
                                                        <Briefcase className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">Attestation de Travail</h3>
                                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                            Certificat officiel d'emploi
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={route('employees.documents.work-certificate', {
                                                        employee: employee.id,
                                                        lang: docLang,
                                                        _query: docQuery,
                                                    })}
                                                    className="mt-auto block w-full"
                                                >
                                                    <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Télécharger
                                                    </Button>
                                                </a>
                                            </div>

                                            {/* Attestation de Salaire */}
                                            <div className="flex h-full flex-col gap-3 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5 transition-shadow hover:shadow-md dark:border-amber-800 dark:from-amber-950/30 dark:to-amber-900/30">
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-lg bg-amber-600 p-2">
                                                        <Banknote className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">Attestation de Salaire</h3>
                                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                            Certificat de rémunération officiel
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={route('employees.documents.salary-certificate', {
                                                        employee: employee.id,
                                                        lang: docLang,
                                                        _query: docQuery,
                                                    })}
                                                    className="mt-auto block w-full"
                                                >
                                                    <Button className="w-full bg-amber-600 text-white hover:bg-amber-700">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Télécharger
                                                    </Button>
                                                </a>
                                            </div>

                                            {/* Domiciliation de salaire */}
                                            <div className="flex h-full flex-col gap-3 rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 p-5 transition-shadow hover:shadow-md dark:border-violet-800 dark:from-violet-950/30 dark:to-violet-900/30">
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-lg bg-violet-600 p-2">
                                                        <CreditCard className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">Domiciliation de salaire</h3>
                                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                            Demande de domiciliation (modèle marocain)
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={route('employees.documents.salary-domiciliation', {
                                                        employee: employee.id,
                                                        lang: docLang,
                                                        _query: docQuery,
                                                    })}
                                                    className="mt-auto block w-full"
                                                >
                                                    <Button className="w-full bg-violet-600 text-white hover:bg-violet-700">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Télécharger
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>

                                        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                ℹ️ <strong>Note :</strong> Les documents sont générés en temps réel avec les données actuelles de
                                                l'employé. Assurez-vous que toutes les informations sont à jour avant de télécharger.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Audit */}
                                {activeTab === 'audit' && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Detail icon={User} label="Créé par" value={employee.createdBy?.name ?? '—'} />
                                        <Detail icon={Calendar} label="Créé le" value={fmtDate(employee.created_at)} />
                                        <Detail icon={Calendar} label="Dernière màj" value={fmtDate(employee.updated_at)} />
                                    </div>
                                )}

                                {/* Notes */}
                                {activeTab === 'notes' && (
                                    <div className="text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                                        {employee.notes?.trim() ? employee.notes : 'Aucune note enregistrée.'}
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

/* -------------------------- Petites icônes manquantes -------------------------- */
// Recyclage d’une icône générique pour “CIN”
function IdCardIcon(props: JSX.IntrinsicElements['svg']) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
            <line x1="3" y1="8" x2="21" y2="8"></line>
            <circle cx="9" cy="13" r="2"></circle>
            <path d="M15 12h4M15 16h4"></path>
        </svg>
    );
}
