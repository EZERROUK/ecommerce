import type { FormDataConvertible } from '@inertiajs/core';
import { Head, useForm } from '@inertiajs/react';
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
    Plus,
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

/* -------------------- Planning hebdo (work_schedule) -------------------- */
type DayConfig = { enabled: boolean; start: string; end: string };
type WeekConfig = Record<DayKey, DayConfig> & { weekly_hours: number };

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

/* -------------------- Contrats autorisés par type d'emploi -------------------- */
const CONTRACT_OPTIONS_BY_EMPLOYMENT: Record<EmploymentType, { value: ContractType; label: string }[]> = {
    permanent: [
        { value: 'full_time', label: 'Temps plein' },
        { value: 'part_time', label: 'Temps partiel' },
    ],
    fixed_term: [
        { value: 'full_time', label: 'Temps plein' },
        { value: 'part_time', label: 'Temps partiel' },
        { value: 'temp', label: 'Temporaire' },
    ],
    intern: [
        { value: 'full_time', label: 'Temps plein' },
        { value: 'part_time', label: 'Temps partiel' },
    ],
    apprentice: [
        { value: 'full_time', label: 'Temps plein' },
        { value: 'part_time', label: 'Temps partiel' },
    ],
    contractor: [{ value: 'freelance', label: 'Freelance / Prestataire' }],
};

function isContractAllowed(employment: EmploymentType, contract: ContractType) {
    return (CONTRACT_OPTIONS_BY_EMPLOYMENT[employment] ?? []).some((o) => o.value === contract);
}

/* ------------------------ Form data ------------------------ */
interface EmployeeFormData {
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
    benefits: string[] | string;
    cost_center: string;

    // Sécurité / bancaire
    emergency_contact_name: string;
    emergency_contact_phone: string;
    bank_iban: string;
    bank_rib: string;

    // ✅ obligatoire (Inertia FormDataType)
    [key: string]: FormDataConvertible;
}

interface Props {
    departments: Department[];
    managers?: Manager[];
    next_employee_code: string;
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

/* -------------------- DateInput (icône unique à droite) -------------------- */
function DateInput(props: {
    value: string;
    onChange: (v: string) => void;
    type?: 'date' | 'datetime-local';
    className?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
}) {
    const { value, onChange, type = 'date', className, disabled, id, name } = props;
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
                id={id}
                name={name}
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

/* ------------------------------ Sécurité fichiers (front) ------------------------------ */
/**
 * NOTE : la sécurité réelle doit être côté backend (validation, scan AV, stockage, ACL).
 * Ici, on ajoute des garde-fous UI (type MIME + taille max) pour réduire les risques.
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_DOC_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
]);

function isValidFile(file: File, kind: 'image' | 'doc') {
    if (file.size > MAX_FILE_SIZE) return { ok: false as const, msg: 'Fichier trop volumineux (max 10MB).' };
    if (kind === 'image' && !ALLOWED_IMAGE_TYPES.has(file.type)) return { ok: false as const, msg: 'Format image non autorisé.' };
    if (kind === 'doc' && !ALLOWED_DOC_TYPES.has(file.type)) return { ok: false as const, msg: 'Format document non autorisé.' };
    return { ok: true as const, msg: '' };
}

/* ====================================================================== */
export default function CreateEmployee({ departments, managers = [], next_employee_code }: Props) {
    /* ------------ Form ------------- */
    const form = useForm<EmployeeFormData>({
        // Identité / contact
        first_name: '',
        last_name: '',
        employee_code: next_employee_code ?? null,
        cin: '',
        cnss_number: '',
        photo: null,
        cv: null,
        contract: null,
        email: '',
        phone_number: '',
        address: '',
        date_of_birth: '',

        // Poste & orga
        position: '',
        department_id: '',
        status: 'active',
        hire_date: '',
        departure_date: '',

        // Orga & suivi
        manager_id: '',
        is_manager: false,
        location: '',
        probation_end_date: '',
        last_review_date: '',
        notes: '',

        // Rémunération & contrat
        employment_type: 'permanent',
        contract_type: 'full_time',
        work_schedule: DEFAULT_WEEK,
        salary_gross: '',
        salary_currency: 'MAD',
        pay_frequency: 'monthly',
        hourly_rate: '',
        bonus_target: '',
        benefits: [],
        cost_center: '',

        // Sécurité / bancaire
        emergency_contact_name: '',
        emergency_contact_phone: '',
        bank_iban: '',
        bank_rib: '',
    });

    const { data, setData, post, processing, errors, transform, setError, clearErrors } = form;

    // Helper set() sûr
    const set =
        <K extends keyof EmployeeFormData>(k: K) =>
        (v: EmployeeFormData[K]) =>
            setData((prev) => ({ ...prev, [k]: v }));

    // Typage des erreurs serveur
    type FormErrs = Partial<Record<keyof EmployeeFormData, string>>;
    const formErrors = errors as unknown as FormErrs;

    // Erreurs locales (front)
    const [localErrors, setLocalErrors] = useState<Partial<Record<string, string>>>({});
    const mergeErrors = useMemo(() => ({ ...formErrors, ...localErrors }), [formErrors, localErrors]);

    const setLocalErr = (key: string, msg: string) => setLocalErrors((prev) => ({ ...prev, [key]: msg }));
    const clearLocalErr = (key: string) =>
        setLocalErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });

