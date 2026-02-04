import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from '@sveltejs/kit';

const normalizeBackendUrl = (value: string) =>
  value.replace(/localhost/g, '127.0.0.1').replace(/\/+$/, '');
const BACKEND_BASE_URL = normalizeBackendUrl(
  publicEnv.PUBLIC_BACKEND_URL || 'http://127.0.0.1:5001'
);

const proxyRequest: RequestHandler = async ({ request, url, params, cookies }) => {
  const targetPath = params.path ? `/${params.path}` : '';
  const targetUrl = `${BACKEND_BASE_URL}${targetPath}${url.search}`;

  console.log(`Proxying request to: ${targetUrl}`);
  
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  if (!headers.has('authorization')) {
    const token = cookies.get('access_token_cookie');
    if (targetPath.includes('/vote')) {
      console.log('Proxy auth check', { targetPath, hasCookie: Boolean(token) });
    }
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const contentType = headers.get('content-type') ?? '';
  const shouldBufferBody = contentType.includes('application/json');
  const requestBody = hasBody
    ? shouldBufferBody
      ? await request.text()
      : request.body
    : undefined;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: requestBody,
    redirect: 'manual',
    // Required for streaming request bodies in Node
    duplex: hasBody && !shouldBufferBody ? 'half' : undefined
  } as RequestInit);

  if (targetPath.startsWith('/auth/callback')) {
    const data = await response.json().catch(() => ({}));
    const token = typeof data?.token === 'string' ? data.token : null;
    if (token) {
      const redirectTo =
        typeof data?.redirect === 'string' && data.redirect.trim() ? data.redirect : '/dashboard';
      cookies.set('access_token_cookie', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: url.protocol === 'https:',
        maxAge: 60 * 60
      });
      return new Response(null, {
        status: 303,
        headers: { Location: redirectTo }
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
    cookies.delete('access_token_cookie', { path: '/' });
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
