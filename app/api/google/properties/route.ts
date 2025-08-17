import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { connectionId } = await request.json()
    
    if (!connectionId) {
      return NextResponse.json({ error: "Connection ID required" }, { status: 400 })
    }
    
    // Get the connection from database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    const { data: connection, error: connError } = await supabase
      .from("admin_google_connections")
      .select("*")
      .eq("id", connectionId)
      .single()
    
    if (connError || !connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }
    
    // Check if token is expired and refresh if needed
    const tokenExpiry = new Date(connection.token_expiry)
    const now = new Date()
    let accessToken = connection.access_token
    
    if (now >= tokenExpiry) {
      console.log("Token expired, refreshing...")
      
      // Refresh the token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
      
      if (!tokenResponse.ok) {
        console.error("Failed to refresh token")
        return NextResponse.json({ error: "Failed to refresh Google token" }, { status: 401 })
      }
      
      const newTokens = await tokenResponse.json()
      accessToken = newTokens.access_token
      
      // Update tokens in database
      const newExpiry = new Date()
      newExpiry.setSeconds(newExpiry.getSeconds() + newTokens.expires_in)
      
      await supabase
        .from("admin_google_connections")
        .update({
          access_token: accessToken,
          token_expiry: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId)
    }
    
    // Fetch Search Console properties
    let searchConsoleProperties = []
    try {
      const scResponse = await fetch(
        "https://www.googleapis.com/webmasters/v3/sites",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      
      if (scResponse.ok) {
        const scData = await scResponse.json()
        searchConsoleProperties = scData.siteEntry || []
        console.log(`Found ${searchConsoleProperties.length} Search Console properties`)
      } else {
        console.error("Failed to fetch Search Console properties:", await scResponse.text())
      }
    } catch (error) {
      console.error("Error fetching Search Console properties:", error)
    }
    
    // Fetch Analytics properties
    let analyticsAccounts = []
    try {
      // Try GA4 Admin API first
      const accountsResponse = await fetch(
        "https://analyticsadmin.googleapis.com/v1alpha/accounts",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      
      console.log("Analytics accounts response status:", accountsResponse.status)
      
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        const accounts = accountsData.accounts || []
        console.log(`Found ${accounts.length} Analytics accounts`)
        
        // For each account, get properties
        for (const account of accounts) {
          const propertiesResponse = await fetch(
            `https://analyticsadmin.googleapis.com/v1alpha/properties?filter=parent:${account.name}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
          
          console.log(`Properties response for ${account.displayName}:`, propertiesResponse.status)
          
          if (propertiesResponse.ok) {
            const propertiesData = await propertiesResponse.json()
            if (propertiesData.properties && propertiesData.properties.length > 0) {
              analyticsAccounts.push({
                name: account.displayName,
                id: account.name,
                properties: propertiesData.properties.map((prop: any) => ({
                  name: prop.name,
                  id: prop.name.split('/').pop(), // Extract property ID
                  displayName: prop.displayName,
                }))
              })
            }
          } else {
            const errorText = await propertiesResponse.text()
            console.error(`Failed to fetch properties for ${account.displayName}:`, errorText)
          }
        }
      } else {
        const errorText = await accountsResponse.text()
        console.error("Failed to fetch Analytics accounts:", errorText)
        
        // Try alternative approach - Management API for Universal Analytics (if any legacy properties)
        try {
          const mgmtResponse = await fetch(
            "https://www.googleapis.com/analytics/v3/management/accounts",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
          
          if (mgmtResponse.ok) {
            const mgmtData = await mgmtResponse.json()
            console.log("Found legacy Analytics accounts:", mgmtData.items?.length || 0)
          }
        } catch (e) {
          console.log("No legacy Analytics access")
        }
      }
      
      console.log(`Total Analytics accounts with properties: ${analyticsAccounts.length}`)
    } catch (error) {
      console.error("Error fetching Analytics properties:", error)
    }
    
    return NextResponse.json({
      searchConsole: searchConsoleProperties,
      analytics: analyticsAccounts,
    })
  } catch (error: any) {
    console.error("Properties API error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch properties",
      details: error.message 
    }, { status: 500 })
  }
}