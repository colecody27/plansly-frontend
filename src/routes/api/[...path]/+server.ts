import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { PRIVATE_API_BASE_URL } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

const BACKEND_BASE_URL = (PRIVATE_API_BASE_URL || PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000')
  .replace(/\/+$/, '');

const proxyRequest: RequestHandler = async ({ request, url, params, cookies }) => {
  const targetPath = params.path ? `/${params.path}` : '';
  const targetUrl = `${BACKEND_BASE_URL}${targetPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  if (!headers.has('authorization')) {
    const token = cookies.get('plannit-token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method);

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: 'manual',
    // Required for streaming request bodies in Node
    duplex: hasBody ? 'half' : undefined
  } as RequestInit);

  if (targetPath.startsWith('/auth/callback')) {
    const data = await response.json().catch(() => ({}));
    const token = typeof data?.token === 'string' ? data.token : null;
    if (token) {
      cookies.set('plannit-token', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: url.protocol === 'https:',
        maxAge: 60 * 60
      });
      return new Response(null, {
        status: 303,
        headers: { Location: '/dashboard' }
      });
    }
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: headers
    });
  }

  if (targetPath.startsWith('/auth/logout')) {
    cookies.delete('plannit-token', { path: '/' });
  }

  return new Response(response.body, {
    status: response.status,
    headers: response.headers
  });
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
