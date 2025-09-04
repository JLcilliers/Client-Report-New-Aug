// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export function middleware(req: NextRequest) {
  // In development, bypass auth completely
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  
  // In production, use NextAuth
  return (withAuth({
    pages: { signIn: '/api/auth/signin' },
  }) as any)(req);
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],           // guard private areas
};