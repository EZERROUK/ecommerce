import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());

const CACHE_FILE = path.join(ROOT, 'scripts', '.cache', 'routes.json');

const readText = (relPath) => fs.readFileSync(path.join(ROOT, relPath), 'utf8');

const unique = (items) => Array.from(new Set(items)).filter(Boolean);

const readJsonIfExists = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const extractSlugs = (text) => {
  const out = [];
  const re = /\bslug\s*:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
};

const extractExportedArrayText = (text, exportConstName) => {
  const idx = text.indexOf(`export const ${exportConstName}`);
  if (idx === -1) return '';

  const from = text.indexOf('[', idx);
  if (from === -1) return '';

  let depth = 0;
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (depth === 0) {
      return text.slice(from, i + 1);
    }
  }

  return '';
};

const extractIdsInStruct = (text, structName) => {
  const slice = extractExportedArrayText(text, structName);
  if (!slice) return [];
  const out = [];
  const re = /\bid\s*:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(slice))) out.push(m[1]);
  return out;
};

export const getPrerenderRoutes = () => {
  const constantsText = readText('constants.ts');
  const blogText = readText('data/blog.ts');
  const knowledgeText = readText('data/knowledge.ts');

  const apiCache = readJsonIfExists(CACHE_FILE);
  const apiProductSlugs = Array.isArray(apiCache?.productSlugs) ? apiCache.productSlugs : [];
  const apiBlogSlugs = Array.isArray(apiCache?.blogSlugs) ? apiCache.blogSlugs : [];

  const staticProductSlugs = unique(extractSlugs(extractExportedArrayText(constantsText, 'PRODUCTS_STRUCT')));
  const serviceSlugs = unique(extractSlugs(extractExportedArrayText(constantsText, 'SERVICES_STRUCT')));
  const sectorIds = unique(extractIdsInStruct(constantsText, 'SECTORS_STRUCT'));

  const staticBlogSlugs = unique(extractSlugs(blogText));
  const knowledgeSlugs = unique(extractSlugs(knowledgeText));

  const productSlugs = unique([...(apiProductSlugs.length ? apiProductSlugs : []), ...staticProductSlugs]);
  const blogSlugs = unique([...(apiBlogSlugs.length ? apiBlogSlugs : []), ...staticBlogSlugs]);

  const routes = unique([
    '/',
    '/about',
    '/services',
    '/produits',
    '/blog',
    '/knowledge',
    '/faq',
    '/contact',
    '/success-stories',
    '/diagnostic',
    '/rachat',
    '/search',
    '/compare',
    '/configurator',

    ...serviceSlugs.map((s) => `/services/${s}`),
    ...sectorIds.map((id) => `/solutions/${id}`),
    ...productSlugs.map((s) => `/produits/${s}`),
    ...blogSlugs.map((s) => `/blog/${s}`),
    ...knowledgeSlugs.map((s) => `/knowledge/${s}`),
  ]);

  return { routes, blogSlugs, knowledgeSlugs, productSlugs, serviceSlugs, sectorIds };
};
