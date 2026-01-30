
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Check, AlertCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { PRODUCTS, DEFAULT_PRODUCT_IMAGE } from '../constants';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

export const Compare: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { t } = useLanguage();
  
  // Helper to add/remove
  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
    }
  };

  const getPriceDisplay = (price: string | undefined) => {
    if (price === 'price_on_request') return t('common.price_on_request');
    if (price === 'Promo' || price === 'Promo -30%') return t('common.promo');

        if (!price) return price;
        const raw = String(price).trim();
        const isNumeric = /^-?\d+(?:[.,]\d+)?$/.test(raw);
        if (!isNumeric) return raw;

        const value = Number(raw.replace(',', '.'));
        if (!Number.isFinite(value)) return raw;

        const formatted = Number.isInteger(value)
            ? value.toLocaleString('fr-MA', { maximumFractionDigits: 0 })
            : value.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return `${formatted} Dhs`;
  };

  // Helper to hydrate product with translations
  const getProductData = (product: typeof PRODUCTS[0]) => {
      const translatedName = t(`products_data.${product.id}.name`);
      const translatedDesc = t(`products_data.${product.id}.description`);
      const translatedSpecs = t(`products_data.${product.id}.specs`);
      
      return {
          ...product,
          name: translatedName !== `products_data.${product.id}.name` ? translatedName : product.name,
          description: translatedDesc !== `products_data.${product.id}.description` ? translatedDesc : product.description,
          specs: Array.isArray(translatedSpecs) ? translatedSpecs : product.specs
      };
  };

  const selectedProducts = PRODUCTS.filter(p => selectedIds.includes(p.id)).map(getProductData);
  const allProductsHydrated = PRODUCTS.slice(0, 6).map(getProductData);

  return (
    <div className="bg-white min-h-screen">
      <SEO title="Comparateur de Produits" description="Comparez les caractéristiques techniques du matériel X-Zone." />

      <div className="bg-gray-50 py-12 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-corporate-blue mb-2 font-heading">Comparateur</h1>
            <p className="text-gray-600">Sélectionnez jusqu'à 3 produits pour comparer leurs fiches techniques.</p>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Selector */}
        <div className="mb-12">
            <h3 className="font-bold text-gray-700 mb-4">Ajouter des produits au comparateur :</h3>
            <div className="flex flex-wrap gap-4">
                {allProductsHydrated.map(product => (
                    <button
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        disabled={!selectedIds.includes(product.id) && selectedIds.length >= 3}
                        className={`px-4 py-2 rounded border text-sm transition-all ${
                            selectedIds.includes(product.id) 
                            ? 'bg-corporate-blue text-white border-corporate-blue' 
                            : 'bg-white text-gray-700 border-gray-300 hover:border-corporate-blue'
                        } ${(!selectedIds.includes(product.id) && selectedIds.length >= 3) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {selectedIds.includes(product.id) ? <Check className="w-4 h-4 inline mr-1" /> : '+ '}
                        {product.name}
                    </button>
                ))}
            </div>
             {selectedIds.length >= 3 && <p className="text-xs text-red-500 mt-2"><AlertCircle className="w-3 h-3 inline" /> Maximum 3 produits atteints.</p>}
        </div>

        {/* Comparison Table */}
        {selectedProducts.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                    <thead>
                        <tr>
                            <th className="p-4 border border-gray-200 bg-gray-50 w-1/4"></th>
                            {selectedProducts.map(p => (
                                <th key={p.id} className="p-4 border border-gray-200 w-1/4 align-top">
                                    <div className="flex justify-end">
                                        <button onClick={() => toggleProduct(p.id)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5"/></button>
                                    </div>
                                    <img 
                                        src={p.image || DEFAULT_PRODUCT_IMAGE} 
                                        alt={p.name}
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                        }}
                                        className="h-32 mx-auto object-contain mb-4" 
                                    />
                                    <h3 className="text-lg font-bold text-corporate-blue">{p.name}</h3>
                                    <p className="text-sm text-gray-500">{p.category}</p>
                                </th>
                            ))}
                            {/* Empty cells filler */}
                            {[...Array(3 - selectedProducts.length)].map((_, i) => <th key={i} className="p-4 border border-gray-200 bg-gray-50/50"></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-4 border border-gray-200 font-bold bg-gray-50">Prix</td>
                            {selectedProducts.map(p => (
                                <td key={p.id} className="p-4 border border-gray-200 text-center font-bold text-corporate-red">{getPriceDisplay(p.price)}</td>
                            ))}
                             {[...Array(3 - selectedProducts.length)].map((_, i) => <td key={i} className="p-4 border border-gray-200"></td>)}
                        </tr>
                        <tr>
                            <td className="p-4 border border-gray-200 font-bold bg-gray-50">Description</td>
                            {selectedProducts.map(p => (
                                <td key={p.id} className="p-4 border border-gray-200 text-sm text-gray-600">{p.description}</td>
                            ))}
                             {[...Array(3 - selectedProducts.length)].map((_, i) => <td key={i} className="p-4 border border-gray-200"></td>)}
                        </tr>
                        <tr>
                            <td className="p-4 border border-gray-200 font-bold bg-gray-50">Spécifications</td>
                            {selectedProducts.map(p => (
                                <td key={p.id} className="p-4 border border-gray-200 align-top">
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        {p.specs.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                                    </ul>
                                </td>
                            ))}
                             {[...Array(3 - selectedProducts.length)].map((_, i) => <td key={i} className="p-4 border border-gray-200"></td>)}
                        </tr>
                        <tr>
                            <td className="p-4 border border-gray-200 font-bold bg-gray-50">Action</td>
                            {selectedProducts.map(p => (
                                <td key={p.id} className="p-4 border border-gray-200 text-center">
                                    <Link to={`/produits/${(p as any).slug || p.id}`}>
                                        <Button size="sm">Voir Détails</Button>
                                    </Link>
                                </td>
                            ))}
                             {[...Array(3 - selectedProducts.length)].map((_, i) => <td key={i} className="p-4 border border-gray-200"></td>)}
                        </tr>
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-lg">
                <p>Aucun produit sélectionné pour le moment.</p>
            </div>
        )}
      </div>
    </div>
  );
};
