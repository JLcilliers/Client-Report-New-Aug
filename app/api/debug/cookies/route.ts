import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()

  // Get all cookies
  const allCookies: Record<string, string> = {}
  const importantCookies = [
    'session_token',
    'google_access_token',
    'google_refresh_token',
    'google_token_expiry',
    'google_user_email',
    'demo_auth'
  ]

  for (const cookieName of importantCookies) {
    const cookie = cookieStore.get(cookieName)
    if (cookie) {
      allCookies[cookieName] = cookie.value.substring(0, 20) + '...'
    } else {
      allCookies[cookieName] = 'NOT SET'
    }
  }

  // Also get cookies from request headers
  const cookieHeader = request.headers.get('cookie')

  return NextResponse.json({
    message: 'Cookie Debug Info',
    cookies: allCookies,
    cookieHeader: cookieHeader ? 'Present' : 'None',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      url: request.url
    }
  })
}