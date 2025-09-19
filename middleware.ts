// Simplified middleware - let the admin layout handle auth
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Only protect specific routes that absolutely need middleware protection
  // Admin routes will handle their own auth via the layout
  return NextResponse.next();
}

// Empty matcher - effectively disables middleware
// Auth is handled in components instead
export const config = {
  matcher: []
};