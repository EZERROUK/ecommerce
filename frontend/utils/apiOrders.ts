import { apiGet, apiPost } from './apiClient';
import type { ApiCreateOrderRequest, ApiCreateOrderResponse, ApiTrackOrderResponse } from './apiTypes';

export async function createOrder(payload: ApiCreateOrderRequest): Promise<ApiCreateOrderResponse> {
  return apiPost<ApiCreateOrderResponse>('/orders', payload);
}

export async function trackOrder(params: { orderNumber: string; email: string }): Promise<ApiTrackOrderResponse> {
  const qs = new URLSearchParams({
    order_number: params.orderNumber,
    email: params.email,
  }).toString();

  return apiGet<ApiTrackOrderResponse>(`/orders/track?${qs}`);
}
