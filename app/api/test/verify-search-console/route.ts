import { NextResponse } from "next/server"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { createClient } from "@supabase/supabase-js"

const searchconsole = google.searchconsole("v1")

export async function GET() {
  try {
    console.log('Testing Search Console API connection...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get admin user
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "johanlcilliers@gmail.com")
      .single()
    
    if (adminError || !adminUser) {
      return NextResponse.json({ 
        error: "Admin user not found",
        details: adminError
      }, { status: 404 })
    }
    
    if (!adminUser.google_refresh_token) {
      return NextResponse.json({ 
        error: "No refresh token for admin user",
        adminUser: {
          email: adminUser.email,
          hasRefreshToken: false
        }
      }, { status: 401 })
    }
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/auth/google/callback`
    )
    
    oauth2Client.setCredentials({
      refresh_token: adminUser.google_refresh_token,
    })
    
    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)
    
    // List Search Console sites
    const sitesResponse = await searchconsole.sites.list({
      auth: oauth2Client,
    })
    
    // Test fetching data for the first site
    let testData = null
    if (sitesResponse.data.siteEntry && sitesResponse.data.siteEntry.length > 0) {
      const testSite = sitesResponse.data.siteEntry[0].siteUrl
      
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      
      const formatDate = (date: Date) => date.toISOString().split('T')[0]
      
      try {
        const queryResponse = await searchconsole.searchanalytics.query({
          auth: oauth2Client,
          siteUrl: testSite,
          requestBody: {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            dimensions: [],
            rowLimit: 1,
          },
        })
        
        testData = queryResponse.data
      } catch (error: any) {
        console.error('Error fetching test data:', error)
        testData = { error: error.message }
      }
    }
    
    return NextResponse.json({
      success: true,
      adminUser: {
        email: adminUser.email,
        hasRefreshToken: true
      },
      searchConsole: {
        sites: sitesResponse.data.siteEntry || [],
        siteCount: sitesResponse.data.siteEntry?.length || 0
      },
      testData,
      credentials: {
        hasAccessToken: !!credentials.access_token,
        tokenType: credentials.token_type,
        expiryDate: credentials.expiry_date
      }
    })
  } catch (error: any) {
    console.error('Error verifying Search Console connection:', error)
    return NextResponse.json({
      error: "Failed to verify Search Console connection",
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}