import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get("action")
  
  if (action === "start") {
    // Generate OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "NOT_SET",
      redirect_uri: `${request.nextUrl.origin}/api/test/google-auth?action=callback`,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/webmasters",
        "https://www.googleapis.com/auth/analytics",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    return NextResponse.redirect(authUrl)
  }
  
  if (action === "callback") {
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    
    if (error) {
      return NextResponse.json({ error: `Google OAuth error: ${error}` })
    }
    
    if (!code) {
      return NextResponse.json({ error: "No authorization code received" })
    }
    
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: `${request.nextUrl.origin}/api/test/google-auth?action=callback`,
          grant_type: "authorization_code",
        }),
      })

      const responseText = await tokenResponse.text()
      
      if (!tokenResponse.ok) {
        return NextResponse.json({ 
          error: "Token exchange failed",
          status: tokenResponse.status,
          details: responseText,
          client_id: process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET",
          client_secret: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET",
        })
      }
      
      const tokens = JSON.parse(responseText)
      
      // Get user info
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      )
      
      const userInfo = await userInfoResponse.json()
      
      return NextResponse.json({
        success: true,
        userInfo,
        hasRefreshToken: !!tokens.refresh_token,
        tokenExpiry: tokens.expires_in,
        scopes: tokens.scope,
      })
    } catch (error: any) {
      return NextResponse.json({ 
        error: "Test failed",
        message: error.message,
        stack: error.stack,
      })
    }
  }
  
  // Default response with test links
  return NextResponse.json({
    message: "Google OAuth Test Endpoint",
    test_auth_url: `${request.nextUrl.origin}/api/test/google-auth?action=start`,
    environment: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET",
    }
  })
}