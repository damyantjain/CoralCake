import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/runner', '/runs-last', '/compare'];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function generateNonce(): string {
  // 16 random bytes → 22 chars of url-safe base64 (no `+`, `/`, or `=`
  // padding). Edge runtime's Buffer doesn't reliably honor the
  // `'base64url'` encoding, so we sanitize the standard output manually.
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Buffer.from(arr)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildCspHeader(nonce: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  // In production we rely on nonce + strict-dynamic to allow only the
  // first-party scripts that Next.js emits with the nonce attribute. In
  // dev we relax to allow Turbopack's HMR scripts (eval + inline). Style
  // src keeps `'unsafe-inline'` for both — Tailwind / Next.js inline
  // styles for streaming, and moving that to nonces is a higher-risk
  // change deferred to a later phase.
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'`;
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://oai.helicone.ai https://mistral.helicone.ai https://*.supabase.co",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();
  const csp = buildCspHeader(nonce);

  // Forward x-nonce on the request so Server Components (and Next.js's
  // own script injection) can read it via `headers()`.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Next.js reads this specific header to inject the nonce into its
  // framework <script> tags.
  requestHeaders.set('Content-Security-Policy', csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  if (isProtectedRoute(pathname)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: requestHeaders } });
            response.headers.set('Content-Security-Policy', csp);
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set('Content-Security-Policy', csp);
      return redirectResponse;
    }
  }

  return response;
}

// Match every HTML route — we need the nonce CSP everywhere a page is
// rendered. Skip static asset paths and API routes.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|\\.well-known).*)',
  ],
};
