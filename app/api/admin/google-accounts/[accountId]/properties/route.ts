import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Fetch the Google account
    const { data: account, error } = await supabase
      .from("google_accounts")
      .select("*")
      .eq("id", accountId)
      .single()
    
    if (error || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    
    if (!account.refresh_token) {
      return NextResponse.json({ 
        error: "No refresh token for this account",
        searchConsole: { sites: [] },
        analytics: { properties: [] }
      }, { status: 200 })
    }
    
    // Create OAuth client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/auth/google/callback`
    )
    
    oauth2Client.setCredentials({
      refresh_token: account.refresh_token,
    })
    
    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)
    
    // Update the stored access token
    await supabase
      .from("google_accounts")
      .update({
        access_token: credentials.access_token,
        token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
      })
      .eq("id", accountId)
    
    const result: any = {
      searchConsole: { sites: [] },
      analytics: { properties: [] }
    }
    
    // Fetch Search Console properties
    try {
      const searchconsole = google.searchconsole("v1")
      const sitesResponse = await searchconsole.sites.list({
        auth: oauth2Client,
      })
      
      result.searchConsole.sites = sitesResponse.data.siteEntry || []
    } catch (error: any) {
      console.error(`Error fetching Search Console for ${account.account_email}:`, error)
      result.searchConsole.error = error.message
    }
    
    // Fetch Analytics properties
    try {
      const analyticsAdmin = google.analyticsadmin("v1alpha")
      
      // First get accounts
      const accountsResponse = await analyticsAdmin.accounts.list({
        auth: oauth2Client,
      })
      
      const analyticsProperties = []
      
      if (accountsResponse.data.accounts) {
        // For each account, get properties
        for (const analyticsAccount of accountsResponse.data.accounts) {
          try {
            const propertiesResponse = await analyticsAdmin.properties.list({
              auth: oauth2Client,
              filter: `parent:${analyticsAccount.name}`,
            })
            
            if (propertiesResponse.data.properties) {
              for (const property of propertiesResponse.data.properties) {
                // Extract property ID from the name (format: properties/123456)
                const propertyId = property.name?.split('/')[1] || ''
                
                analyticsProperties.push({
                  account: analyticsAccount.displayName || analyticsAccount.name || '',
                  property: property.name || '',
                  propertyId: propertyId,
                  displayName: property.displayName || property.name || '',
                })
              }
            }
          } catch (propError: any) {
            console.error(`Error fetching properties for account ${analyticsAccount.name}:`, propError)
          }
        }
      }
      
      result.analytics.properties = analyticsProperties
    } catch (error: any) {
      console.error(`Error fetching Analytics for ${account.account_email}:`, error)
      result.analytics.error = error.message
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching properties:', error)
    return NextResponse.json({
      error: "Failed to fetch properties",
      details: error.message
    }, { status: 500 })
  }
}