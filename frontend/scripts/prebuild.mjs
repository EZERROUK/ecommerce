import { writeRoutesCacheFromApi, ROUTES_CACHE_FILE } from './fetch-routes-from-api.mjs';

const main = async () => {
  try {
    const { cacheFile, counts } = await writeRoutesCacheFromApi();
    console.log(`Routes API cache: ${cacheFile} (products=${counts.productSlugs}, blog=${counts.blogSlugs})`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Routes API cache: skip (${msg}). Fallback sur routes statiques.`);
    console.warn(`(Si besoin) définis ROUTES_API_ORIGIN ou VITE_API_PROXY_TARGET. Cache attendu: ${ROUTES_CACHE_FILE}`);
  }

  // Génère le sitemap à partir de _routes.mjs (qui fusionne API cache + routes statiques)
  await import('./generate-sitemap.mjs');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
