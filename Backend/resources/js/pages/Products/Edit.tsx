import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Calendar, Edit3, Plus, Save, UploadCloud, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';

import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import type { Category, Currency, PageProps, TaxRate } from '@/types';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type SpecializedData = Record<string, any>;

type CompatibilityEntry = {
    compatible_with_id: string;
    direction?: 'bidirectional' | 'uni';
    note?: string;
};

type ProductType = 'physical' | 'digital' | 'service';
type ProductVisibility = 'public' | 'hidden' | 'draft';
type ProductCondition = 'new' | 'refurbished' | 'refurbished_premium';
type ToleranceTypeUI = 'percentage' | 'amount';

const DOCUMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'install_guide', label: "Guide d'installation" },
    { value: 'datasheet', label: 'Fiche technique' },
    { value: 'user_manual', label: 'Manuel utilisateur' },
    { value: 'quick_start', label: 'Guide de démarrage rapide' },
    { value: 'warranty', label: 'Garantie' },
    { value: 'certificate', label: 'Certificat' },
    { value: 'brochure', label: 'Brochure' },
    { value: 'safety_sheet', label: 'Fiche de sécurité' },
    { value: 'drivers', label: 'Pilotes / Drivers' },
    { value: 'schematics', label: 'Schémas' },
];

interface ExistingImage {
    id: number;
    path: string;
    is_primary: boolean;
    url?: string;
}

interface ExistingDocument {
    id: number;
    title: string;
    type?: string;
    url: string;
}

interface _ProductFormData {
    brand_id: string;
    name: string;
    model: string;
    sku: string;
    description: string;

    // SEO
    meta_title: string;
    meta_description: string;
    meta_keywords: string;

    // Pricing
    price: string;
    is_price_on_request: boolean;
    compare_at_price: string;
    cost_price: string;
    // Tolerance
    min_tolerance_type: '' | ToleranceTypeUI;
    min_tolerance_value: string;

    // Relations
    currency_code: string;
    tax_rate_id: number;
    category_id: number | '';

    // E-commerce
    type: ProductType;
    visibility: ProductVisibility;
    available_from: string;
    available_until: string;

    // Inventory
    stock_quantity: number;
    track_inventory: boolean;
    low_stock_threshold: number | '';
    allow_backorder: boolean;

    // Physical attributes
    weight: string;
    length: string;
    width: string;
    height: string;

    // Digital
    download_url: string;
    download_limit: string;
    download_expiry_days: string;

    // Flags
    is_active: boolean;
    is_featured: boolean;
    has_variants: boolean;

    // Media
    images: File[];
    primary_image_index: number;
    deleted_image_ids: number[];
    restored_image_ids: number[];

    // Documents
    documents: { title: string; type: string; file: File }[];
    deleted_document_ids: number[];
    updated_documents: { id: number; title: string; type: string }[];

    // Dynamic attributes
    spec: SpecializedData;
    attributes?: Record<string, any>;

    // Compat
    compatibilities: CompatibilityEntry[];
}

interface AttributeOptionDTO {
    id: number;
    label: string;
    value: string;
    color?: string | null;
    sort_order?: number;
    is_active?: boolean;
}

type AttrType = 'text' | 'textarea' | 'number' | 'decimal' | 'boolean' | 'select' | 'multiselect' | 'date' | 'url' | 'email' | 'json';

interface CategoryAttributeDTO {
    id: number;
    name: string;
    slug: string;
    type: AttrType;
    unit?: string | null;
    description?: string | null;
    is_required: boolean;
    default_value?: any;
    validation_rules?: any;
    options?: AttributeOptionDTO[];
    current_value?: any;
    formatted_value?: any;
}

interface ProductData {
    id: string;
    name: string;
    model: string;
    sku: string;
    description: string;
    price: number;
    condition?: ProductCondition | null;
    is_price_on_request?: boolean;
    compare_at_price?: number;
    cost_price?: number;
    min_tolerance_type?: ToleranceTypeUI | null;
    min_tolerance_value?: number | null;
    currency_code: string;
    tax_rate_id: number;
    category_id: number;
    type: ProductType;
    visibility: ProductVisibility;
    available_from?: string;
    available_until?: string;
    stock_quantity: number;
    track_inventory: boolean;
    low_stock_threshold?: number | null;
    allow_backorder: boolean;
    weight?: number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    download_url?: string;
    download_limit?: number | null;
    download_expiry_days?: number | null;
    is_active: boolean;
    is_featured: boolean;
    has_variants: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    brand_id?: number | null;
    images?: ExistingImage[];
    documents?: ExistingDocument[];
    attributes?: Record<string, any>;
    min_allowed_price?: number | null;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function EditProduct({
    product,
    brands,
    categories,
    currencies,
    taxRates,
    attributes,
    compatibilities,
}: PageProps<{
    product: ProductData;
    brands: { id: number; name: string }[];
    categories: Category[];
    currencies: Currency[];
    taxRates: TaxRate[];
    attributes: CategoryAttributeDTO[];
    compatibilities: CompatibilityEntry[];
}>) {
    const form = useForm({
        brand_id: toStrSafe(product.brand_id),
        name: product.name,
        model: product.model || '',
        sku: product.sku,
        description: product.description || '',

        // SEO
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        meta_keywords: product.meta_keywords || '',

        // Pricing
        price: toStrSafe(product.price),
        is_price_on_request: Boolean((product as any).is_price_on_request) as boolean,
        compare_at_price: toStrSafe(product.compare_at_price),
        cost_price: toStrSafe(product.cost_price),
        min_tolerance_type: (product.min_tolerance_type || '') as '' | ToleranceTypeUI,
        min_tolerance_value: toStrSafe(product.min_tolerance_value),

        // Relations
        currency_code: product.currency_code,
        tax_rate_id: product.tax_rate_id,
        category_id: (product.category_id ?? '') as number | '',

        // E-commerce
        type: (product.type as ProductType) ?? ('physical' as ProductType),
        condition: ((product as any).condition || 'new') as ProductCondition,
        visibility: (product.visibility as ProductVisibility) ?? ('public' as ProductVisibility),
        available_from: formatDateTimeLocal(product.available_from),
        available_until: formatDateTimeLocal(product.available_until),

        // Inventory
        stock_quantity: Number(product.stock_quantity || 0) as number,
        track_inventory: Boolean(product.track_inventory) as boolean,
        low_stock_threshold: (product.low_stock_threshold ?? '') as number | '',
        allow_backorder: Boolean(product.allow_backorder) as boolean,

        // Physical
        weight: toStrSafe(product.weight),
        length: toStrSafe(product.length),
        width: toStrSafe(product.width),
        height: toStrSafe(product.height),

        // Digital
        download_url: product.download_url || '',
        download_limit: toStrSafe(product.download_limit),
        download_expiry_days: toStrSafe(product.download_expiry_days),

        // Flags
        is_active: Boolean(product.is_active) as boolean,
        is_featured: Boolean(product.is_featured) as boolean,
        has_variants: Boolean(product.has_variants) as boolean,

        // Media
        images: [] as File[],
        primary_image_index: 0 as number,
        deleted_image_ids: [] as number[],
        restored_image_ids: [] as number[],

        // Documents
        documents: [] as { title: string; type: string; file: File }[],
        deleted_document_ids: [] as number[],
        updated_documents: [] as { id: number; title: string; type: string }[],

        // Dynamic
        spec: (product.attributes || {}) as SpecializedData,
        compatibilities: compatibilities || [],
    });

    const { data, setData, post, processing, errors } = form;

    /* ---------- Images existantes ---------- */
    const [existingImages, _setExistingImages] = useState<ExistingImage[]>(product.images || []);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);

