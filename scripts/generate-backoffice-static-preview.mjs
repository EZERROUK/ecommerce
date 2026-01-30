import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const [k, v] = a.split('=');
    args[k.slice(2)] = v ?? true;
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadManifest(manifestPath) {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw);
}

function pickEntry(manifest) {
  const preferred = ['resources/js/app.tsx', 'resources/js/app.jsx', 'resources/js/app.js'];
  for (const key of preferred) {
    if (manifest[key]) return { key, entry: manifest[key] };
  }
  const fallbackKey = Object.keys(manifest).find((k) => /resources\/js\/app\.(t|j)sx?$/.test(k));
  if (fallbackKey) return { key: fallbackKey, entry: manifest[fallbackKey] };
  throw new Error('Entrée Vite introuvable dans le manifest (attendu: resources/js/app.*).');
}

function buildSharedProps() {
  const nowIso = new Date().toISOString();

  const user = {
    id: 1,
    name: 'SuperAdmin (démo DAT)',
    email: 'SuperAdmin@example.com',
    avatar: null,
    email_verified_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
    deleted_at: null,
    roles: [{ name: 'SuperAdmin' }],
  };

  const roles = ['SuperAdmin'];

  // Jeu de permissions “large” pour afficher la navigation et les actions.
  const permissions = [
    'dashboard_view',
    'category_list',
    'category_create',
    'category_edit',
    'category_delete',
    'category_restore',
    'product_list',
    'product_create',
    'product_show',
    'product_edit',
    'product_delete',
    'product_restore',
    'quote_list',
    'quote_create',
    'quote_show',
    'quote_edit',
    'quote_delete',
    'invoice_list',
    'web_order_list',
    'ticket_list',
    'employee_list',
    'leave_list',
    'audit_list',
    'loginlog_list',
  ];

  return {
    name: 'X-Zone',
    quote: {
      message: "Prévisualisation statique (DAT) : UI issue du build Vite du backoffice.",
      author: 'Généré',
    },
    auth: {
      user,
      roles,
      permissions,
    },
    // `ziggy` côté props est attendu par les types SharedData.
    // Le rendu utilise `route()` (ziggy-js) qui lit `window.Ziggy`.
    ziggy: {
      url: '',
      port: null,
      defaults: {},
      routes: {},
      location: '',
    },
    sidebarOpen: true,
    settings: {
      app_name: 'X-Zone',
      logo_url: '/logo.svg',
      logo_dark_url: '/logo.svg',
    },
    errors: {},
  };
}

