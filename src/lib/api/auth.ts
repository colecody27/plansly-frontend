import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

const normalizeBackendUrl = (value: string) =>
  value.replace(/localhost/g, '127.0.0.1').replace(/\/+$/, '');
const BACKEND_BASE_URL = normalizeBackendUrl(
  env.PUBLIC_BACKEND_URL || 'http://127.0.0.1:5001'
);

export const getLoginUrl = (redirectTo?: string) => {
  if (browser) {
    const token = localStorage.getItem('access_token_cookie');
    if (token) {
      return '/dashboard';
    }
  }
  const url = new URL('/auth/login', BACKEND_BASE_URL);
  if (redirectTo && browser) {
    url.searchParams.set('redirect_to', redirectTo);
  }
  return url.toString();
};
