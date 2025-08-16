import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow public access to report pages
  if (request.nextUrl.pathname.startsWith('/report/')) {
    return NextResponse.next()
  }

  // Allow public access to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public access to auth pages
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next()
  }

  // All other routes continue normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}