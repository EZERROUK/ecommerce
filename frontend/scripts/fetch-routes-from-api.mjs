import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, 'scripts', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'routes.json');

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const unique = (items) => Array.from(new Set(items)).filter(Boolean);

const resolveApiBaseUrl = () => {
  const direct = process.env.ROUTES_API_BASE_URL || process.env.API_BASE_URL;
  if (direct) return String(direct).replace(/\/+$/, '');

  const origin = process.env.ROUTES_API_ORIGIN || process.env.API_ORIGIN || process.env.VITE_API_PROXY_TARGET;
  const baseOrigin = (origin || 'http://127.0.0.1:8000').replace(/\/+$/, '');
  return `${baseOrigin}/api`;
};

const fetchJson = async (url, timeoutMs = 15_000) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
};

const extractPage = (payload) => {
  if (!payload) return { data: [], lastPage: null };
  const data = Array.isArray(payload.data) ? payload.data : [];
  const meta = payload.meta && typeof payload.meta === 'object' ? payload.meta : null;

  const lastPageRaw = meta && (meta.last_page ?? meta.lastPage ?? meta.lastPageNumber);
  const lastPage = typeof lastPageRaw === 'number' ? lastPageRaw : typeof lastPageRaw === 'string' ? Number(lastPageRaw) : null;

  return { data, lastPage: Number.isFinite(lastPage) ? lastPage : null };
};

const fetchAllPaginated = async (urlFactory, { perPage = 200, maxPages = 25 } = {}) => {
  const all = [];
  let page = 1;
  let lastPage = null;

  while (page <= maxPages) {
    const url = urlFactory(page, perPage);
    const payload = await fetchJson(url);
    const { data, lastPage: lp } = extractPage(payload);
    all.push(...data);

    if (lp != null) {
      lastPage = lp;
      if (page >= lastPage) break;
    } else {
      if (!data.length || data.length < perPage) break;
    }

    page += 1;
  }

  return all;
};

export const writeRoutesCacheFromApi = async () => {
  const apiBase = resolveApiBaseUrl();

  const products = await fetchAllPaginated((page, perPage) => `${apiBase}/products?per_page=${perPage}&page=${page}`);
  const productSlugs = unique(
    products
      .map((p) => (p && typeof p === 'object' ? (p.slug || p.id) : null))
      .map((s) => (typeof s === 'string' ? s.trim() : null))
  );

  const posts = await fetchAllPaginated((page, perPage) => `${apiBase}/blog-posts?per_page=${perPage}&page=${page}`);
  const blogSlugs = unique(
    posts
      .map((p) => (p && typeof p === 'object' ? p.slug : null))
      .map((s) => (typeof s === 'string' ? s.trim() : null))
  );

  const cache = {
    generatedAt: new Date().toISOString(),
    apiBaseUrl: apiBase,
    productSlugs,
    blogSlugs,
  };

  ensureDir(CACHE_DIR);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  return { cacheFile: CACHE_FILE, counts: { productSlugs: productSlugs.length, blogSlugs: blogSlugs.length } };
};

export const ROUTES_CACHE_FILE = CACHE_FILE;
