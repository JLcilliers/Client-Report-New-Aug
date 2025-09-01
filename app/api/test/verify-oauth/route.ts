import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  
  // Check what URLs the app is actually using
  const actualBaseUrl = process.env.NEXT_PUBLIC_URL || `${protocol}://${host}`
  
  // These are the callback URLs your app will use
  const callbacks = [
    `${actualBaseUrl}/api/auth/google/callback`,
    `${actualBaseUrl}/api/auth/google/admin-callback`,
    `${actualBaseUrl}/api/auth/admin-google/callback`
  ]
  
  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
      APP_URL: process.env.APP_URL
    },
    detected: {
      host,
      protocol,
      actualBaseUrl
    },
    oauth_config: {
      client_id: process.env.GOOGLE_CLIENT_ID?.substring(0, 30) + "...",
      has_secret: !!process.env.GOOGLE_CLIENT_SECRET
    },
    required_redirect_uris: callbacks,
    instructions: [
      "1. ALL redirect URIs above must be in Google Cloud Console",
      "2. NEXTAUTH_URL must use https:// for production",
      "3. Remove any redirect URIs with /api/auth/callback/google format"
    ]
  })
}