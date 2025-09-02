import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Redirect from old callback path to new admin-callback path
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString()
  const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
  const redirectUrl = `${baseUrl}/api/auth/google/admin-callback${searchParams ? `?${searchParams}` : ''}`
  
  console.log('[OAuth Redirect] Redirecting from /api/auth/google/callback to /api/auth/google/admin-callback')
  return NextResponse.redirect(redirectUrl)
}