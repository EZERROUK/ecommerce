<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return match ($this->method()) {
            'POST'          => $this->user()->can('product_create'),
            'PATCH', 'PUT'  => $this->user()->can('product_edit'),
            'DELETE'        => $this->user()->can('product_delete'),
            default         => true,
        };
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        $isPriceOnRequest = (bool) $this->input('is_price_on_request', false);

        $rules = [
            // Champs de base
            'name'              => ['required','string','max:255'],
            'model'             => ['nullable','string','max:255'],
            'sku'               => ['required','string','max:100', $productId ? "unique:products,sku,{$productId}" : 'unique:products,sku'],
            'slug'              => ['nullable','string','max:255','regex:/^[a-z0-9-]+$/', $productId ? "unique:products,slug,{$productId}" : 'unique:products,slug'],
            'description'       => ['nullable','string'],
            'meta_title'        => ['nullable','string','max:255'],
            'meta_description'  => ['nullable','string','max:500'],
            'meta_keywords'     => ['nullable','string'],

            // Relations
            'brand_id'      => ['nullable','exists:brands,id'],
            'category_id'   => ['required','exists:categories,id'],
            'currency_code' => ['required','exists:currencies,code'],
            'tax_rate_id'   => ['required','exists:tax_rates,id'],

            // Pricing
            'is_price_on_request' => ['sometimes','boolean'],
            'price'               => [$isPriceOnRequest ? 'nullable' : 'required','numeric','min:0','max:999999.99'],
            'compare_at_price'    => array_values(array_filter([
                'nullable','numeric','min:0','max:999999.99',
                $isPriceOnRequest ? null : 'gt:price',
            ])),
            'cost_price'          => ['nullable','numeric','min:0','max:999999.99'],

            // Tolérance sur le prix
            'min_tolerance_type'  => ['nullable','in:percentage,amount'],
            'min_tolerance_value' => ['nullable','numeric','min:0'],

            // E-commerce
            'type'            => ['required','in:physical,digital,service'],
            'condition'       => ['required','in:new,refurbished,refurbished_premium'],
            'visibility'      => ['required','in:public,hidden,draft'],
            'is_active'       => ['sometimes','boolean'],
            'has_variants'    => ['sometimes','boolean'],
            'is_featured'     => ['sometimes','boolean'],
            'available_from'  => ['nullable','date'],
            'available_until' => ['nullable','date','after:available_from'],

            // Inventory
            'stock_quantity'      => ['required','integer','min:0'],
            'track_inventory'     => ['sometimes','boolean'],
            'low_stock_threshold' => ['nullable','integer','min:0'],
            'allow_backorder'     => ['sometimes','boolean'],

            // Physical product fields
            'weight' => ['nullable','numeric','min:0'],
            'length' => ['nullable','numeric','min:0'],
            'width'  => ['nullable','numeric','min:0'],
            'height' => ['nullable','numeric','min:0'],

            // Digital product fields
            'download_url'         => ['nullable','url','max:500'],
            'download_limit'       => ['nullable','integer','min:1'],
            'download_expiry_days' => ['nullable','integer','min:1'],

            // Images
            'images'               => ['nullable','array'],
            'images.*'             => ['image','mimes:jpeg,png,jpg,webp','max:5120'],
            'primary_image_index'  => ['nullable','integer','min:0'],
            'deleted_image_ids'    => ['nullable','array'],
            'deleted_image_ids.*'  => ['integer','exists:product_images,id'],
            'restored_image_ids'   => ['nullable','array'],
            'restored_image_ids.*' => ['integer','exists:product_images,id'],

            // Documents (fiche technique, guide d'installation, etc.)
            'documents'                => ['nullable','array'],
            'documents.*.title'        => ['required','string','max:255'],
            'documents.*.type'         => ['required','in:install_guide,datasheet,user_manual,quick_start,warranty,certificate,brochure,safety_sheet,drivers,schematics'],
            'documents.*.file'         => ['required','file','max:20480','mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,zip,rar,7z,jpg,jpeg,png,webp'],
            'deleted_document_ids'     => ['nullable','array'],
            'deleted_document_ids.*'   => ['integer','exists:product_documents,id'],

            // Updates documents existants (titre/type)
            'updated_documents'          => ['nullable','array'],
            'updated_documents.*.id'     => ['required','integer','exists:product_documents,id'],
            'updated_documents.*.title'  => ['required','string','max:255'],
            'updated_documents.*.type'   => ['required','in:install_guide,datasheet,user_manual,quick_start,warranty,certificate,brochure,safety_sheet,drivers,schematics'],

            // Compatibilités (schéma avancé avec note/direction)
            'compatibilities'                        => ['nullable','array'],
            'compatibilities.*.compatible_with_id'   => ['required','exists:products,id'],
            'compatibilities.*.direction'            => ['nullable','in:bidirectional,uni'],
            'compatibilities.*.note'                 => ['nullable','string','max:500'],

            // Compatibilités (simplifié : liste d’IDs)
            'compatibility_product_ids'   => ['nullable','array'],
            'compatibility_product_ids.*' => ['uuid','distinct','exists:products,id'],

            // Catégories multiples
            'additional_categories'   => ['nullable','array'],
            'additional_categories.*' => ['exists:categories,id'],

            // Attributs personnalisés (validation dynamique)
            'attributes' => ['nullable','array'],
        ];

        // Règles conditionnelles pour la tolérance
        if ($this->filled('min_tolerance_type')) {
            $rules['min_tolerance_value'][] = 'required';
            if ($this->input('min_tolerance_type') === 'percentage') {
                $rules['min_tolerance_value'][] = 'max:100';
            }
        }
        if ($this->filled('min_tolerance_value')) {
            $rules['min_tolerance_type'][] = 'required';
        }

        // Validation dynamique des attributs personnalisés selon la catégorie
        if ($this->filled('category_id')) {
            $category = \App\Models\Category::with('attributes.options')->find($this->input('category_id'));

            if ($category) {
                foreach ($category->attributes as $attribute) {
                    $rules["attributes.{$attribute->slug}"] = $attribute->getValidationRulesArray();
                }
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'sku.unique'                 => 'Ce SKU est déjà utilisé par un autre produit.',
            'slug.unique'                => 'Ce slug est déjà utilisé par un autre produit.',
            'slug.regex'                 => 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets.',
            'compare_at_price.gt'        => 'Le prix comparé doit être supérieur au prix de vente.',
            'available_until.after'      => 'La date de fin de disponibilité doit être postérieure à la date de début.',
            'images.*.max'               => 'Chaque image ne doit pas dépasser 5 MB.',
            'documents.*.file.max'       => 'Chaque document ne doit pas dépasser 20 MB.',
            'updated_documents.*.type.in' => 'Type de document invalide.',
            'download_url.url'           => "L'URL de téléchargement doit être valide.",
            'attributes.*.required'      => 'Ce champ est requis.',
            'attributes.*.in'            => 'La valeur sélectionnée n\'est pas valide.',
            'visibility.in'              => 'Visibilité invalide (public, hidden, draft).',
            'type.in'                    => 'Type invalide (physical, digital, service).',
            'min_tolerance_type.required'  => 'Le type de tolérance est requis lorsque la valeur est renseignée.',
            'min_tolerance_type.in'        => 'Type de tolérance invalide (percentage ou amount).',
            'min_tolerance_value.required' => 'La valeur de tolérance est requise lorsque le type est renseigné.',
            'min_tolerance_value.numeric'  => 'La valeur de tolérance doit être un nombre.',
            'min_tolerance_value.min'      => 'La valeur de tolérance doit être supérieure ou égale à 0.',
            'min_tolerance_value.max'      => 'Pour un type "percentage", la valeur doit être comprise entre 0 et 100.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Slug auto si manquant
        if ($this->filled('name') && !$this->filled('slug')) {
            $this->merge([
                'slug' => \Illuminate\Support\Str::slug($this->input('name')),
            ]);
        }

        // Valeurs par défaut pour type/visibility si absentes
        $this->merge([
            'type'       => $this->input('type', 'physical'),
            'condition'  => $this->input('condition', 'new'),
            'visibility' => $this->input('visibility', 'public'),
        ]);

        // Conversion des booléens
        foreach (['is_active','is_featured','track_inventory','allow_backorder','has_variants','is_price_on_request'] as $field) {
            if ($this->has($field)) {
                $this->merge([
                    $field => filter_var($this->input($field), FILTER_VALIDATE_BOOLEAN),
                ]);
            }
        }

        // Mode "prix sur devis" : le prix ne doit pas être obligatoire.
        // Le schéma DB a un price non-null, donc on stocke 0 en base tout en exposant "Sur devis" côté API/front.
        if (filter_var($this->input('is_price_on_request', false), FILTER_VALIDATE_BOOLEAN)) {
            $this->merge([
                'price' => 0,
                'compare_at_price' => null,
            ]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $currentId = $this->route('product')?->id;

            // Empêche l’auto-lien si on a l’ID courant
            if ($currentId) {
                $ids = collect($this->input('compatibility_product_ids', []))
                    ->merge(collect($this->input('compatibilities', []))->pluck('compatible_with_id'))
                    ->filter()
                    ->unique()
                    ->values();

                if ($ids->contains($currentId)) {
                    $v->errors()->add('compatibility_product_ids', 'Un produit ne peut pas être compatible avec lui-même.');
                }
            }
        });
    }
}
