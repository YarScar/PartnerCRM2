import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/intake',
  '/public/intake',
  '/public',
  '/api/intake',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
];

function isProtectedPath(pathname: string) {
  // These are the parts of the app that should never be public.
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/partners') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/partners')
  );
}

function applySecurityHeaders(response: NextResponse) {
  // Basic browser hardening so the app behaves more like a production app.
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    // Even public pages still get the safe headers.
    return applySecurityHeaders(NextResponse.next());
  }

  if (!isProtectedPath(pathname)) {
    // Let unrelated routes pass through, but keep the same header protection.
    return applySecurityHeaders(NextResponse.next());
  }

  // Protected routes need a valid session before they can load.
  const user = await getSessionFromToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (pathname.startsWith('/admin') && !isAdmin(user)) {
    // Staff can still use the app, but only admins can open admin pages.
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return applySecurityHeaders(NextResponse.redirect(dashboardUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
