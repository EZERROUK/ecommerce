import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Building2, FileText, Info, User } from 'lucide-react';
import React, { useMemo } from 'react';
import { route } from 'ziggy-js';

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
}

interface Department {
    id: number;
    name: string;
    description: string | null;
    department_head: number | null;
}

/**
 * ⚠️ Renommé pour éviter le conflit avec FormData (browser)
 */
type DeptFormData = {
    name: string;
    description: string;
    department_head: string;
};

interface Props {
    department: Department;
    employees?: Employee[];
}

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */
const DESCRIPTION_MAX_LENGTH = 255;

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */
export default function EditDepartment({ department, employees = [] }: Props) {
    const { data, setData, patch, errors, clearErrors, processing } = useForm<DeptFormData>({
        name: department.name ?? '',
        description: department.description ?? '',
        department_head: department.department_head ? String(department.department_head) : '',
    });

    const handleChange = (field: keyof DeptFormData, value: string) => {
        setData(field, value);
        if (errors[field]) {
            clearErrors(field);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        patch(route('departments.update', department.id), {
            preserveScroll: true,
        });
    };

    const currentHeadLabel = useMemo(() => {
        if (!data.department_head) return 'Non assigné';
        const found = employees.find((e) => String(e.id) === data.department_head);
        return found ? `${found.first_name} ${found.last_name}` : 'Non assigné';
    }, [data.department_head, employees]);

    return (
        <>
            <Head title={`Modifier — ${department.name}`} />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Départements', href: '/departments' },
                    { title: department.name, href: route('departments.edit', department.id) },
                    { title: 'Éditer', href: route('departments.edit', department.id) },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 p-6">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Modifier le département</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Mettez à jour les informations de « {department.name} »</p>
                        </div>

                        <div className="grid grid-cols-12 gap-6">
                            {/* FORM */}
                            <div className="col-span-12 lg:col-span-8 xl:col-span-7">
                                <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Informations du département</h2>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* NAME */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <Building2 className="mr-1 inline h-4 w-4" />
                                                Nom du département <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                required
                                                placeholder="Ex: Ressources Humaines, Marketing, IT..."
                                                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                            />
                                            {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                                        </div>

                                        {/* DESCRIPTION */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <FileText className="mr-1 inline h-4 w-4" />
                                                Description
                                            </label>
                                            <textarea
                                                value={data.description}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value.length <= DESCRIPTION_MAX_LENGTH) {
                                                        handleChange('description', value);
                                                    }
                                                }}
                                                rows={4}
                                                maxLength={DESCRIPTION_MAX_LENGTH}
                                                placeholder="Décrivez le rôle et les responsabilités de ce département..."
                                                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                            />

                                            <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span>
                                                    {data.description.length} / {DESCRIPTION_MAX_LENGTH} caractères
                                                </span>
                                                {data.description.length === DESCRIPTION_MAX_LENGTH && (
                                                    <span className="text-amber-600 dark:text-amber-400">Limite atteinte</span>
                                                )}
                                            </div>

                                            {errors.description && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                                            )}
                                        </div>

                                        {/* DEPARTMENT HEAD */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <User className="mr-1 inline h-4 w-4" />
                                                Chef de département
                                            </label>
                                            <select
                                                value={data.department_head}
                                                onChange={(e) => handleChange('department_head', e.target.value)}
                                                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value="">— Aucun / Non assigné —</option>
                                                {employees.map((emp) => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.first_name} {emp.last_name}
                                                    </option>
                                                ))}
                                            </select>

                                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                                Actuellement : <span className="font-medium">{currentHeadLabel}</span>
                                            </div>

                                            {errors.department_head && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department_head}</p>
                                            )}
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex justify-between pt-4">
                                            <Button type="button" variant="secondary" onClick={() => router.visit(route('departments.index'))}>
                                                Annuler
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-600"
                                            >
                                                {processing ? 'Enregistrement…' : 'Enregistrer les modifications'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* INFO PANEL */}
                            <div className="col-span-12 lg:col-span-4 xl:col-span-5">
                                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />À propos des départements
                                    </h2>
                                    <div className="space-y-3 text-justify text-sm text-slate-700 dark:text-slate-300">
                                        <p>Les départements permettent d'organiser votre entreprise en unités fonctionnelles distinctes.</p>
                                        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                            <div className="space-y-2">
                                                <p className="font-medium">Rappels :</p>
                                                <ul className="list-inside list-disc space-y-1 text-xs">
                                                    <li>Mettez à jour le nom et la description</li>
                                                    <li>Assignez (ou retirez) un chef de département</li>
                                                    <li>Les modifications sont instantanées après sauvegarde</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                                            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                            <p className="text-xs">Choisir « — Aucun / Non assigné — » désassigne le chef de ce département.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* END INFO PANEL */}
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
