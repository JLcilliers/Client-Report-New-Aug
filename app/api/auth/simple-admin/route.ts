import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    // Simple demo authentication - no real validation
    const body = await request.json()
    
    // Set a simple session cookie for demo purposes
    const response = NextResponse.json({ 
      success: true, 
      message: "Demo authentication successful" 
    })
    
    // Set a simple auth cookie (in production, use proper session management)
    response.cookies.set('demo_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })
    
    return response
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Authentication failed" 
    }, { status: 401 })
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const action = searchParams.get("action")
  
  // If no code, initiate OAuth
  if (!code && action === "start") {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${request.nextUrl.origin}/api/auth/simple-admin`,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
    })
    
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  }
  
  // If we have a code, exchange it for tokens
  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Missing Supabase configuration")
      }
      
      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: `${request.nextUrl.origin}/api/auth/simple-admin`,
          grant_type: "authorization_code",
        }),
      })
      
      const tokenData = await tokenResponse.json()
      
      if (!tokenResponse.ok) {
        
        throw new Error(tokenData.error_description || "Failed to exchange code")
      }
      
      const { access_token, refresh_token, expires_in } = tokenData
      
      // Get user info
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      
      const userData = await userResponse.json()
      
      // Calculate token expiry
      const tokenExpiry = new Date()
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in)
      
      // Store in Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
      
      // Try to create table if it doesn't exist (will fail silently if it does)
      try {
        await supabase.from("admin_google_connections").select("*").limit(1)
      } catch (error) {
        // Table might not exist, but we'll handle that below
        
      }
      
      // Upsert the connection
      const { error: upsertError } = await supabase
        .from("admin_google_connections")
        .upsert({
          admin_email: userData.email,
          email: userData.email,
          access_token,
          refresh_token: refresh_token || "",
          token_expiry: tokenExpiry.toISOString(),
        }, {
          onConflict: "admin_email",
        })
      
      if (upsertError) {
        
        // Try without upsert
        await supabase
          .from("admin_google_connections")
          .delete()
          .eq("admin_email", userData.email)
        
        await supabase
          .from("admin_google_connections")
          .insert({
            admin_email: userData.email,
            email: userData.email,
            access_token,
            refresh_token: refresh_token || "",
            token_expiry: tokenExpiry.toISOString(),
          })
      }
      
      // Create response with success page
      const response = new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Success</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 1rem;
                box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
                max-width: 500px;
                text-align: center;
              }
              h1 { color: #10b981; }
              .email { 
                background: #f3f4f6; 
                padding: 0.5rem 1rem; 
                border-radius: 0.5rem; 
                margin: 1rem 0;
                font-family: monospace;
              }
              .button {
                display: inline-block;
                margin-top: 1rem;
                padding: 0.75rem 2rem;
                background: #6366f1;
                color: white;
                text-decoration: none;
                border-radius: 0.5rem;
                font-weight: 500;
              }
              .button:hover {
                background: #4f46e5;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Authentication Successful!</h1>
              <p>Google account connected successfully</p>
              <div class="email">${userData.email}</div>
              <p>Tokens stored: ${refresh_token ? '✅ Refresh token saved' : '⚠️ No refresh token (may need to revoke and retry)'}</p>
              <a href="/admin/auth/setup" class="button">Back to Setup</a>
              <br><br>
              <a href="/report/${request.nextUrl.searchParams.get('report') || '4227ac4a-d82e-45c1-adf4-3c019f0204f8'}" class="button">Test Report Refresh</a>
            </div>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
      })
      
      // Set cookies for the tokens so the refresh route can use them
      response.cookies.set('google_access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })
      
      if (refresh_token) {
        response.cookies.set('google_refresh_token', refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/'
        })
      }
      
      return response
      
    } catch (error: any) {
      
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: #fef2f2;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 1rem;
                box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
                max-width: 500px;
              }
              h1 { color: #ef4444; }
              .error {
                background: #fee2e2;
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem 0;
                color: #991b1b;
                font-family: monospace;
                font-size: 0.875rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Authentication Failed</h1>
              <div class="error">${error.message}</div>
              <a href="/admin/auth/setup">Back to Setup</a>
            </div>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
      })
    }
  }
  
  // Default response
  return NextResponse.json({
    message: "Simple Admin OAuth",
    start_url: `${request.nextUrl.origin}/api/auth/simple-admin?action=start`,
  })
}