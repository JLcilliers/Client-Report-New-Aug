import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get all the URLs we're using
  const baseUrl1 = process.env.NEXT_PUBLIC_URL || `https://${request.headers.get('host')}`
  const baseUrl2 = `https://${request.headers.get('host')}`
  const baseUrl3 = request.nextUrl.origin
  
  // All possible redirect URIs in the app
  const redirectUris = [
    `${baseUrl1}/api/auth/google/admin-callback`,
    `${baseUrl2}/api/auth/google/admin-callback`,
    `${baseUrl3}/api/auth/google/admin-callback`,
    `https://searchsignal.online/api/auth/google/admin-callback`,
  ]
  
  // What the initiate endpoint is actually using
  const actualBaseUrl = process.env.NEXT_PUBLIC_URL || 
    `https://${request.headers.get('host')}` ||
    'https://online-client-reporting.vercel.app'
  
  const actualRedirectUri = `${actualBaseUrl}/api/auth/google/admin-callback`
  
  // Build the actual auth URL
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "NOT_SET",
    redirect_uri: actualRedirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state: "admin_connection",
  })
  
  return NextResponse.json({
    current_config: {
      actualRedirectUri,
      actualBaseUrl,
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
    },
    all_base_urls: {
      env_NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || "not set",
      headers_host: request.headers.get('host'),
      nextUrl_origin: request.nextUrl.origin,
    },
    all_possible_redirects: redirectUris,
    auth_url_params: Object.fromEntries(params),
    full_auth_url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    instructions: [
      "IMPORTANT: The redirect URI that MUST be in Google Cloud Console is:",
      actualRedirectUri,
      "",
      "To add it:",
      "1. Go to https://console.cloud.google.com",
      "2. Navigate to APIs & Services > Credentials",
      "3. Click on your OAuth 2.0 Client ID",
      "4. In 'Authorized redirect URIs', ensure this EXACT URI is present:",
      `   ${actualRedirectUri}`,
      "5. Make sure there are no trailing slashes or spaces",
      "6. Save the changes"
    ]
  })
}