import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import puppeteer from 'puppeteer';
import { getPrerenderRoutes } from './_routes.mjs';

const ROOT = process.cwd();
const DIST_DIR = path.resolve(ROOT, 'dist');
const PORT = Number(process.env.PRERENDER_PORT || 4173);
const HOST = '127.0.0.1';
const ORIGIN = `http://${HOST}:${PORT}`;

const viteJs = path.resolve(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const routeToFilePath = (route) => {
  if (route === '/') return path.join(DIST_DIR, 'index.html');

  // Normalize (no trailing slash)
  const clean = route.replace(/\/+$/, '');
  const dir = path.join(DIST_DIR, clean.replace(/^\//, ''));
  return path.join(dir, 'index.html');
};

const waitForServer = async () => {
  const maxTries = 40;
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await fetch(`${ORIGIN}/`);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await sleep(250);
  }
  throw new Error('Vite preview non prêt (timeout)');
};

const startPreview = () => {
  const child = spawn(process.execPath, [viteJs, 'preview', '--strictPort', '--port', String(PORT), '--host', HOST], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: false,
    env: { ...process.env },
  });

  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));

  return child;
};

const main = async () => {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('dist/ introuvable. Lance `npm run build` avant le prerender.');
  }

  const { routes } = getPrerenderRoutes();

  // Exclusions: pages utilitaires / sensibles
  const excludedPrefixes = ['/cart', '/checkout', '/client-area', '/order-success', '/order-tracking'];
  const prerenderRoutes = routes.filter((r) => !excludedPrefixes.some((p) => r === p || r.startsWith(`${p}/`)));

  console.log(`Prerender: ${prerenderRoutes.length} routes`);

  const server = startPreview();
  try {
    await waitForServer();

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(60_000);

      for (const route of prerenderRoutes) {
        const url = `${ORIGIN}${route}`;
        console.log(`- ${url}`);

        await page.goto(url, { waitUntil: 'networkidle0' });

        // Ensure our SEO tags are present (React effect has run)
        await page.waitForSelector('meta[name="description"]', { timeout: 10_000 }).catch(() => {});
        await page.waitForSelector('script#json-ld-schema', { timeout: 10_000 }).catch(() => {});

        const html = await page.content();
        const outPath = routeToFilePath(route);
        ensureDir(path.dirname(outPath));
        fs.writeFileSync(outPath, html, 'utf8');
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.kill('SIGTERM');
  }

  console.log('Prerender terminé.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
