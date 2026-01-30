// Edit.tsx
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Banknote,
    Briefcase,
    Building2,
    Calendar,
    Clock3,
    CreditCard,
    FileText,
    IdCard,
    Image as ImageIcon,
    Mail,
    MapPin,
    Paperclip,
    Phone,
    Save,
    UserCircle2,
    Users,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

/* ------------------------ Types & props ------------------------ */
type EmployeeStatus = 'active' | 'inactive';
type EmploymentType = 'permanent' | 'fixed_term' | 'intern' | 'contractor' | 'apprentice';
type ContractType = 'full_time' | 'part_time' | 'temp' | 'freelance';
type PayFrequency = 'monthly' | 'weekly' | 'biweekly' | 'hourly';

interface Department {
    id: number;
    name: string;
}
interface Manager {
    id: number;
    first_name: string;
    last_name: string;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type DayConfig = { enabled: boolean; start: string; end: string };
type WeekConfig = Record<DayKey, DayConfig> & { weekly_hours: number };

/** Employé tel que renvoyé par le back pour l’édition */
interface EmployeeModel {
    id: number;
    // Identité / contact
    first_name: string;
    last_name: string;
    employee_code: string | null;
    cin: string;
    cnss_number: string;
    photo?: string | null;
    cv?: string | null;
    contract?: string | null;
    email: string;
    phone_number: string;
    address: string;
    date_of_birth: string;

    // Poste & orga
    position: string;
    department_id: number | null;
    status: EmployeeStatus;
    hire_date: string;
    departure_date: string | null;

    // Orga & suivi
    manager_id: number | null;
    is_manager?: boolean;
    location: string;
    probation_end_date: string | null;
    last_review_date: string | null;
    notes?: string | null;

    // Rémunération & contrat
    employment_type: EmploymentType;
    contract_type: ContractType;
    work_schedule: WeekConfig | null;
    salary_gross: string | number | null;
    salary_currency: string;
    pay_frequency: PayFrequency;
    hourly_rate: string | number | null;
    bonus_target: string | number | null;
    benefits: string[] | null;
    cost_center: string | null;

    bank_iban: string | null;
    bank_rib: string | null;
}

type EmployeeFormData = {
    // Identité / contact
    first_name: string;
    last_name: string;
    employee_code: string | null;
    cin: string;
    cnss_number: string;
    photo: File | null;
    cv: File | null;
    contract: File | null;
    email: string;
    phone_number: string;
    address: string;
    date_of_birth: string;

    // Poste & orga
    position: string;
    department_id: string;
    status: EmployeeStatus;
    hire_date: string;
    departure_date: string;

    // Orga & suivi
    manager_id: string;
    is_manager: boolean;
    location: string;
    probation_end_date: string;
    last_review_date: string;
    notes?: string;

    // Rémunération & contrat
    employment_type: EmploymentType;
    contract_type: ContractType;
    work_schedule: WeekConfig;
    salary_gross: string;
    salary_currency: string;
    pay_frequency: PayFrequency;
    hourly_rate: string;
    bonus_target: string;
    benefits: string; // on saisit "A, B, C", on normalise avant envoi
    cost_center: string;

    bank_iban: string;
    bank_rib: string;

    emergency_contact_name?: string;
    emergency_contact_phone?: string;

    [key: string]: any;
};

interface Props {
    employee: EmployeeModel;
    departments: Department[];
    managers?: Manager[];
}

/* --------------------- Téléphone (pays + logique) --------------------- */
const COUNTRIES = [
    { iso: 'MA', name: 'Maroc', dial: '+212', lengths: [9] as const },
    { iso: 'FR', name: 'France', dial: '+33', lengths: [9] as const },
    { iso: 'ES', name: 'Espagne', dial: '+34', lengths: [9] as const },
    { iso: 'DE', name: 'Allemagne', dial: '+49', lengths: [10, 11] as const },
    { iso: 'GB', name: 'Royaume-Uni', dial: '+44', lengths: [10] as const },
    { iso: 'US', name: 'États-Unis', dial: '+1', lengths: [10] as const },
    { iso: 'CA', name: 'Canada', dial: '+1', lengths: [10] as const },
    { iso: 'IT', name: 'Italie', dial: '+39', lengths: [9, 10] as const },
    { iso: 'BE', name: 'Belgique', dial: '+32', lengths: [8, 9] as const },
    { iso: 'NL', name: 'Pays-Bas', dial: '+31', lengths: [9] as const },
] as const;

type Country = (typeof COUNTRIES)[number];
const onlyDigits = (v: string) => v.replace(/\D/g, '');
const isoToFlag = (iso: string) => iso.replace(/./g, (c) => String.fromCodePoint(127397 + c.toUpperCase().charCodeAt(0)));

/* ------------------------------ UI helpers ------------------------------ */
const baseInput =
    'w-full h-11 px-3 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/30 focus:border-red-500';
const errorInput = baseInput + ' border-red-500 focus:ring-red-500/40';
const disabledInput = baseInput + ' bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 cursor-not-allowed';

/* -------------------- Planning hebdo (work_schedule) -------------------- */
const DEFAULT_WEEK: WeekConfig = {
    weekly_hours: 40,
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '13:00' },
};

