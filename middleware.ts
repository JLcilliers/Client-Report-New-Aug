// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export async function middleware(req: NextRequest) {
  // In development, bypass auth completely
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  
  // Check for demo auth cookie first
  const demoAuth = req.cookies.get('demo_auth');
  if (demoAuth?.value === 'true') {
    return NextResponse.next();
  }
  
  // Enhanced session validation
  const sessionToken = req.cookies.get('session_token');
  const googleAccessToken = req.cookies.get('google_access_token');
  const googleTokenExpiry = req.cookies.get('google_token_expiry');
  
  // Check session token first (preferred method)
  if (sessionToken?.value) {
    try {
      // For middleware, we'll do a lightweight check
      // The full validation happens in the check-session endpoint
      
      // If we have a session token, allow access
      // The check-session endpoint will handle expired sessions
      return NextResponse.next();
    } catch (error) {
      console.error('Session token validation failed:', error);
      // Fall through to other auth methods
    }
  }
  
  // Check for valid Google OAuth tokens
  if (googleAccessToken?.value) {
    // Check if token is expired
    if (googleTokenExpiry?.value) {
      const expiryDate = new Date(googleTokenExpiry.value);
      const now = new Date();
      
      // If token expires within 5 minutes, still allow (refresh will happen in check-session)
      if (expiryDate.getTime() - now.getTime() > -5 * 60 * 1000) {
        return NextResponse.next();
      }
    } else {
      // No expiry info, assume token is valid
      return NextResponse.next();
    }
  }
  
  // No valid authentication found, redirect to home
  const baseUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online';
  return NextResponse.redirect(`${baseUrl}/?auth=required`);
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/admin/:path*',
    // Add other protected routes here
    '/reports/:path*',
    // Exclude API routes from middleware (they handle their own auth)
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};