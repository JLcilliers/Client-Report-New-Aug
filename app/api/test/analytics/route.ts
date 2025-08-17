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
    
    const results: any = {
      connection: {
        email: connection.email,
        connected_at: connection.connected_at,
        token_expires: connection.token_expiry,
      },
      tests: {}
    }
    
    // Test 1: Token Info
    try {
      const tokenInfoRes = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${connection.access_token}`
      )
      const tokenInfo = await tokenInfoRes.json()
      results.tests.tokenInfo = {
        valid: tokenInfoRes.ok,
        scopes: tokenInfo.scope,
        expires_in: tokenInfo.expires_in,
      }
    } catch (e: any) {
      results.tests.tokenInfo = { error: e.message }
    }
    
    // Test 2: Analytics Admin API v1alpha
    try {
      const res = await fetch(
        "https://analyticsadmin.googleapis.com/v1alpha/accounts",
        {
          headers: {
            Authorization: `Bearer ${connection.access_token}`,
          },
        }
      )
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
      
      results.tests.analyticsAdminV1Alpha = {
        status: res.status,
        ok: res.ok,
        response: res.ok ? { accountCount: data.accounts?.length || 0 } : data
      }
    } catch (e: any) {
      results.tests.analyticsAdminV1Alpha = { error: e.message }
    }
    
    // Test 3: Analytics Reporting API (legacy)
    try {
      const res = await fetch(
        "https://www.googleapis.com/analytics/v3/management/accounts",
        {
          headers: {
            Authorization: `Bearer ${connection.access_token}`,
          },
        }
      )
      const data = await res.json()
      results.tests.analyticsV3 = {
        status: res.status,
        ok: res.ok,
        response: res.ok ? { accountCount: data.items?.length || 0 } : data
      }
    } catch (e: any) {
      results.tests.analyticsV3 = { error: e.message }
    }
    
    // Test 4: Search Console (for comparison)
    try {
      const res = await fetch(
        "https://www.googleapis.com/webmasters/v3/sites",
        {
          headers: {
            Authorization: `Bearer ${connection.access_token}`,
          },
        }
      )
      const data = await res.json()
      results.tests.searchConsole = {
        status: res.status,
        ok: res.ok,
        response: res.ok ? { siteCount: data.siteEntry?.length || 0 } : data
      }
    } catch (e: any) {
      results.tests.searchConsole = { error: e.message }
    }
    
    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Test failed",
      details: error.message 
    })
  }
}