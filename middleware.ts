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
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/partners') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/partners')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ensure every new browser (no landing cookie) starts at the landing page
  // and clear any existing session so an admin who forgot to sign out
  // doesn't leave their session active for the next visitor.
  const landingSeen = request.cookies.get('createaccess_landing_seen')?.value;
  const isApi = pathname.startsWith('/api/') || pathname.startsWith('/_next') || pathname === '/favicon.ico';
  if (!landingSeen && !isApi) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    const res = NextResponse.redirect(redirectUrl);

    // clear session cookie
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });

    // mark landing seen for this browser so we don't redirect repeatedly
    res.cookies.set({
      name: 'createaccess_landing_seen',
      value: '1',
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  }

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const user = await getSessionFromToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin') && !isAdmin(user)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
