import { NextRequest, NextResponse } from "next/server"
import { getOAuthRedirectUri } from "@/lib/utils/oauth-config"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getOAuthRedirectUri(request)
    
    console.log('[OAuth] ===== OAuth Initialization Debug =====')
    console.log('[OAuth] Request URL:', request.url)
    console.log('[OAuth] Request origin:', request.nextUrl.origin)
    console.log('[OAuth] Redirect URI being used:', redirectUri)
    console.log('[OAuth] NEXT_PUBLIC_URL env:', process.env.NEXT_PUBLIC_URL)
    console.log('[OAuth] NODE_ENV:', process.env.NODE_ENV)
    
    // Construct OAuth URL manually for better control
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state: "admin_connection"
    })
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    
    console.log('[OAuth] Full OAuth URL:', authUrl)
    console.log('[OAuth] URL params:', Object.fromEntries(params.entries()))
    console.log('[OAuth] ===== End Debug =====')
    console.log('[OAuth] Redirecting to Google Auth...')
    
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('[OAuth] Initialization error:', error)
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    return NextResponse.redirect(`${baseUrl}/admin/google-accounts?error=oauth_init_failed`)
  }
}