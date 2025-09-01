import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  
  // For localhost, use http and ignore NEXT_PUBLIC_URL
  const isLocalhost = host?.includes('localhost')
  const effectiveProtocol = isLocalhost ? 'http' : protocol
  
  const baseUrl = isLocalhost 
    ? `http://${host}`
    : (process.env.NEXT_PUBLIC_URL || `${effectiveProtocol}://${host}` || 'https://searchsignal.online')
    
  const redirectUri = `${baseUrl}/api/auth/google/admin-callback`
  
  return NextResponse.json({
    current_redirect_uri: redirectUri,
    base_url: baseUrl,
    host,
    protocol,
    env_url: process.env.NEXT_PUBLIC_URL,
    client_id: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
    all_oauth_routes: {
      add_account: "/api/auth/google/add-account",
      callback: "/api/auth/google/admin-callback",
      legacy_callback: "/api/auth/admin-google/callback"
    },
    instructions: [
      "1. Copy the 'current_redirect_uri' value above",
      "2. Go to https://console.cloud.google.com",
      "3. Navigate to APIs & Services > Credentials",
      "4. Click on your OAuth 2.0 Client ID",
      "5. Add the redirect URI to 'Authorized redirect URIs'",
      "6. Save the changes"
    ]
  })
}