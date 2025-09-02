import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const baseUrl = 'https://searchsignal.online'
  const redirectUri = `${baseUrl}/api/auth/google/admin-callback`
  
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
    state: "admin_connection"
  })
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  
  return NextResponse.json({
    redirect_uri_being_sent: redirectUri,
    client_id: process.env.GOOGLE_CLIENT_ID,
    full_oauth_url: authUrl,
    decoded_params: {
      client_id: params.get('client_id'),
      redirect_uri: params.get('redirect_uri'),
      response_type: params.get('response_type'),
      scope: params.get('scope'),
      access_type: params.get('access_type'),
      prompt: params.get('prompt'),
      state: params.get('state')
    },
    required_in_google_console: [
      "https://searchsignal.online/api/auth/google/admin-callback"
    ],
    instructions: [
      "1. Copy the 'redirect_uri_being_sent' value",
      "2. Go to https://console.cloud.google.com",
      "3. Navigate to APIs & Services > Credentials",
      "4. Click on your OAuth 2.0 Client ID",
      "5. Ensure this exact URI is in 'Authorized redirect URIs'",
      "6. Save changes in Google Cloud Console"
    ]
  })
}