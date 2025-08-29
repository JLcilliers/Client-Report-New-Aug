import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  
  // This is the callback - handle the OAuth response
  if (code || error) {
    if (error) {
      return NextResponse.json({ 
        oauth_error: error,
        description: searchParams.get("error_description") || "No description provided"
      }, { status: 400 })
    }
    
    try {
      // Try to exchange the code
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code!,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: `${request.nextUrl.origin}/api/auth/test-oauth`,
          grant_type: "authorization_code",
        }),
      })

      const responseText = await tokenResponse.text()
      let responseData: any
      
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = { raw_response: responseText }
      }
      
      if (!tokenResponse.ok) {
        return NextResponse.json({ 
          error: "Token exchange failed",
          status: tokenResponse.status,
          response: responseData,
          debug: {
            client_id_set: !!process.env.GOOGLE_CLIENT_ID,
            client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${request.nextUrl.origin}/api/auth/test-oauth`,
          }
        }, { status: 400 })
      }
      
      // Success! Try to get user info
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${responseData.access_token}`,
        },
      })
      
      const userInfo = await userResponse.json()
      
      return NextResponse.json({
        success: true,
        user: userInfo,
        token_info: {
          has_refresh_token: !!responseData.refresh_token,
          expires_in: responseData.expires_in,
          scope: responseData.scope,
        }
      })
      
    } catch (error: any) {
      return NextResponse.json({ 
        error: "Exception during token exchange",
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      }, { status: 500 })
    }
  }
  
  // Generate the OAuth URL
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "MISSING_CLIENT_ID",
    redirect_uri: `${request.nextUrl.origin}/api/auth/test-oauth`,
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
  
  // Return HTML page with link
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OAuth Test</title>
        <style>
          body { font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .info { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #4285f4; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px;
            margin: 20px 0;
          }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>Google OAuth Test</h1>
        
        <div class="info">
          <h3>Environment Check:</h3>
          <p>✅ GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : '❌ MISSING'}</p>
          <p>✅ GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'SET' : '❌ MISSING'}</p>
        </div>
        
        <div class="info">
          <h3>Redirect URI to add in Google Cloud Console:</h3>
          <code>${request.nextUrl.origin}/api/auth/test-oauth</code>
        </div>
        
        <a href="${authUrl}" class="button">Test Google OAuth</a>
        
        <div class="info">
          <h3>OAuth URL (for debugging):</h3>
          <textarea style="width: 100%; height: 100px; font-size: 12px;">${authUrl}</textarea>
        </div>
      </body>
    </html>
  `
  
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  })
}