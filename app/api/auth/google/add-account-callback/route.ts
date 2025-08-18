import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect('/admin/google-accounts?error=oauth_denied')
  }

  if (!code) {
    return NextResponse.redirect('/admin/google-accounts?error=no_code')
  }

  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL || 'https://online-client-reporting.vercel.app'}/api/auth/google/add-account-callback`
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user info
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    })
    
    const userInfo = await response.json()

    // Save to database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Server configuration error")
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Check if account already exists
    const { data: existing } = await supabase
      .from("google_accounts")
      .select("*")
      .eq("account_email", userInfo.email)
      .single()
    
    if (existing) {
      // Update existing account
      await supabase
        .from("google_accounts")
        .update({
          account_name: userInfo.name || existing.account_name,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existing.refresh_token,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          scopes: tokens.scope ? tokens.scope.split(' ') : existing.scopes,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
    } else {
      // Create new account
      await supabase
        .from("google_accounts")
        .insert({
          account_email: userInfo.email,
          account_name: userInfo.name,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          scopes: tokens.scope ? tokens.scope.split(' ') : [],
          is_active: true
        })
    }

    return NextResponse.redirect('/admin/google-accounts?success=account_added')
  } catch (error: any) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect('/admin/google-accounts?error=oauth_failed')
  }
}