import fs from 'node:fs';
import path from 'node:path';
import { getPrerenderRoutes } from './_routes.mjs';

const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://x-zone.ma').replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);

const priorityFor = (route) => {
  if (route === '/') return 1.0;
  if (route === '/produits') return 0.9;
  if (route.startsWith('/produits/')) return 0.8;
  if (route === '/services') return 0.9;
  if (route.startsWith('/services/')) return 0.8;
  if (route === '/blog') return 0.8;
  if (route.startsWith('/blog/')) return 0.7;
  if (route === '/knowledge') return 0.7;
  if (route.startsWith('/knowledge/')) return 0.6;
  if (route === '/contact') return 0.7;
  return 0.5;
};

const changefreqFor = (route) => {
  if (route === '/') return 'daily';
  if (route === '/produits' || route.startsWith('/produits/')) return 'weekly';
  if (route === '/blog') return 'daily';
  if (route.startsWith('/blog/')) return 'monthly';
  if (route === '/services' || route.startsWith('/services/')) return 'monthly';
  return 'monthly';
};

const escapeXml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const { routes } = getPrerenderRoutes();

// Exclusions SEO: pages utilitaires / sensibles
const excluded = new Set([
  '/cart',
  '/checkout',
  '/client-area',
  '/order-success',
  '/order-tracking',
]);

const filteredRoutes = routes.filter((r) => {
  if (!r.startsWith('/')) return false;
  for (const ex of excluded) {
    if (r === ex || r.startsWith(`${ex}/`)) return false;
  }
  return true;
});

const urls = filteredRoutes.map((route) => {
  const loc = `${SITE_URL}${route}`;
  return `   <url>\n      <loc>${escapeXml(loc)}</loc>\n      <lastmod>${TODAY}</lastmod>\n      <changefreq>${changefreqFor(route)}</changefreq>\n      <priority>${priorityFor(route).toFixed(1)}</priority>\n   </url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

const outPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`Sitemap généré: ${outPath} (${filteredRoutes.length} URLs)`);
