import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Auto-detect URL using the same logic as the OAuth endpoints
  const baseUrl = process.env.NEXT_PUBLIC_URL || 
    `https://${request.headers.get('host')}` ||
    'https://online-client-reporting.vercel.app'
    
  const redirectUri = `${baseUrl}/api/auth/admin-google/callback`
  
  const clientId = process.env.GOOGLE_CLIENT_ID
  
  const params = new URLSearchParams({
    client_id: clientId || "NOT_SET",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
  })
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  
  return NextResponse.json({
    redirectUri,
    baseUrl,
    host: request.headers.get('host'),
    envUrl: process.env.NEXT_PUBLIC_URL || "Not set",
    clientIdPreview: clientId ? clientId.substring(0, 20) + "..." : "Not set",
    authUrl,
    instructions: [
      "1. Copy the redirectUri above",
      "2. Go to Google Cloud Console > APIs & Services > Credentials",
      "3. Click on your OAuth 2.0 Client ID",
      "4. Add the redirectUri to 'Authorized redirect URIs'",
      "5. Save the changes",
      "",
      "Common redirect URIs to add:",
      "- https://online-client-reporting.vercel.app/api/auth/admin-google/callback",
      "- https://online-client-reporting.vercel.app/api/auth/google/callback",
      "- http://localhost:3000/api/auth/admin-google/callback (for local development)"
    ]
  })
}