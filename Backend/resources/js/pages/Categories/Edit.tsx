import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    CornerDownRight,
    Image as ImageIcon,
    ImageOff,
    Save,
    Hash as SlugIcon,
    Tag as TagIcon,
    Type as TypeIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type ParentOption = { id: number; name: string; full_name?: string; level?: number };

type PageProps = {
    category: {
        id: number | string;
        name: string;
        slug: string | null;
        description?: string | null;
        parent_id?: number | null;
        icon?: string | null;
        image_url?: string | null;
        image_path?: string | null;
        is_active: boolean;
        sort_order?: number;
        meta_title?: string | null;
        meta_description?: string | null;
        created_at?: string;
        updated_at?: string;
    };
    availableParents: ParentOption[];
    errors: Record<string, string>;
    error?: string;
};

export default function EditCategory() {
    const page = usePage<PageProps>();
    const cat = page.props.category;

    const [hasParent, setHasParent] = useState<boolean>(!!cat.parent_id);
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, processing, errors } = useForm({
        name: cat.name ?? '',
        slug: cat.slug ?? '',
        parent_id: cat.parent_id ? String(cat.parent_id) : '',
        icon: cat.icon ?? '',
        image: null as File | null,
        remove_image: false as boolean,
        description: cat.description ?? '',
        is_active: !!cat.is_active,
        sort_order: cat.sort_order ?? 0,
        meta_title: cat.meta_title ?? '',
        meta_description: cat.meta_description ?? '',
    });

    const [slugEdited, setSlugEdited] = useState(!!cat.slug);

    useEffect(() => {
        if (data.image instanceof File) {
            const url = URL.createObjectURL(data.image);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreview(null);
    }, [data.image]);

    useEffect(() => {
        if (!slugEdited && data.name) setData('slug', slugify(data.name));
    }, [data.name, slugEdited, setData]);

    useEffect(() => {
        if (!hasParent) setData('parent_id', '');
    }, [hasParent, setData]);

    const parentOptions = useMemo(() => {
        const base = [{ value: '', label: '— Choisir un parent —' }];
        const opts = (page.props.availableParents ?? []).map((c) => {
            const lvl = Number.isFinite(c.level as number) ? (c.level as number) : 0;
            const indent = '— '.repeat(Math.max(0, lvl));
            return { value: String(c.id), label: `${indent}${c.name}` };
        });
        return [...base, ...opts];
    }, [page.props.availableParents]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            ...data,
            name: (data.name || '').trim(),
            slug: (data.slug || slugify(data.name || '')).trim(),
            parent_id: hasParent && data.parent_id ? Number(data.parent_id) : null,
            is_active: !!data.is_active,
            sort_order: Number(data.sort_order) || 0,
            meta_title: data.meta_title || null,
            meta_description: data.meta_description || null,
            remove_image: !!data.remove_image,
            _method: 'PATCH',
        };

        const url = route('categories.update', cat.id);

        router.post(url, payload, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onError: (errs) => console.error('Échec de la mise à jour :', errs),
            onSuccess: () => console.log('Mise à jour réussie'),
        });
    };

    const pageErrors = errors || {};
    const serverError = page.props.error;

    return (
        <>
            <Head title={`Modifier – ${cat.name}`} />
            <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Catégories', href: '/categories' },
                        { title: cat.name, href: route('categories.show', cat.id) },
                        { title: 'Modifier', href: route('categories.edit', cat.id) },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* Formulaire */}
                        <div className="col-span-12 lg:col-span-8 xl:col-span-8">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Modifier la catégorie</h1>

                                {(Object.keys(pageErrors).length > 0 || serverError) && (
                                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                        {serverError && <div className="mb-2 font-medium">{serverError}</div>}
                                        {Object.entries(pageErrors).map(([k, v]) => (
                                            <div key={k} className="mb-1">
                                                <strong>{k}:</strong> {String(v)}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Field
                                        id="name"
                                        label="Nom"
                                        Icon={TagIcon}
                                        value={data.name}
                                        onChange={(v) => {
                                            setData('name', v);
                                            if (v === '') setSlugEdited(false);
                                        }}
                                        error={errors.name}
                                        required
                                    />

                                    <Field
                                        id="slug"
                                        label="Slug (URL)"
                                        Icon={SlugIcon}
                                        value={data.slug}
                                        onChange={(v) => {
                                            setData('slug', v);
                                            setSlugEdited(true);
                                        }}
                                        error={errors.slug}
                                    />

                                    <ToggleRow id="has_parent" label="Cette catégorie a un parent" checked={hasParent} onChange={setHasParent} />
                                    {hasParent && (
                                        <FieldSelect
                                            id="parent_id"
                                            label="Catégorie parente"
                                            value={data.parent_id}
                                            onChange={(v) => setData('parent_id', v)}
                                            options={parentOptions}
                                            error={errors.parent_id}
                                            icon={<CornerDownRight className="h-4 w-4" />}
                                        />
                                    )}

                                    <Field
                                        id="icon"
                                        label="Icône (facultatif)"
                                        Icon={TypeIcon}
                                        value={data.icon}
                                        onChange={(v) => setData('icon', v)}
                                        error={errors.icon}
                                        required={false}
                                    />

                                    {/* Image existante + upload + suppression */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FileField
                                            id="image"
                                            label="Remplacer l'image"
                                            Icon={ImageIcon}
                                            onChange={(file) => {
                                                setData('image', file);
                                                if (file) setData('remove_image', false);
                                            }}
                                            previewUrl={preview}
                                            error={errors.image}
                                        />
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Image actuelle
                                            </label>
                                            <div className="flex items-center gap-3">
                                                {cat.image_url ? (
                                                    <img
                                                        src={cat.image_url}
                                                        alt="current"
                                                        className="h-24 rounded-md border border-slate-300 object-cover dark:border-slate-700"
                                                    />
                                                ) : (
                                                    <div className="grid h-24 w-24 place-items-center rounded-md border text-slate-400">
                                                        <ImageOff className="h-6 w-6" />
                                                    </div>
                                                )}
                                                {cat.image_url && (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            id="remove_image"
                                                            name="remove_image"
                                                            type="checkbox"
                                                            checked={!!data.remove_image}
                                                            onChange={(e) => {
                                                                setData('remove_image', e.target.checked);
                                                                if (e.target.checked) setData('image', null);
                                                            }}
                                                            className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                                        />
                                                        <label htmlFor="remove_image" className="text-sm text-slate-700 dark:text-slate-300">
                                                            Supprimer l'image
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Textarea
                                        id="description"
                                        label="Description"
                                        value={data.description}
                                        onChange={(v) => setData('description', v)}
                                        error={errors.description}
                                    />

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <ToggleRow
                                            id="is_active"
                                            label="Activer la catégorie"
                                            checked={!!data.is_active}
                                            onChange={(v) => setData('is_active', v)}
                                        />
                                        <NumberField
                                            id="sort_order"
                                            label="Ordre d'affichage"
                                            value={Number(data.sort_order ?? 0)}
                                            onChange={(v) => setData('sort_order', v)}
                                            error={errors.sort_order}
                                        />
                                    </div>

                                    {/* SEO */}
                                    <Field
                                        id="meta_title"
                                        label="Meta Title (SEO)"
                                        Icon={TagIcon}
                                        value={data.meta_title}
                                        onChange={(v) => setData('meta_title', v)}
                                        error={errors.meta_title}
                                        required={false}
                                    />
                                    <Textarea
                                        id="meta_description"
                                        label="Meta Description (SEO)"
                                        value={data.meta_description}
                                        onChange={(v) => setData('meta_description', v)}
                                        error={errors.meta_description}
                                    />

                                    {/* Actions */}
                                    <div className="flex justify-between pt-4">
                                        <Link href={route('categories.show', cat.id)}>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="bg-muted hover:bg-muted/80 text-slate-700 dark:text-slate-300"
                                            >
                                                <ArrowLeft className="mr-2 h-4 w-4" /> Annuler
                                            </Button>
                                        </Link>

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
                                            {processing ? 'Enregistrement…' : 'Enregistrer'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Aide */}
                        <div className="col-span-12 lg:col-span-4 xl:col-span-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Aide</h2>
                                <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                                    Modifie les informations de base de la catégorie. Utilise l'ordre d'affichage pour prioriser l'apparition de la
                                    catégorie dans les listes.
                                </p>

                                {/* Lien vers les attributs */}
                                <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                                    <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-white">Gestion des attributs</h3>
                                    <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                                        Pour modifier les attributs de cette catégorie, utilisez l'éditeur dédié.
                                    </p>
                                    <Link href={route('categories.attributes.edit', cat.id)}>
                                        <Button variant="outline" size="sm" className="w-full">
                                            Gérer les attributs
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </div>
        </>
    );
}

/* ===== Composants de base ===== */
interface FieldProps {
    id: string;
    label: string;
    Icon?: any;
    type?: React.HTMLInputTypeAttribute;
    required?: boolean;
    value: string;
    onChange: (v: string) => void;
    autoComplete?: string;
    error?: string | false;
}

function Field({ id, label, Icon, type = 'text', required = true, value, onChange, autoComplete, error }: FieldProps) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {Icon ? <Icon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" /> : null}
                <input
                    id={id}
                    name={id}
                    type={type}
                    required={required}
                    value={value}
                    autoComplete={autoComplete}
                    onChange={(e) => onChange(e.target.value)}
                    className={`block w-full rounded-lg border py-3 ${Icon ? 'pl-10' : 'pl-3'} bg-white pr-3 dark:bg-slate-800 ${error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'} focus:border-red-500 focus:ring-1 focus:ring-red-500`}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

function NumberField({
    id,
    label,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
    value: number;
    onChange: (v: number) => void;
    error?: string | false;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <input
                id={id}
                name={id}
                type="number"
                value={Number.isFinite(value) ? value : 0}
                onChange={(e) => onChange(parseInt(e.target.value || '0', 10))}
                className={`block w-full rounded-lg border bg-white px-3 py-3 dark:bg-slate-800 ${error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'} focus:border-red-500 focus:ring-1 focus:ring-red-500`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

function Textarea({
    id,
    label,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string | false;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <textarea
                id={id}
                name={id}
                rows={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`block w-full rounded-lg border bg-white px-3 py-3 dark:bg-slate-800 ${error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'} focus:border-red-500 focus:ring-1 focus:ring-red-500`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

function FileField({
    id,
    label,
    Icon,
    onChange,
    previewUrl,
    error,
}: {
    id: string;
    label: string;
    Icon?: any;
    onChange: (f: File | null) => void;
    previewUrl: string | null;
    error?: string | false;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <div className="relative">
                {Icon ? <Icon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" /> : null}
                <input
                    id={id}
                    name={id}
                    type="file"
                    accept="image/*"
                    onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                    className={`block w-full rounded-lg border py-3 ${Icon ? 'pl-10' : 'pl-3'} bg-white pr-3 dark:bg-slate-800 ${error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'} focus:border-red-500 focus:ring-1 focus:ring-red-500`}
                />
            </div>
            {previewUrl && (
                <div className="mt-3">
                    <img src={previewUrl} alt="preview" className="h-24 rounded-md border border-slate-300 object-cover dark:border-slate-700" />
                </div>
            )}
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

function FieldSelect({
    id,
    label,
    value,
    onChange,
    options,
    error,
    icon,
}: {
    id: string;
    label: string;
    value: string | number;
    onChange: (v: any) => void;
    options: { value: string | number; label: string }[];
    error?: string | false;
    icon?: React.ReactNode;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <div className="relative">
                {icon ? <div className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">{icon}</div> : null}
                <select
                    id={id}
                    name={id}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`block w-full rounded-lg border py-3 ${icon ? 'pl-10' : 'pl-3'} appearance-none bg-white pr-10 dark:bg-slate-800 ${error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'} focus:border-red-500 focus:ring-1 focus:ring-red-500`}
                >
                    {options.map((opt) => (
                        <option key={`${id}-${opt.value}`} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}

function ToggleRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center gap-3">
            <input
                id={id}
                name={id}
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor={id} className="text-sm text-slate-700 select-none dark:text-slate-300">
                {label}
            </label>
        </div>
    );
}

function slugify(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
