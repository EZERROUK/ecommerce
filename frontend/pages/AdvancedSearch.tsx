
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sliders, X, Filter } from 'lucide-react';
import { SEO } from '../components/SEO';
import { PRODUCTS, DEFAULT_PRODUCT_IMAGE } from '../constants';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

export const AdvancedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    brand: 'all',
    price: 'all' // Mock price filter
  });
  const { t } = useLanguage();

  const [results, setResults] = useState(PRODUCTS);

  useEffect(() => {
    // Hydrate Products first
    const hydratedProducts = PRODUCTS.map(product => {
        const translatedName = t(`products_data.${product.id}.name`);
        const translatedDesc = t(`products_data.${product.id}.description`);
        return {
            ...product,
            name: translatedName !== `products_data.${product.id}.name` ? translatedName : product.name,
            description: translatedDesc !== `products_data.${product.id}.description` ? translatedDesc : product.description
        };
    });

    let filtered = hydratedProducts;

    // Filter by text
    if (query) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by Category
    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Filter by Brand (Mock property check)
    if (filters.brand !== 'all') {
      filtered = filtered.filter(p => p.brand === filters.brand);
    }

    setResults(filtered);
  }, [query, filters, t]);

  // Extract unique brands from products
  const brands = Array.from(new Set(PRODUCTS.map(p => p.brand).filter(Boolean)));
  const categories = Array.from(new Set(PRODUCTS.map(p => p.category)));

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

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO title="Recherche Avancée" description="Trouvez le matériel informatique idéal : filtres par marque, prix, performance." />

      {/* Header Search Bar */}
      <div className="bg-corporate-blue py-8 shadow-md">
         <div className="max-w-4xl mx-auto px-4">
             <div className="relative">
                 <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Que recherchez-vous ? (ex: Serveur Dell, PC HP...)" 
                    className="w-full pl-6 pr-12 py-4 rounded-lg shadow-lg text-lg focus:outline-none focus:ring-2 focus:ring-corporate-red placeholder-gray-400 bg-[#F5F5F5] text-[#1A1A1A]"
                    autoFocus
                 />
                 <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
             </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
          
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                 <div className="flex items-center justify-between mb-6">
                     <h2 className="font-bold text-corporate-blue flex items-center"><Sliders className="w-4 h-4 mr-2" /> Filtres</h2>
                     {(filters.category !== 'all' || filters.brand !== 'all') && (
                        <button onClick={() => setFilters({category: 'all', brand: 'all', price: 'all'})} className="text-xs text-red-500 hover:underline">Réinitialiser</button>
                     )}
                 </div>

                 {/* Category Filter */}
                 <div className="mb-6">
                     <h3 className="font-bold text-sm text-gray-700 mb-3">Catégorie</h3>
                     <div className="space-y-2">
                         <label className="flex items-center space-x-2 cursor-pointer">
                             <input type="radio" checked={filters.category === 'all'} onChange={() => setFilters({...filters, category: 'all'})} className="text-corporate-blue focus:ring-corporate-blue" />
                             <span className="text-sm text-gray-600">Tout</span>
                         </label>
                         {categories.map(cat => (
                             <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                                 <input type="radio" checked={filters.category === cat} onChange={() => setFilters({...filters, category: cat})} className="text-corporate-blue focus:ring-corporate-blue" />
                                 <span className="text-sm text-gray-600 capitalize">{cat}</span>
                             </label>
                         ))}
                     </div>
                 </div>

                 {/* Brand Filter */}
                 <div className="mb-6">
                     <h3 className="font-bold text-sm text-gray-700 mb-3">Marque</h3>
                     <div className="space-y-2">
                         <label className="flex items-center space-x-2 cursor-pointer">
                             <input type="radio" checked={filters.brand === 'all'} onChange={() => setFilters({...filters, brand: 'all'})} className="text-corporate-blue focus:ring-corporate-blue" />
                             <span className="text-sm text-gray-600">Toutes</span>
                         </label>
                         {brands.map(brand => (
                             <label key={brand} className="flex items-center space-x-2 cursor-pointer">
                                 <input type="radio" checked={filters.brand === brand} onChange={() => setFilters({...filters, brand: brand || 'all'})} className="text-corporate-blue focus:ring-corporate-blue" />
                                 <span className="text-sm text-gray-600">{brand}</span>
                             </label>
                         ))}
                     </div>
                 </div>
             </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1">
              <div className="mb-4 text-sm text-gray-500">
                  {results.length} produit(s) trouvé(s)
              </div>
              
              {results.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.map(product => (
                          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="h-48 bg-white p-4 relative">
                                    <img 
                                        src={product.image || DEFAULT_PRODUCT_IMAGE} 
                                        alt={product.name} 
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                        }}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                                    />
                                    {product.badge && <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">{product.badge}</span>}
                                </div>
                                <div className="p-4">
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">{product.brand}</div>
                                    <h3 className="font-bold text-gray-900 mb-2 truncate">{product.name}</h3>
                                    <div className="flex justify-between items-center mt-4">
                                        <span className="text-corporate-blue font-bold text-sm">{getPriceDisplay(product.price)}</span>
                                        <Link to={`/produits/${(product as any).slug || product.id}`}>
                                            <Button size="sm" className="text-xs px-3 py-1">Voir</Button>
                                        </Link>
                                    </div>
                                </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                      <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun produit ne correspond à vos critères.</p>
                      <button onClick={() => {setQuery(''); setFilters({category: 'all', brand: 'all', price: 'all'})}} className="text-corporate-red font-bold mt-2 hover:underline">Réinitialiser la recherche</button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
