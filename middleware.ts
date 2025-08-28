import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export default auth(async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers for production
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS for production (uncomment when using HTTPS)
  // response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname;
  
  // Check if the path is protected (admin routes)
  if (pathname.startsWith('/admin')) {
    const session = await auth();
    
    // Redirect to sign in if no session exists
    if (!session) {
      const signInUrl = new URL('/api/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  return response;
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    '/admin/:path*'
  ],
};