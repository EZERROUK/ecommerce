import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    Eye,
    EyeOff,
    GripVertical,
    Hash as HashIcon,
    ListChecks,
    PlusCircle,
    Save,
    Settings,
    Tag as TagIcon,
    Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

type Option = { id?: number; label: string; value?: string; color?: string; is_active?: boolean; sort_order?: number };
type Rule = { rule: string; value?: string | number };
type Attr = {
    id?: number;
    name: string;
    slug?: string;
    type: string;
    unit?: string;
    is_required?: boolean;
    is_filterable?: boolean;
    is_searchable?: boolean;
    show_in_listing?: boolean;
    is_active?: boolean;
    sort_order?: number;
    description?: string;
    default_value?: string;
    options?: Option[];
    validation_rules?: Rule[] | Record<string, any>;
};

type PageProps = {
    category: { id: number | string; name: string };
    attributes: Attr[];
    errors: Record<string, string>;
    success?: string;
};

export default function EditAttributes() {
    const page = usePage<PageProps>();
    const { category, attributes } = page.props;

    const { data, setData, post, processing, errors, clearErrors, transform } = useForm<{ attributes: Attr[] }>({
        attributes: (attributes ?? []).map((a, i) => ({
            ...a,
            sort_order: Number.isFinite(a.sort_order as number) ? (a.sort_order as number) : i,
            options: Array.isArray(a.options) ? a.options : [],
            validation_rules: Array.isArray(a.validation_rules)
                ? a.validation_rules
                : a.validation_rules && typeof a.validation_rules === 'object'
                  ? Object.entries(a.validation_rules).map(([rule, value]) => ({ rule, value }))
                  : [],
        })),
    });

    const toBackend = (rows: Attr[]) =>
        rows.map((a, idx) => ({
            id: a.id,
            name: (a.name || '').trim(),
            slug: (a.slug || slugify(a.name || '')).trim(),
            type: a.type,
            unit: a.unit || null,
            description: a.description || null,
            default_value: a.default_value || null,
            is_required: !!a.is_required,
            is_filterable: !!a.is_filterable,
            is_searchable: !!a.is_searchable,
            show_in_listing: !!a.show_in_listing,
            is_active: a.is_active !== false,
            sort_order: Number.isFinite(a.sort_order as number) ? (a.sort_order as number) : idx,
            validation_rules: (Array.isArray(a.validation_rules) ? a.validation_rules : []).reduce((acc: any, r: any) => {
                if (!r?.rule) return acc;
                acc[r.rule] = r.value === '' || r.value === undefined ? true : r.value;
                return acc;
            }, {}),
            options: (a.options ?? [])
                .filter((o) => (o?.label || '').trim() !== '')
                .map((o, i) => ({
                    id: o.id,
                    label: o.label.trim(),
                    value: (o.value || slugify(o.label || '')).trim(),
                    color: o.color || null,
                    is_active: o.is_active !== false,
                    sort_order: Number.isFinite(o.sort_order as number) ? (o.sort_order as number) : i,
                })),
        }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        // `useForm().post()` n'accepte pas `data:` dans les options.
        // On transforme la payload juste avant l'envoi.
        transform((current) => ({ attributes: toBackend(current.attributes) }));

        post(route('categories.attributes.sync', category.id), {
            preserveScroll: true,
            preserveState: true,
            onError: (errs) => {
                console.error('Échec de la mise à jour :', errs);
            },
            onSuccess: () => {
                console.log('Attributs mis à jour avec succès');
            },
            onFinish: () => transform((current) => current),
        });
    };

    const pageErrors = errors || {};
    const successMessage = page.props.success;

    return (
        <>
            <Head title={`Attributs – ${category.name}`} />
            <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <AppLayout
                    breadcrumbs={[
                        { title: 'Dashboard', href: '/dashboard' },
                        { title: 'Catégories', href: route('categories.index') },
                        { title: category.name, href: route('categories.show', category.id) },
                        { title: 'Attributs', href: route('categories.attributes.edit', category.id) },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* Formulaire */}
                        <div className="col-span-12 lg:col-span-8 xl:col-span-8">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h1 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Attributs de "{category.name}"</h1>

                                {/* Message de succès */}
                                {successMessage && (
                                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                                        <div className="font-medium">{successMessage}</div>
                                    </div>
                                )}

                                {/* Messages d'erreur */}
                                {Object.keys(pageErrors).length > 0 && (
                                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                        {Object.entries(pageErrors).map(([k, v]) => (
                                            <div key={k} className="mb-1">
                                                <strong>{k}:</strong> {String(v)}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Editeur d'attributs dynamiques */}
                                    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                        <div className="mb-4 flex items-center gap-2">
                                            <ListChecks className="h-4 w-4" />
                                            <span className="font-medium">Attributs dynamiques</span>
                                        </div>
                                        <AdvancedAttributesEditor
                                            rows={data.attributes as Attr[]}
                                            onChange={(rows) => setData('attributes', rows)}
                                            errors={errors as any}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-between pt-4">
                                        <Link href={route('categories.show', category.id)}>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="bg-muted hover:bg-muted/80 text-slate-700 dark:text-slate-300"
                                            >
                                                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
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
                                            {processing ? 'Enregistrement…' : 'Enregistrer les attributs'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Aide */}
                        <div className="col-span-12 lg:col-span-4 xl:col-span-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-white/5">
                                <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Aide</h2>
                                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                    <div>
                                        <h3 className="mb-2 font-medium text-slate-900 dark:text-white">Types d'attributs</h3>
                                        <ul className="space-y-1 text-xs">
                                            <li>
                                                <strong>Texte :</strong> Champ texte simple
                                            </li>
                                            <li>
                                                <strong>Texte long :</strong> Zone de texte multi-lignes
                                            </li>
                                            <li>
                                                <strong>Nombre :</strong> Valeur numérique entière
                                            </li>
                                            <li>
                                                <strong>Décimal :</strong> Valeur numérique décimale
                                            </li>
                                            <li>
                                                <strong>Oui/Non :</strong> Case à cocher
                                            </li>
                                            <li>
                                                <strong>Liste :</strong> Sélection unique ou multiple
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-medium text-slate-900 dark:text-white">Options</h3>
                                        <p className="text-xs">
                                            Les options sont uniquement disponibles pour les types "Liste déroulante" et "Liste multiple". Chaque
                                            option peut avoir une couleur pour l'affichage.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-medium text-slate-900 dark:text-white">Configuration</h3>
                                        <ul className="space-y-1 text-xs">
                                            <li>
                                                <strong>Obligatoire :</strong> Champ requis
                                            </li>
                                            <li>
                                                <strong>Filtrable :</strong> Utilisé dans les filtres
                                            </li>
                                            <li>
                                                <strong>Recherchable :</strong> Inclus dans la recherche
                                            </li>
                                            <li>
                                                <strong>Listing :</strong> Affiché dans les listes
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Lien retour vers la catégorie */}
                                <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                                    <Link href={route('categories.edit', category.id)}>
                                        <Button variant="outline" size="sm" className="w-full">
                                            Modifier la catégorie
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

/* ===== Éditeur d'attributs avancé ===== */
function AdvancedAttributesEditor({ rows, onChange, errors }: { rows: Attr[]; onChange: (rows: Attr[]) => void; errors?: Record<string, any> }) {
    const addRow = () => {
        onChange([
            ...rows,
            {
                name: '',
                slug: '',
                type: 'text',
                unit: '',
                is_required: false,
                is_filterable: true,
                is_searchable: false,
                show_in_listing: false,
                is_active: true,
                sort_order: rows.length,
                description: '',
                default_value: '',
                options: [],
                validation_rules: [],
            },
        ]);
    };

    const removeRow = (idx: number) => {
        const next = [...rows];
        next.splice(idx, 1);
        onChange(next.map((r, i) => ({ ...r, sort_order: i })));
    };

    const update = (idx: number, patch: Partial<Attr>) => {
        const next = [...rows];
        next[idx] = { ...next[idx], ...patch };
        onChange(next);
    };

    const moveRow = (fromIndex: number, toIndex: number) => {
        const next = [...rows];
        const item = next.splice(fromIndex, 1)[0];
        next.splice(toIndex, 0, item);
        onChange(next.map((r, i) => ({ ...r, sort_order: i })));
    };

    const typeOptions = [
        { value: 'text', label: 'Texte' },
        { value: 'textarea', label: 'Texte long' },
        { value: 'number', label: 'Nombre entier' },
        { value: 'decimal', label: 'Nombre décimal' },
        { value: 'boolean', label: 'Oui/Non' },
        { value: 'select', label: 'Liste déroulante' },
        { value: 'multiselect', label: 'Liste multiple' },
        { value: 'date', label: 'Date' },
        { value: 'url', label: 'URL' },
        { value: 'email', label: 'Email' },
        { value: 'json', label: 'JSON' },
    ];

    return (
        <div className="mt-2 space-y-6">
            {rows.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                    <ListChecks className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>Aucun attribut défini. Cliquez sur "Ajouter un attribut" pour commencer.</p>
                </div>
            ) : (
                rows.map((row, idx) => (
                    <AttributeEditor
                        key={row.id ?? `new-${idx}`}
                        index={idx}
                        attribute={row}
                        onChange={(patch) => update(idx, patch)}
                        onRemove={() => removeRow(idx)}
                        onMoveUp={idx > 0 ? () => moveRow(idx, idx - 1) : undefined}
                        onMoveDown={idx < rows.length - 1 ? () => moveRow(idx, idx + 1) : undefined}
                        typeOptions={typeOptions}
                        errors={errors?.attributes?.[idx]}
                    />
                ))
            )}

            <Button type="button" onClick={addRow} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un attribut
            </Button>
        </div>
    );
}

function AttributeEditor({
    index,
    attribute,
    onChange,
    onRemove,
    onMoveUp,
    onMoveDown,
    typeOptions,
    errors,
}: {
    index: number;
    attribute: Attr;
    onChange: (patch: Partial<Attr>) => void;
    onRemove: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    typeOptions: { value: string; label: string }[];
    errors?: Record<string, any>;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (attribute.name && !attribute.slug) {
            onChange({ slug: slugify(attribute.name) });
        }
    }, [attribute.name, attribute.slug, onChange]);

    const hasOptions = ['select', 'multiselect'].includes(attribute.type);

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                        {onMoveUp && (
                            <button
                                type="button"
                                onClick={onMoveUp}
                                className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                                title="Monter"
                            >
                                <GripVertical className="h-3 w-3 text-slate-400" />
                            </button>
                        )}
                        {onMoveDown && (
                            <button
                                type="button"
                                onClick={onMoveDown}
                                className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                                title="Descendre"
                            >
                                <GripVertical className="h-3 w-3 text-slate-400" />
                            </button>
                        )}
                    </div>

                    <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">{attribute.name || `Attribut ${index + 1}`}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {typeOptions.find((t) => t.value === attribute.type)?.label || attribute.type}
                            {attribute.is_required && ' • Obligatoire'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onChange({ is_active: !attribute.is_active })}
                        className={`rounded p-1 transition-colors ${
                            attribute.is_active
                                ? 'text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-500 dark:hover:bg-slate-800'
                        }`}
                        title={attribute.is_active ? 'Actif' : 'Inactif'}
                    >
                        {attribute.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`rounded p-1 transition-colors ${
                            isExpanded
                                ? 'text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-500 dark:hover:bg-slate-800'
                        }`}
                        title={isExpanded ? 'Masquer les paramètres' : 'Afficher les paramètres'}
                    >
                        <Settings className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={onRemove}
                        className="rounded p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                        title="Supprimer l'attribut"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Contenu */}
            <div className="space-y-4 p-4">
                {/* Champs de base */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field
                        id={`attr_name_${index}`}
                        label="Nom"
                        value={attribute.name}
                        onChange={(v) => onChange({ name: v })}
                        required
                        Icon={TagIcon}
                        error={errors?.name}
                    />
                    <Field
                        id={`attr_slug_${index}`}
                        label="Slug"
                        value={attribute.slug || ''}
                        onChange={(v) => onChange({ slug: v })}
                        required
                        Icon={HashIcon}
                        error={errors?.slug}
                    />
                    <FieldSelect
                        id={`attr_type_${index}`}
                        label="Type"
                        value={attribute.type}
                        onChange={(v) => onChange({ type: v })}
                        options={typeOptions}
                        error={errors?.type}
                    />
                </div>

                {/* Description & unité */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Textarea
                        id={`attr_desc_${index}`}
                        label="Description"
                        value={attribute.description ?? ''}
                        onChange={(v) => onChange({ description: v })}
                        error={errors?.description}
                    />
                    <Field
                        id={`attr_unit_${index}`}
                        label="Unité (ex: GB, MHz)"
                        value={attribute.unit ?? ''}
                        onChange={(v) => onChange({ unit: v })}
                        required={false}
                        error={errors?.unit}
                    />
                </div>

                {/* Valeur par défaut */}
                <Field
                    id={`attr_default_${index}`}
                    label="Valeur par défaut"
                    value={attribute.default_value ?? ''}
                    onChange={(v) => onChange({ default_value: v })}
                    required={false}
                    error={errors?.default_value}
                />

                {/* Options pour select/multiselect */}
                {hasOptions && (
                    <OptionsEditor options={attribute.options ?? []} onChange={(options) => onChange({ options })} errors={errors?.options} />
                )}

                {/* Règles de validation */}
                <ValidationRulesEditor
                    rules={Array.isArray(attribute.validation_rules) ? attribute.validation_rules : []}
                    type={attribute.type}
                    onChange={(validation_rules) => onChange({ validation_rules })}
                    errors={errors?.validation_rules}
                />

                {/* Configuration avancée */}
                {isExpanded && (
                    <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <ToggleRow
                                id={`attr_req_${index}`}
                                label="Obligatoire"
                                checked={!!attribute.is_required}
                                onChange={(v) => onChange({ is_required: v })}
                            />
                            <ToggleRow
                                id={`attr_filter_${index}`}
                                label="Filtrable"
                                checked={!!attribute.is_filterable}
                                onChange={(v) => onChange({ is_filterable: v })}
                            />
                            <ToggleRow
                                id={`attr_search_${index}`}
                                label="Recherchable"
                                checked={!!attribute.is_searchable}
                                onChange={(v) => onChange({ is_searchable: v })}
                            />
                            <ToggleRow
                                id={`attr_list_${index}`}
                                label="Afficher en listing"
                                checked={!!attribute.show_in_listing}
                                onChange={(v) => onChange({ show_in_listing: v })}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function OptionsEditor({ options, onChange, errors }: { options: Option[]; onChange: (options: Option[]) => void; errors?: any }) {
    const addOption = () => {
        onChange([...options, { label: '', value: '', color: '', sort_order: options.length, is_active: true }]);
    };

    const removeOption = (idx: number) => {
        const next = [...options];
        next.splice(idx, 1);
        onChange(next.map((o, i) => ({ ...o, sort_order: i })));
    };

    const updateOption = (idx: number, patch: Partial<Option>) => {
        const next = [...options];
        next[idx] = { ...next[idx], ...patch };
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300"> Options </label>
                <Button type="button" variant="ghost" size="sm" onClick={addOption}>
                    <PlusCircle className="mr-1 h-3 w-3" /> Ajouter
                </Button>
            </div>

            {options.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">Aucune option définie</p>
            ) : (
                <div className="space-y-2">
                    {options.map((option, idx) => (
                        <div key={option.id ?? `option-${idx}`} className="flex items-start gap-2 rounded border bg-white p-3 dark:bg-slate-900">
                            <Field
                                id={`option_label_${idx}`}
                                label={`Label ${idx + 1}`}
                                value={option.label}
                                onChange={(v) => {
                                    updateOption(idx, {
                                        label: v,
                                        value: v ? slugify(v) : '',
                                    });
                                }}
                                required
                                error={errors?.[idx]?.label}
                            />
                            <Field
                                id={`option_value_${idx}`}
                                label={`Valeur ${idx + 1}`}
                                value={option.value || ''}
                                onChange={(v) => updateOption(idx, { value: v })}
                                required
                                error={errors?.[idx]?.value}
                            />
                            <div className="flex-shrink-0 pt-6">
                                <input
                                    type="color"
                                    value={option.color || '#6b7280'}
                                    onChange={(e) => updateOption(idx, { color: e.target.value })}
                                    className="h-8 w-8 rounded border"
                                    title="Couleur"
                                />
                            </div>
                            <div className="flex-shrink-0 pt-6">
                                <button
                                    type="button"
                                    onClick={() => removeOption(idx)}
                                    className="rounded p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ValidationRulesEditor({ rules, type, onChange }: { rules: Rule[]; type: string; onChange: (rules: Rule[]) => void; errors?: any }) {
    const availableRules = useMemo(() => {
        const base = [
            { rule: 'min', label: 'Minimum', hasValue: true },
            { rule: 'max', label: 'Maximum', hasValue: true },
        ];

        switch (type) {
            case 'text':
            case 'textarea':
                return [
                    ...base,
                    { rule: 'min_length', label: 'Longueur min', hasValue: true },
                    { rule: 'max_length', label: 'Longueur max', hasValue: true },
                    { rule: 'regex', label: 'Expression régulière', hasValue: true },
                ];
            case 'number':
            case 'decimal':
                return base;
            default:
                return base;
        }
    }, [type]);

    const addRule = (ruleName: string) => {
        if (rules.find((r) => r.rule === ruleName)) return;
        onChange([...rules, { rule: ruleName, value: '' }]);
    };

    const removeRule = (idx: number) => {
        const next = [...rules];
        next.splice(idx, 1);
        onChange(next);
    };

    const updateRule = (idx: number, patch: Partial<Rule>) => {
        const next = [...rules];
        next[idx] = { ...next[idx], ...patch };
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300"> Règles de validation </label>
                <div className="relative">
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                addRule(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        className="rounded border bg-white px-2 py-1 text-xs dark:bg-slate-800"
                    >
                        <option value="">Ajouter une règle</option>
                        {availableRules
                            .filter((r) => !rules.find((existing) => existing.rule === r.rule))
                            .map((r) => (
                                <option key={r.rule} value={r.rule}>
                                    {r.label}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            {rules.length === 0 ? (
                <p className="py-2 text-center text-sm text-slate-500 dark:text-slate-400">Aucune règle définie</p>
            ) : (
                <div className="space-y-2">
                    {rules.map((rule, idx) => {
                        const ruleInfo = availableRules.find((r) => r.rule === rule.rule);
                        return (
                            <div key={idx} className="flex items-center gap-2 rounded border bg-white p-2 dark:bg-slate-900">
                                <span className="min-w-0 flex-shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {ruleInfo?.label || rule.rule}
                                </span>
                                {ruleInfo?.hasValue && (
                                    <input
                                        type="text"
                                        value={(rule as any).value || ''}
                                        onChange={(e) => updateRule(idx, { value: e.target.value })}
                                        placeholder="Valeur"
                                        className="flex-1 rounded border bg-transparent px-2 py-1 text-sm"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeRule(idx)}
                                    className="flex-shrink-0 rounded p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
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

function FieldSelect({
    id,
    label,
    value,
    onChange,
    options,
    error,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    error?: string | false;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <div className="relative">
                <select
                    id={id}
                    name={id}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`block w-full appearance-none rounded-lg border bg-white py-3 pr-10 pl-3 dark:bg-slate-800 ${error ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-900 dark:border-slate-700 dark:text-white'} focus:border-red-500 focus:ring-1 focus:ring-red-500`}
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
