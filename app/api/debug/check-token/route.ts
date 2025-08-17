import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Missing configuration" })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get the stored connection
    const { data: connection, error } = await supabase
      .from("admin_google_connections")
      .select("*")
      .limit(1)
      .single()
    
    if (error || !connection) {
      return NextResponse.json({ error: "No connection found" })
    }
    
    // Check token info
    const tokenInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${connection.access_token}`
    )
    
    if (!tokenInfoResponse.ok) {
      // Token might be expired, try to refresh
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: connection.refresh_token,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: "refresh_token",
        }),
      })
      
      if (!refreshResponse.ok) {
        return NextResponse.json({ 
          error: "Failed to refresh token",
          details: await refreshResponse.text()
        })
      }
      
      const newTokens = await refreshResponse.json()
      
      // Update in database
      const newExpiry = new Date()
      newExpiry.setSeconds(newExpiry.getSeconds() + newTokens.expires_in)
      
      await supabase
        .from("admin_google_connections")
        .update({
          access_token: newTokens.access_token,
          token_expiry: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id)
      
      // Check new token info
      const newTokenInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${newTokens.access_token}`
      )
      
      const newTokenInfo = await newTokenInfoResponse.json()
      
      return NextResponse.json({
        status: "Token refreshed",
        tokenInfo: newTokenInfo,
        scopes: newTokenInfo.scope?.split(' ') || [],
        hasAnalyticsScope: newTokenInfo.scope?.includes('analytics'),
        email: connection.email,
        connected_at: connection.connected_at,
      })
    }
    
    const tokenInfo = await tokenInfoResponse.json()
    
    // Test Analytics API access
    let analyticsTest = { working: false, error: null }
    try {
      const testResponse = await fetch(
        "https://analyticsadmin.googleapis.com/v1alpha/accounts",
        {
          headers: {
            Authorization: `Bearer ${connection.access_token}`,
          },
        }
      )
      
      if (testResponse.ok) {
        const data = await testResponse.json()
        analyticsTest = { 
          working: true, 
          accountCount: data.accounts?.length || 0 
        }
      } else {
        analyticsTest = { 
          working: false, 
          error: await testResponse.text() 
        }
      }
    } catch (e: any) {
      analyticsTest = { working: false, error: e.message }
    }
    
    return NextResponse.json({
      tokenInfo,
      scopes: tokenInfo.scope?.split(' ') || [],
      hasAnalyticsScope: tokenInfo.scope?.includes('analytics'),
      hasAnalyticsReadonly: tokenInfo.scope?.includes('analytics.readonly'),
      email: connection.email,
      connected_at: connection.connected_at,
      analyticsApiTest: analyticsTest,
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to check token",
      details: error.message 
    })
  }
}