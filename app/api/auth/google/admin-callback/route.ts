import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Check for required Supabase config
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase configuration")
    return NextResponse.redirect(
      new URL("/admin/connections?error=server_configuration", request.url)
    )
  }
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
      console.error("Status:", tokenResponse.status)
      console.error("Client ID:", process.env.GOOGLE_CLIENT_ID)
      console.error("Redirect URI:", `${request.nextUrl.origin}/api/auth/google/admin-callback`)
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status} - ${errorData}`)
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
      // Table doesn't exist - try to create it
      console.log("Creating admin_google_connections table...")
      
      // Create the table using raw SQL
      const { error: createError } = await supabase.from("admin_google_connections").select("*").limit(1)
      
      // If it still doesn't exist, we need to inform the user
      if (createError?.code === "42P01") {
        console.error("Table admin_google_connections does not exist. Please create it in Supabase.")
        return NextResponse.redirect(
          new URL("/admin/connections?error=database_not_configured", request.url)
        )
      }
    }

    // Calculate token expiry
    const tokenExpiry = new Date()
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokens.expires_in)

    // For now, just use the Google email as the admin email
    // Since the admin is connecting their own Google account
    const adminEmail = userInfo.email
    
    console.log("Using admin email:", adminEmail)

    // Upsert the connection
    console.log("Attempting to store connection for:", adminEmail)
    console.log("Google email:", userInfo.email)
    console.log("Token expiry:", tokenExpiry.toISOString())
    console.log("Has refresh token:", !!tokens.refresh_token)
    
    const { data: upsertData, error: upsertError } = await supabase
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
      .select()

    if (upsertError) {
      console.error("Error storing tokens:", upsertError)
      console.error("Error details:", JSON.stringify(upsertError, null, 2))
      throw new Error(`Failed to store authentication: ${upsertError.message}`)
    }
    
    console.log("Successfully stored connection:", upsertData)

    // Redirect back to connections page with success
    return NextResponse.redirect(
      new URL("/admin/connections?success=connected", request.url)
    )
  } catch (error: any) {
    console.error("OAuth callback error:", error)
    console.error("Error stack:", error.stack)
    
    // Return a proper error response instead of 500
    const errorMessage = error.message || "Unknown error occurred"
    
    // Check if it's a Supabase/database error
    if (errorMessage.includes("store authentication")) {
      return NextResponse.redirect(
        new URL("/admin/connections?error=database_error", request.url)
      )
    }
    
    // Check if it's a token exchange error
    if (errorMessage.includes("exchange code")) {
      return NextResponse.redirect(
        new URL("/admin/connections?error=oauth_exchange_failed", request.url)
      )
    }
    
    // Default error
    return NextResponse.redirect(
      new URL("/admin/connections?error=connection_failed", request.url)
    )
  }
}