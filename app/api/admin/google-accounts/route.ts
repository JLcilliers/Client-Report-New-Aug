import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Fetch all Google accounts
    const { data: accounts, error } = await supabase
      .from("google_accounts")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (error) {
      throw error
    }
    
    // For each account, get property counts
    const accountsWithProperties = await Promise.all(
      (accounts || []).map(async (account) => {
        let searchConsoleCount = 0
        let analyticsCount = 0
        
        if (account.refresh_token) {
          try {
            // Create OAuth client for this account
            const oauth2Client = new OAuth2Client(
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_CLIENT_SECRET,
              `${process.env.NEXT_PUBLIC_URL}/api/auth/google/callback`
            )
            
            oauth2Client.setCredentials({
              refresh_token: account.refresh_token,
            })
            
            // Try to refresh token and get properties
            const { credentials } = await oauth2Client.refreshAccessToken()
            oauth2Client.setCredentials(credentials)
            
            // Get Search Console properties
            try {
              const searchconsole = google.searchconsole("v1")
              const sitesResponse = await searchconsole.sites.list({
                auth: oauth2Client,
              })
              searchConsoleCount = sitesResponse.data.siteEntry?.length || 0
            } catch (e) {
              console.error(`Error fetching Search Console for ${account.account_email}:`, e)
            }
            
            // Get Analytics properties
            try {
              const analytics = google.analyticsadmin("v1alpha")
              const accountsResponse = await analytics.accounts.list({
                auth: oauth2Client,
              })
              analyticsCount = accountsResponse.data.accounts?.length || 0
            } catch (e) {
              console.error(`Error fetching Analytics for ${account.account_email}:`, e)
            }
          } catch (error) {
            console.error(`Error processing account ${account.account_email}:`, error)
          }
        }
        
        return {
          ...account,
          search_console_properties: new Array(searchConsoleCount).fill(''),
          analytics_properties: new Array(analyticsCount).fill('')
        }
      })
    )
    
    return NextResponse.json({
      accounts: accountsWithProperties
    })
  } catch (error: any) {
    console.error('Error fetching Google accounts:', error)
    return NextResponse.json({
      error: "Failed to fetch Google accounts",
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const { email, name, accessToken, refreshToken, tokenExpiry, scopes } = await request.json()
    
    if (!email || !refreshToken) {
      return NextResponse.json({ error: "Email and refresh token are required" }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Check if account already exists
    const { data: existing } = await supabase
      .from("google_accounts")
      .select("*")
      .eq("account_email", email)
      .single()
    
    if (existing) {
      // Update existing account
      const { data: account, error } = await supabase
        .from("google_accounts")
        .update({
          account_name: name || existing.account_name,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: tokenExpiry,
          scopes: scopes || existing.scopes,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single()
      
      if (error) throw error
      
      return NextResponse.json({
        account,
        message: "Account updated successfully",
        isNew: false
      })
    } else {
      // Create new account
      const { data: account, error } = await supabase
        .from("google_accounts")
        .insert({
          account_email: email,
          account_name: name,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: tokenExpiry,
          scopes: scopes,
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      
      return NextResponse.json({
        account,
        message: "Account added successfully",
        isNew: true
      })
    }
  } catch (error: any) {
    console.error('Error creating/updating Google account:', error)
    return NextResponse.json({
      error: "Failed to save Google account",
      details: error.message
    }, { status: 500 })
  }
}