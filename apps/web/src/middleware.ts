import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes — anyone can access
  const publicRoutes = ['/login', '/signup', '/verify-email'];
  if (publicRoutes.includes(pathname)) {
    // If already logged in, redirect away from auth pages
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // API auth routes are always public
  if (pathname.startsWith('/api/auth')) return NextResponse.next();

  // Protect all other routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
