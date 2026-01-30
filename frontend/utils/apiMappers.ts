import type { Product } from '../types';
import type { ApiProduct } from './apiTypes';

const DEFAULT_CATEGORY: Product['category'] = 'accessory';

const STORAGE_BASE_URL = (import.meta.env.VITE_STORAGE_BASE_URL || '').toString().replace(/\/+$/, '');

function guessCategory(api: ApiProduct): Product['category'] {
  const slug = (api.category?.slug || '').toLowerCase();
  const name = (api.category?.name || '').toLowerCase();
  const hay = `${slug} ${name}`;

  if (hay.includes('server') || hay.includes('serveur')) return 'server';
  if (hay.includes('laptop') || hay.includes('pc-portable') || hay.includes('portable')) return 'laptop';
  if (hay.includes('desktop') || hay.includes('pc-fixe') || hay.includes('bureau')) return 'desktop';
  if (hay.includes('network') || hay.includes('reseau') || hay.includes('réseau') || hay.includes('switch') || hay.includes('routeur')) return 'network';
  if (hay.includes('printer') || hay.includes('imprim')) return 'printer';
  if (hay.includes('software') || hay.includes('logiciel')) return 'software';
  if (hay.includes('rental') || hay.includes('location')) return 'rental';

  return DEFAULT_CATEGORY;
}

export function apiProductToUiProduct(api: ApiProduct): Product {
  const normalizedAttributes = (api.attributes || [])
    .filter(a => a?.name && a?.value)
    .map(a => ({ name: String(a.name), value: String(a.value) }));

  const specsFromAttributes = (api.attributes || [])
    .filter(a => a?.name && a?.value)
    .map(a => `${a.name}: ${a.value}`);

  const primaryImage = (api.images || []).find(i => i?.is_primary) ?? (api.images || [])[0];
  const imagePath = primaryImage?.path ? String(primaryImage.path).replace(/^\/+/, '') : '';
  const image = imagePath
    ? (STORAGE_BASE_URL ? `${STORAGE_BASE_URL}/storage/${imagePath}` : `/storage/${imagePath}`)
    : '';

  const documents = (api.documents || [])
    .filter((d: any) => d && (d.url || d.file_url))
    .map((d: any) => ({
      id: Number(d.id),
      title: d.title != null ? String(d.title) : undefined,
      type: String(d.type || 'datasheet'),
      url: String(d.url || d.file_url),
    }));

  return {
    id: String(api.id),
    slug: api.slug || undefined,
    name: api.name,
    category: guessCategory(api),
    backendCategoryId: api.category?.id,
    backendCategoryName: api.category?.name,
    price: api.is_price_on_request ? 'price_on_request' : (api.price != null ? String(api.price) : 'price_on_request'),
    description: api.description || '',
    specs: specsFromAttributes.length > 0 ? specsFromAttributes : [],
    attributes: normalizedAttributes,
    image,
    sku: api.sku || undefined,
    stock: api.stock != null && api.stock > 0 ? 'in_stock' : 'out_of_stock',
    condition: (api.condition ?? 'new') as Product['condition'],
    badge: (api.condition && api.condition !== 'new') ? 'refurbished' : undefined,
    documents: documents.length > 0 ? documents : undefined,
  };
}
