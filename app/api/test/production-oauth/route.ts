import { NextRequest, NextResponse } from "next/server"
import { getOAuthRedirectUri } from "@/lib/utils/oauth-config"

export async function GET(request: NextRequest) {
  // Get the production redirect URI
  const productionRedirectUri = "https://searchsignal.online/api/auth/google/admin-callback"
  
  // Get the actual redirect URI based on current request
  const actualRedirectUri = getOAuthRedirectUri(request)
  
  // Construct what the OAuth URL would be in production
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: productionRedirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state: "admin_connection"
  })
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  
  return NextResponse.json({
    current_environment: {
      NODE_ENV: process.env.NODE_ENV,
      actual_redirect_uri: actualRedirectUri
    },
    production_config: {
      expected_redirect_uri: productionRedirectUri,
      oauth_url_preview: authUrl
    },
    google_console_required_uris: [
      "https://searchsignal.online/api/auth/google/admin-callback",
      "http://localhost:3000/api/auth/google/admin-callback", 
      "http://localhost:3001/api/auth/google/admin-callback"
    ],
    status: {
      ready_for_production: process.env.NEXT_PUBLIC_URL === "https://searchsignal.online",
      https_configured: process.env.NEXTAUTH_URL?.startsWith("https://")
    }
  })
}