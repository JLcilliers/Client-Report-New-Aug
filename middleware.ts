// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // In development, bypass auth completely
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  
  // Check if user has a valid Google access token cookie
  const hasGoogleToken = req.cookies.has('google_access_token');
  
  // Allow access if they have a Google token (from our OAuth flow)
  if (hasGoogleToken) {
    return NextResponse.next();
  }
  
  // Otherwise redirect to home page for login
  const baseUrl = req.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/?auth=required`);
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],           // guard private areas
};