const dayLabels: Record<DayKey, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
};

function timeDiffHours(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const diff = Math.max(0, endMin - startMin);
    return Math.round((diff / 60) * 100) / 100;
}

/* -------------------- DateInput -------------------- */
function DateInput(props: {
    value: string;
    onChange: (v: string) => void;
    type?: 'date' | 'datetime-local';
    className?: string;
    disabled?: boolean;
}) {
    const { value, onChange, type = 'date', className, disabled } = props;
    const ref = useRef<HTMLInputElement>(null);
    const openPicker = () => {
        const el = ref.current as any;
        if (el?.showPicker) el.showPicker();
        else el?.focus();
    };
    return (
        <div className="relative">
            <Input
                ref={ref}
                type={type}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className={`pr-10 ${className ?? ''} [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0`}
            />
            <button
                type="button"
                onClick={openPicker}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                aria-label="Ouvrir le calendrier"
                tabIndex={-1}
            >
                <Calendar className="h-4 w-4" />
            </button>
        </div>
    );
}

/* ============================== Helpers ============================== */
function pickCountryFromPhone(phone: string): { country: Country; national: string } {
    const p = phone?.trim() || '';
    const match = COUNTRIES.find((c) => p.startsWith(c.dial));
    if (match) return { country: match as Country, national: p.slice(match.dial.length) };
    return { country: COUNTRIES[0], national: p.replace(/^\+/, '') };
}

