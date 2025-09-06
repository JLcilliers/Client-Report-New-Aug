// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export function middleware(req: NextRequest) {
  // In development, bypass auth completely
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  
  // Check for demo auth cookie first
  const demoAuth = req.cookies.get('demo_auth');
  if (demoAuth?.value === 'true') {
    return NextResponse.next();
  }
  
  // Check for Google OAuth cookies
  const googleAccessToken = req.cookies.get('google_access_token');
  if (googleAccessToken?.value) {
    return NextResponse.next();
  }
  
  // Use NextAuth middleware for admin routes as fallback
  return (withAuth({
    pages: { signIn: '/' }, // redirect to home page instead of /api/auth/signin
  }) as any)(req);
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],           // guard private areas
};