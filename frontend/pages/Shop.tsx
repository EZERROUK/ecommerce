
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, ShoppingBag, ShoppingCart, Eye, Tag, RotateCw, Sparkles } from 'lucide-react';
import { SEO } from '../components/SEO';
import { DEFAULT_PRODUCT_IMAGE } from '../constants';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { LazyImage } from '../components/LazyImage';
import { PrefetchLink } from '../components/PrefetchLink';
import { fetchCategoriesTree, fetchProducts, searchProducts } from '../utils/apiCatalog';
import { apiProductToUiProduct } from '../utils/apiMappers';
import { prefetchRoute } from '../utils/routePrefetch';
import type { Product } from '../types';

export const Shop: React.FC = () => {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; label: string }>>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialFilter, setSpecialFilter] = useState<'none' | 'promo' | 'refurbished'>('none');

  // Filtres dynamiques: attributs de la catégorie sélectionnée
  const [selectedAttributeFilters, setSelectedAttributeFilters] = useState<Record<string, string[]>>({});

  const CATEGORIES = useMemo(() => {
    return [
      { id: 'all', label: t('shop_data.categories.all') },
      ...categories.map(c => ({ id: String(c.id), label: c.label })),
    ];
  }, [categories, t]);

  const toggleAttributeValue = (attributeName: string, value: string) => {
    setSelectedAttributeFilters(prev => {
      const current = prev[attributeName] || [];
      const nextValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      const next: Record<string, string[]> = { ...prev };
      if (nextValues.length === 0) {
        delete next[attributeName];
      } else {
        next[attributeName] = nextValues;
      }
      return next;
    });
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

  const loadProducts = async (params?: { search?: string; categoryId?: number | null }) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const shouldUseSearch = Boolean(params?.search) || params?.categoryId != null;

      let apiProducts: any[] = [];
      if (shouldUseSearch) {
        const res = await searchProducts({
          search: params?.search || undefined,
          categoryId: params?.categoryId ?? undefined,
        });

        const results: any = (res as any)?.results;
        const list = Array.isArray(results) ? results : results?.data;
        apiProducts = Array.isArray(list) ? list : [];
      } else {
        const res = await fetchProducts();
        apiProducts = Array.isArray((res as any)?.data) ? (res as any).data : [];
      }

      const mapped = apiProducts.map(apiProductToUiProduct);

      setProducts(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur lors du chargement des produits.';
      setLoadError(message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Accélère l'accès au détail produit depuis le listing.
    prefetchRoute('/product/0');
  }, []);

  const loadCategories = async () => {
    setIsCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await fetchCategoriesTree();

      const flatten = (nodes: any[], depth = 0): Array<{ id: number; label: string }> => {
        return nodes.flatMap((n) => {
          const prefix = depth > 0 ? `${'—'.repeat(depth)} ` : '';
          const current = [{ id: Number(n.id), label: `${prefix}${String(n.name)}` }];
          const children = Array.isArray(n.children) ? flatten(n.children, depth + 1) : [];
          return [...current, ...children];
        });
      };

      setCategories(flatten(res.data || []));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur lors du chargement des catégories.';
      setCategoriesError(message);
      setCategories([]);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rechargement depuis l'API quand la recherche / catégorie change
  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadProducts({
        search: searchQuery.trim() || undefined,
        categoryId: selectedCategoryId,
      });
    }, 300);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategoryId]);

  // Quand on change de catégorie (ou qu'on revient à Tout voir), on remet à zéro les filtres dynamiques
  useEffect(() => {
    setSelectedAttributeFilters({});
  }, [selectedCategoryId]);

  const availableAttributeFacets = useMemo(() => {
    if (selectedCategoryId == null) return [] as Array<{ name: string; values: string[] }>;

    const map = new Map<string, Set<string>>();

    for (const product of products) {
      const attrs = product.attributes || [];
      for (const a of attrs) {
        const name = String(a.name || '').trim();
        const value = String(a.value || '').trim();
        if (!name || !value) continue;
        if (!map.has(name)) map.set(name, new Set());
        map.get(name)!.add(value);
      }
    }

    return Array.from(map.entries())
      .map(([name, values]) => ({
        name,
        values: Array.from(values).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [products, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    return products.map(product => {
      // Hydrate with translation
      const translatedName = t(`products_data.${product.id}.name`);
      const translatedDesc = t(`products_data.${product.id}.description`);
      const translatedSpecs = t(`products_data.${product.id}.specs`);
      
      return {
        ...product,
        // Fallback to static if translation returns key (error state) or if missing
        name: translatedName !== `products_data.${product.id}.name` ? translatedName : product.name,
        description: translatedDesc !== `products_data.${product.id}.description` ? translatedDesc : product.description,
        specs: Array.isArray(translatedSpecs) ? translatedSpecs : product.specs
      };
    }).filter(product => {
      let matchesSpecial = true;
      if (specialFilter === 'promo') matchesSpecial = product.badge === 'promo';
      if (specialFilter === 'refurbished') matchesSpecial = product.condition === 'refurbished_premium';

      // Filtres dynamiques (uniquement si une catégorie est sélectionnée)
      let matchesAttributes = true;
      if (selectedCategoryId != null) {
        const selectedEntries = (Object.entries(selectedAttributeFilters) as Array<[string, string[]]>).filter(
          ([, v]) => v.length > 0,
        );

        if (selectedEntries.length > 0) {
          const productAttrMap = new Map<string, Set<string>>();
          for (const a of product.attributes || []) {
            const name = String(a.name || '').trim().toLowerCase();
            const value = String(a.value || '').trim().toLowerCase();
            if (!name || !value) continue;
            if (!productAttrMap.has(name)) productAttrMap.set(name, new Set());
            productAttrMap.get(name)!.add(value);
          }

          matchesAttributes = selectedEntries.every(([attrName, values]) => {
            const wanted = values.map(v => String(v).trim().toLowerCase());
            const have = productAttrMap.get(String(attrName).trim().toLowerCase());
            if (!have) return false;
            return wanted.some(v => have.has(v));
          });
        }
      }

      return matchesSpecial && matchesAttributes;
    });
  }, [products, searchQuery, specialFilter, selectedAttributeFilters, selectedCategoryId, t]);

  const clearFilters = () => {
      setSelectedCategoryId(null);
      setSearchQuery('');
      setSpecialFilter('none');
      setSelectedAttributeFilters({});
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO 
        title={t('meta.shopTitle')} 
        description={t('meta.shopDesc')} 
      />

      {/* Header */}
      <div className="bg-gray-100 shadow-sm py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold text-corporate-blue font-heading">{t('shop_data.title')}</h1>
              <p className="text-gray-500 mt-2">{t('shop_data.subtitle')}</p>
            </div>
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder={t('shop_data.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-[#F5F5F5] text-[#1A1A1A] placeholder-gray-500 focus:ring-2 focus:ring-corporate-blue focus:border-transparent outline-none transition-shadow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Special Sections Tabs */}
      <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-8 overflow-x-auto">
             <button 
                onClick={() => setSpecialFilter('none')} 
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${specialFilter === 'none' ? 'border-corporate-blue text-corporate-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             >
                {t('shop_data.tabs.general')}
             </button>
             <button 
                onClick={() => setSpecialFilter('promo')} 
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${specialFilter === 'promo' ? 'border-corporate-red text-corporate-red' : 'border-transparent text-gray-500 hover:text-red-500'}`}
             >
                <Tag className="w-4 h-4 mr-2" /> {t('shop_data.tabs.promo')}
             </button>
             <button 
                onClick={() => setSpecialFilter('refurbished')} 
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${specialFilter === 'refurbished' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-green-500'}`}
             >
                <RotateCw className="w-4 h-4 mr-2" /> {t('shop_data.tabs.refurbished')}
             </button>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center text-corporate-blue font-bold">
                    <Filter className="w-5 h-5 mr-2" />
                    {t('shopPage.filters.title')}
                </div>
                {(Object.keys(selectedAttributeFilters).length > 0 || selectedCategoryId != null || searchQuery.trim().length > 0) && (
                    <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">{t('shopPage.filters.reset')}</button>
                )}
              </div>
              
              {/* Categories */}
              <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">{t('shopPage.filters.category')}</h3>
                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id === 'all' ? null : Number(cat.id))}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          (cat.id === 'all' ? selectedCategoryId == null : selectedCategoryId === Number(cat.id))
                            ? 'bg-corporate-blue text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {isCategoriesLoading && (
                    <p className="text-xs text-gray-400 mt-3">Chargement des catégories…</p>
                  )}
                  {categoriesError && (
                    <p className="text-xs text-red-500 mt-3">{categoriesError}</p>
                  )}

                  {selectedCategoryId == null && (
                    <p className="text-xs text-gray-500 mt-3">
                      Sélectionnez une catégorie pour afficher les filtres d’attributs.
                    </p>
                  )}
              </div>

              {/* Dynamic Category Attributes Filters */}
              {selectedCategoryId != null && availableAttributeFacets.length > 0 && (
                <div className="mb-6 pt-6 border-t border-gray-100 space-y-6">
                  {availableAttributeFacets.map((facet) => (
                    <div key={facet.name}>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">{facet.name}</h3>
                      <div className="space-y-2 max-h-56 overflow-auto pr-1">
                        {facet.values.map((value) => (
                          <label key={value} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(selectedAttributeFilters[facet.name] || []).includes(value)}
                              onChange={() => toggleAttributeValue(facet.name, value)}
                              className="rounded text-corporate-blue focus:ring-corporate-blue"
                            />
                            <span className="text-sm text-gray-600">{value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-gray-100">
                 <Link to="/configurator" className="block p-4 rounded-lg bg-gradient-to-r from-corporate-blue to-blue-900 text-white shadow-md hover:shadow-lg transition-all text-center">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
                    <p className="font-bold text-sm mb-1">{t('shop_data.configurator.title')}</p>
                    <p className="text-xs text-blue-200">{t('shop_data.configurator.subtitle')}</p>
                 </Link>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500 text-lg">Chargement des produits…</p>
              </div>
            ) : loadError ? (
              <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                <p className="text-gray-700 text-lg">Impossible de charger le catalogue.</p>
                <p className="text-gray-500 text-sm mt-2">{loadError}</p>
                <button
                  onClick={loadProducts}
                  className="mt-4 text-corporate-blue hover:underline font-medium"
                >
                  Réessayer
                </button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col group relative">
                    
                    {/* Badge */}
                    {product.badge && (
                      <div className={`absolute top-4 left-4 z-10 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider ${
                        product.badge === 'promo' ? 'bg-red-500' : 
                        product.badge === 'new' ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {product.badge === 'promo'
                          ? t('common.promo')
                          : product.badge === 'new'
                            ? t('common.new')
                            : product.badge === 'refurbished'
                              ? (product.condition === 'refurbished_premium'
                                  ? (t('common.refurbishedPremium') ?? 'Reconditionné Premium')
                                  : (t('common.refurbished') ?? 'Reconditionné'))
                              : t('common.bestSeller')}
                      </div>
                    )}

                    <div className="relative h-56 overflow-hidden p-4 bg-white rounded-t-xl">
                      <LazyImage
                        src={product.image || DEFAULT_PRODUCT_IMAGE} 
                        alt={product.name} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        width={600}
                        height={400}
                      />
                       {product.isRental && (
                        <div className="absolute top-4 right-4 bg-corporate-blue text-white text-[10px] font-bold px-2 py-1 rounded tracking-wider shadow-sm">
                          {t('common.rental')}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                        {product.backendCategoryName ?? product.category}
                      </div>
                      <PrefetchLink to={`/produits/${product.slug || product.id}`} prefetch="hover">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight hover:text-corporate-blue transition-colors">{product.name}</h3>
                      </PrefetchLink>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      
                      <div className="mt-auto space-y-2 mb-6">
                        {product.specs.slice(0, 2).map((spec, i) => (
                            <div key={i} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block mr-2">
                                {spec}
                            </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="font-bold text-corporate-blue">{getPriceDisplay(product.price)}</span>
                        <div className="flex space-x-2">
                            <PrefetchLink to={`/produits/${product.slug || product.id}`} prefetch="hover">
                                <button className="p-2 text-gray-500 hover:text-corporate-blue hover:bg-blue-50 rounded transition-colors" title={t('common.viewDetails')}>
                                    <Eye className="w-5 h-5" />
                                </button>
                          </PrefetchLink>
                            {product.price && product.price !== 'price_on_request' ? (
                              <button
                                type="button"
                                onClick={() => addItem(product, 1)}
                                className="flex items-center text-sm bg-corporate-blue text-white px-3 py-2 rounded hover:bg-blue-900 transition-colors"
                                title="Ajouter au panier"
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </button>
                            ) : (
                              <Link to={`/contact?product=${encodeURIComponent(product.name)}`}>
                                <button className="flex items-center text-sm bg-corporate-blue text-white px-3 py-2 rounded hover:bg-blue-900 transition-colors" title={t('common.askQuote')}>
                                  <ShoppingBag className="w-4 h-4" />
                                </button>
                              </Link>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500 text-lg">{t('shopPage.filters.noResults')}</p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 text-corporate-red hover:underline font-medium"
                >
                  {t('shopPage.filters.reset')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