function pageHtml({ title, cssFiles, jsFile, page }) {
  const dataPage = escapeHtmlAttr(JSON.stringify(page).replace(/</g, '\\u003c'));

  const cssTags = (cssFiles ?? [])
    .map((f) => `<link rel="stylesheet" href="/build/${f}">`)
    .join('\n');

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    ${cssTags}
  </head>
  <body>
    <script src="/dat-preview/ziggy-mock.js"></script>
    <div id="app" data-page="${dataPage}"></div>
    <script type="module" src="/build/${jsFile}"></script>
  </body>
</html>
`;
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function buildPagination({ perPage = 15 } = {}) {
  return {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
    from: 0,
    to: 0,
  };
}

function main() {
  const args = parseArgs(process.argv);

  const root = process.cwd();
  const manifestPath = path.resolve(root, String(args.manifest || 'Backend/public/build/manifest.json'));
  const outDir = path.resolve(root, String(args.outDir || 'Backend/public/dat-preview'));

  const manifest = loadManifest(manifestPath);
  const { entry } = pickEntry(manifest);

  const jsFile = entry.file;
  const cssFiles = entry.css ?? [];

  ensureDir(outDir);

  // Ziggy mock: Proxy permissif pour éviter les crashes si route inconnue.
  // NOTE: `ziggy-js` lit `window.Ziggy`.
  const ziggyMock = `// Généré automatiquement pour la prévisualisation DAT (captures)
(() => {
  const routesProxy = new Proxy({}, {
    get: (_t, prop) => ({
      uri: String(prop).replace(/\\./g, '/'),
      methods: ['GET', 'HEAD'],
      domain: null,
      parameters: [],
    }),
    has: () => true,
  });

  window.Ziggy = {
    url: window.location.origin,
    port: null,
    defaults: {},
    routes: routesProxy,
  };
})();
`;
  writeFile(path.join(outDir, 'ziggy-mock.js'), ziggyMock);

  const shared = buildSharedProps();

  const pages = [
    {
      file: 'login.html',
      title: 'DAT Preview — Backoffice — Login',
      component: 'auth/login',
      url: '/login',
      props: {},
    },
    {
      file: 'dashboard.html',
      title: 'DAT Preview — Backoffice — Dashboard',
      component: 'dashboard',
      url: '/dashboard',
      props: {
        period: '30',
        kpis: {
          revenue: { value: 125000, formatted: '125\u202f000,00\u00a0MAD', change: 4.2 },
          orders: { value: 18, change: 1.7 },
          newClients: { value: 3, change: 2.3 },
          outOfStock: { value: 2, total: 120, change: -0.5 },
        },
        salesChart: [],
        topProducts: [],
        stockAlerts: { lowStock: [], outOfStock: [] },
        recentActivity: [],
        categoryDistribution: [],
        trendsData: { dailyMetrics: [] },
        flash: { success: 'Prévisualisation statique (captures DAT).' },
      },
    },
    {
      file: 'products.html',
      title: 'DAT Preview — Backoffice — Produits',
      component: 'Products/Index',
      url: '/products',
      props: {
        products: buildPagination({ perPage: 15 }),
        categories: [
          { id: 10, name: 'Serveurs' },
          { id: 20, name: 'Stockage' },
        ],
        filters: {
          search: '',
          name: '',
          category: '',
          status: '',
          price: '',
          price_operator: '',
          price_min: '',
          price_max: '',
          stock: '',
          stock_operator: '',
          stock_min: '',
          stock_max: '',
          date_start: '',
          date_end: '',
        },
        sort: 'created_at',
        dir: 'desc',
        flash: { success: 'Liste Produits — données de démonstration (fixtures).' },
      },
    },
    {
      file: 'categories.html',
      title: 'DAT Preview — Backoffice — Catégories',
      component: 'Categories/Index',
      url: '/categories',
      props: {
        categories: {
          ...buildPagination({ perPage: 10 }),
          data: [
            { id: 10, name: 'Serveurs', slug: 'serveurs', parent_id: null, deleted_at: null },
            { id: 11, name: 'Rack', slug: 'rack', parent_id: 10, deleted_at: null },
            { id: 12, name: 'Tour', slug: 'tour', parent_id: 10, deleted_at: null },
          ],
          total: 3,
          to: 3,
        },
        flash: { success: 'Liste Catégories — données de démonstration (fixtures).' },
      },
    },
    {
      file: 'quotes.html',
      title: 'DAT Preview — Backoffice — Devis',
      component: 'Quotes/Index',
      url: '/quotes',
      props: {
        quotes: {
          ...buildPagination({ perPage: 15 }),
          data: [
            {
              id: 1,
              quote_number: 'Q-2026-000001',
              status: 'draft',
              quote_date: '2026-01-25',
              valid_until: '2026-02-25',
              subtotal_ht: 10832.5,
              total_tax: 2166.5,
              total_ttc: 12999,
              currency: { code: 'MAD', symbol: 'MAD' },
              client: { id: 1, company_name: 'Client Démo', contact_name: 'Contact Démo' },
              user: { name: 'SuperAdmin (démo DAT)' },
              items_count: 1,
              deleted_at: null,
              created_at: '2026-01-25T10:00:00.000Z',
            },
          ],
          total: 1,
          to: 1,
        },
        clients: [{ id: 1, company_name: 'Client Démo' }],
        filters: {
          search: '',
          quote_number: '',
          status: '',
          client_id: '',
          total_ttc: '',
          total_ttc_min: '',
          total_ttc_max: '',
        },
        flash: { success: 'Liste Devis — données de démonstration (fixtures).' },
      },
    },
  ];

  for (const p of pages) {
    const page = {
      component: p.component,
      props: { ...shared, ...p.props },
      url: p.url,
      version: null,
    };

    const html = pageHtml({ title: p.title, cssFiles, jsFile, page });
    writeFile(path.join(outDir, p.file), html);
  }

  const info = {
    generated_at: new Date().toISOString(),
    manifest: path.relative(root, manifestPath).replace(/\\/g, '/'),
    outDir: path.relative(root, outDir).replace(/\\/g, '/'),
    entry_js: `/build/${jsFile}`,
    entry_css: cssFiles.map((f) => `/build/${f}`),
    pages: pages.map((p) => `/dat-preview/${p.file}`),
  };
  writeFile(path.join(outDir, 'manifest.preview.json'), JSON.stringify(info, null, 2));

  process.stdout.write(`OK: prévisualisation backoffice générée dans ${info.outDir}\n`);
}

main();
