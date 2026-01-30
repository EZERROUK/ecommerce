import { apiGet } from './apiClient';
import type { ApiBlogPostShowResponse, ApiBlogPostsIndexResponse } from './apiTypes';

export async function fetchBlogPosts(params?: { page?: number; perPage?: number }): Promise<ApiBlogPostsIndexResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.perPage) search.set('per_page', String(params.perPage));
  const qs = search.toString();
  return apiGet<ApiBlogPostsIndexResponse>(`/blog-posts${qs ? `?${qs}` : ''}`);
}

export async function fetchBlogPostBySlug(slug: string): Promise<ApiBlogPostShowResponse> {
  return apiGet<ApiBlogPostShowResponse>(`/blog-posts/${encodeURIComponent(slug)}`);
}
