import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

const searchconsole = google.searchconsole("v1")

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get admin connection
    const { data: adminConnection, error: adminError } = await supabase
      .from("admin_google_connections")
      .select("*")
      .eq("admin_email", "johanlcilliers@gmail.com")
      .single()
    
    if (adminError || !adminConnection) {
      return NextResponse.json({ 
        error: "Admin connection not found",
        details: adminError
      }, { status: 404 })
    }
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `https://online-client-reporting.vercel.app/api/auth/google/callback`
    )
    
    oauth2Client.setCredentials({
      refresh_token: adminConnection.refresh_token,
    })
    
    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)
    
    // Test fetching data from the first Search Console property
    const sitesResponse = await searchconsole.sites.list({
      auth: oauth2Client,
    })
    
    let testData = null
    let testSite = null
    let siteError = null
    
    // Try to find a site we have access to, preferring lancerskincare.com
    const preferredSites = [
      'sc-domain:lancerskincare.com',
      'https://www.lancerskincare.com/',
      'https://lancerskincare.com/',
      'sc-domain:vocalegalglobal.com',
      'https://www.vocalegalglobal.com/'
    ]
    
    // First try preferred sites
    for (const site of preferredSites) {
      const siteEntry = sitesResponse.data.siteEntry?.find(s => s.siteUrl === site)
      if (siteEntry) {
        testSite = siteEntry.siteUrl
        break
      }
    }
    
    // If no preferred site found, try any site until we find one that works
    if (!testSite && sitesResponse.data.siteEntry && sitesResponse.data.siteEntry.length > 0) {
      for (const site of sitesResponse.data.siteEntry) {
        testSite = site.siteUrl
        // Skip sites that commonly have permission issues
        if (testSite?.includes('laasinvest.com')) {
          continue
        }
        break
      }
    }
    
    if (testSite) {
      try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        
        const formatDate = (date: Date) => date.toISOString().split('T')[0]
        
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
        siteError = error.message
        console.error(`Error fetching data for ${testSite}:`, error.message)
      }
    }
    
    // Try to fetch a report and store data
    const { data: reports } = await supabase
      .from("reports")
      .select("*")
      .limit(1)
      .single()
    
    let storeResult = null
    if (reports && testData) {
      const { data: stored, error: storeError } = await supabase
        .from("report_data")
        .upsert({
          report_id: reports.id,
          data_type: "search_console_test",
          data: testData,
          date_range: "last7days",
          fetched_at: new Date().toISOString(),
        }, {
          onConflict: "report_id,data_type",
        })
      
      if (storeError) {
        // Try insert instead
        const { data: inserted, error: insertError } = await supabase
          .from("report_data")
          .insert({
            report_id: reports.id,
            data_type: "search_console_test",
            data: testData,
            date_range: "last7days",
          })
        
        storeResult = { inserted, insertError }
      } else {
        storeResult = { stored }
      }
    }
    
    return NextResponse.json({
      success: true,
      connection: {
        email: adminConnection.admin_email,
        hasRefreshToken: !!adminConnection.refresh_token,
        tokenExpiry: adminConnection.token_expiry
      },
      searchConsole: {
        sites: sitesResponse.data.siteEntry?.map(s => s.siteUrl) || [],
        siteCount: sitesResponse.data.siteEntry?.length || 0,
        testedSite: testSite,
        siteError: siteError
      },
      testData,
      storeResult,
      report: reports
    })
  } catch (error: any) {
    console.error('Error testing data fetch:', error)
    return NextResponse.json({
      error: "Failed to fetch data",
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}