    /* ------------ Téléphone (UI) ------------- */
    const [country, setCountry] = useState<Country>(COUNTRIES[0]);
    const expectedLengths: readonly number[] = country.lengths;
    const [nationalNumber, setNationalNumber] = useState<string>('');
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

    /* ------------ Planning (work_schedule) ------------- */
    const [week, setWeek] = useState<WeekConfig>(DEFAULT_WEEK);

    const computedWeeklyHours = useMemo(() => {
        let total = 0;
        (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as DayKey[]).forEach((d) => {
            const cfg = week[d];
            if (!cfg.enabled) return;
            total += timeDiffHours(cfg.start, cfg.end);
        });
        return Math.round(total * 100) / 100;
    }, [week]);

    const setDay = (day: DayKey, patch: Partial<DayConfig>) => {
        setWeek((w) => ({ ...w, [day]: { ...w[day], ...patch } }));
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

    /* ------------ Poste & Contrat : options dynamiques ------------- */
    const contractOptions = useMemo(() => {
        return CONTRACT_OPTIONS_BY_EMPLOYMENT[data.employment_type] ?? [];
    }, [data.employment_type]);

    // Sécurise si une valeur invalide est injectée
    useEffect(() => {
        if (!isContractAllowed(data.employment_type, data.contract_type)) {
            const firstAllowed = CONTRACT_OPTIONS_BY_EMPLOYMENT[data.employment_type]?.[0]?.value;
            set('contract_type')(firstAllowed ?? 'full_time');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.employment_type]);

    // Statut : si actif, on vide departure_date (évite incohérence)
    useEffect(() => {
        if (data.status !== 'inactive' && data.departure_date) {
            set('departure_date')('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.status]);

    /* ------------------------------ Submit ------------------------------- */
    type TabKey = 'profil' | 'poste_contrat' | 'planning' | 'pieces_dates';
    const TAB_ORDER: TabKey[] = ['profil', 'poste_contrat', 'planning', 'pieces_dates'];
    const TAB_LABEL: Record<TabKey, string> = {
        profil: 'Profil',
        poste_contrat: 'Poste & Contrat',
        planning: 'Planning',
        pieces_dates: 'Pièces & Dates',
    };

    const FIELD_META: Record<string, { label: string; tab: TabKey }> = useMemo(
        () => ({
            // Profil
            employee_code: { label: 'Matricule', tab: 'profil' },
            first_name: { label: 'Prénom', tab: 'profil' },
            last_name: { label: 'Nom', tab: 'profil' },
            cin: { label: 'CIN', tab: 'profil' },
            cnss_number: { label: 'CNSS', tab: 'profil' },
            email: { label: 'Email', tab: 'profil' },
            phone_number: { label: 'Téléphone', tab: 'profil' },
            address: { label: 'Adresse', tab: 'profil' },
            date_of_birth: { label: 'Date de naissance', tab: 'profil' },

            // Poste & Contrat
            position: { label: 'Poste', tab: 'poste_contrat' },
            department_id: { label: 'Département', tab: 'poste_contrat' },
            manager_id: { label: 'Manager', tab: 'poste_contrat' },
            is_manager: { label: 'Manager (oui/non)', tab: 'poste_contrat' },
            location: { label: 'Lieu / Site', tab: 'poste_contrat' },
            employment_type: { label: "Type d'emploi", tab: 'poste_contrat' },
            contract_type: { label: 'Type de contrat', tab: 'poste_contrat' },
            salary_gross: { label: 'Salaire brut', tab: 'poste_contrat' },
            salary_currency: { label: 'Devise', tab: 'poste_contrat' },
            pay_frequency: { label: 'Fréquence de paie', tab: 'poste_contrat' },
            hourly_rate: { label: 'Taux horaire', tab: 'poste_contrat' },
            bonus_target: { label: 'Prime / Objectif', tab: 'poste_contrat' },
            benefits: { label: 'Avantages', tab: 'poste_contrat' },
            cost_center: { label: 'Centre de coût', tab: 'poste_contrat' },

            // Planning
            work_schedule: { label: 'Planning', tab: 'planning' },

            // Pièces & Dates
            status: { label: 'Statut', tab: 'pieces_dates' },
            hire_date: { label: "Date d'embauche", tab: 'pieces_dates' },
            departure_date: { label: 'Date de départ', tab: 'pieces_dates' },
            probation_end_date: { label: "Fin de période d'essai", tab: 'pieces_dates' },
            last_review_date: { label: 'Dernière évaluation', tab: 'pieces_dates' },
            notes: { label: 'Notes', tab: 'pieces_dates' },
            photo: { label: 'Photo', tab: 'pieces_dates' },
            cv: { label: 'CV', tab: 'pieces_dates' },
            contract: { label: 'Contrat', tab: 'pieces_dates' },
            emergency_contact_name: { label: 'Contact urgence (nom)', tab: 'pieces_dates' },
            emergency_contact_phone: { label: 'Contact urgence (téléphone)', tab: 'pieces_dates' },
            bank_iban: { label: 'IBAN', tab: 'pieces_dates' },
            bank_rib: { label: 'RIB', tab: 'pieces_dates' },
        }),
        [],
    );

    const tabForField = useCallback(
        (field: string): TabKey => {
            const root =
                String(field ?? '')
                    .split(/[.[\]]/)
                    .filter(Boolean)[0] ?? String(field ?? '');
            return FIELD_META[root]?.tab ?? FIELD_META[field]?.tab ?? 'profil';
        },
        [FIELD_META],
    );

    const labelForField = useCallback(
        (field: string): string => {
            const root =
                String(field ?? '')
                    .split(/[.[\]]/)
                    .filter(Boolean)[0] ?? String(field ?? '');
            return FIELD_META[root]?.label ?? FIELD_META[field]?.label ?? field;
        },
        [FIELD_META],
    );

    const [activeTab, setActiveTab] = useState<TabKey>('profil');

    const escapeSelector = (value: string) => {
        const esc = (window as any)?.CSS?.escape;
        if (typeof esc === 'function') return esc(value);
        return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    };

    const normalizeFieldKey = (field: string) => {
        const parts = String(field ?? '')
            .split(/[.[\]]/)
            .filter(Boolean);
        return parts[0] ?? String(field ?? '');
    };

    const focusField = (field: string) => {
        const root = normalizeFieldKey(field);
        const candidates = [
            `#employee-create-field-${escapeSelector(root)}`,
            `[name="${root}"]`,
            `#employee-create-field-${escapeSelector(field)}`,
            `[name="${field}"]`,
            `[data-field="${root}"]`,
        ];

        let el = null as HTMLElement | null;
        for (const selector of candidates) {
            el = document.querySelector(selector) as HTMLElement | null;
            if (el) break;
        }

        if (!el && root === 'work_schedule') {
            el = document.querySelector('#employee-create-tab-planning input[type="time"]') as HTMLElement | null;
        }

        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        try {
            (el as any).focus?.({ preventScroll: true });
        } catch {
            (el as any).focus?.();
        }
    };

    const goToTab = (tab: TabKey, fieldToFocus?: string) => {
        setActiveTab(tab);
        requestAnimationFrame(() => {
            const el = document.getElementById(`employee-create-tab-${tab}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (fieldToFocus) requestAnimationFrame(() => focusField(fieldToFocus));
        });
    };

    const goToField = (field: string) => {
        const root = normalizeFieldKey(field);
        const tab = FIELD_META[root]?.tab ?? FIELD_META[field]?.tab ?? 'profil';
        goToTab(tab, root);
    };

    const pickTabFromErrorKeys = (keys: string[]): TabKey => {
        for (const tab of TAB_ORDER) {
            if (keys.some((k) => tabForField(k) === tab)) return tab;
        }
        return 'profil';
    };

    const pickFirstFieldKey = (keys: string[]): string | null => {
        if (!keys.length) return null;
        for (const tab of TAB_ORDER) {
            const hit = keys.find((k) => {
                const root = normalizeFieldKey(k);
                return tabForField(root) === tab || tabForField(k) === tab;
            });
            if (hit) return hit;
        }
        return keys[0] ?? null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Reset erreurs locales/serveur
        setLocalErrors({});
        clearErrors();

        // Téléphone
        if (nationalNumber) {
            if (!validatePhone()) return;
            set('phone_number')(fullInternational);
        } else {
            set('phone_number')('');
        }

        // Cohérence Type emploi / Type contrat
        if (!isContractAllowed(data.employment_type, data.contract_type)) {
            const msg = 'Type de contrat incohérent avec le type d’emploi.';
            setLocalErr('contract_type', msg);
            setError({ contract_type: msg });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            goToField('contract_type');
            return;
        }

        // Cohérence dates
        if (data.status === 'inactive' && !data.departure_date) {
            const msg = 'La date de départ est requise si le statut est inactif.';
            setLocalErr('departure_date', msg);
            setError({ departure_date: msg });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            goToField('departure_date');
            return;
        }
        if (data.hire_date && data.departure_date && data.departure_date < data.hire_date) {
            const msg = "La date de départ ne peut pas être antérieure à la date d'embauche.";
            setLocalErr('departure_date', msg);
            setError({ departure_date: msg });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            goToField('departure_date');
            return;
        }

        // Normalisation benefits
        const normBenefits = Array.isArray(data.benefits)
            ? data.benefits
            : String(data.benefits || '')
                  .split(',')
                  .map((t: string) => t.trim())
                  .filter(Boolean);

        transform((d) => ({
            ...d,
            department_id: d.department_id ? Number(d.department_id) : null,
            manager_id: d.manager_id ? Number(d.manager_id) : null,
            work_schedule: { ...week, weekly_hours: computedWeeklyHours },
            benefits: normBenefits,
            salary_currency: (d.salary_currency || 'MAD').toUpperCase(),
            departure_date: d.status === 'inactive' ? d.departure_date : '',
            contract_type: isContractAllowed(d.employment_type, d.contract_type)
                ? d.contract_type
                : (CONTRACT_OPTIONS_BY_EMPLOYMENT[d.employment_type]?.[0]?.value ?? 'full_time'),
        }));

        post(route('employees.store'), {
            forceFormData: true,
            onError: (errs) => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const keys = Object.keys(errs || {});
                const first = pickFirstFieldKey(keys);
                if (first) goToField(first);
                else if (keys.length) goToTab(pickTabFromErrorKeys(keys));
            },
        });
    };

    /* --------------------------------- UI -------------------------------- */
    const errorEntries = useMemo(
        () => Object.entries(mergeErrors).filter(([, m]) => m !== undefined && m !== null && String(m).trim() !== ''),
        [mergeErrors],
    );

    const errorsByTab = useMemo(() => {
        const grouped: Record<TabKey, Array<{ field: string; label: string; message: string }>> = {
            profil: [],
            poste_contrat: [],
            planning: [],
            pieces_dates: [],
        };

        for (const [field, message] of errorEntries) {
            const tab = tabForField(field);
            grouped[tab].push({ field, label: labelForField(field), message: String(message) });
        }

        return grouped;
    }, [errorEntries, labelForField, tabForField]);

    const tabErrorCounts = useMemo(() => {
        const counts: Record<TabKey, number> = {
            profil: errorsByTab.profil.length,
            poste_contrat: errorsByTab.poste_contrat.length,
            planning: errorsByTab.planning.length,
            pieces_dates: errorsByTab.pieces_dates.length,
        };
        return counts;
    }, [errorsByTab]);

    return (
        <>
            <Head title="Nouvel employé" />
            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Employés', href: '/employees' },
                        { title: 'Créer', href: '' },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        <div className="col-span-12">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md md:p-8 dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Nouveau collaborateur</h1>

                                {errorEntries.length > 0 && (
                                    <div
                                        className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                                        role="alert"
                                    >
                                        <div className="font-semibold">Erreur(s) dans le formulaire</div>
                                        <p className="mt-1 text-sm">Cliquez sur une erreur pour aller directement à l’onglet concerné.</p>

                                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {TAB_ORDER.filter((t) => tabErrorCounts[t] > 0).map((tab) => (
                                                <div
                                                    key={tab}
                                                    className="rounded-md border border-red-200/70 bg-white/60 p-3 dark:border-red-800/60 dark:bg-black/10"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-medium">{TAB_LABEL[tab]}</div>
                                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs dark:bg-red-800/30">
                                                            {tabErrorCounts[tab]}
                                                        </span>
                                                    </div>
                                                    <ul className="mt-2 space-y-1.5 text-sm">
                                                        {errorsByTab[tab].map((e) => (
                                                            <li key={e.field}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => goToField(e.field)}
                                                                    className="text-left underline underline-offset-2 hover:opacity-90"
                                                                >
                                                                    <span className="font-medium">{e.label} :</span> {e.message}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
                                        <TabsList className="flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                                            <TabsTrigger
                                                value="profil"
                                                className={tabErrorCounts.profil ? 'border border-red-300 text-red-700 dark:text-red-300' : ''}
                                            >
                                                Profil
                                                {tabErrorCounts.profil ? (
                                                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs dark:bg-red-800/30">
                                                        {tabErrorCounts.profil}
                                                    </span>
                                                ) : null}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="poste_contrat"
                                                className={tabErrorCounts.poste_contrat ? 'border border-red-300 text-red-700 dark:text-red-300' : ''}
                                            >
                                                Poste & Contrat
                                                {tabErrorCounts.poste_contrat ? (
                                                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs dark:bg-red-800/30">
                                                        {tabErrorCounts.poste_contrat}
                                                    </span>
                                                ) : null}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="planning"
                                                className={tabErrorCounts.planning ? 'border border-red-300 text-red-700 dark:text-red-300' : ''}
                                            >
                                                Planning
                                                {tabErrorCounts.planning ? (
                                                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs dark:bg-red-800/30">
                                                        {tabErrorCounts.planning}
                                                    </span>
                                                ) : null}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="pieces_dates"
                                                className={tabErrorCounts.pieces_dates ? 'border border-red-300 text-red-700 dark:text-red-300' : ''}
                                            >
                                                Pièces & Dates
                                                {tabErrorCounts.pieces_dates ? (
                                                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs dark:bg-red-800/30">
                                                        {tabErrorCounts.pieces_dates}
                                                    </span>
                                                ) : null}
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* ============ PROFIL (Identité + Coordonnées) ============ */}
                                        <TabsContent id="employee-create-tab-profil" value="profil" className="space-y-5 pt-4">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Matricule (auto)</label>
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
                                                        onChange={(e) => set('first_name')(e.target.value)}
                                                        id="employee-create-field-first_name"
                                                        name="first_name"
                                                        className={mergeErrors.first_name ? errorInput : baseInput}
                                                        required
                                                        autoComplete="given-name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Users className="mr-1 inline h-4 w-4" /> Nom <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        value={data.last_name}
                                                        onChange={(e) => set('last_name')(e.target.value)}
                                                        id="employee-create-field-last_name"
                                                        name="last_name"
                                                        className={mergeErrors.last_name ? errorInput : baseInput}
                                                        required
                                                        autoComplete="family-name"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                <div className="md:col-span-1">
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <CreditCard className="mr-1 inline h-4 w-4" /> CNSS
                                                    </label>
                                                    <Input
                                                        inputMode="numeric"
                                                        maxLength={13}
                                                        value={data.cnss_number}
                                                        onChange={(e) => set('cnss_number')(onlyDigits(e.target.value).slice(0, 13))}
                                                        id="employee-create-field-cnss_number"
                                                        name="cnss_number"
                                                        className={mergeErrors.cnss_number ? errorInput : baseInput}
                                                    />
                                                    <p className="mt-1 text-xs text-slate-500">Max 13 chiffres.</p>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <IdCard className="mr-1 inline h-4 w-4" /> CIN <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        maxLength={10}
                                                        value={data.cin}
                                                        onChange={(e) => set('cin')(e.target.value.replace(/\s+/g, '').toUpperCase().slice(0, 10))}
                                                        id="employee-create-field-cin"
                                                        name="cin"
                                                        className={mergeErrors.cin ? errorInput : baseInput}
                                                        required
                                                        autoComplete="off"
                                                    />
                                                    <p className="mt-1 text-xs text-slate-500">10 caractères, majuscules.</p>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="mb-1 block text-sm font-medium">RIB (24 chiffres)</label>
                                                    <Input
                                                        inputMode="numeric"
                                                        maxLength={24}
                                                        value={data.bank_rib}
                                                        onChange={(e) => set('bank_rib')(onlyDigits(e.target.value).slice(0, 24))}
                                                        id="employee-create-field-bank_rib"
                                                        name="bank_rib"
                                                        placeholder="24 chiffres"
                                                        className={mergeErrors.bank_rib ? errorInput : baseInput}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="mb-1 block text-sm font-medium">
                                                        Date de naissance <span className="text-red-500">*</span>
                                                    </label>
                                                    <DateInput
                                                        value={data.date_of_birth}
                                                        onChange={(v) => set('date_of_birth')(v)}
                                                        id="employee-create-field-date_of_birth"
                                                        name="date_of_birth"
                                                        className={mergeErrors.date_of_birth ? errorInput : baseInput}
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
                                                        onChange={(e) => set('email')(e.target.value.trim())}
                                                        id="employee-create-field-email"
                                                        name="email"
                                                        className={mergeErrors.email ? errorInput : baseInput}
                                                        required
                                                        autoComplete="email"
                                                    />
                                                </div>

                                                {/* Téléphone : drapeau + indicatif + input national */}
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
                                                                    id="employee-create-field-phone_number"
                                                                    name="phone_number"
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
                                                        {mergeErrors.phone_number && (
                                                            <p className="mt-1 text-sm text-red-600">{String(mergeErrors.phone_number)}</p>
                                                        )}
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
                                                    onChange={(e) => set('address')(e.target.value)}
                                                    id="employee-create-field-address"
                                                    name="address"
                                                    className={mergeErrors.address ? errorInput : baseInput}
                                                    autoComplete="street-address"
                                                />
                                            </div>
                                        </TabsContent>

                                        {/* ======= POSTE & CONTRAT ======= */}
                                        <TabsContent id="employee-create-tab-poste_contrat" value="poste_contrat" className="space-y-6 pt-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Briefcase className="mr-1 inline h-4 w-4" /> Poste <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        value={data.position}
                                                        onChange={(e) => set('position')(e.target.value)}
                                                        id="employee-create-field-position"
                                                        name="position"
                                                        className={mergeErrors.position ? errorInput : baseInput}
                                                        required
                                                        autoComplete="organization-title"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Building2 className="mr-1 inline h-4 w-4" /> Département
                                                    </label>

                                                    {departments && departments.length > 0 ? (
                                                        <Select value={data.department_id} onValueChange={(v: string) => set('department_id')(v)}>
                                                            <SelectTrigger
                                                                id="employee-create-field-department_id"
                                                                className={mergeErrors.department_id ? errorInput : baseInput}
                                                            >
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

                                                    {mergeErrors.department_id && (
                                                        <p className="mt-1 text-sm text-red-600">{String(mergeErrors.department_id)}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {/* Manager */}
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <UserCircle2 className="mr-1 inline h-4 w-4" /> Manager (Nom + Prénom)
                                                    </label>
                                                    <Select
                                                        value={data.manager_id || 'none'}
                                                        onValueChange={(v: string) => set('manager_id')(v === 'none' ? '' : v)}
                                                    >
                                                        <SelectTrigger id="employee-create-field-manager_id" className={baseInput}>
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
                                                        onChange={(e) => set('location')(e.target.value)}
                                                        id="employee-create-field-location"
                                                        name="location"
                                                        className={baseInput}
                                                        placeholder="(ex) Casablanca - Siège"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-white/5">
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        id="employee-create-field-is_manager"
                                                        checked={data.is_manager}
                                                        onCheckedChange={(c) => set('is_manager')(Boolean(c))}
                                                    />
                                                    <div className="leading-tight">
                                                        <label
                                                            htmlFor="employee-create-field-is_manager"
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
                                                {mergeErrors.is_manager && (
                                                    <p className="mt-2 text-sm text-red-600">{String(mergeErrors.is_manager)}</p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Banknote className="mr-1 inline h-4 w-4" /> Salaire brut
                                                        <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.salary_gross}
                                                        onChange={(e) => set('salary_gross')(e.target.value)}
                                                        id="employee-create-field-salary_gross"
                                                        name="salary_gross"
                                                        className={mergeErrors.salary_gross ? errorInput : baseInput}
                                                        placeholder="0.00"
                                                        inputMode="decimal"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Devise</label>
                                                    <Select value={data.salary_currency} onValueChange={(v: string) => set('salary_currency')(v)}>
                                                        <SelectTrigger
                                                            id="employee-create-field-salary_currency"
                                                            className={mergeErrors.salary_currency ? errorInput : baseInput}
                                                        >
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
                                                        onValueChange={(v: string) => set('pay_frequency')(v as PayFrequency)}
                                                    >
                                                        <SelectTrigger
                                                            id="employee-create-field-pay_frequency"
                                                            className={mergeErrors.pay_frequency ? errorInput : baseInput}
                                                        >
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
                                                        onValueChange={(v: string) => {
                                                            const nextEmployment = v as EmploymentType;
                                                            set('employment_type')(nextEmployment);

                                                            if (!isContractAllowed(nextEmployment, data.contract_type)) {
                                                                const firstAllowed = CONTRACT_OPTIONS_BY_EMPLOYMENT[nextEmployment]?.[0]?.value;
                                                                set('contract_type')(firstAllowed ?? 'full_time');
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger
                                                            id="employee-create-field-employment_type"
                                                            className={mergeErrors.employment_type ? errorInput : baseInput}
                                                        >
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
                                                        onValueChange={(v: string) => set('contract_type')(v as ContractType)}
                                                    >
                                                        <SelectTrigger
                                                            id="employee-create-field-contract_type"
                                                            className={
                                                                mergeErrors.contract_type || localErrors.contract_type ? errorInput : baseInput
                                                            }
                                                        >
                                                            <SelectValue placeholder="Type de contrat" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {contractOptions.map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    {(localErrors.contract_type || mergeErrors.contract_type) && (
                                                        <p className="mt-1 text-sm text-red-600">
                                                            {String(localErrors.contract_type || mergeErrors.contract_type)}
                                                        </p>
                                                    )}

                                                    {data.employment_type === 'contractor' &&
                                                        !(localErrors.contract_type || mergeErrors.contract_type) && (
                                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                Prestataire : le contrat est forcément en mode freelance / prestation.
                                                            </p>
                                                        )}
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* ================= PLANNING ================= */}
                                        <TabsContent id="employee-create-tab-planning" value="planning" className="space-y-4 pt-4">
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
                                                                            name={`work_schedule.${day}.start`}
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
                                                                            name={`work_schedule.${day}.end`}
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

                                        {/* ================= PIÈCES & DATES ================= */}
                                        <TabsContent id="employee-create-tab-pieces_dates" value="pieces_dates" className="space-y-6 pt-4">
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <ImageIcon className="mr-1 inline h-4 w-4" /> Photo (image)
                                                    </label>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        id="employee-create-field-photo"
                                                        name="photo"
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0] ?? null;
                                                            clearLocalErr('photo');
                                                            if (!f) return set('photo')(null);
                                                            const check = isValidFile(f, 'image');
                                                            if (!check.ok) {
                                                                setLocalErr('photo', check.msg);
                                                                set('photo')(null);
                                                                e.currentTarget.value = '';
                                                                return;
                                                            }
                                                            set('photo')(f);
                                                        }}
                                                        className={mergeErrors.photo || localErrors.photo ? errorInput : baseInput}
                                                    />
                                                    {(localErrors.photo || mergeErrors.photo) && (
                                                        <p className="mt-1 text-sm text-red-600">{String(localErrors.photo || mergeErrors.photo)}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <FileText className="mr-1 inline h-4 w-4" /> CV (PDF/DOC)
                                                    </label>
                                                    <Input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,.odt"
                                                        id="employee-create-field-cv"
                                                        name="cv"
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0] ?? null;
                                                            clearLocalErr('cv');
                                                            if (!f) return set('cv')(null);
                                                            const check = isValidFile(f, 'doc');
                                                            if (!check.ok) {
                                                                setLocalErr('cv', check.msg);
                                                                set('cv')(null);
                                                                e.currentTarget.value = '';
                                                                return;
                                                            }
                                                            set('cv')(f);
                                                        }}
                                                        className={mergeErrors.cv || localErrors.cv ? errorInput : baseInput}
                                                    />
                                                    {(localErrors.cv || mergeErrors.cv) && (
                                                        <p className="mt-1 text-sm text-red-600">{String(localErrors.cv || mergeErrors.cv)}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        <Paperclip className="mr-1 inline h-4 w-4" /> Contrat (PDF/DOC)
                                                    </label>
                                                    <Input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,.odt"
                                                        id="employee-create-field-contract"
                                                        name="contract"
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0] ?? null;
                                                            clearLocalErr('contract');
                                                            if (!f) return set('contract')(null);
                                                            const check = isValidFile(f, 'doc');
                                                            if (!check.ok) {
                                                                setLocalErr('contract', check.msg);
                                                                set('contract')(null);
                                                                e.currentTarget.value = '';
                                                                return;
                                                            }
                                                            set('contract')(f);
                                                        }}
                                                        className={mergeErrors.contract || localErrors.contract ? errorInput : baseInput}
                                                    />
                                                    {(localErrors.contract || mergeErrors.contract) && (
                                                        <p className="mt-1 text-sm text-red-600">
                                                            {String(localErrors.contract || mergeErrors.contract)}
                                                        </p>
                                                    )}
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
                                                        onChange={(v) => set('hire_date')(v)}
                                                        id="employee-create-field-hire_date"
                                                        name="hire_date"
                                                        className={mergeErrors.hire_date ? errorInput : baseInput}
                                                    />
                                                    {mergeErrors.hire_date && (
                                                        <p className="mt-1 text-sm text-red-600">{String(mergeErrors.hire_date)}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        Statut <span className="text-red-500">*</span>
                                                    </label>
                                                    <Select value={data.status} onValueChange={(v: string) => set('status')(v as EmployeeStatus)}>
                                                        <SelectTrigger
                                                            id="employee-create-field-status"
                                                            className={mergeErrors.status ? errorInput : baseInput}
                                                        >
                                                            <SelectValue placeholder="Statut" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Actif</SelectItem>
                                                            <SelectItem value="inactive">Inactif</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {mergeErrors.status && <p className="mt-1 text-sm text-red-600">{String(mergeErrors.status)}</p>}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Date de départ (si inactif)</label>
                                                    <DateInput
                                                        type="date"
                                                        value={data.departure_date}
                                                        onChange={(v) => set('departure_date')(v)}
                                                        id="employee-create-field-departure_date"
                                                        name="departure_date"
                                                        className={mergeErrors.departure_date || localErrors.departure_date ? errorInput : baseInput}
                                                        disabled={data.status !== 'inactive'}
                                                    />
                                                    {(localErrors.departure_date || mergeErrors.departure_date) && (
                                                        <p className="mt-1 text-sm text-red-600">
                                                            {String(localErrors.departure_date || mergeErrors.departure_date)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Fin de période d’essai</label>
                                                    <DateInput
                                                        type="date"
                                                        value={data.probation_end_date}
                                                        onChange={(v) => set('probation_end_date')(v)}
                                                        id="employee-create-field-probation_end_date"
                                                        name="probation_end_date"
                                                        className={baseInput}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Dernière évaluation</label>
                                                    <DateInput
                                                        type="date"
                                                        value={data.last_review_date}
                                                        onChange={(v) => set('last_review_date')(v)}
                                                        id="employee-create-field-last_review_date"
                                                        name="last_review_date"
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
                                                        onChange={(e) => set('hourly_rate')(e.target.value)}
                                                        id="employee-create-field-hourly_rate"
                                                        name="hourly_rate"
                                                        className={baseInput}
                                                        inputMode="decimal"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Prime cible (annuelle)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.bonus_target}
                                                        onChange={(e) => set('bonus_target')(e.target.value)}
                                                        id="employee-create-field-bonus_target"
                                                        name="bonus_target"
                                                        className={baseInput}
                                                        inputMode="decimal"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Avantages (séparés par des virgules)</label>
                                                    <Input
                                                        placeholder="Mutuelle, Titres resto, Transport…"
                                                        value={Array.isArray(data.benefits) ? data.benefits.join(', ') : data.benefits || ''}
                                                        onChange={(e) => set('benefits')(e.target.value)}
                                                        id="employee-create-field-benefits"
                                                        name="benefits"
                                                        className={baseInput}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Centre de coût</label>
                                                    <Input
                                                        value={data.cost_center}
                                                        onChange={(e) => set('cost_center')(e.target.value)}
                                                        id="employee-create-field-cost_center"
                                                        name="cost_center"
                                                        className={baseInput}
                                                        placeholder="(ex) CC-001"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Contact urgence – Nom</label>
                                                    <Input
                                                        value={data.emergency_contact_name}
                                                        onChange={(e) => set('emergency_contact_name')(e.target.value)}
                                                        id="employee-create-field-emergency_contact_name"
                                                        name="emergency_contact_name"
                                                        className={baseInput}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Contact urgence – Téléphone</label>
                                                    <Input
                                                        value={data.emergency_contact_phone}
                                                        onChange={(e) => set('emergency_contact_phone')(e.target.value)}
                                                        id="employee-create-field-emergency_contact_phone"
                                                        name="emergency_contact_phone"
                                                        className={baseInput}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">IBAN</label>
                                                    <Input
                                                        value={data.bank_iban}
                                                        onChange={(e) => set('bank_iban')(e.target.value.replace(/\s+/g, '').toUpperCase())}
                                                        id="employee-create-field-bank_iban"
                                                        name="bank_iban"
                                                        className={baseInput}
                                                        placeholder="IBAN"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Notes (interne)</label>
                                                    <Textarea
                                                        rows={4}
                                                        value={data.notes ?? ''}
                                                        onChange={(e) => set('notes')(e.target.value)}
                                                        id="employee-create-field-notes"
                                                        name="notes"
                                                        className={baseInput}
                                                        placeholder="Commentaires internes, ex: fin période d'essai, remarques RH, ..."
                                                    />
                                                    <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                                        <AlertCircle className="mt-0.5 h-4 w-4" />
                                                        <p className="text-sm">
                                                            Les pièces jointes sont facultatives — vous pourrez les ajouter plus tard.
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
                                            onClick={() => window.history.back()}
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
                                                <Plus className="mr-2 h-4 w-4" />
                                            )}
                                            {processing ? 'Création…' : 'Créer l’employé'}
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
