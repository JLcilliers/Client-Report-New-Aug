import { NextResponse } from "next/server"

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/auth/admin-google/callback`
    
    if (!clientId) {
      return NextResponse.json({ 
        error: "Google Client ID not configured",
        envVars: {
          hasClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          hasPublicUrl: !!process.env.NEXT_PUBLIC_URL,
        }
      }, { status: 500 })
    }
    
    const params = new URLSearchParams({
      client_id: clientId,
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
    
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error("Error initiating OAuth:", error)
    return NextResponse.json({ 
      error: "Failed to initiate OAuth",
      details: error.message 
    }, { status: 500 })
  }
}