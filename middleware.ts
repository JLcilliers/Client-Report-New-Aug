// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Debug logging for production
  console.log(`[Middleware] Path: ${pathname}`);
  console.log(`[Middleware] Cookies: session=${req.cookies.has('session_token')}, google=${req.cookies.has('google_access_token')}, demo=${req.cookies.has('demo_auth')}`);

  // Skip middleware for public pages and API routes
  // TEMPORARILY adding /admin to test if middleware is the issue
  const publicPaths = ['/', '/login', '/auth', '/api', '/legal', '/report', '/admin', '/dashboard'];

  // Check if this is a public path
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    console.log(`[Middleware] Public path, allowing through`);
    return NextResponse.next();
  }

  // In development, bypass auth completely
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Check for demo auth cookie first
  const demoAuth = req.cookies.get('demo_auth');
  if (demoAuth?.value === 'true') {
    console.log(`[Middleware] Demo auth detected, allowing through`);
    return NextResponse.next();
  }
  
  // Enhanced session validation
  const sessionToken = req.cookies.get('session_token');
  const googleAccessToken = req.cookies.get('google_access_token');
  const googleTokenExpiry = req.cookies.get('google_token_expiry');
  
  // Check session token first (preferred method)
  if (sessionToken?.value) {
    console.log(`[Middleware] Session token found, allowing through`);
    // If we have a session token, allow access
    // The check-session endpoint will handle expired sessions
    return NextResponse.next();
  }
  
  // Check for valid Google OAuth tokens
  if (googleAccessToken?.value) {
    console.log(`[Middleware] Google access token found`);
    // Check if token is expired
    if (googleTokenExpiry?.value) {
      const expiryDate = new Date(googleTokenExpiry.value);
      const now = new Date();

      // If token expires within 5 minutes, still allow (refresh will happen in check-session)
      if (expiryDate.getTime() - now.getTime() > -5 * 60 * 1000) {
        console.log(`[Middleware] Token not expired, allowing through`);
        return NextResponse.next();
      } else {
        console.log(`[Middleware] Token expired`);
      }
    } else {
      // No expiry info, assume token is valid
      console.log(`[Middleware] No expiry info, assuming valid, allowing through`);
      return NextResponse.next();
    }
  }
  
  // No valid authentication found, redirect to login
  console.log(`[Middleware] No valid auth found, redirecting to login`);
  const baseUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online';
  return NextResponse.redirect(`${baseUrl}/login?auth=required`);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/reports/:path*',
    // Only protect specific routes, not the catch-all
    // This allows root '/', '/login', '/auth/*', '/legal/*', and other public routes to be accessible
  ]
};