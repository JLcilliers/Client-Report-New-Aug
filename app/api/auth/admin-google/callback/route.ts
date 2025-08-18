import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?error=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin?error=missing_code", request.url)
    )
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase configuration")
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Auto-detect URL if NEXT_PUBLIC_URL is not set
    const baseUrl = process.env.NEXT_PUBLIC_URL || 
      `https://${request.headers.get('host')}` ||
      'https://online-client-reporting.vercel.app'
    
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
        redirect_uri: `${baseUrl}/api/auth/admin-google/callback`,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || "Failed to exchange code for tokens")
    }

    const { access_token, refresh_token, expires_in } = tokenData

    // Calculate token expiry
    const tokenExpiry = new Date()
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in)

    // Update admin user with tokens
    const { error: updateError } = await supabase
      .from("admin_users")
      .update({
        google_access_token: access_token,
        google_refresh_token: refresh_token,
        google_token_expiry: tokenExpiry.toISOString(),
      })
      .eq("email", "johanlcilliers@gmail.com")

    if (updateError) {
      console.error("Failed to update admin user:", updateError)
      throw new Error("Failed to save authentication tokens")
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/admin?auth=success", request.url)
    )
  } catch (error: any) {
    console.error("Admin OAuth callback error:", error)
    return NextResponse.redirect(
      new URL(`/admin?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}