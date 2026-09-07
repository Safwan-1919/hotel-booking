const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('hotel_token');
    if (stored) headers['Authorization'] = `Bearer ${stored}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string, opts?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', ...opts }),
  post: <T>(endpoint: string, body?: any, opts?: RequestOptions) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), ...opts }),
  put: <T>(endpoint: string, body?: any, opts?: RequestOptions) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  patch: <T>(endpoint: string, body?: any, opts?: RequestOptions) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  delete: <T>(endpoint: string, opts?: RequestOptions) =>
    request<T>(endpoint, { method: 'DELETE', ...opts }),
};

export type { RequestOptions };
