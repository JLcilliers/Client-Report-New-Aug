import { NextResponse } from "next/server"

export async function GET() {
  // Build the direct OAuth URL
  const params = new URLSearchParams({
    client_id: "998982098952-et4jamotfaitvlp5d1mim3ve144dbm2s.apps.googleusercontent.com",
    redirect_uri: "https://online-client-reporting.vercel.app/api/auth/google/admin-callback",
    response_type: "code",
    scope: "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly",
    access_type: "offline",
    prompt: "consent",
    state: "admin_connection",
  })
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  
  // Redirect directly to Google OAuth
  return NextResponse.redirect(authUrl)
}