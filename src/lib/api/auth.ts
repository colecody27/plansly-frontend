import { browser } from '$app/environment';
import { PRIVATE_API_BASE_URL } from '$env/static/private';

const normalizeBackendUrl = (value: string) =>
  value.replace(/localhost/g, '127.0.0.1').replace(/\/+$/, '');
const BACKEND_BASE_URL = normalizeBackendUrl(PRIVATE_API_BASE_URL || 'http://127.0.0.1:5001');

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
