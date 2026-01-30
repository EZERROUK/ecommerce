
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Activity, Recycle, GraduationCap, Building, HeartPulse, Headphones, Landmark, LucideIcon, ShoppingBag } from 'lucide-react';
import { Button } from '../components/Button';
import { SEO } from '../components/SEO';
import { SERVICES, SECTORS, COMPANY_INFO, DEFAULT_PRODUCT_IMAGE } from '../constants';
import { TrustBadges } from '../components/TrustBadges';
import { BrandsSection, ClientsSection } from '../components/Partners';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product } from '../types';
import { apiProductToUiProduct } from '../utils/apiMappers';
import { fetchBestSellers, fetchNewProducts, fetchProduct, fetchProducts } from '../utils/apiCatalog';
import { useCart } from '../contexts/CartContext';
import { LazyImage } from '../components/LazyImage';
import { prefetchRoute } from '../utils/routePrefetch';

const sectorIcons: { [key: string]: LucideIcon } = {
  GraduationCap, Building, HeartPulse, Headphones, Landmark
};

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { addItem } = useCart();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [showAddToCartToast, setShowAddToCartToast] = useState(false);
  const addToCartToastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const uniqById = (items: Product[]) => {
      const seen = new Set<string>();
      return items.filter(p => {
        const key = String(p.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const loadFeatured = async () => {
      try {
        if (!cancelled) {
          setIsFeaturedLoading(true);
          setFeaturedError(null);
        }

        const picked: Product[] = [];

        const best = await fetchBestSellers();
        const bestList = Array.isArray((best as any).products) ? (best as any).products : (best as any).products?.data;
        picked.push(...(bestList || []).map(apiProductToUiProduct));

        if (picked.length < 4) {
          const news = await fetchNewProducts();
          const newList = Array.isArray((news as any).products) ? (news as any).products : (news as any).products?.data;
          picked.push(...(newList || []).map(apiProductToUiProduct));
        }

        if (picked.length < 4) {
          const list = await fetchProducts({ page: 1 });
          picked.push(...(list.data || []).map(apiProductToUiProduct));
        }

        const finalItems = uniqById(picked).slice(0, 4);

        // Les endpoints /products/new et /products/best-sellers peuvent ne pas inclure `images`.
        // On hydrate donc via /products/{id} (max 4 produits) pour récupérer les images.
        const hydrated = await Promise.all(
          finalItems.map(async (p) => {
            if (p.image) return p;
            try {
              const res = await fetchProduct(String(p.id));
              return apiProductToUiProduct(res.data);
            } catch {
              return p;
            }
          })
        );

        if (!cancelled) {
          setFeaturedProducts(hydrated);
          setIsFeaturedLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setFeaturedProducts([]);
          setIsFeaturedLoading(false);
          setFeaturedError('Impossible de charger les produits.');
        }
      }
    };

    loadFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  const triggerAddToCartToast = () => {
    setShowAddToCartToast(true);
    if (addToCartToastTimeoutRef.current !== null) {
      window.clearTimeout(addToCartToastTimeoutRef.current);
    }
    addToCartToastTimeoutRef.current = window.setTimeout(() => {
      setShowAddToCartToast(false);
      addToCartToastTimeoutRef.current = null;
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (addToCartToastTimeoutRef.current !== null) {
        window.clearTimeout(addToCartToastTimeoutRef.current);
      }
    };
  }, []);

  const featuredToDisplay = useMemo(() => featuredProducts.slice(0, 4), [featuredProducts]);

  // Schema.org for LocalBusiness/Organization
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "ComputerStore",
    "name": COMPANY_INFO.name,
    "image": "https://x-zone.ma/logo.png",
    "telephone": COMPANY_INFO.phone,
    "email": COMPANY_INFO.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bd Anfa",
      "addressLocality": "Casablanca",
      "addressCountry": "MA"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "08:30",
      "closes": "18:30"
    },
    "url": "https://x-zone.ma",
    "priceRange": "$$"
  };

  const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": "https://x-zone.ma/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://x-zone.ma/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
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

  return (
    <div className="bg-white">
      <SEO 
        title={t('meta.homeTitle')} 
        description={t('meta.homeDesc')}
        schema={[orgSchema, websiteSchema]}
      />

      {/* Hero Section - Optimized Compact Version */}
      <section className="relative h-[500px] md:h-[580px] flex items-center justify-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <LazyImage
            src="/images/HomeBanner.avif"
            alt="Infrastructure Serveur Datacenter Maroc - X-Zone Technologie" 
            className="w-full h-full object-cover"
            width="1920"
            height="1080"
            loading="eager" // LCP optimization
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-corporate-blue/80 mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
          <div className="md:w-2/3">
            <span className="inline-block px-4 py-1 rounded-full bg-corporate-red/90 text-white text-sm font-semibold mb-4 tracking-wider">
              {t('home.hero.since')}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold font-heading text-white leading-[1.1] mb-4 whitespace-pre-line">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl text-gray-200 mb-6 font-light max-w-2xl whitespace-pre-line">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/produits" onMouseEnter={() => prefetchRoute('/produits')} onFocus={() => prefetchRoute('/produits')}>
                <Button>{t('home.hero.ctaProducts')}</Button>
              </Link>
              <Link to="/contact" onMouseEnter={() => prefetchRoute('/contact')} onFocus={() => prefetchRoute('/contact')}>
                <Button className="!bg-white !text-corporate-red hover:!bg-corporate-blue hover:!text-white hover:!border-corporate-blue transition-all duration-200 shadow-lg border">
                  {t('home.hero.ctaQuote')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges - Feature 5 */}
      <TrustBadges />

      {/* Solutions by Sector - Feature 2 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-corporate-blue mb-4 font-heading">{t('home.sectors.title')}</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    {t('home.sectors.subtitle')}
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {SECTORS.map((sector) => {
                    const Icon = sectorIcons[sector.icon] || Building;
                    return (
                        <Link key={sector.id} to={`/solutions/${sector.id}`} className="group">
                            <article className="flex flex-col items-center p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-xl hover:border-corporate-blue transition-all duration-300 h-full">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-corporate-blue mb-4 group-hover:bg-corporate-blue group-hover:text-white transition-colors">
                                    <Icon className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2 text-center group-hover:text-corporate-red transition-colors">
                                  {t(`sectors_data.${sector.id}.title`)}
                                </h3>
                                <p className="text-xs text-gray-500 text-center">
                                  {t(`sectors_data.${sector.id}.description`)}
                                </p>
                            </article>
                        </Link>
                    )
                })}
            </div>
        </div>
      </section>

      {/* Diagnostic & Buyback Split Section - Feature 1 & 3 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Diagnostic */}
                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 flex flex-col items-start border-t-4 border-corporate-blue">
                    <div className="bg-blue-100 p-3 rounded-lg mb-6 text-corporate-blue">
                        <Activity className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-corporate-blue mb-4">{t('home.diagnostic.title')}</h3>
                    <p className="text-gray-600 mb-8 flex-1">
                        {t('home.diagnostic.desc')}
                    </p>
                    <Link to="/diagnostic">
                        <Button>{t('home.diagnostic.cta')}</Button>
                    </Link>
                </div>

                {/* Buyback */}
                <div className="bg-corporate-blue text-white rounded-2xl shadow-lg p-8 md:p-12 flex flex-col items-start relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
                    <div className="bg-white/10 p-3 rounded-lg mb-6 text-white backdrop-blur-sm relative z-10">
                        <Recycle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{t('home.buyback.title')}</h3>
                    <p className="text-blue-200 mb-8 flex-1 relative z-10">
                        {t('home.buyback.desc')}
                    </p>
                    <Link to="/rachat" className="relative z-10">
                         <Button variant="white">{t('home.buyback.cta')}</Button>
                    </Link>
                </div>
            </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-corporate-blue mb-4 font-heading">{t('home.services.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('home.services.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICES.slice(0, 3).map((service) => (
              <article key={service.id} className="bg-white p-8 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="w-14 h-14 bg-corporate-blue/10 rounded-lg flex items-center justify-center mb-6 text-corporate-blue group-hover:bg-corporate-red group-hover:text-white transition-colors">
                  <Star className="w-8 h-8" /> 
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-heading">
                  {t(`services_data.${service.slug}.title`)}
                </h3>
                <p className="text-gray-600 mb-6">{t(`services_data.${service.slug}.shortDescription`)}</p>
                <Link to={`/services/${service.slug}`} className="text-corporate-red font-semibold flex items-center hover:text-red-700">
                  {t('home.services.readMore')} <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-corporate-blue text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-corporate-red rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-2">{t('home.products.title')}</h2>
              <p className="text-gray-300">{t('home.products.subtitle')}</p>
            </div>
            <Link to="/produits" className="hidden md:flex items-center text-white hover:text-corporate-red transition-colors">
              {t('home.products.viewAll')} <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-lg">
                  <div className="h-48 bg-gray-100 animate-pulse" />
                  <div className="p-4">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="mt-4 h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredToDisplay.map((product) => {
              const productUrl = `/produits/${product.slug || product.id}`;
              // Hydrate translation
              const translatedName = t(`products_data.${product.id}.name`);
              const displayName = translatedName !== `products_data.${product.id}.name` ? translatedName : product.name;

              return (
              <article key={product.id} className="bg-white rounded-lg overflow-hidden shadow-lg group">
                <div className="h-48 overflow-hidden relative">
                   <img 
                    src={product.image || DEFAULT_PRODUCT_IMAGE} 
                    alt={product.imageAlt || displayName}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    width="400"
                    height="300"
                  />
                  {product.isRental && (
                    <div className="absolute top-2 right-2 bg-corporate-red text-white text-xs font-bold px-2 py-1 rounded">
                      {t('common.rental')}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">{product.category}</div>
                  <Link to={productUrl}>
                    <h3 className="text-gray-900 font-bold mb-2 truncate hover:text-corporate-blue transition-colors">{displayName}</h3>
                  </Link>
                  <div className="flex justify-between items-center mt-4 relative">
                    <span className="text-corporate-blue font-bold text-sm">{getPriceDisplay(product.price)}</span>
                    {product.price && product.price !== 'price_on_request' ? (
                      <button
                        type="button"
                        onClick={() => {
                          addItem(product, 1);
                          triggerAddToCartToast();
                        }}
                        className="text-xs bg-gray-100 hover:bg-corporate-red hover:text-white text-gray-800 py-1.5 px-3 rounded transition-colors inline-flex items-center"
                        aria-label={`Ajouter ${displayName} au panier`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> {t('common.addToCart')}
                      </button>
                    ) : (
                      <Link to={`/contact?product=${encodeURIComponent(displayName)}`}>
                        <button className="text-xs bg-gray-100 hover:bg-corporate-red hover:text-white text-gray-800 py-1.5 px-3 rounded transition-colors" aria-label={`Demander un devis pour ${displayName}`}>
                          {t('home.products.quote')}
                        </button>
                      </Link>
                    )}

                    {showAddToCartToast && (
                      <div className="absolute -bottom-10 right-0 w-max max-w-[220px] bg-gray-900 text-white text-xs py-2 px-3 rounded-lg shadow-lg z-50 animate-fade-in text-center">
                        {t('common.addedToCart')}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )})}
          </div>
          ) : (
            <div className="bg-white/10 border border-white/10 rounded-xl p-6 text-center">
              <p className="text-gray-200">{featuredError || 'Aucun produit à afficher pour le moment.'}</p>
              <Link to="/produits" className="inline-flex items-center justify-center mt-4 text-white hover:text-corporate-red transition-colors">
                {t('home.products.viewAll')} <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Brands & References Section */}
      <BrandsSection />
      <ClientsSection />

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-corporate-blue mb-6 font-heading">
            {t('home.ctaBottom.title')}
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {t('home.ctaBottom.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/contact">
              <Button>{t('home.ctaBottom.ctaChat')}</Button>
            </Link>
            <a href="tel:+212522000000" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <span className="mr-2">📞</span> {t('home.ctaBottom.ctaCall')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