    /* ---------- Documents existants ---------- */
    const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>((product as any).documents || []);

    useEffect(() => {
        const urls = data.images.map((f) => URL.createObjectURL(f));
        setNewPreviews(urls);
        return () => urls.forEach(URL.revokeObjectURL);
    }, [data.images]);

    // définir l'index de l'image principale existante au montage
    useEffect(() => {
        const idx = (product.images || []).findIndex((img) => img.is_primary);
        if (idx >= 0) setData('primary_image_index', idx);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calcul de l'index principal pour toutes les images (existantes + nouvelles)
    const allImages = useMemo(() => {
        const existing = existingImages.filter((img) => !data.deleted_image_ids.includes(img.id));
        return [...existing, ...data.images];
    }, [existingImages, data.images, data.deleted_image_ids]);

    /* ---------- Produits pour compatibilité ---------- */
    const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);
    const [selectedCompatId, setSelectedCompatId] = useState<string>('');
    useEffect(() => {
        const categoryId = data.category_id;
        if (!categoryId) {
            setAllProducts([]);
            setSelectedCompatId('');
            return;
        }

        const url = route('api.products.compatible-list', { category_id: categoryId });
        axios
            .get(url)
            .then((res) => setAllProducts(res.data))
            .catch((err) => {
                console.error('Échec de récupération de la liste de compatibilité', err);
                setAllProducts([]);
            });
    }, [data.category_id]);

    /* ---------- Attributs dynamiques par catégorie ---------- */
    const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttributeDTO[]>(attributes || []);
    const [attrLoading, setAttrLoading] = useState(false);
    const [attrError, setAttrError] = useState<string | null>(null);

    const currentCategory = useMemo(() => categories.find((c) => c.id === data.category_id), [categories, data.category_id]);

    const parentCategory = useMemo(
        () => (currentCategory?.parent_id ? categories.find((c) => c.id === currentCategory.parent_id) : null),
        [categories, currentCategory],
    );

    // charge les attributs au changement de catégorie
    useEffect(() => {
        const catId = data.category_id;
        if (!catId || catId === product.category_id) {
            if (catId === product.category_id) {
                setCategoryAttributes(attributes || []);
                setAttrError(null);
            }
            return;
        }

        let cancelled = false;
        setAttrLoading(true);
        setAttrError(null);

        const url = `/api/categories/${catId}/attributes`;
        axios
            .get(url)
            .then((res) => {
                if (cancelled) return;
                const attrs: CategoryAttributeDTO[] = res.data?.attributes ?? [];

                setCategoryAttributes(attrs);

                // initialise spec avec valeurs par défaut selon type
                const nextSpec: Record<string, any> = {};
                attrs.forEach((a) => {
                    switch (a.type) {
                        case 'boolean':
                            nextSpec[a.slug] = a.default_value ?? false;
                            break;
                        case 'number':
                        case 'decimal':
                        case 'text':
                        case 'url':
                        case 'email':
                        case 'date':
                        case 'textarea':
                        case 'select':
                            nextSpec[a.slug] = a.default_value ?? '';
                            break;
                        case 'multiselect':
                            nextSpec[a.slug] = Array.isArray(a.default_value) ? a.default_value : [];
                            break;
                        case 'json':
                            nextSpec[a.slug] =
                                typeof a.default_value === 'object' && a.default_value !== null
                                    ? a.default_value
                                    : a.default_value
                                      ? safeJsonParse(String(a.default_value), {})
                                      : {};
                            break;
                        default:
                            nextSpec[a.slug] = a.default_value ?? '';
                    }
                });
                setData('spec', nextSpec);
            })
            .catch(() => {
                if (cancelled) return;
                setCategoryAttributes([]);
                setAttrError('Impossible de charger les attributs de cette catégorie.');
            })
            .finally(() => {
                if (!cancelled) setAttrLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [attributes, data.category_id, product.category_id, setData]);

    /* ---------- Helpers calculs tarification ---------- */
    const currency = useMemo(() => currencies.find((c) => c.code === data.currency_code), [currencies, data.currency_code]);
    const currencySymbol = currency?.symbol ?? '';

    const vatRate = useMemo(() => {
        const tr = taxRates.find((t) => t.id === Number(data.tax_rate_id));
        const n = Number(tr?.rate ?? 0);
        return Number.isFinite(n) ? Math.max(0, n) : 0;
    }, [taxRates, data.tax_rate_id]);

    const priceNum = useMemo(() => toFloat(data.price), [data.price]);
    const costNum = useMemo(() => toFloat(data.cost_price), [data.cost_price]);

    const priceTTC = useMemo(() => {
        if (priceNum <= 0) return 0;
        return round2(priceNum * (1 + vatRate / 100));
    }, [priceNum, vatRate]);

    const marginAbs = useMemo(() => {
        if (priceNum <= 0) return 0;
        return round2(priceNum - costNum);
    }, [priceNum, costNum]);

    const marginPct = useMemo(() => {
        if (priceNum <= 0) return 0;
        return round1(((priceNum - costNum) / priceNum) * 100);
    }, [priceNum, costNum]);

    const minAllowedPrice = useMemo(
        () => computeMinAllowedPrice(priceNum, data.min_tolerance_type, data.min_tolerance_value),
        [priceNum, data.min_tolerance_type, data.min_tolerance_value],
    );

    /* ---------- Handlers ---------- */
    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files).slice(0, 7 - allImages.length);
        setData('images', [...data.images, ...files]);
    };

    const handleDocumentFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const files = Array.from(e.target.files).slice(0, Math.max(0, 10 - (data.documents?.length ?? 0)));
        const next = files.map((file) => ({
            file,
            title: file.name.replace(/\.[^/.]+$/, ''),
            type: 'datasheet',
        }));

        setData('documents', [...(data.documents ?? []), ...next]);
        e.target.value = '';
    };

    const updateDocumentTitle = (idx: number, title: string) => {
        setData(
            'documents',
            (data.documents ?? []).map((d, i) => (i === idx ? { ...d, title } : d)),
        );
    };

    const updateDocumentType = (idx: number, type: string) => {
        setData(
            'documents',
            (data.documents ?? []).map((d, i) => (i === idx ? { ...d, type } : d)),
        );
    };

    const removeNewDocument = (idx: number) => {
        setData(
            'documents',
            (data.documents ?? []).filter((_, i) => i !== idx),
        );
    };

    const removeExistingDocument = (docId: number) => {
        if (!data.deleted_document_ids.includes(docId)) {
            setData('deleted_document_ids', [...data.deleted_document_ids, docId]);
        }
    };

    const restoreDocument = (docId: number) => {
        setData(
            'deleted_document_ids',
            data.deleted_document_ids.filter((id) => id !== docId),
        );
    };

    const updateExistingDocumentTitle = (docId: number, title: string) => {
        setExistingDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, title } : d)));
    };

    const updateExistingDocumentType = (docId: number, type: string) => {
        setExistingDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, type } : d)));
    };

    const removeExistingImage = (imgId: number) => {
        setData('deleted_image_ids', [...data.deleted_image_ids, imgId]);

        // Ajuster l'index principal si nécessaire
        const visibleExisting = existingImages.filter((img) => !data.deleted_image_ids.includes(img.id) && img.id !== imgId);
        const totalVisible = visibleExisting.length + data.images.length;
        if (data.primary_image_index >= totalVisible) {
            setData('primary_image_index', Math.max(0, totalVisible - 1));
        }
    };

    const removeNewImage = (idx: number) => {
        const imgs = data.images.filter((_, i) => i !== idx);
        setData('images', imgs);

        // Ajuster l'index principal
        const visibleExisting = existingImages.filter((img) => !data.deleted_image_ids.includes(img.id));
        const newIndex = visibleExisting.length + idx;
        if (data.primary_image_index >= newIndex) {
            setData('primary_image_index', Math.max(0, allImages.length - 2));
        }
    };

    const restoreImage = (imgId: number) => {
        setData(
            'deleted_image_ids',
            data.deleted_image_ids.filter((id) => id !== imgId),
        );
        if (!data.restored_image_ids.includes(imgId)) {
            setData('restored_image_ids', [...data.restored_image_ids, imgId]);
        }
    };

    const choosePrimary = (idx: number) => setData('primary_image_index', idx);

    const setSpecField = (field: string, value: any) => setData('spec', { ...(data.spec ?? {}), [field]: value });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prépare 'attributes' pour le backend à partir de 'spec'
        const attrs: Record<string, any> = { ...(data.spec || {}) };
        // typage JSON (si champs json saisis en string)
        categoryAttributes.forEach((a) => {
            if (a.type === 'json') {
                const v = attrs[a.slug];
                if (typeof v === 'string') {
                    attrs[a.slug] = safeJsonParse(v, {});
                }
            }
        });

        form.transform((payload) => ({
            _method: 'patch', // override pour utiliser POST + multipart
            ...payload,
            attributes: attrs,
            updated_documents: (existingDocuments ?? [])
                .filter((d) => !data.deleted_document_ids.includes(d.id))
                .map((d) => ({
                    id: d.id,
                    title: String(d.title || '').trim() || 'Document',
                    type: String((d as any).type || 'datasheet'),
                })),
            // tolérance : mappe "none" → null et vide → null
            min_tolerance_type: data.min_tolerance_type ? data.min_tolerance_type : null,
            min_tolerance_value: data.min_tolerance_type ? toFloat(data.min_tolerance_value) : null,
        }));

        // Utiliser POST (multipart) avec _method=patch
        post(route('products.update', product.id), {
            forceFormData: true,
            onFinish: () => form.transform((p) => p),
            onError: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        });
    };

    /* ---------- Refs + helper pour date/time ---------- */
    const fromRef = useRef<HTMLInputElement>(null);
    const untilRef = useRef<HTMLInputElement>(null);
    const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
        const el = ref.current as any;
        if (el?.showPicker) el.showPicker();
        else el?.focus();
    };

    /* ------------------------------------------------------------------ */
    /* Rendu                                                              */
    /* ------------------------------------------------------------------ */
    return (
        <>
            <Head title={`Modifier ${product.name}`} />

            <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 transition-colors duration-500 dark:from-[#0a0420] dark:via-[#0e0a32] dark:to-[#1B1749]">
                <ParticlesBackground />

                <AppLayout
                    breadcrumbs={[
                        { title: 'Produits', href: '/products' },
                        { title: product.name, href: `/products/${product.id}` },
                        { title: 'Modifier' },
                    ]}
                >
                    <div className="grid grid-cols-12 gap-6 p-6">
                        {/* ────────── Formulaire sur toute la largeur ────────── */}
                        <div className="col-span-12">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop-blur-md md:p-8 dark:border-slate-700 dark:bg-white/5">
                                <div className="mb-6 flex items-center gap-3">
                                    <Edit3 className="h-6 w-6 text-red-600" />
                                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Modifier le produit</h1>
                                </div>

                                {Object.keys(errors).length > 0 && (
                                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                                        <strong>Erreur(s) dans le formulaire :</strong>
                                        <ul className="mt-2 list-inside list-disc text-sm">
                                            {Object.entries(errors).map(([field, message]) => (
                                                <li key={field}>{String(message)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Tabs defaultValue="general" className="w-full">
                                        <TabsList className="flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                                            <TabsTrigger value="general">Général</TabsTrigger>
                                            <TabsTrigger value="pricing">Tarification</TabsTrigger>
                                            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
                                            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
                                            <TabsTrigger value="availability">Disponibilité</TabsTrigger>
                                            <TabsTrigger value="digital">Numérique</TabsTrigger>
                                            <TabsTrigger value="images">Images</TabsTrigger>
                                            <TabsTrigger value="documents">Documents</TabsTrigger>
                                            <TabsTrigger value="compat">Compatibilités</TabsTrigger>
                                            <TabsTrigger value="seo">SEO</TabsTrigger>
                                        </TabsList>

                                        {/* --- Général --- */}
                                        <TabsContent value="general" className="space-y-6 pt-4">
                                            {/* Marque & Modèle */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Marque
                                                    </label>
                                                    <Select value={data.brand_id} onValueChange={(v) => setData('brand_id', v)}>
                                                        <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                            <SelectValue placeholder="Sélectionner une marque" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {brands.map((b) => (
                                                                <SelectItem key={b.id} value={String(b.id)}>
                                                                    {b.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Modèle
                                                    </label>
                                                    <Input
                                                        placeholder="Modèle du produit"
                                                        value={data.model}
                                                        onChange={(e) => setData('model', e.target.value)}
                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            {/* Nom & SKU */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Nom <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        placeholder="Nom du produit"
                                                        required
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        SKU <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        placeholder="Code produit"
                                                        required
                                                        value={data.sku}
                                                        onChange={(e) => setData('sku', e.target.value)}
                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            {/* Type & Visibilité */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Type <span className="text-red-500">*</span>
                                                    </label>
                                                    <Select value={data.type} onValueChange={(v) => setData('type', v as ProductType)}>
                                                        <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                            <SelectValue placeholder="Type de produit" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="physical">Physique</SelectItem>
                                                            <SelectItem value="digital">Numérique</SelectItem>
                                                            <SelectItem value="service">Service</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Visibilité <span className="text-red-500">*</span>
                                                    </label>
                                                    <Select
                                                        value={data.visibility}
                                                        onValueChange={(v) => setData('visibility', v as ProductVisibility)}
                                                    >
                                                        <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                            <SelectValue placeholder="Visibilité" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="public">Publique</SelectItem>
                                                            <SelectItem value="hidden">Masqué</SelectItem>
                                                            <SelectItem value="draft">Brouillon</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* État */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        État <span className="text-red-500">*</span>
                                                    </label>
                                                    <Select
                                                        value={data.condition as any}
                                                        onValueChange={(v) => setData('condition', v as ProductCondition)}
                                                    >
                                                        <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                            <SelectValue placeholder="Sélectionner un état" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="new">Neuf</SelectItem>
                                                            <SelectItem value="refurbished">Reconditionné</SelectItem>
                                                            <SelectItem value="refurbished_premium">Reconditionné Premium</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {(errors as any)['condition'] && (
                                                        <p className="mt-1 text-sm text-red-600">{String((errors as any)['condition'])}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Description
                                                </label>
                                                <Textarea
                                                    placeholder="Description du produit"
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                />
                                            </div>

                                            {/* Catégorie */}
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Catégorie <span className="text-red-500">*</span>
                                                </label>
                                                <Select
                                                    value={data.category_id ? String(data.category_id) : ''}
                                                    onValueChange={(v) => setData('category_id', Number(v))}
                                                >
                                                    <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((c) => (
                                                            <SelectItem key={c.id} value={String(c.id)}>
                                                                {(c as any).indented_name ?? c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Attributs dynamiques */}
                                            {attrLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Chargement des attributs…</p>}
                                            {attrError && <p className="text-sm text-red-600">{attrError}</p>}
                                            {!attrLoading && !attrError && categoryAttributes.length === 0 && data.category_id && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Cette catégorie n'a pas d'attributs actifs — ou aucun n'a été défini.
                                                </p>
                                            )}
                                            {categoryAttributes.length > 0 && (
                                                <div className="space-y-4 pt-2">
                                                    {categoryAttributes.map((attr) => {
                                                        const fieldId = `attr_${attr.slug}`;
                                                        const fieldErr = (errors as any)[`attributes.${attr.slug}`] as string | undefined;
                                                        const value = (data.spec ?? {})[attr.slug] ?? attr.current_value;

                                                        return (
                                                            <div key={attr.slug}>
                                                                <label
                                                                    htmlFor={fieldId}
                                                                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                                                >
                                                                    {attr.name}
                                                                    {attr.is_required ? ' *' : ''}
                                                                    {attr.unit ? <span className="opacity-70"> ({attr.unit})</span> : null}
                                                                </label>

                                                                {attr.type === 'textarea' && (
                                                                    <Textarea
                                                                        id={fieldId}
                                                                        value={value ?? ''}
                                                                        onChange={(e) => setSpecField(attr.slug, e.target.value)}
                                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                                    />
                                                                )}

                                                                {(attr.type === 'text' || attr.type === 'url' || attr.type === 'email') && (
                                                                    <Input
                                                                        id={fieldId}
                                                                        type={attr.type === 'text' ? 'text' : attr.type}
                                                                        value={value ?? ''}
                                                                        onChange={(e) => setSpecField(attr.slug, e.target.value)}
                                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                                    />
                                                                )}

                                                                {(attr.type === 'number' || attr.type === 'decimal') && (
                                                                    <Input
                                                                        id={fieldId}
                                                                        type="number"
                                                                        step={attr.type === 'decimal' ? '0.01' : '1'}
                                                                        value={value ?? ''}
                                                                        onChange={(e) => setSpecField(attr.slug, e.target.value)}
                                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                                    />
                                                                )}

                                                                {attr.type === 'date' && (
                                                                    <Input
                                                                        id={fieldId}
                                                                        type="date"
                                                                        value={value ?? ''}
                                                                        onChange={(e) => setSpecField(attr.slug, e.target.value)}
                                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                                    />
                                                                )}

                                                                {attr.type === 'boolean' && (
                                                                    <label className="inline-flex items-center gap-2">
                                                                        <input
                                                                            id={fieldId}
                                                                            type="checkbox"
                                                                            checked={!!value}
                                                                            onChange={(e) => setSpecField(attr.slug, e.target.checked)}
                                                                            className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-2 focus:ring-red-500"
                                                                        />
                                                                        <span className="text-sm text-slate-700 dark:text-slate-300">Oui / Non</span>
                                                                    </label>
                                                                )}

                                                                {attr.type === 'select' && (
                                                                    <Select value={value ?? ''} onValueChange={(v) => setSpecField(attr.slug, v)}>
                                                                        <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                                            <SelectValue placeholder="Sélectionner une option" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {(attr.options ?? [])
                                                                                .filter((o) => String(o.value) !== '')
                                                                                .map((o) => (
                                                                                    <SelectItem key={o.id} value={o.value}>
                                                                                        {o.label}
                                                                                    </SelectItem>
                                                                                ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}

                                                                {attr.type === 'multiselect' && (
                                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                        {(attr.options ?? []).map((o) => {
                                                                            const selected: string[] = Array.isArray(value) ? value : [];
                                                                            const checked = selected.includes(o.value);
                                                                            return (
                                                                                <label
                                                                                    key={o.id}
                                                                                    className="flex items-center gap-2 rounded border border-slate-200 bg-white/60 p-2 dark:border-slate-700 dark:bg-slate-800/60"
                                                                                >
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={checked}
                                                                                        onChange={(e) => {
                                                                                            const set = new Set(selected);
                                                                                            if (e.target.checked) set.add(o.value);
                                                                                            else set.delete(o.value);
                                                                                            setSpecField(attr.slug, Array.from(set));
                                                                                        }}
                                                                                    />
                                                                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                                                                        {o.label}
                                                                                    </span>
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {attr.type === 'json' && (
                                                                    <Textarea
                                                                        id={fieldId}
                                                                        value={
                                                                            typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)
                                                                        }
                                                                        onChange={(e) => setSpecField(attr.slug, e.target.value)}
                                                                        className="border-slate-300 bg-white font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                                        placeholder='{"key": "value"}'
                                                                        rows={4}
                                                                    />
                                                                )}

                                                                {attr.description && (
                                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                        {attr.description}
                                                                    </p>
                                                                )}
                                                                {fieldErr && <p className="mt-1 text-sm text-red-600">{fieldErr}</p>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </TabsContent>

                                        {/* --- Tarification --- */}
                                        <TabsContent value="pricing" className="space-y-4 pt-4">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={!!data.is_price_on_request}
                                                    onCheckedChange={(v) => {
                                                        const next = Boolean(v);
                                                        setData('is_price_on_request', next);
                                                        if (next) {
                                                            setData('price', '');
                                                            setData('compare_at_price', '');
                                                            setData('cost_price', '');
                                                            setData('min_tolerance_type', '');
                                                            setData('min_tolerance_value', '');
                                                        }
                                                    }}
                                                />
                                                <div className="text-sm text-slate-700 dark:text-slate-300">Prix sur devis</div>
                                            </div>

                                            <div
                                                className={data.is_price_on_request ? 'pointer-events-none opacity-60' : ''}
                                                aria-disabled={data.is_price_on_request ? 'true' : 'false'}
                                            >
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                    <div className="md:col-span-1">
                                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Prix {!data.is_price_on_request && <span className="text-red-500">*</span>}
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            required={!data.is_price_on_request}
                                                            disabled={!!data.is_price_on_request}
                                                            value={data.price}
                                                            onChange={(e) => setData('price', e.target.value)}
                                                            className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Prix comparé
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            disabled={!!data.is_price_on_request}
                                                            value={data.compare_at_price}
                                                            onChange={(e) => setData('compare_at_price', e.target.value)}
                                                            className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Coût
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            disabled={!!data.is_price_on_request}
                                                            value={data.cost_price}
                                                            onChange={(e) => setData('cost_price', e.target.value)}
                                                            className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Devise
                                                        </label>
                                                        <Select value={data.currency_code} onValueChange={(v) => setData('currency_code', v)}>
                                                            <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                                <SelectValue placeholder="Devise" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {currencies.map((c) => (
                                                                    <SelectItem key={c.code} value={c.code}>
                                                                        {c.symbol} ({c.code})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Tolérance */}
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Tolérance (type)
                                                        </label>
                                                        <Select
                                                            value={data.min_tolerance_type || ''}
                                                            onValueChange={(v) =>
                                                                setData('min_tolerance_type', v === 'none' ? '' : (v as ToleranceTypeUI))
                                                            }
                                                            disabled={!!data.is_price_on_request}
                                                        >
                                                            <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                                <SelectValue placeholder="Aucune" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Aucune</SelectItem>
                                                                <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                                                                <SelectItem value="amount">Montant</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Tolérance (valeur)
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder={data.min_tolerance_type === 'percentage' ? 'ex: 15.00' : 'ex: 50.00'}
                                                                value={data.min_tolerance_value}
                                                                onChange={(e) => setData('min_tolerance_value', e.target.value)}
                                                                disabled={!!data.is_price_on_request || !data.min_tolerance_type}
                                                                className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                            />
                                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                                {data.min_tolerance_type === 'percentage' ? '%' : currencySymbol || 'Dhs'}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            Définit le prix plancher autorisé pour l'équipe.
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Aperçu prix minimum autorisé
                                                        </label>
                                                        <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800/40">
                                                            <span className="text-sm text-slate-700 dark:text-slate-200">
                                                                {minAllowedPrice === null
                                                                    ? '—'
                                                                    : `${formatMoney(minAllowedPrice, currencySymbol)} ${currency?.code ?? ''}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* TVA + indicateurs live */}
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            TVA
                                                        </label>
                                                        <Select
                                                            value={String(data.tax_rate_id)}
                                                            onValueChange={(v) => setData('tax_rate_id', Number(v))}
                                                            disabled={!!data.is_price_on_request}
                                                        >
                                                            <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                                <SelectValue placeholder="Taux de TVA" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {taxRates.map((t) => (
                                                                    <SelectItem key={t.id} value={String(t.id)}>
                                                                        {t.name} ({t.rate}%)
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">Prix TTC estimé</div>
                                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                            {priceNum > 0 ? `${formatMoney(priceTTC, currencySymbol)} ${currency?.code ?? ''}` : '—'}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            TVA: {vatRate}% (appliquée sur le prix HT)
                                                        </div>
                                                    </div>

                                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">Marge estimée</div>
                                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                            {priceNum > 0
                                                                ? `${formatMoney(marginAbs, currencySymbol)} ${currency?.code ?? ''} (${marginPct}%)`
                                                                : '—'}
                                                        </div>
                                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            Marge = (Prix - Coût) / Prix
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* --- Inventaire --- */}
                                        <TabsContent value="inventory" className="space-y-4 pt-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div className="flex items-end gap-2">
                                                    <div className="w-full">
                                                        <label
                                                            htmlFor="stock_quantity"
                                                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                                        >
                                                            Stock <span className="text-red-500">*</span>
                                                        </label>
                                                        <Input
                                                            id="stock_quantity"
                                                            type="number"
                                                            min={0}
                                                            required
                                                            value={data.stock_quantity}
                                                            onChange={(e) => setData('stock_quantity', Number(e.target.value))}
                                                            className="w-full border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Seuil stock bas
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={data.low_stock_threshold ?? ''}
                                                        onChange={(e) =>
                                                            setData('low_stock_threshold', e.target.value === '' ? '' : Number(e.target.value))
                                                        }
                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>

                                                <div className="flex items-end gap-4">
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.track_inventory}
                                                            onChange={(e) => setData('track_inventory', e.target.checked)}
                                                            className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-2 focus:ring-red-500"
                                                        />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            Suivre le stock
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Flags */}
                                            <div className="flex flex-wrap gap-6">
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.is_active}
                                                        onChange={(e) => setData('is_active', e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-2 focus:ring-red-500"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Actif</span>
                                                </label>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.is_featured}
                                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-2 focus:ring-red-500"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">En vedette</span>
                                                </label>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.allow_backorder}
                                                        onChange={(e) => setData('allow_backorder', e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-2 focus:ring-red-500"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Précommande</span>
                                                </label>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.has_variants}
                                                        onChange={(e) => setData('has_variants', e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-2 focus:ring-red-500"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Variantes</span>
                                                </label>
                                            </div>
                                        </TabsContent>

                                        {/* --- Dimensions --- */}
                                        <TabsContent value="dimensions" className="pt-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                {[
                                                    { key: 'weight', label: 'Poids (kg)' },
                                                    { key: 'length', label: 'Longueur (cm)' },
                                                    { key: 'width', label: 'Largeur (cm)' },
                                                    { key: 'height', label: 'Hauteur (cm)' },
                                                ].map((f) => (
                                                    <div key={f.key}>
                                                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            {f.label}
                                                        </label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={(data as any)[f.key]}
                                                            onChange={(e) => setData(f.key as any, e.target.value)}
                                                            className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </TabsContent>

                                        {/* --- Disponibilité --- */}
                                        <TabsContent value="availability" className="pt-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Disponible à partir du
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            ref={fromRef}
                                                            type="datetime-local"
                                                            value={data.available_from}
                                                            onChange={(e) => setData('available_from', e.target.value)}
                                                            className="border-slate-300 bg-white pr-10 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => openPicker(fromRef)}
                                                            className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                                                            aria-label="Ouvrir le calendrier"
                                                            tabIndex={-1}
                                                        >
                                                            <Calendar className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Disponible jusqu'au
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            ref={untilRef}
                                                            type="datetime-local"
                                                            value={data.available_until}
                                                            onChange={(e) => setData('available_until', e.target.value)}
                                                            className="border-slate-300 bg-white pr-10 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => openPicker(untilRef)}
                                                            className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                                                            aria-label="Ouvrir le calendrier"
                                                            tabIndex={-1}
                                                        >
                                                            <Calendar className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* --- Numérique --- */}
                                        <TabsContent value="digital" className="space-y-3 pt-4">
                                            {data.type !== 'digital' && (
                                                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                                                    <AlertCircle className="mt-0.5 h-4 w-4" />
                                                    <p className="text-sm">
                                                        Le type du produit n'est pas <strong>numérique</strong>. Ces champs sont facultatifs et
                                                        peuvent rester vides.
                                                    </p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        URL de téléchargement
                                                    </label>
                                                    <Input
                                                        type="url"
                                                        placeholder="https://..."
                                                        value={data.download_url}
                                                        onChange={(e) => setData('download_url', e.target.value)}
                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Limite de téléchargement
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={data.download_limit}
                                                        onChange={(e) => setData('download_limit', e.target.value)}
                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Expiration (jours)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={data.download_expiry_days}
                                                        onChange={(e) => setData('download_expiry_days', e.target.value)}
                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* --- Images --- */}
                                        <TabsContent value="images" className="space-y-4 pt-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Images du produit
                                                </label>
                                                {allImages.length < 7 && (
                                                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-center transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                                                        <UploadCloud className="mb-2 h-6 w-6 text-slate-400" />
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            Cliquez ou déposez vos images ici (max. {7 - allImages.length} de plus)
                                                        </p>
                                                        <input type="file" multiple className="hidden" onChange={handleFiles} />
                                                    </label>
                                                )}
                                            </div>

                                            {allImages.length > 0 && (
                                                <motion.div layout className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                                    {/* Images existantes */}
                                                    {existingImages.map((img, i) => {
                                                        const isDeleted = data.deleted_image_ids.includes(img.id);
                                                        const globalIndex = i;

                                                        return (
                                                            <motion.div
                                                                layout
                                                                key={`existing-${img.id}`}
                                                                className={`relative ${isDeleted ? 'opacity-50' : ''}`}
                                                            >
                                                                <img
                                                                    src={img.url || `/storage/${img.path}`}
                                                                    className="h-32 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                                                    alt=""
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
                                                                    onClick={() => (isDeleted ? restoreImage(img.id) : removeExistingImage(img.id))}
                                                                    type="button"
                                                                >
                                                                    {isDeleted ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                                </Button>
                                                                {!isDeleted && (
                                                                    <Button
                                                                        type="button"
                                                                        onClick={() => choosePrimary(globalIndex)}
                                                                        className={`absolute bottom-1 left-1 rounded px-2 py-0.5 text-xs ${
                                                                            data.primary_image_index === globalIndex
                                                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                                                : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                                                        }`}
                                                                    >
                                                                        {data.primary_image_index === globalIndex ? 'Principale' : 'Choisir'}
                                                                    </Button>
                                                                )}
                                                                {isDeleted && (
                                                                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-500/20">
                                                                        <span className="rounded bg-white px-2 py-1 text-xs font-medium text-red-600">
                                                                            Supprimée
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        );
                                                    })}

                                                    {/* Nouvelles images */}
                                                    {newPreviews.map((src, i) => {
                                                        const visibleExistingCount = existingImages.filter(
                                                            (img) => !data.deleted_image_ids.includes(img.id),
                                                        ).length;
                                                        const globalIndex = visibleExistingCount + i;

                                                        return (
                                                            <motion.div layout key={`new-${i}`} className="relative">
                                                                <img
                                                                    src={src}
                                                                    className="h-32 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
                                                                    onClick={() => removeNewImage(i)}
                                                                    type="button"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => choosePrimary(globalIndex)}
                                                                    className={`absolute bottom-1 left-1 rounded px-2 py-0.5 text-xs ${
                                                                        data.primary_image_index === globalIndex
                                                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                                                            : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                                                    }`}
                                                                >
                                                                    {data.primary_image_index === globalIndex ? 'Principale' : 'Choisir'}
                                                                </Button>
                                                                <div className="absolute top-1 left-1 rounded bg-green-500 px-1.5 py-0.5 text-xs text-white">
                                                                    Nouvelle
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </TabsContent>

                                        {/* --- Documents --- */}
                                        <TabsContent value="documents" className="space-y-4 pt-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Documents du produit (PDF, fiche technique, guide d'installation…)
                                                </label>
                                                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-8 text-center transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                                                    <UploadCloud className="mb-2 h-6 w-6 text-slate-400" />
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        Cliquez ou déposez vos documents ici (max. 10)
                                                    </p>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip,.rar,.7z,.jpg,.jpeg,.png,.webp"
                                                        className="hidden"
                                                        onChange={handleDocumentFiles}
                                                    />
                                                </label>
                                            </div>

                                            {/* Documents existants */}
                                            {(existingDocuments ?? []).length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Documents existants</div>
                                                    <div className="space-y-3">
                                                        {(existingDocuments ?? []).map((doc) => {
                                                            const isDeleted = data.deleted_document_ids.includes(doc.id);
                                                            return (
                                                                <div
                                                                    key={doc.id}
                                                                    className={`rounded-lg border border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-800/60 ${isDeleted ? 'opacity-50' : ''}`}
                                                                >
                                                                    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[1fr_auto]">
                                                                        <div className="min-w-0 space-y-2">
                                                                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                                                <div>
                                                                                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                                        Type
                                                                                    </label>
                                                                                    <Select
                                                                                        value={(doc as any).type || 'datasheet'}
                                                                                        onValueChange={(v) => updateExistingDocumentType(doc.id, v)}
                                                                                        disabled={isDeleted}
                                                                                    >
                                                                                        <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                                                            <SelectValue placeholder="Choisir un type" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                                                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                                                    {opt.label}
                                                                                                </SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                                        Titre
                                                                                    </label>
                                                                                    <Input
                                                                                        value={doc.title}
                                                                                        onChange={(e) =>
                                                                                            updateExistingDocumentTitle(doc.id, e.target.value)
                                                                                        }
                                                                                        disabled={isDeleted}
                                                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            {!isDeleted && (
                                                                                <a
                                                                                    href={doc.url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="text-xs break-all text-blue-600 hover:underline dark:text-blue-400"
                                                                                >
                                                                                    Ouvrir / télécharger
                                                                                </a>
                                                                            )}
                                                                            {isDeleted && (
                                                                                <div className="text-xs text-red-600 dark:text-red-400">
                                                                                    Supprimé (sera appliqué à l’enregistrement)
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex md:justify-end">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
                                                                                onClick={() =>
                                                                                    isDeleted
                                                                                        ? restoreDocument(doc.id)
                                                                                        : removeExistingDocument(doc.id)
                                                                                }
                                                                                title={isDeleted ? 'Restaurer' : 'Supprimer'}
                                                                            >
                                                                                {isDeleted ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Nouveaux documents */}
                                            {(data.documents ?? []).length > 0 ? (
                                                <div className="space-y-2">
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Nouveaux documents</div>
                                                    <div className="space-y-3">
                                                        {(data.documents ?? []).map((d, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="rounded-lg border border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-800/60"
                                                            >
                                                                <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[1fr_auto]">
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                                Type
                                                                            </label>
                                                                            <Select
                                                                                value={d.type ?? 'datasheet'}
                                                                                onValueChange={(v) => updateDocumentType(idx, v)}
                                                                            >
                                                                                <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                                                    <SelectValue placeholder="Choisir un type" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                                                                                        <SelectItem key={opt.value} value={opt.value}>
                                                                                            {opt.label}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                                Titre
                                                                            </label>
                                                                            <Input
                                                                                value={d.title}
                                                                                onChange={(e) => updateDocumentTitle(idx, e.target.value)}
                                                                                placeholder="Ex: Fiche technique / Guide d'installation"
                                                                                className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                                            />
                                                                        </div>
                                                                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                            Fichier : {d.file?.name}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex md:justify-end">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
                                                                            onClick={() => removeNewDocument(idx)}
                                                                            title="Retirer"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Aucun nouveau document ajouté.</p>
                                            )}
                                        </TabsContent>

                                        {/* --- Compatibilités --- */}
                                        <TabsContent value="compat" className="pt-4">
                                            {(() => {
                                                if (!data.category_id) {
                                                    return (
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            Sélectionnez d'abord une catégorie pour gérer les compatibilités.
                                                        </p>
                                                    );
                                                }

                                                // options de la liste = produits filtrés pour ne pas proposer ceux déjà sélectionnés
                                                const compatIds = new Set(data.compatibilities.map((c) => c.compatible_with_id));
                                                const options = (allProducts ?? []).filter((p) => !compatIds.has(p.id));

                                                // util: retrouver le nom d'un produit depuis l'id
                                                const nameOf = (id: string) =>
                                                    options.find((p) => p.id === id)?.name ?? allProducts.find((p) => p.id === id)?.name ?? id;

                                                const addSelectedCompatibility = () => {
                                                    if (!selectedCompatId || compatIds.has(selectedCompatId)) return;
                                                    setData('compatibilities', [
                                                        ...(data.compatibilities ?? []),
                                                        { compatible_with_id: selectedCompatId, direction: 'bidirectional' as const, note: '' },
                                                    ]);
                                                    setSelectedCompatId('');
                                                };

                                                const removeCompatibility = (id: string) => {
                                                    setData(
                                                        'compatibilities',
                                                        (data.compatibilities ?? []).filter((c) => c.compatible_with_id !== id),
                                                    );
                                                };

                                                const updateCompatibility = (id: string, patch: Partial<CompatibilityEntry>) => {
                                                    setData(
                                                        'compatibilities',
                                                        (data.compatibilities ?? []).map((c) =>
                                                            c.compatible_with_id === id ? { ...c, ...patch } : c,
                                                        ),
                                                    );
                                                };

                                                return (
                                                    <div className="space-y-4">
                                                        {/* Information sur la logique de compatibilité */}
                                                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                                <strong>Logique de compatibilité :</strong>
                                                                <br />
                                                                {currentCategory && (
                                                                    <span>
                                                                        {' '}
                                                                        Votre produit appartient à la catégorie "{currentCategory.name}"
                                                                        {parentCategory
                                                                            ? ` rattachée directement à la catégorie parente "${parentCategory.name}".`
                                                                            : ' (catégorie racine).'}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>

                                                        {/* Sélecteur d'ajout */}
                                                        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto]">
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                    Ajouter un produit compatible
                                                                </label>
                                                                <Select value={selectedCompatId} onValueChange={setSelectedCompatId}>
                                                                    <SelectTrigger className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                                                                        <SelectValue placeholder="Choisir un produit…" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {options.length === 0 ? (
                                                                            <div className="px-3 py-2 text-sm text-slate-500">
                                                                                Aucun produit disponible
                                                                            </div>
                                                                        ) : (
                                                                            options.map((p) => (
                                                                                <SelectItem key={p.id} value={String(p.id)}>
                                                                                    {p.name}
                                                                                </SelectItem>
                                                                            ))
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="md:pb-[2px]">
                                                                <Button type="button" onClick={addSelectedCompatibility} disabled={!selectedCompatId}>
                                                                    <Plus className="mr-1 h-4 w-4" /> Ajouter
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Liste des compatibilités sélectionnées */}
                                                        {(data.compatibilities ?? []).length === 0 ? (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                Aucun produit compatible sélectionné.
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {(data.compatibilities ?? []).map((c) => (
                                                                    <div
                                                                        key={c.compatible_with_id}
                                                                        className="rounded-md border border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-800/60"
                                                                    >
                                                                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                                                                    {nameOf(c.compatible_with_id)}
                                                                                </div>
                                                                                <div className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                                                                                    {c.compatible_with_id}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-2">
                                                                                <Select
                                                                                    value={c.direction ?? 'bidirectional'}
                                                                                    onValueChange={(v) =>
                                                                                        updateCompatibility(c.compatible_with_id, {
                                                                                            direction: v as 'bidirectional' | 'uni',
                                                                                        })
                                                                                    }
                                                                                >
                                                                                    <SelectTrigger className="w-[160px] border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                                                                                        <SelectValue placeholder="Direction" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="bidirectional">Bidirectionnel</SelectItem>
                                                                                        <SelectItem value="uni">Unidirectionnel</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>

                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    onClick={() => removeCompatibility(c.compatible_with_id)}
                                                                                >
                                                                                    <X className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="mt-3">
                                                                            <Input
                                                                                placeholder="Note (facultatif)"
                                                                                value={c.note ?? ''}
                                                                                onChange={(e) =>
                                                                                    updateCompatibility(c.compatible_with_id, {
                                                                                        note: e.target.value,
                                                                                    })
                                                                                }
                                                                                className="border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Messages de validation backend éventuels */}
                                                        {(errors as any)['compatibilities'] && (
                                                            <p className="text-sm text-red-600">{String((errors as any)['compatibilities'])}</p>
                                                        )}
                                                        {(errors as any)['compatibilities.0.compatible_with_id'] && (
                                                            <p className="text-sm text-red-600">
                                                                {String((errors as any)['compatibilities.0.compatible_with_id'])}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </TabsContent>

                                        {/* --- SEO --- */}
                                        <TabsContent value="seo" className="space-y-3 pt-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Meta title
                                                    </label>
                                                    <Input
                                                        value={data.meta_title}
                                                        onChange={(e) => setData('meta_title', e.target.value)}
                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Mots-clés (meta)
                                                    </label>
                                                    <Input
                                                        value={data.meta_keywords}
                                                        onChange={(e) => setData('meta_keywords', e.target.value)}
                                                        placeholder="mot1, mot2, mot3"
                                                        className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Meta description
                                                </label>
                                                <Textarea
                                                    value={data.meta_description}
                                                    onChange={(e) => setData('meta_description', e.target.value)}
                                                    className="border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                                                    rows={3}
                                                />
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
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Annuler
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
                                            {processing ? 'Mise à jour…' : 'Mettre à jour'}
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

/* ------------------------------------------------------------------ */
/* Utils                                                              */
/* ------------------------------------------------------------------ */
function safeJsonParse(input: string, fallback: any) {
    try {
        const v = JSON.parse(input);
        return typeof v === 'object' && v !== null ? v : fallback;
    } catch {
        return fallback;
    }
}

function toFloat(v: string | number | null | undefined): number {
    if (v === null || v === undefined || v === '') return 0;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}
function round1(n: number) {
    return Math.round(n * 10) / 10;
}

function formatMoney(n: number, symbol: string) {
    return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`.trim();
}

function computeMinAllowedPrice(price: number, type: '' | ToleranceTypeUI, value: string | number): number | null {
    if (!type) return null;
    const v = toFloat(value);
    if (v < 0) return Math.max(0, price); // valeur négative -> ignore, garde le prix
    if (type === 'percentage') {
        return Math.max(0, round2(price * (1 - v / 100)));
    }
    if (type === 'amount') {
        return Math.max(0, round2(price - v));
    }
    return null;
}

function formatDateTimeLocal(dateString?: string | null): string {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
}

function toStrSafe(v: number | string | null | undefined) {
    return v === null || v === undefined ? '' : String(v);
}
