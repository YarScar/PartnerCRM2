import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/intake',
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
