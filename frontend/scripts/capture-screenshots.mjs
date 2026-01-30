import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

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

async function waitForNetworkIdle(page, timeoutMs = 10000) {
  if (typeof page.waitForNetworkIdle === 'function') {
    await page.waitForNetworkIdle({ idleTime: 750, timeout: timeoutMs });
    return;
  }
  // Fallback (anciens runtimes): pause courte
  await page.waitForTimeout(Math.min(timeoutMs, 1000));
}

async function installRequestMocks(page, { product1, categoriesTree }) {
  // On remplace le handler pour éviter l'empilement des listeners.
  page.removeAllListeners('request');
  await page.setRequestInterception(true);

  // PNG 1x1 transparent
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8Yk9kAAAAASUVORK5CYII=',
    'base64',
  );

  page.on('request', async (request) => {
    try {
      const url = new URL(request.url());
      const pathname = url.pathname;
      const method = request.method().toUpperCase();

      // Placeholder image
      if (method === 'GET' && pathname === '/storage/demo/product-1.png') {
        return request.respond({
          status: 200,
          headers: {
            'content-type': 'image/png',
            'cache-control': 'no-store',
          },
          body: tinyPng,
        });
      }

      if (!pathname.startsWith('/api/')) {
        return request.continue();
      }

      const respondJson = (status, body) =>
        request.respond({
          status,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          },
          body: JSON.stringify(body),
        });

      // Catalogue
      if (method === 'GET' && pathname === '/api/categories/tree') {
        return respondJson(200, { success: true, data: categoriesTree });
      }

      if (method === 'GET' && pathname === '/api/products') {
        return respondJson(200, { success: true, data: [product1] });
      }

      if (method === 'GET' && pathname.startsWith('/api/products/slug/')) {
        return respondJson(200, { success: true, data: product1 });
      }

      if (method === 'GET' && pathname.startsWith('/api/products/') && pathname.endsWith('/recommended')) {
        return respondJson(200, { success: true, products: [product1] });
      }

      if (method === 'GET' && pathname === '/api/products/new') {
        return respondJson(200, { success: true, products: [product1] });
      }

      if (method === 'GET' && pathname === '/api/products/best-sellers') {
        return respondJson(200, { success: true, products: [product1] });
      }

      if (method === 'GET' && pathname === `/api/products/${product1.id}`) {
        return respondJson(200, { success: true, data: product1 });
      }

      if (method === 'GET' && pathname === `/api/products/${product1.id}/reviews`) {
        return respondJson(200, {
          success: true,
          data: [
            {
              id: 'r1',
              product_id: product1.id,
              author_name: 'Client Démo',
              rating: 5,
              comment: 'Avis de démonstration pour capture DAT.',
              created_at: new Date().toISOString(),
            },
          ],
        });
      }

      if (method === 'POST' && pathname === `/api/products/${product1.id}/reviews`) {
        return respondJson(200, { success: true, message: 'Avis reçu (démo capture).' });
      }

      // Commandes web
      if (method === 'POST' && pathname === '/api/orders') {
        return respondJson(200, {
          success: true,
          order: {
            id: 1,
            order_number: 'WO-000001',
            total_ttc: 12999.0,
            currency_code: 'MAD',
          },
        });
      }

      if (method === 'GET' && pathname === '/api/orders/track') {
        return respondJson(200, {
          success: true,
          order: {
            order_number: url.searchParams.get('order_number') || 'WO-000001',
            status: 'confirmed',
            payment_method: 'cod',
            created_at: new Date().toISOString(),
            subtotal_ht: 10832.5,
            total_tax: 2166.5,
            total_ttc: 12999.0,
            currency_code: 'MAD',
            shipping_address: { city: 'Casablanca', country: 'MA' },
            items: [
              {
                name: product1.name,
                sku: product1.sku,
                quantity: 1,
                line_total_ttc: 12999.0,
              },
            ],
          },
        });
      }

      // Par défaut: ne pas mocker -> laisser passer
      return request.continue();
    } catch (err) {
      // En cas de bug de mock, ne pas bloquer le rendu
      try {
        return request.continue();
      } catch {
        // ignore
      }
    }
  });
}

