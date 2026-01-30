export class ApiError extends Error {
  status: number;
  url: string;
  body: unknown;

  constructor(message: string, params: { status: number; url: string; body: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = params.status;
    this.url = params.url;
    this.body = params.body;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const rawMsg = typeof body === 'object' && body && 'message' in (body as any)
      ? String((body as any).message)
      : `HTTP ${res.status}`;

    const msg = res.status === 404
      ? 'Ressource introuvable.'
      : rawMsg;

    throw new ApiError(msg, { status: res.status, url, body });
  }

  return body as T;
}

export async function apiPost<T>(path: string, payload?: unknown, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    ...init,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const rawMsg = typeof body === 'object' && body && 'message' in (body as any)
      ? String((body as any).message)
      : `HTTP ${res.status}`;

    const msg = res.status === 404
      ? 'Ressource introuvable.'
      : rawMsg;

    throw new ApiError(msg, { status: res.status, url, body });
  }

  return body as T;
}
