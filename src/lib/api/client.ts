import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

const normalizeBackendUrl = (value: string) =>
  value.replace(/localhost/g, '127.0.0.1').replace(/\/+$/, '');
const BASE_URL = normalizeBackendUrl(env.PUBLIC_BACKEND_URL || 'http://127.0.0.1:5001');

export const getBackendBaseUrl = () => BASE_URL;

const getToken = () => {
  if (!browser) {
    return null;
  }
  return localStorage.getItem('access_token_cookie');
};

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  if (import.meta.env.DEV && path.startsWith('/api')) {
    throw new Error('Do not use /api proxy paths; call the backend directly.');
  }
  const token = getToken();
  const headers = new Headers(options.headers ?? {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 401 && browser) {
    window.location.href = '/';
    return null as T;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    const requestError = new Error(error.message ?? 'Request failed');
    (requestError as Error & { status?: number }).status = response.status;
    throw requestError;
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return (text as unknown) as T;
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }
  return JSON.parse(text) as T;
};