/* ====================================================================== */
export default function EditEmployee({ employee, departments, managers = [] }: Props) {
    /* ------------ Préremplissage ------------- */
    const initialWeek: WeekConfig = employee.work_schedule ?? DEFAULT_WEEK;
    const { country: initialCountry, national: initialNational } = pickCountryFromPhone(employee.phone_number || '');

    const benefitsInitial = Array.isArray(employee.benefits) ? employee.benefits.join(', ') : (employee.benefits ?? '');

    const form = useForm<EmployeeFormData>({
        // Identité / contact
        first_name: employee.first_name ?? '',
        last_name: employee.last_name ?? '',
        employee_code: employee.employee_code ?? null,
        cin: employee.cin ?? '',
        cnss_number: employee.cnss_number ?? '',
        photo: null,
        cv: null,
        contract: null,
        email: employee.email ?? '',
        phone_number: employee.phone_number ?? '',
        address: employee.address ?? '',
        date_of_birth: employee.date_of_birth ?? '',

        // Poste & orga
        position: employee.position ?? '',
        department_id: employee.department_id ? String(employee.department_id) : '',
        status: employee.status ?? 'active',
        hire_date: employee.hire_date ?? '',
        departure_date: employee.departure_date ?? '',

        // Orga & suivi
        manager_id: employee.manager_id ? String(employee.manager_id) : '',
        is_manager: Boolean(employee.is_manager),
        location: employee.location ?? '',
        probation_end_date: employee.probation_end_date ?? '',
        last_review_date: employee.last_review_date ?? '',
        notes: employee.notes ?? '',

        // Rémunération & contrat
        employment_type: employee.employment_type ?? 'permanent',
        contract_type: employee.contract_type ?? 'full_time',
        work_schedule: initialWeek,
        salary_gross: employee.salary_gross != null ? String(employee.salary_gross) : '',
        salary_currency: (employee.salary_currency || 'EUR').toUpperCase(),
        pay_frequency: employee.pay_frequency ?? 'monthly',
        hourly_rate: employee.hourly_rate != null ? String(employee.hourly_rate) : '',
        bonus_target: employee.bonus_target != null ? String(employee.bonus_target) : '',
        benefits: benefitsInitial,
        cost_center: employee.cost_center ?? '',

        bank_iban: employee.bank_iban ?? '',
        bank_rib: employee.bank_rib ?? '',

        emergency_contact_name: '',
        emergency_contact_phone: '',
    });

    // Shims typage
    const { data, setData, processing, errors: rawErrors } = form;
    type SafeErrors<T> = Partial<Record<Extract<keyof T, string>, string>>;
    const errors = rawErrors as SafeErrors<EmployeeFormData>;
    const setField = useCallback(
        <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) =>
            (setData as unknown as (k: string, v: unknown) => void)(key as string, value as unknown),
        [setData],
    );

    /* ------------ Téléphone (UI) ------------- */
    const [country, setCountry] = useState<Country>(initialCountry);
    const [nationalNumber, setNationalNumber] = useState<string>(initialNational);
    const expectedLengths: readonly number[] = country.lengths;
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const fullInternational = `${country.dial}${nationalNumber}`;
    const validatePhone = () => {
        if (!nationalNumber) {
            setPhoneError(null);
            return true;
        }
        if (!expectedLengths.includes(nationalNumber.length)) {
            const pretty = [...expectedLengths].map(String).join(' ou ');
            setPhoneError(`Le numéro doit contenir ${pretty} chiffres pour ${country.name}.`);
            return false;
        }
        setPhoneError(null);
        return true;
    };

    useEffect(() => {
        if (data.status === 'active' && data.departure_date) {
            setField('departure_date', '');
        }
    }, [data.status, data.departure_date, setField]);

    /* ------------ Planning (work_schedule) ------------- */
    const [week, setWeek] = useState<WeekConfig>(initialWeek);
    const computedWeeklyHours = useMemo(() => {
        let total = 0;
        (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as DayKey[]).forEach((d) => {
            const cfg = week[d];
            if (!cfg.enabled) return;
            total += timeDiffHours(cfg.start, cfg.end);
        });
        return Math.round(total * 100) / 100;
    }, [week]);

    const setDay = (day: DayKey, patchDay: Partial<DayConfig>) => {
        setWeek((w) => ({ ...w, [day]: { ...w[day], ...patchDay } }));
    };

    const applyStandard = (type: 'standard-40' | 'parttime-20' | 'weekend') => {
        if (type === 'standard-40') setWeek(DEFAULT_WEEK);
        if (type === 'parttime-20') {
            setWeek({
                ...DEFAULT_WEEK,
                weekly_hours: 20,
                monday: { enabled: true, start: '09:00', end: '13:00' },
                tuesday: { enabled: true, start: '09:00', end: '13:00' },
                wednesday: { enabled: true, start: '09:00', end: '13:00' },
                thursday: { enabled: true, start: '09:00', end: '13:00' },
                friday: { enabled: true, start: '09:00', end: '13:00' },
                saturday: { enabled: false, start: '09:00', end: '13:00' },
                sunday: { enabled: false, start: '09:00', end: '13:00' },
            });
        }
        if (type === 'weekend') {
            setWeek({
                weekly_hours: 16,
                monday: { enabled: false, start: '09:00', end: '17:00' },
                tuesday: { enabled: false, start: '09:00', end: '17:00' },
                wednesday: { enabled: false, start: '09:00', end: '17:00' },
                thursday: { enabled: false, start: '09:00', end: '17:00' },
                friday: { enabled: false, start: '09:00', end: '17:00' },
                saturday: { enabled: true, start: '09:00', end: '17:00' },
                sunday: { enabled: true, start: '09:00', end: '17:00' },
            });
        }
    };

    /* ------------------------------ Submit ------------------------------- */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prépare les valeurs sans dépendre d'un setData juste avant patch
        const phone_to_send = nationalNumber ? (validatePhone() ? `${country.dial}${nationalNumber}` : null) : '';

        if (nationalNumber && phone_to_send === null) {
            // téléphone invalide → on bloque
            return;
        }

        const benefitsArray = String(data.benefits || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

        const payload: any = {
            // Identité / contact
            first_name: data.first_name,
            last_name: data.last_name,
            employee_code: data.employee_code,
            cin: data.cin,
            cnss_number: data.cnss_number,
            photo: data.photo,
            cv: data.cv,
            contract: data.contract,
            email: data.email,
            phone_number: phone_to_send ?? '', // si invalide on a déjà return
            address: data.address,
            date_of_birth: data.date_of_birth,

            // Poste & orga
            position: data.position,
            department_id: data.department_id ? Number(data.department_id) : null,
            status: data.status,
            hire_date: data.hire_date,
            departure_date: data.status === 'inactive' ? data.departure_date : '',

            // Orga & suivi
            manager_id: data.manager_id ? Number(data.manager_id) : null,
            is_manager: Boolean(data.is_manager),
            location: data.location,
            probation_end_date: data.probation_end_date || '',
            last_review_date: data.last_review_date || '',
            notes: data.notes || '',

            // Rémunération & contrat
            employment_type: data.employment_type,
            contract_type: data.contract_type,
            work_schedule: { ...week, weekly_hours: computedWeeklyHours },
            salary_gross: data.salary_gross,
            salary_currency: (data.salary_currency || 'EUR').toUpperCase(),
            pay_frequency: data.pay_frequency,
            hourly_rate: data.hourly_rate,
            bonus_target: data.bonus_target,
            benefits: benefitsArray,
            cost_center: data.cost_center,

            bank_iban: data.bank_iban,
            bank_rib: data.bank_rib,

            // champs libres
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_contact_phone: data.emergency_contact_phone || '',
            _method: 'PATCH', // au cas où
        };

        // DEBUG (optionnel) : décommenter pour vérifier le payload
        // console.log('PAYLOAD >>>', payload)

        router.post(route('employees.update', employee.id), payload, {
            forceFormData: true,
            preserveScroll: true,
            onError: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        });
    };

    /* --------------------------------- UI -------------------------------- */
    return (
        <>
            <Head title={`Modifier — ${employee.first_name} ${employee.last_name}`} />
            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Employés', href: '/employees' },
                        { title: `${employee.first_name} ${employee.last_name}`, href: route('employees.edit', employee.id) },
                        { title: 'Éditer', href: '' },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        <div className="col-span-12">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md md:p-8 dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Modifier le collaborateur</h1>

                                {Object.keys(errors).length > 0 && (
                                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                                        <strong>Erreur(s) dans le formulaire) :</strong>
                                        <ul className="mt-2 list-inside list-disc text-sm">
                                            {Object.entries(errors).map(([field, message]) => (
                                                <li key={field}>{String(message)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Tabs defaultValue="profil" className="w-full">
                                        <TabsList className="flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                                            <TabsTrigger value="profil">Profil</TabsTrigger>
                                            <TabsTrigger value="poste_contrat">Poste & Contrat</TabsTrigger>
                                            <TabsTrigger value="planning">Planning</TabsTrigger>
                                            <TabsTrigger value="pieces_dates">Pièces & Dates</TabsTrigger>
                                        </TabsList>

                                        {/* --- PROFIL --- */}
                                        <TabsContent value="profil" className="space-y-5 pt-4">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Matricule</label>
                                                <Input value={data.employee_code ?? ''} readOnly disabled className={disabledInput} aria-readonly />
                                                <p className="mt-1 text-xs text-slate-500">Généré automatiquement. Non modifiable ici.</p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Users className="mr-1 inline h-4 w-4" /> Prénom <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        value={data.first_name}
                                                        onChange={(e) => setField('first_name', e.target.value)}
                                                        className={errors.first_name ? errorInput : baseInput}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Users className="mr-1 inline h-4 w-4" /> Nom <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        value={data.last_name}
                                                        onChange={(e) => setField('last_name', e.target.value)}
                                                        className={errors.last_name ? errorInput : baseInput}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                <div className="md:col-span-1">
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <CreditCard className="mr-1 inline h-4 w-4" /> CNSS <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        inputMode="numeric"
                                                        maxLength={13}
                                                        value={data.cnss_number}
                                                        onChange={(e) => setField('cnss_number', onlyDigits(e.target.value).slice(0, 13))}
                                                        className={errors.cnss_number ? errorInput : baseInput}
                                                        required
                                                    />
                                                    <p className="mt-1 text-xs text-slate-500">Max 13 chiffres.</p>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <IdCard className="mr-1 inline h-4 w-4" /> CIN
                                                    </label>
                                                    <Input
                                                        maxLength={10}
                                                        value={data.cin}
                                                        onChange={(e) =>
                                                            setField('cin', e.target.value.replace(/\s+/g, '').toUpperCase().slice(0, 10))
                                                        }
                                                        className={errors.cin ? errorInput : baseInput}
                                                    />
                                                    <p className="mt-1 text-xs text-slate-500">10 caractères, majuscules.</p>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="mb-1 block text-sm font-medium">RIB (24 chiffres)</label>
                                                    <Input
                                                        inputMode="numeric"
                                                        maxLength={24}
                                                        value={data.bank_rib}
                                                        onChange={(e) => setField('bank_rib', onlyDigits(e.target.value).slice(0, 24))}
                                                        placeholder="24 chiffres"
                                                        className={errors.bank_rib ? errorInput : baseInput}
                                                    />
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="mb-1 block text-sm font-medium">
                                                        Date de naissance <span className="text-red-500">*</span>
                                                    </label>
                                                    <DateInput
                                                        value={data.date_of_birth}
                                                        onChange={(v) => setField('date_of_birth', v)}
                                                        className={errors.date_of_birth ? errorInput : baseInput}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Mail className="mr-1 inline h-4 w-4" /> Email <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        type="email"
                                                        value={data.email}
                                                        onChange={(e) => setField('email', e.target.value)}
                                                        className={errors.email ? errorInput : baseInput}
                                                        required
                                                    />
                                                </div>

                                                {/* Téléphone */}
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Phone className="mr-1 inline h-4 w-4" /> Téléphone
                                                    </label>
                                                    <div className="relative">
                                                        <div className="relative flex items-center rounded-lg border border-slate-300 bg-white focus-within:ring-1 focus-within:ring-red-500 dark:border-slate-700 dark:bg-slate-800">
                                                            <div className="flex items-center gap-2 border-r border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                                                <span className="text-lg">{isoToFlag(country.iso)}</span>
                                                                <select
                                                                    aria-label="Indicatif"
                                                                    value={country.iso}
                                                                    onChange={(e) => {
                                                                        const c =
                                                                            COUNTRIES.find((k) => k.iso === (e.target.value as Country['iso'])) ||
                                                                            COUNTRIES[0];
                                                                        setCountry(c as Country);
                                                                    }}
                                                                    className="bg-transparent outline-none"
                                                                >
                                                                    {COUNTRIES.map((c) => (
                                                                        <option key={c.iso} value={c.iso}>
                                                                            {c.dial}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="relative flex-1">
                                                                <Phone className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                                                <input
                                                                    id="contact_phone"
                                                                    inputMode="numeric"
                                                                    autoComplete="tel-national"
                                                                    placeholder="612345678"
                                                                    value={nationalNumber}
                                                                    maxLength={Math.max(...expectedLengths)}
                                                                    onChange={(e) => {
                                                                        const digits = onlyDigits(e.target.value);
                                                                        setNationalNumber(digits);
                                                                        if (phoneError) setPhoneError(null);
                                                                    }}
                                                                    onBlur={validatePhone}
                                                                    className={(phoneError ? errorInput : baseInput) + ' border-0 pl-10'}
                                                                />
                                                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 dark:text-slate-400">
                                                                    {nationalNumber.length}/{Math.max(...expectedLengths)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
                                                        {!phoneError && nationalNumber && (
                                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                Numéro complet : <strong>{fullInternational}</strong>
                                                            </p>
                                                        )}
                                                        {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    <MapPin className="mr-1 inline h-4 w-4" /> Adresse
                                                </label>
                                                <Textarea
                                                    rows={3}
                                                    value={data.address}
                                                    onChange={(e) => setField('address', e.target.value)}
                                                    className={errors.address ? errorInput : baseInput}
                                                />
                                            </div>
                                        </TabsContent>

                                        {/* --- POSTE & CONTRAT --- */}
                                        <TabsContent value="poste_contrat" className="space-y-6 pt-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Briefcase className="mr-1 inline h-4 w-4" /> Poste <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        value={data.position}
                                                        onChange={(e) => setField('position', e.target.value)}
                                                        className={errors.position ? errorInput : baseInput}
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Building2 className="mr-1 inline h-4 w-4" /> Département
                                                    </label>
                                                    {departments && departments.length > 0 ? (
                                                        <Select value={data.department_id} onValueChange={(v) => setField('department_id', v)}>
                                                            <SelectTrigger className={errors.department_id ? errorInput : baseInput}>
                                                                <SelectValue placeholder="Sélectionner…" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {departments.map((d) => (
                                                                    <SelectItem key={d.id} value={String(d.id)}>
                                                                        {d.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                                                            Aucun département trouvé.
                                                        </div>
                                                    )}
                                                    {errors.department_id && <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <UserCircle2 className="mr-1 inline h-4 w-4" /> Manager (Nom + Prénom)
                                                    </label>
                                                    <Select
                                                        value={data.manager_id || 'none'}
                                                        onValueChange={(v) => setField('manager_id', v === 'none' ? '' : v)}
                                                    >
                                                        <SelectTrigger className={baseInput}>
                                                            <SelectValue placeholder="Aucun (optionnel)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Aucun</SelectItem>
                                                            {(managers || []).map((m) => (
                                                                <SelectItem key={m.id} value={String(m.id)}>
                                                                    {m.last_name} {m.first_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Lieu / Site</label>
                                                    <Input
                                                        value={data.location}
                                                        onChange={(e) => setField('location', e.target.value)}
                                                        className={baseInput}
                                                        placeholder="(ex) Casablanca - Siège"
                                                    />
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-white/5">
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        id="employee-edit-field-is_manager"
                                                        checked={data.is_manager}
                                                        onCheckedChange={(c) => setField('is_manager', Boolean(c))}
                                                    />
                                                    <div className="leading-tight">
                                                        <label
                                                            htmlFor="employee-edit-field-is_manager"
                                                            className="text-sm font-medium text-slate-900 dark:text-white"
                                                        >
                                                            Cet employé est manager
                                                        </label>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            Si activé, il apparaîtra dans la liste des managers lors de la création/édition d’un
                                                            employé.
                                                        </p>
                                                    </div>
                                                </div>
                                                {errors.is_manager && <p className="mt-2 text-sm text-red-600">{errors.is_manager}</p>}
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Banknote className="mr-1 inline h-4 w-4" /> Salaire brut
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.salary_gross}
                                                        onChange={(e) => setField('salary_gross', e.target.value)}
                                                        className={errors.salary_gross ? errorInput : baseInput}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Devise</label>
                                                    <Select value={data.salary_currency} onValueChange={(v) => setField('salary_currency', v)}>
                                                        <SelectTrigger className={errors.salary_currency ? errorInput : baseInput}>
                                                            <SelectValue placeholder="Devise" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {['MAD', 'EUR', 'USD'].map((c) => (
                                                                <SelectItem key={c} value={c}>
                                                                    {c}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Fréquence de paie</label>
                                                    <Select
                                                        value={data.pay_frequency}
                                                        onValueChange={(v) => setField('pay_frequency', v as PayFrequency)}
                                                    >
                                                        <SelectTrigger className={errors.pay_frequency ? errorInput : baseInput}>
                                                            <SelectValue placeholder="Fréquence" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="monthly">Mensuelle</SelectItem>
                                                            <SelectItem value="biweekly">Bimensuelle</SelectItem>
                                                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                                            <SelectItem value="hourly">Horaire</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Type d’emploi</label>
                                                    <Select
                                                        value={data.employment_type}
                                                        onValueChange={(v) => setField('employment_type', v as EmploymentType)}
                                                    >
                                                        <SelectTrigger className={errors.employment_type ? errorInput : baseInput}>
                                                            <SelectValue placeholder="Type d’emploi" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="permanent">CDI</SelectItem>
                                                            <SelectItem value="fixed_term">CDD</SelectItem>
                                                            <SelectItem value="intern">Stagiaire</SelectItem>
                                                            <SelectItem value="contractor">Prestataire</SelectItem>
                                                            <SelectItem value="apprentice">Apprenti</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Type de contrat</label>
                                                    <Select
                                                        value={data.contract_type}
                                                        onValueChange={(v) => setField('contract_type', v as ContractType)}
                                                    >
                                                        <SelectTrigger className={errors.contract_type ? errorInput : baseInput}>
                                                            <SelectValue placeholder="Type de contrat" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="full_time">Temps plein</SelectItem>
                                                            <SelectItem value="part_time">Temps partiel</SelectItem>
                                                            <SelectItem value="temp">Temporaire</SelectItem>
                                                            <SelectItem value="freelance">Freelance</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* --- PLANNING --- */}
                                        <TabsContent value="planning" className="space-y-4 pt-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock3 className="h-4 w-4" />
                                                    <span className="text-sm text-slate-700 dark:text-slate-200">
                                                        Heures hebdomadaires calculées : <strong>{computedWeeklyHours}h</strong>
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="button" variant="outline" onClick={() => applyStandard('standard-40')}>
                                                        40h standard
                                                    </Button>
                                                    <Button type="button" variant="outline" onClick={() => applyStandard('parttime-20')}>
                                                        20h part-time
                                                    </Button>
                                                    <Button type="button" variant="outline" onClick={() => applyStandard('weekend')}>
                                                        Week-end
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as DayKey[]).map(
                                                    (day) => {
                                                        const cfg = week[day];
                                                        return (
                                                            <div
                                                                key={day}
                                                                className="rounded-lg border bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40"
                                                            >
                                                                <div className="mb-2 flex items-center justify-between">
                                                                    <span className="font-medium">{dayLabels[day]}</span>
                                                                    <label className="inline-flex items-center gap-2 text-sm">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={cfg.enabled}
                                                                            onChange={(e) => setDay(day, { enabled: e.target.checked })}
                                                                        />
                                                                        <span>{cfg.enabled ? 'Activé' : 'Repos'}</span>
                                                                    </label>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="mb-1 block text-xs">Début</label>
                                                                        <Input
                                                                            type="time"
                                                                            value={cfg.start}
                                                                            disabled={!cfg.enabled}
                                                                            onChange={(e) => setDay(day, { start: e.target.value })}
                                                                            className={baseInput}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-xs">Fin</label>
                                                                        <Input
                                                                            type="time"
                                                                            value={cfg.end}
                                                                            disabled={!cfg.enabled}
                                                                            onChange={(e) => setDay(day, { end: e.target.value })}
                                                                            className={baseInput}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <p className="mt-2 text-xs text-slate-500">
                                                                    {cfg.enabled ? `≈ ${timeDiffHours(cfg.start, cfg.end)}h` : '—'}
                                                                </p>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Astuce : utilisez les presets pour aller plus vite, puis ajustez les horaires par jour.
                                            </p>
                                        </TabsContent>

                                        {/* --- PIÈCES & DATES --- */}
                                        <TabsContent value="pieces_dates" className="space-y-6 pt-4">
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <ImageIcon className="mr-1 inline h-4 w-4" /> Photo (image)
                                                    </label>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => setField('photo', e.target.files?.[0] ?? null)}
                                                        className={errors.photo ? errorInput : baseInput}
                                                    />
                                                    {errors.photo && <p className="mt-1 text-sm text-red-600">{errors.photo}</p>}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <FileText className="mr-1 inline h-4 w-4" /> CV (PDF/DOC)
                                                    </label>
                                                    <Input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,.odt"
                                                        onChange={(e) => setField('cv', e.target.files?.[0] ?? null)}
                                                        className={errors.cv ? errorInput : baseInput}
                                                    />
                                                    {errors.cv && <p className="mt-1 text-sm text-red-600">{errors.cv}</p>}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Paperclip className="mr-1 inline h-4 w-4" /> Contrat (PDF/DOC)
                                                    </label>
                                                    <Input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,.odt"
                                                        onChange={(e) => setField('contract', e.target.files?.[0] ?? null)}
                                                        className={errors.contract ? errorInput : baseInput}
                                                    />
                                                    {errors.contract && <p className="mt-1 text-sm text-red-600">{errors.contract}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Calendar className="mr-1 inline h-4 w-4" /> Date d'embauche{' '}
                                                        <span className="text-red-500">*</span>
                                                    </label>
                                                    <DateInput
                                                        type="date"
                                                        value={data.hire_date}
                                                        onChange={(v) => setField('hire_date', v)}
                                                        className={errors.hire_date ? errorInput : baseInput}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        Statut <span className="text-red-500">*</span>
                                                    </label>
                                                    <Select value={data.status} onValueChange={(v) => setField('status', v as EmployeeStatus)}>
                                                        <SelectTrigger className={errors.status ? errorInput : baseInput}>
                                                            <SelectValue placeholder="Statut" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Actif</SelectItem>
                                                            <SelectItem value="inactive">Inactif</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Date de départ (si inactif)</label>
                                                    <DateInput
                                                        type="date"
                                                        value={data.departure_date}
                                                        onChange={(v) => setField('departure_date', v)}
                                                        className={errors.departure_date ? errorInput : baseInput}
                                                        disabled={data.status !== 'inactive'}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Fin de période d’essai</label>
                                                    <DateInput
                                                        type="date"
                                                        value={data.probation_end_date}
                                                        onChange={(v) => setField('probation_end_date', v)}
                                                        className={baseInput}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Dernière évaluation</label>
                                                    <DateInput
                                                        type="date"
                                                        value={data.last_review_date}
                                                        onChange={(v) => setField('last_review_date', v)}
                                                        className={baseInput}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Taux horaire (si horaire)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.hourly_rate}
                                                        onChange={(e) => setField('hourly_rate', e.target.value)}
                                                        className={baseInput}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Prime cible (annuelle)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.bonus_target}
                                                        onChange={(e) => setField('bonus_target', e.target.value)}
                                                        className={baseInput}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Avantages (séparés par des virgules)</label>
                                                    <Input
                                                        placeholder="Mutuelle, Titres resto, Transport…"
                                                        value={data.benefits}
                                                        onChange={(e) => setField('benefits', e.target.value)}
                                                        className={baseInput}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Centre de coût</label>
                                                    <Input
                                                        value={data.cost_center}
                                                        onChange={(e) => setField('cost_center', e.target.value)}
                                                        className={baseInput}
                                                        placeholder="(ex) CC-001"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Contact urgence – Nom</label>
                                                    <Input
                                                        value={data.emergency_contact_name}
                                                        onChange={(e) => setField('emergency_contact_name', e.target.value)}
                                                        className={baseInput}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Contact urgence – Téléphone</label>
                                                    <Input
                                                        value={data.emergency_contact_phone}
                                                        onChange={(e) => setField('emergency_contact_phone', e.target.value)}
                                                        className={baseInput}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">IBAN</label>
                                                    <Input
                                                        value={data.bank_iban}
                                                        onChange={(e) => setField('bank_iban', e.target.value)}
                                                        className={baseInput}
                                                        placeholder="IBAN"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Notes (interne)</label>
                                                    <Textarea
                                                        rows={4}
                                                        value={data.notes ?? ''}
                                                        onChange={(e) => setField('notes', e.target.value)}
                                                        className={baseInput}
                                                        placeholder="Commentaires internes, ex: fin période d'essai, remarques RH, ..."
                                                    />
                                                    <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                                        <AlertCircle className="mt-0.5 h-4 w-4" />
                                                        <p className="text-sm">
                                                            Les pièces jointes sont facultatives — vous pourrez les mettre à jour plus tard.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>

                                    {/* Actions */}
                                    <div className="flex justify-between pt-2">
                                        <Button
                                            type="button"
                                            onClick={() => history.back()}
                                            className="border-0 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                        >
                                            <X className="mr-2 h-4 w-4" /> Annuler
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="group relative flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 focus:ring-2 focus:ring-red-500"
                                        >
                                            {processing ? (
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : (
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            {processing ? 'Enregistrement…' : 'Enregistrer les modifications'}
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
