import { apiGet, apiPost } from './apiClient';
import type {
  ApiCategory,
  ApiProductsIndexResponse,
  ApiProductShowResponse,
  ApiProductSearchResponse,
  ApiRecommendedResponse,
  ApiSuccessEnvelope,
  ApiProductReviewsResponse,
  ApiCreateProductReviewRequest,
  ApiCreateProductReviewResponse,
} from './apiTypes';

export async function fetchProducts(params?: { page?: number }): Promise<ApiProductsIndexResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  const qs = search.toString();
  return apiGet<ApiProductsIndexResponse>(`/products${qs ? `?${qs}` : ''}`);
}

export async function searchProducts(params?: {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
}): Promise<ApiProductSearchResponse> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.categoryId != null) qs.set('category_id', String(params.categoryId));
  if (params?.minPrice != null) qs.set('min_price', String(params.minPrice));
  if (params?.maxPrice != null) qs.set('max_price', String(params.maxPrice));
  if (params?.sort && params.sort !== 'newest') qs.set('sort', params.sort);
  if (params?.page) qs.set('page', String(params.page));

  const query = qs.toString();
  return apiGet<ApiProductSearchResponse>(`/products/search${query ? `?${query}` : ''}`);
}

export async function fetchProduct(productId: string): Promise<ApiProductShowResponse> {
  return apiGet<ApiProductShowResponse>(`/products/${encodeURIComponent(productId)}`);
}

export async function fetchProductBySlug(slug: string): Promise<ApiProductShowResponse> {
  return apiGet<ApiProductShowResponse>(`/products/slug/${encodeURIComponent(slug)}`);
}

export async function fetchRecommended(productId: string): Promise<ApiRecommendedResponse> {
  return apiGet<ApiRecommendedResponse>(`/products/${encodeURIComponent(productId)}/recommended`);
}

export async function fetchNewProducts(): Promise<ApiRecommendedResponse> {
  return apiGet<ApiRecommendedResponse>(`/products/new`);
}

export async function fetchBestSellers(): Promise<ApiRecommendedResponse> {
  return apiGet<ApiRecommendedResponse>(`/products/best-sellers`);
}

export async function fetchCategoriesTree(): Promise<ApiSuccessEnvelope<ApiCategory[]>> {
  return apiGet<ApiSuccessEnvelope<ApiCategory[]>>(`/categories/tree`);
}

export async function fetchProductReviews(productId: string): Promise<ApiProductReviewsResponse> {
  return apiGet<ApiProductReviewsResponse>(`/products/${encodeURIComponent(productId)}/reviews`);
}

export async function submitProductReview(
  productId: string,
  payload: ApiCreateProductReviewRequest
): Promise<ApiCreateProductReviewResponse> {
  return apiPost<ApiCreateProductReviewResponse>(`/products/${encodeURIComponent(productId)}/reviews`, payload);
}
