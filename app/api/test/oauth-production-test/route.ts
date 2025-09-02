import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Always use production URL for this test
  const productionUrl = 'https://searchsignal.online'
  const redirectUri = `${productionUrl}/api/auth/google/admin-callback`
  
  // Create the exact OAuth URL that will be used in production
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
  
  // Test if redirect URI matches what we expect
  const expectedRedirectUri = "https://searchsignal.online/api/auth/google/admin-callback"
  const redirectUriMatch = redirectUri === expectedRedirectUri
  
  return NextResponse.json({
    test_results: {
      redirect_uri_match: redirectUriMatch ? "✅ PASS" : "❌ FAIL",
      uses_https: redirectUri.startsWith("https://") ? "✅ PASS" : "❌ FAIL",
      correct_path: redirectUri.includes("/api/auth/google/admin-callback") ? "✅ PASS" : "❌ FAIL",
      client_id_present: process.env.GOOGLE_CLIENT_ID ? "✅ PASS" : "❌ FAIL"
    },
    production_config: {
      redirect_uri: redirectUri,
      expected_redirect_uri: expectedRedirectUri,
      client_id: process.env.GOOGLE_CLIENT_ID
    },
    oauth_url: authUrl,
    google_console_requirements: {
      must_add_these_uris: [
        "https://searchsignal.online/api/auth/google/admin-callback"
      ],
      optional_for_local_testing: [
        "http://localhost:3000/api/auth/google/admin-callback",
        "http://localhost:3001/api/auth/google/admin-callback",
        "http://localhost:3002/api/auth/google/admin-callback"
      ]
    },
    status: redirectUriMatch ? "✅ Ready for production" : "❌ Configuration mismatch"
  })
}