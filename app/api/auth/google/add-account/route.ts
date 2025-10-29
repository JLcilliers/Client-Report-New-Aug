import { NextRequest, NextResponse } from "next/server"
import { getOAuthRedirectUri } from "@/lib/utils/oauth-config"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getOAuthRedirectUri(request)
    
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
    
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    return NextResponse.redirect(`${baseUrl}/admin?error=oauth_init_failed`)
  }
}
