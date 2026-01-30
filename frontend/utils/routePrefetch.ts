type Importer = () => Promise<unknown>;

export type PrefetchOptions = {
  /**
   * Contexte d'appel (debug/observabilité). N'impacte pas la logique.
   */
  reason?: 'hover' | 'focus' | 'visible' | 'idle' | 'manual';
  /**
   * Bypass des garde-fous (à éviter sauf cas particulier).
   */
  force?: boolean;
};

const importers: Record<string, Importer> = {
  '/': () => import('../pages/Home'),
  '/about': () => import('../pages/About'),
  '/services': () => import('../pages/Services'),
  '/shop': () => import('../pages/Shop'),
  '/produits': () => import('../pages/Shop'),
  '/contact': () => import('../pages/Contact'),
  '/blog': () => import('../pages/Blog'),
  '/knowledge': () => import('../pages/KnowledgeCenter'),
  '/faq': () => import('../pages/FAQ'),
  '/success-stories': () => import('../pages/SuccessStories'),
  '/compare': () => import('../pages/Compare'),
  '/diagnostic': () => import('../pages/Diagnostic'),
  '/solutions': () => import('../pages/SectorDetail'),
  '/rachat': () => import('../pages/Buyback'),
  '/search': () => import('../pages/AdvancedSearch'),
  '/configurator': () => import('../pages/Configurator'),
  '/client-area': () => import('../pages/ClientArea'),
  '/cart': () => import('../pages/Cart'),
  '/checkout': () => import('../pages/Checkout'),
  '/order-success': () => import('../pages/OrderSuccess'),
  '/order-tracking': () => import('../pages/OrderTracking'),

  // virtual keys (dynamic routes)
  '/product-detail': () => import('../pages/ProductDetail'),
  '/article-detail': () => import('../pages/ArticleDetail'),
};

const prefetchedKeys = new Set<string>();

const MAX_PREFETCHES_PER_PAGE = 10;
let prefetchCount = 0;

const getConnection = (): any => {
  if (typeof navigator === 'undefined') return null;
  return (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection || null;
};

const shouldAllowPrefetch = (): boolean => {
  // SSR / tests
  if (typeof window === 'undefined') return false;

  const conn = getConnection();
  const saveData = Boolean(conn?.saveData);
  const effectiveType = String(conn?.effectiveType || '');

  if (saveData) return false;
  if (['slow-2g', '2g', '3g'].includes(effectiveType)) return false;

  // Budget global pour éviter de saturer le réseau si beaucoup de liens sont visibles.
  if (prefetchCount >= MAX_PREFETCHES_PER_PAGE) return false;

  return true;
};

const scheduleIdle = (cb: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;

  const w = window as unknown as {
    requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof w.requestIdleCallback === 'function' && typeof w.cancelIdleCallback === 'function') {
    const id = w.requestIdleCallback(cb, { timeout: 1500 });
    return () => w.cancelIdleCallback?.(id);
  }

  const id = window.setTimeout(cb, 800);
  return () => window.clearTimeout(id);
};

const normalizePathKey = (to: string): string => {
  const raw = String(to || '/');
  const withoutHash = raw.split('#')[0] ?? raw;
  const withoutQuery = withoutHash.split('?')[0] ?? withoutHash;

  const normalized = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length === 0) return '/';

  const head = `/${segments[0]}`;

  // dynamic route groups
  if ((head === '/product' || head === '/produits') && segments.length >= 2) return '/product-detail';
  if ((head === '/blog' || head === '/knowledge') && segments.length >= 2) return '/article-detail';

  return head;
};

export const prefetchRoute = (to: string): void => {
  prefetchRouteWithOptions(to);
};

export const prefetchRouteWithOptions = (to: string, options?: PrefetchOptions): void => {
  const key = normalizePathKey(to);
  const importer = importers[key];
  if (!importer) return;

  if (!options?.force && !shouldAllowPrefetch()) return;
  if (prefetchedKeys.has(key)) return;

  prefetchedKeys.add(key);
  prefetchCount++;

  // Fire-and-forget: on veut juste déclencher le téléchargement du chunk.
  void importer().catch(() => {
    // En cas d'échec réseau ponctuel, on autorise un retry ultérieur.
    prefetchedKeys.delete(key);
    prefetchCount = Math.max(0, prefetchCount - 1);
  });
};

export const prefetchCriticalRoutesOnIdle = (): (() => void) => {
  return scheduleIdle(() => {
    // Routes « probables » après l'arrivée sur la home.
    prefetchRouteWithOptions('/produits', { reason: 'idle' });
    prefetchRouteWithOptions('/blog', { reason: 'idle' });
    prefetchRouteWithOptions('/contact', { reason: 'idle' });
    prefetchRouteWithOptions('/search', { reason: 'idle' });

    // Chunk de détail produit souvent utilisé depuis /produits.
    prefetchRouteWithOptions('/product/0', { reason: 'idle' });
  });
};
