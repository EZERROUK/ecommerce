import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Building2, FileText, Info, User } from 'lucide-react';
import React, { useState } from 'react';
import { route } from 'ziggy-js';

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
}

interface DepartmentFormData {
    name: string;
    description: string;
    department_head: string;
}

interface Props {
    employees?: Employee[];
}

const DESCRIPTION_MAX = 255;

export default function CreateDepartment({ employees = [] }: Props) {
    const [formData, setFormData] = useState<DepartmentFormData>({
        name: '',
        description: '',
        department_head: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof DepartmentFormData, string>>>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (field: keyof DepartmentFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post(route('departments.store'), formData as Record<string, any>, {
            onError: (errs) => {
                setErrors(errs as Partial<Record<keyof DepartmentFormData, string>>);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title="Nouveau département" />

            <AppLayout
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Départements', href: '/departments' },
                    { title: 'Nouveau', href: '/departments/create' },
                ]}
            >
                <div className="relative">
                    <ParticlesBackground />

                    <div className="relative z-10 p-6">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nouveau département</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Créer un nouveau département dans votre organisation</p>
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
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                required
                                                placeholder="Ex : Ressources Humaines, Marketing, IT..."
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
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                rows={4}
                                                maxLength={DESCRIPTION_MAX}
                                                placeholder="Décrivez le rôle et les responsabilités de ce département..."
                                                className="w-full resize-none rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                            />

                                            {/* COUNTER — collé au textarea */}
                                            <div className="mt-1 flex justify-between text-xs">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {formData.description.length} / {DESCRIPTION_MAX} caractères
                                                </span>
                                                {formData.description.length === DESCRIPTION_MAX && (
                                                    <span className="text-red-500">Limite atteinte</span>
                                                )}
                                            </div>

                                            {errors.description && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                                            )}
                                        </div>

                                        {/* HEAD */}
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <User className="mr-1 inline h-4 w-4" />
                                                Chef de département
                                            </label>
                                            <select
                                                value={formData.department_head}
                                                onChange={(e) => handleChange('department_head', e.target.value)}
                                                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-red-500 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                            >
                                                <option value="">Sélectionner un chef de département</option>
                                                {employees.map((emp) => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.first_name} {emp.last_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Vous pouvez assigner un chef de département maintenant ou plus tard
                                            </p>
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
                                                {processing ? 'Création…' : 'Créer le département'}
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
                                            <ul className="list-inside list-disc space-y-1 text-xs">
                                                <li>Organisation par département</li>
                                                <li>Assignation d’un responsable</li>
                                                <li>Suivi des effectifs</li>
                                                <li>Gestion hiérarchique facilitée</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* END INFO */}
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
