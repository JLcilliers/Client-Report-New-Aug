import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check for required Supabase config
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase configuration")
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // Handle error from Google
  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/connections?error=${error}`, request.url)
    )
  }

  if (!code || state !== "admin_connection") {
    return NextResponse.redirect(
      new URL("/admin/connections?error=invalid_request", request.url)
    )
  }

  try {
    // Check for required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth environment variables")
      throw new Error("Server configuration error - missing OAuth credentials")
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${request.nextUrl.origin}/api/auth/google/admin-callback`,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("Token exchange error:", errorData)
      throw new Error("Failed to exchange code for tokens")
    }

    const tokens = await tokenResponse.json()

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    )

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info")
    }

    const userInfo = await userInfoResponse.json()

    // Store tokens in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // First, check if table exists by trying to query it
    const { error: tableError } = await supabase
      .from("admin_google_connections")
      .select("*")
      .limit(1)

    if (tableError?.code === "42P01") {
      // Table doesn't exist - user needs to run the SQL manually
      console.error("admin_google_connections table doesn't exist. Please run the SQL in supabase/create-admin-connections-table.sql")
      // For now, we'll proceed anyway and let it error on the upsert
    }

    // Calculate token expiry
    const tokenExpiry = new Date()
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokens.expires_in)

    // Get the current user's session to get their email
    const sessionCookie = request.cookies.get("sb-bqpmpjuhjbbyouycwxgt-auth-token")
    let adminEmail = userInfo.email // Default to Google email

    if (sessionCookie) {
      try {
        // Parse the session to get the user email
        const sessionData = JSON.parse(sessionCookie.value)
        if (sessionData?.user?.email) {
          adminEmail = sessionData.user.email
        }
      } catch (e) {
        console.log("Could not parse session cookie, using Google email")
      }
    }

    // Upsert the connection
    const { error: upsertError } = await supabase
      .from("admin_google_connections")
      .upsert({
        admin_email: adminEmail,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || "",
        token_expiry: tokenExpiry.toISOString(),
        email: userInfo.email,
      }, {
        onConflict: "admin_email",
      })

    if (upsertError) {
      console.error("Error storing tokens:", upsertError)
      throw new Error("Failed to store authentication")
    }

    // Redirect back to connections page with success
    return NextResponse.redirect(
      new URL("/admin/connections?success=connected", request.url)
    )
  } catch (error: any) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/admin/connections?error=connection_failed", request.url)
    )
  }
}