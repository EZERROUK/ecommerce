
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Download, ShoppingBag, Star, Info, Calculator, Layers, ShieldCheck, Truck, Clock, Server, User, AlertCircle, FileText, Cpu, HardDrive, Box } from 'lucide-react';
import { SEO } from '../components/SEO';
import { LazyImage } from '../components/LazyImage';
import { PrefetchLink } from '../components/PrefetchLink';
import { Button } from '../components/Button';
import { PRODUCTS, COMPANY_INFO, DEFAULT_PRODUCT_IMAGE } from '../constants';
import { Product, ProductReview } from '../types';
import { generatePDF } from '../utils/pdfGenerator';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchProduct, fetchProductBySlug, fetchRecommended, fetchProductReviews, submitProductReview } from '../utils/apiCatalog';
import { apiProductToUiProduct } from '../utils/apiMappers';
import { useCart } from '../contexts/CartContext';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
    const [productApiId, setProductApiId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const { addItem } = useCart();
    const [showAddToCartToast, setShowAddToCartToast] = useState(false);
    const addToCartToastTimeoutRef = useRef<number | null>(null);
  const [rentalDays, setRentalDays] = useState(1);
  const [rentalQty, setRentalQty] = useState(1);
  const { t } = useLanguage();

    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
    const [reviewSubmitMessage, setReviewSubmitMessage] = useState<string | null>(null);
    const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);
    const [reviewForm, setReviewForm] = useState({
        authorName: '',
        authorEmail: '',
        rating: 5,
        comment: '',
    });

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

  // 3D Configurator State
  const [config3D, setConfig3D] = useState({
    ram: 0, // 0 = standard, 1 = high
    storage: 0, // 0 = standard, 1 = max
  });

  useEffect(() => {
        let isCancelled = false;

        const isUuid = (value: string) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

        const hydrateProduct = (p: Product): Product => {
            const translatedName = t(`products_data.${p.id}.name`);
            const translatedDesc = t(`products_data.${p.id}.description`);
            const translatedFullDesc = t(`products_data.${p.id}.fullDescription`);
            const translatedSpecs = t(`products_data.${p.id}.specs`);

            return {
                ...p,
                name: translatedName !== `products_data.${p.id}.name` ? translatedName : p.name,
                description: translatedDesc !== `products_data.${p.id}.description` ? translatedDesc : p.description,
                fullDescription: translatedFullDesc !== `products_data.${p.id}.fullDescription` ? translatedFullDesc : p.fullDescription,
                specs: Array.isArray(translatedSpecs) ? translatedSpecs : p.specs,
            };
        };

        const load = async () => {
            if (!id) return;

            setIsLoading(true);
            setLoadError(null);
            setProductApiId(null);

            // Priorité: API
            try {
                const res = isUuid(id) ? await fetchProduct(id) : await fetchProductBySlug(id);
                const uiProduct = hydrateProduct(apiProductToUiProduct(res.data));

                const apiId = uiProduct.id;
                const recRes = apiId && isUuid(apiId) ? await fetchRecommended(apiId).catch(() => null) : null;
                const recList = Array.isArray((recRes as any)?.products)
                    ? (recRes as any).products
                    : (recRes as any)?.products?.data;
                const recs = recList
                    ? recList.map(apiProductToUiProduct).map(hydrateProduct).slice(0, 3)
                    : [];

                if (!isCancelled) {
                    setProduct(uiProduct);
                    setProductApiId(apiId && isUuid(apiId) ? apiId : null);
                    setRecommendations(recs);
                }
                return;
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Erreur lors du chargement du produit.';
                if (!isCancelled) setLoadError(message);
            }

            // Fallback: données statiques (utile si route utilise un slug)
            const found = PRODUCTS.find(p => p.id === id || p.slug === id);

            if (found) {
                const hydrated = hydrateProduct(found);
                const recs = PRODUCTS
                    .filter(p => p.category === found.category && p.id !== found.id)
                    .slice(0, 3)
                    .map(hydrateProduct);

                if (!isCancelled) {
                    setProduct(hydrated);
                    setProductApiId(null);
                    setRecommendations(recs);
                }
            } else {
                if (!isCancelled) {
                    setProduct(null);
                    setProductApiId(null);
                }
            }
        };

        load().finally(() => {
            if (!isCancelled) setIsLoading(false);
        });

        return () => {
            isCancelled = true;
        };
  }, [id, t]); // Add t dependency

    useEffect(() => {
        let cancelled = false;
        const loadReviews = async () => {
            if (!productApiId) return;
            setReviewsLoading(true);
            try {
                const res = await fetchProductReviews(productApiId);
                const list = (res?.data ?? []).map((r) => ({
                    id: r.id,
                    authorName: r.author_name,
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.created_at,
                }));
                if (!cancelled) setReviews(list);
            } catch {
                if (!cancelled) setReviews([]);
            } finally {
                if (!cancelled) setReviewsLoading(false);
            }
        };

        loadReviews();
        return () => {
            cancelled = true;
        };
    }, [productApiId]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productApiId) return;

        setReviewSubmitLoading(true);
        setReviewSubmitMessage(null);
        setReviewSubmitError(null);

        try {
            const res = await submitProductReview(productApiId, {
                author_name: reviewForm.authorName.trim(),
                author_email: reviewForm.authorEmail.trim() || undefined,
                rating: Number(reviewForm.rating) || 5,
                comment: reviewForm.comment.trim(),
            });

            setReviewSubmitMessage(res.message || 'Merci ! Votre avis est en attente de validation.');
            setReviewForm({ authorName: '', authorEmail: '', rating: 5, comment: '' });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi de l'avis.";
            setReviewSubmitError(msg);
        } finally {
            setReviewSubmitLoading(false);
        }
    };

  const handleDownloadQuote = () => {
      if (!product) return;
      const today = new Date();
      const validity = new Date();
      validity.setDate(today.getDate() + 15);
      generatePDF({
          type: 'DEVIS',
          reference: `WEB-${Math.floor(Math.random() * 10000)}`,
          date: today.toLocaleDateString('fr-MA'),
          validityDate: validity.toLocaleDateString('fr-MA'),
          client: { name: "Client Web", address: "Maroc" },
          items: [{ description: product.name, quantity: 1, unitPrice: 0 }]
      });
  };

  const handleConfig3DChange = () => {
      // Pass exact configuration labels to the contact form message
      const ramLabel = config3D.ram === 0 ? 'Standard' : 'Max (+32GB)';
      const storageLabel = config3D.storage === 0 ? 'Standard' : 'Performance (NVMe)';
      
      return `/contact?product=${encodeURIComponent(product?.name || '')}&type=custom_config&ram=${encodeURIComponent(ramLabel)}&storage=${encodeURIComponent(storageLabel)}`;
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

    if (isLoading && !product) {
        return (
            <div className="py-20 text-center">
                <p className="text-gray-500 text-lg">Chargement du produit…</p>
            </div>
        );
    }

    if (!product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-corporate-blue">Produit non trouvé</h2>
                {loadError && <p className="text-gray-500 mt-2">{loadError}</p>}
        <Link to="/produits" className="text-corporate-red mt-4 inline-block hover:underline">Retour au catalogue</Link>
      </div>
    );
  }

  const rentalBasePrice = 500;
  const rentalTotal = rentalBasePrice * rentalDays * rentalQty;

    const canOrder = Boolean(product.price && product.price !== 'price_on_request');

    const canonicalPath = `/produits/${encodeURIComponent(product.slug || id || product.id)}`;

    const parseNumericPrice = (value: unknown): number | null => {
        if (typeof value !== 'string' && typeof value !== 'number') return null;
        const raw = String(value).trim();
        if (!raw) return null;
        if (raw === 'price_on_request') return null;
        const normalized = raw.replace(/\s/g, '').replace(',', '.');
        const n = Number(normalized);
        return Number.isFinite(n) ? n : null;
    };

    const priceValue = parseNumericPrice(product.price);

    const productSchema: any = {
        '@type': 'Product',
        name: product.name,
        description: product.metaDesc || product.description,
        image: [product.image || DEFAULT_PRODUCT_IMAGE],
        sku: product.sku || product.id,
        brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
        url: `https://x-zone.ma${canonicalPath}`,
        offers:
            priceValue != null
                ? {
                      '@type': 'Offer',
                      priceCurrency: 'MAD',
                      price: priceValue,
                      availability: 'https://schema.org/InStock',
                      url: `https://x-zone.ma${canonicalPath}`,
                  }
                : undefined,
    };

    Object.keys(productSchema).forEach((k) => productSchema[k] == null && delete productSchema[k]);

    const breadcrumbSchema = {
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: t('nav.home'),
                item: 'https://x-zone.ma/',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: t('nav.catalog'),
                item: 'https://x-zone.ma/produits',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: product.name,
                item: `https://x-zone.ma${canonicalPath}`,
            },
        ],
    };

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEO
        title={product.metaTitle || product.name}
        description={product.metaDesc || product.description}
        image={product.image || DEFAULT_PRODUCT_IMAGE}
        type="product"
        canonicalPath={canonicalPath}
        schema={[productSchema, breadcrumbSchema]}
      />

      {/* Breadcrumb */}
      <nav aria-label="Fil d'ariane" className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ol className="flex items-center text-sm text-gray-500 list-none p-0 m-0">
            <li><Link to="/" className="hover:text-corporate-blue">{t('nav.home')}</Link><span className="mx-2">/</span></li>
            <li><Link to="/produits" className="hover:text-corporate-blue">{t('nav.catalog')}</Link><span className="mx-2">/</span></li>
            <li><span className="text-corporate-red font-medium">{product.name}</span></li>
          </ol>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Product Content */}
            <div className="lg:col-span-2">
                <article className="bg-white rounded-2xl shadow-sm overflow-hidden p-8 border border-gray-100">
                    <div className="space-y-8">
                        {/* Image Section */}
                        <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center border border-gray-100 group">
                                                        <LazyImage
                                                            src={product.image || DEFAULT_PRODUCT_IMAGE}
                                                            alt={product.name}
                                                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                                            width={1280}
                                                            height={720}
                                                            loading="eager"
                                                            fetchPriority="high"
                                                        />
                            {product.badge && (
                                <div className="absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full uppercase bg-blue-500">
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
                        </div>

                        {/* Info Section */}
                        <div>
                            <h1 className="text-3xl font-bold text-corporate-blue font-heading mb-2">{product.name}</h1>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < (product.rating || 5) ? 'fill-current' : 'text-gray-300'}`} />)}
                                </div>
                                <span className="text-sm text-gray-500">(Basé sur les avis clients)</span>
                            </div>

                            <div className="mb-4">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">{t('common.price') ?? 'Prix'}</div>
                                <div className="text-2xl font-bold text-corporate-red">
                                    {getPriceDisplay(product.price) || t('common.price_on_request')}
                                </div>
                            </div>

                                                        {product.condition && (
                                                            <div className="mb-6">
                                                                <div className="text-xs text-gray-500 uppercase tracking-wider">{t('common.condition') ?? 'État'}</div>
                                                                <div className="text-sm font-semibold text-gray-800">
                                                                    {product.condition === 'new'
                                                                        ? (t('common.conditionNew') ?? 'Neuf')
                                                                        : product.condition === 'refurbished'
                                                                            ? (t('common.refurbished') ?? 'Reconditionné')
                                                                            : (t('common.refurbishedPremium') ?? 'Reconditionné Premium')}
                                                                </div>
                                                            </div>
                                                        )}
                            
                            <p className="prose max-w-none text-gray-600 text-lg leading-relaxed mb-6">{product.fullDescription || product.description}</p>

                            {/* Specifications */}
                            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center"><Info className="w-5 h-5 mr-2 text-corporate-red" /> {t('common.specWarranty')}</h2>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                {product.specs.map((spec, idx) => (
                                    <li key={idx} className="flex items-center bg-gray-50 px-3 py-2 rounded text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 bg-corporate-blue rounded-full mr-2"></div>
                                    {spec}
                                    </li>
                                ))}
                            </ul>

                            {/* Documents (fiche technique, guide d'installation, etc.) */}
                            {(product.documents && product.documents.length > 0) && (
                                <div className="mb-8 border-t border-gray-100 pt-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-corporate-blue" /> {t('common.technicalDocs')}
                                    </h3>
                                    {(() => {
                                      const typeLabel = (type?: string) => {
                                        switch ((type || '').trim()) {
                                          case 'install_guide': return "Guide d'installation"
                                          case 'datasheet': return 'Fiche technique'
                                          case 'user_manual': return 'Manuel utilisateur'
                                          case 'quick_start': return 'Guide de démarrage rapide'
                                          case 'warranty': return 'Garantie'
                                          case 'certificate': return 'Certificat'
                                          case 'brochure': return 'Brochure'
                                          case 'safety_sheet': return 'Fiche de sécurité'
                                          case 'drivers': return 'Pilotes / Drivers'
                                          case 'schematics': return 'Schémas'
                                                                                    default: return 'Fiche technique'
                                        }
                                      }

                                      return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {product.documents.map((doc) => (
                                            <a
                                                key={doc.id}
                                                href={doc.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-corporate-blue transition-colors bg-gray-50"
                                            >
                                                <FileText className="w-8 h-8 text-red-500 mr-3" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-gray-800 truncate">{typeLabel((doc as any).type)}</p>
                                                </div>
                                                <Download className="w-4 h-4 text-gray-400 ml-auto" />
                                            </a>
                                        ))}
                                    </div>
                                      )
                                    })()}
                                </div>
                            )}
                            
                            {/* Feature 16: Illustrative 3D Configurator */}
                            {product.category === 'server' || product.category === 'desktop' ? (
                                <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900 flex items-center"><Box className="w-5 h-5 mr-2 text-corporate-blue" /> {t('common.visualConfig')}</h3>
                                        <span className="text-xs text-corporate-red font-bold uppercase tracking-wider">{t('common.interactiveMode')}</span>
                                    </div>
                                    <div className="p-6 bg-white flex flex-col md:flex-row gap-8">
                                        {/* Visual Representation (Stylized) */}
                                        <div className="w-full md:w-1/2 bg-gray-100 rounded-lg p-6 flex items-center justify-center relative min-h-[200px]">
                                            <div className="relative w-32 h-40 border-4 border-gray-400 rounded-lg bg-gray-800 shadow-xl transition-all duration-500 transform hover:rotate-y-12">
                                                {/* Internal Slots Visualization */}
                                                <div className="absolute top-2 left-2 right-2 h-8 border-b border-gray-600 flex items-center justify-center">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                </div>
                                                {/* RAM Slots */}
                                                <div className={`absolute top-12 left-4 w-12 h-16 border border-gray-600 transition-all ${config3D.ram ? 'bg-green-900/50 border-green-500' : 'bg-transparent'}`}>
                                                    <span className="text-[8px] text-gray-400 block text-center mt-6">RAM</span>
                                                </div>
                                                {/* Storage Slots */}
                                                <div className={`absolute bottom-4 left-4 right-4 h-8 border border-gray-600 transition-all ${config3D.storage ? 'bg-blue-900/50 border-blue-500' : 'bg-transparent'}`}>
                                                    <span className="text-[8px] text-gray-400 block text-center mt-2">STORAGE</span>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 text-xs text-gray-400 italic">Vue interne simplifiée</div>
                                        </div>
                                        
                                        {/* Controls */}
                                        <div className="w-full md:w-1/2 space-y-4">
                                            <div>
                                                <label className="text-sm font-bold text-gray-700 flex items-center mb-2"><Cpu className="w-4 h-4 mr-2" /> {t('common.memory')}</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setConfig3D({...config3D, ram: 0})} className={`flex-1 py-2 text-xs border rounded ${!config3D.ram ? 'bg-corporate-blue text-white border-corporate-blue' : 'bg-white text-gray-600'}`}>Standard</button>
                                                    <button onClick={() => setConfig3D({...config3D, ram: 1})} className={`flex-1 py-2 text-xs border rounded ${config3D.ram ? 'bg-corporate-blue text-white border-corporate-blue' : 'bg-white text-gray-600'}`}>Max (+32GB)</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-gray-700 flex items-center mb-2"><HardDrive className="w-4 h-4 mr-2" /> {t('common.storage')}</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setConfig3D({...config3D, storage: 0})} className={`flex-1 py-2 text-xs border rounded ${!config3D.storage ? 'bg-corporate-blue text-white border-corporate-blue' : 'bg-white text-gray-600'}`}>Standard</button>
                                                    <button onClick={() => setConfig3D({...config3D, storage: 1})} className={`flex-1 py-2 text-xs border rounded ${config3D.storage ? 'bg-corporate-blue text-white border-corporate-blue' : 'bg-white text-gray-600'}`}>Performance (NVMe)</button>
                                                </div>
                                            </div>
                                            <div className="pt-4">
                                                <Link to={handleConfig3DChange()}>
                                                    <Button className="w-full text-sm">{t('common.requestConfigQuote')}</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                                                            {canOrder ? (
                                                                <>
                                                                    <div className="flex-1 relative">
                                                                        <Button
                                                                            type="button"
                                                                            className="w-full flex items-center justify-center"
                                                                            onClick={() => {
                                                                                addItem(product, 1);
                                                                                triggerAddToCartToast();
                                                                            }}
                                                                        >
                                                                            <ShoppingBag className="w-5 h-5 mr-2" /> Ajouter au panier
                                                                        </Button>
                                                                        {showAddToCartToast && (
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[240px] bg-gray-900 text-white text-xs py-2 px-3 rounded-lg shadow-lg z-50 animate-fade-in text-center">
                                                                                {t('common.addedToCart')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <Button
                                                                            type="button"
                                                                            className="w-full flex items-center justify-center"
                                                                            onClick={() => {
                                                                                addItem(product, 1);
                                                                                navigate('/checkout');
                                                                            }}
                                                                        >
                                                                            <ShoppingBag className="w-5 h-5 mr-2" /> Commander maintenant
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <Link to={`/contact?product=${encodeURIComponent(product.name)}`} className="flex-1">
                                                                    <Button className="w-full flex items-center justify-center">
                                                                        <ShoppingBag className="w-5 h-5 mr-2" /> {t('common.askQuote')}
                                                                    </Button>
                                                                </Link>
                                                            )}
                            </div>
                        </div>
                    </div>
                </article>

                 {/* Rental Simulator (Conditional) */}
                {product.isRental && (
                <section className="mt-8 bg-white rounded-2xl shadow-sm p-8 border border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-corporate-blue mb-6 flex items-center font-heading">
                        <Calculator className="w-6 h-6 mr-3 text-corporate-red" />
                        {t('common.rentalSimulator')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.durationDays')}</label>
                        <input 
                            type="number" 
                            min="1" 
                            value={rentalDays} 
                            onChange={(e) => setRentalDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.quantity')}</label>
                        <input 
                            type="number" 
                            min="1" 
                            value={rentalQty} 
                            onChange={(e) => setRentalQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-corporate-blue outline-none"
                        />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">Estimation HT</div>
                        <div className="text-2xl font-bold text-corporate-red">
                            {rentalTotal} MAD*
                        </div>
                        <div className="text-[10px] text-gray-400 italic">*Prix indicatif hors livraison</div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Link to={`/contact?product=${encodeURIComponent(product.name)}`}>
                            <Button variant="secondary" className="w-full md:w-auto">{t('common.receiveOffer')}</Button>
                        </Link>
                    </div>
                    </div>
                </section>
                )}

                {/* Avis & commentaires (modérés) */}
                <section className="mt-8">
                    <h2 className="text-xl font-bold text-corporate-blue mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2" /> Avis & commentaires
                    </h2>

                    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                        <h3 className="font-bold text-gray-900 mb-3">Laisser un avis</h3>
                        <form onSubmit={handleSubmitReview} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                <input
                                    value={reviewForm.authorName}
                                    onChange={(e) => setReviewForm((s) => ({ ...s, authorName: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2"
                                    required
                                    maxLength={100}
                                    placeholder="Votre nom"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optionnel)</label>
                                <input
                                    type="email"
                                    value={reviewForm.authorEmail}
                                    onChange={(e) => setReviewForm((s) => ({ ...s, authorEmail: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2"
                                    maxLength={255}
                                    placeholder="vous@exemple.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                <div className="flex items-center gap-1" role="radiogroup" aria-label="Note sur 5">
                                    {[1, 2, 3, 4, 5].map((n) => {
                                        const active = n <= (reviewForm.rating || 0);
                                        return (
                                            <button
                                                key={n}
                                                type="button"
                                                role="radio"
                                                aria-checked={reviewForm.rating === n}
                                                aria-label={`${n} sur 5`}
                                                onClick={() => setReviewForm((s) => ({ ...s, rating: n }))}
                                                className="p-1 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-corporate-blue"
                                            >
                                                <Star className={`w-6 h-6 ${active ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                                            </button>
                                        );
                                    })}
                                    <span className="ml-2 text-sm text-gray-600">{reviewForm.rating}/5</span>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm((s) => ({ ...s, comment: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2"
                                    required
                                    maxLength={2000}
                                    rows={4}
                                    placeholder="Partagez votre expérience…"
                                />
                            </div>
                            <div className="md:col-span-2 flex items-center justify-between gap-3">
                                <div className="text-xs text-gray-500">Les avis sont affichés après validation par l’administrateur.</div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="whitespace-nowrap"
                                    disabled={reviewSubmitLoading}
                                >
                                    {reviewSubmitLoading ? 'Envoi…' : 'Envoyer'}
                                </Button>
                            </div>
                            {reviewSubmitMessage && (
                                <div className="md:col-span-2 text-sm text-emerald-700">{reviewSubmitMessage}</div>
                            )}
                            {reviewSubmitError && (
                                <div className="md:col-span-2 text-sm text-red-600">{reviewSubmitError}</div>
                            )}
                        </form>
                    </div>

                    <div className="grid gap-4">
                        {reviewsLoading ? (
                            <div className="text-sm text-gray-500">Chargement des avis…</div>
                        ) : reviews.length === 0 ? (
                            <div className="text-sm text-gray-500">Aucun avis pour le moment.</div>
                        ) : (
                            reviews.map((r) => (
                                <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{r.authorName}</p>
                                            {r.createdAt && (
                                                <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
                                            )}
                                        </div>
                                        <div className="flex text-yellow-400 text-xs">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < Math.round(r.rating) ? 'fill-current' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700">{r.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Sidebar with Trust Badges */}
            <aside className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-corporate-blue mb-4 text-lg">{t('common.whyChoose')}</h3>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <ShieldCheck className="w-6 h-6 text-corporate-red mr-3 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">{t('common.officialWarranty')}</h4>
                                <p className="text-xs text-gray-500">{t('common.officialWarrantyDesc')}</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <Truck className="w-6 h-6 text-corporate-red mr-3 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">{t('common.deliveryInstall')}</h4>
                                <p className="text-xs text-gray-500">{t('common.deliveryInstallDesc')}</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <Clock className="w-6 h-6 text-corporate-red mr-3 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">{t('common.reactiveSupport')}</h4>
                                <p className="text-xs text-gray-500">{t('common.reactiveSupportDesc')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                     <p className="text-sm text-corporate-blue font-semibold mb-2">{t('common.needAdvice')}</p>
                     <p className="text-xs text-gray-600 mb-4">{t('common.adviceDesc')}</p>
                     <a href={`tel:${COMPANY_INFO.phone}`} className="text-corporate-red font-bold text-sm hover:underline">{t('common.callSales')}</a>
                </div>
            </aside>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-corporate-blue mb-6 font-heading">{t('common.similarProducts')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                                <PrefetchLink key={rec.id} to={`/produits/${rec.slug || rec.id}`} className="block group" prefetch="both">
                  <article className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
                    <div className="h-48 overflow-hidden p-4 bg-gray-50">
                                            <LazyImage
                                                src={rec.image || DEFAULT_PRODUCT_IMAGE}
                                                alt={rec.imageAlt || rec.name}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                width={600}
                                                height={400}
                                                loading="lazy"
                                            />
                    </div>
                    <div className="p-4">
                       <h3 className="font-bold text-gray-900 mb-1 truncate">{rec.name}</h3>
                       <p className="text-sm text-corporate-blue">{getPriceDisplay(rec.price)}</p>
                    </div>
                  </article>
                                </PrefetchLink>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