async function captureFrontend(page, baseUrl, outDir) {
  // Fixtures minimales, structurées selon frontend/utils/apiTypes.ts
  const product1 = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Serveur Rack X‑Zone (Démo)',
    slug: 'serveur-rack-x-zone-demo',
    sku: 'XZ-SRV-DEMO',
    condition: 'refurbished',
    is_price_on_request: false,
    price: 12999.0,
    price_ht: 10832.5,
    stock: 7,
    description: 'Produit de démonstration (fixtures de capture) aligné avec la structure API attendue par le frontend.',
    images: [
      {
        id: 1,
        product_id: '11111111-1111-1111-1111-111111111111',
        path: '/storage/demo/product-1.png',
        alt_text: 'Image produit démo',
        sort_order: 1,
        is_primary: true,
        deleted_at: null,
      },
    ],
    category: { id: 10, name: 'Serveurs', slug: 'serveurs', parent_id: null, children: [] },
    attributes: [
      { name: 'CPU', value: 'Xeon (démo)' },
      { name: 'RAM', value: '64 Go (démo)' },
      { name: 'Stockage', value: '2× SSD (démo)' },
    ],
    documents: [
      { id: 1, title: 'Fiche technique (démo)', type: 'datasheet', url: '#', file_url: '#' },
    ],
  };

  const categoriesTree = [
    {
      id: 10,
      name: 'Serveurs',
      slug: 'serveurs',
      parent_id: null,
      children: [
        { id: 11, name: 'Rack', slug: 'rack', parent_id: 10, children: [] },
        { id: 12, name: 'Tour', slug: 'tour', parent_id: 10, children: [] },
      ],
    },
  ];

  await installRequestMocks(page, { product1, categoriesTree });

  const shots = [
    { id: 'F01', path: '/', name: 'home' },
    { id: 'F02', path: '/shop', name: 'shop' },
    { id: 'F03', path: `/produits/${product1.id}`, name: 'product-detail' },
    { id: 'F04', path: '/cart', name: 'cart' },
    { id: 'F05', path: '/checkout', name: 'checkout' },
    { id: 'F06', path: '/order-tracking', name: 'order-tracking' },
    { id: 'F07', path: '/blog', name: 'blog' },
  ];

  for (const s of shots) {
    await page.goto(`${baseUrl}${s.path}`, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page);
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(outDir, `${s.id}-${s.name}.png`),
      fullPage: true,
    });
  }
}

async function captureBackofficeStatic(page, baseUrl, outDir) {
  const shots = [
    { id: 'B01', path: '/dat-preview/login.html', name: 'login' },
    { id: 'B02', path: '/dat-preview/dashboard.html', name: 'dashboard' },
    { id: 'B03', path: '/dat-preview/products.html', name: 'products-index' },
    { id: 'B04', path: '/dat-preview/categories.html', name: 'categories-index' },
    { id: 'B05', path: '/dat-preview/quotes.html', name: 'quotes-index' },
  ];

  for (const s of shots) {
    await page.goto(`${baseUrl}${s.path}`, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, 30000);
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(outDir, `${s.id}-${s.name}.png`),
      fullPage: true,
    });
  }
}

async function captureBackoffice(page, baseUrl, outDir, creds) {
  // Login backoffice
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  const emailSelector = 'input[name=email], input[type=email]';
  const pwdSelector = 'input[name=password], input[type=password]';
  const submitSelector = 'button[type=submit]';

  await page.waitForSelector(emailSelector, { timeout: 15000 });
  await page.type(emailSelector, creds.email, { delay: 10 });
  await page.type(pwdSelector, creds.password, { delay: 10 });

  await Promise.all([
    page.click(submitSelector),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null),
  ]);

  // Captures clés (dashboard + pages de gestion)
  const shots = [
    { id: 'B01', path: '/login', name: 'login' },
    { id: 'B02', path: '/dashboard', name: 'dashboard' },
    { id: 'B03', path: '/products', name: 'products-index' },
    { id: 'B04', path: '/categories', name: 'categories-index' },
    { id: 'B05', path: '/quotes', name: 'quotes-index' },
    { id: 'B06', path: '/invoices', name: 'invoices-index' },
    { id: 'B07', path: '/tickets', name: 'tickets-index' },
    { id: 'B08', path: '/web-orders', name: 'web-orders-index' },
  ];

  // Revenir sur /login pour la capture B01 avec page “telle quelle”
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, `B01-login.png`), fullPage: true });

  for (const s of shots.slice(1)) {
    await page.goto(`${baseUrl}${s.path}`, { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page, 20000);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(outDir, `${s.id}-${s.name}.png`),
      fullPage: true,
    });
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const frontendBase = String(args.frontendBase || 'http://127.0.0.1:4173');
  const backendBase = String(args.backendBase || 'http://127.0.0.1:8000');
  const backofficeStaticBase = args.backofficeStaticBase ? String(args.backofficeStaticBase) : null;
  const out = String(args.out || '../docs-assets/screenshots');

  const outDir = path.resolve(process.cwd(), out);
  ensureDir(outDir);

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();
    await captureFrontend(page, frontendBase, outDir);
    if (backofficeStaticBase) {
      await captureBackofficeStatic(page, backofficeStaticBase, outDir);
    } else {
      await captureBackoffice(page, backendBase, outDir, {
        email: process.env.SEED_SUPERADMIN_EMAIL || 'SuperAdmin@example.com',
        password: process.env.SEED_DEFAULT_PASSWORD || 'Password123!',
      });
    }
  } finally {
    await browser.close();
  }

  // Manifeste simple
  const manifest = {
    generated_at: new Date().toISOString(),
    frontendBase,
    backendBase,
    backofficeStaticBase,
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
