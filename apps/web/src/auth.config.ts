import type { NextAuthConfig } from 'next-auth';

const useSecureCookies = process.env.NODE_ENV === 'production';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  cookies: useSecureCookies ? {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  } : undefined,
  providers: [], // Providers added in auth.ts (Node runtime)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes — accessible without login
      const publicRoutes = ['/login', '/signup'];
      const isPublicRoute =
        publicRoutes.includes(pathname) ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/signup');

      if (isPublicRoute) {
        if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      // Protect all other routes
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
