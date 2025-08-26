import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db/supabase"
import { encrypt } from "@/lib/utils/encryption"
import axios from "axios"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state") // Client ID
  const error = searchParams.get("error")

  // Handle error from Google
  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/clients/${state}/connections?error=${error}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/admin/clients?error=missing_params", request.url)
    )
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get("host")}`}/api/auth/google/callback`,
      grant_type: "authorization_code",
    })

    const { access_token, refresh_token, expires_in } = tokenResponse.data

    // Calculate token expiry
    const tokenExpiry = new Date()
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in)

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(access_token)
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null

    // Check if credentials already exist
    const { data: existingCreds } = await supabaseAdmin
      .from("google_credentials")
      .select("id")
      .eq("client_id", state)
      .single()

    if (existingCreds) {
      // Update existing credentials
      await supabaseAdmin
        .from("google_credentials")
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: tokenExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("client_id", state)
    } else {
      // Create new credentials
      await supabaseAdmin
        .from("google_credentials")
        .insert({
          client_id: state,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expiry: tokenExpiry.toISOString(),
        })
    }

    // Close the popup window with a success message
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #10b981;
              margin-bottom: 1rem;
            }
            p {
              color: #6b7280;
              margin-bottom: 1.5rem;
            }
            .close-text {
              color: #9ca3af;
              font-size: 0.875rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Authorization Successful!</h1>
            <p>Google account has been connected successfully.</p>
            <p class="close-text">This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (error: any) {
    
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Failed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f3f4f6;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #ef4444;
              margin-bottom: 1rem;
            }
            p {
              color: #6b7280;
              margin-bottom: 1.5rem;
            }
            .error-details {
              background: #fef2f2;
              color: #991b1b;
              padding: 0.75rem;
              border-radius: 4px;
              font-size: 0.875rem;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✗ Authorization Failed</h1>
            <p>There was an error connecting your Google account.</p>
            <div class="error-details">${error.message || "Unknown error occurred"}</div>
            <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 1rem;">
              Please close this window and try again.
            </p>
          </div>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    })
  }
}