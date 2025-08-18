import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

const searchconsole = google.searchconsole("v1")

interface SearchConsoleMetrics {
  clicks: number
  impressions: number
  ctr: number
  position: number
  date?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    console.log('Refreshing data for report with slug:', slug)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Get report by slug
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select(`
        *,
        client:clients (
          id,
          name,
          domain
        )
      `)
      .eq("slug", slug)
      .single()

    if (reportError || !report) {
      console.error('Report not found:', reportError)
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    console.log('Found report:', report.name, 'with ID:', report.id)

    // Get admin Google connection tokens
    const { data: adminConnection, error: adminError } = await supabase
      .from("admin_google_connections")
      .select("*")
      .eq("admin_email", "johanlcilliers@gmail.com")
      .single()

    if (adminError || !adminConnection || !adminConnection.refresh_token) {
      console.error('Admin connection not found or no refresh token:', adminError)
      return NextResponse.json({ error: "Authentication required - please connect Google account at /admin/auth/setup" }, { status: 401 })
    }

    console.log('Found admin user with refresh token')

    // Auto-detect URL if needed
    const baseUrl = process.env.NEXT_PUBLIC_URL || 
      `https://${request.headers.get('host')}` ||
      'https://online-client-reporting.vercel.app'
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/auth/google/callback`
    )

    oauth2Client.setCredentials({
      refresh_token: adminConnection.refresh_token,
    })

    // Get new access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    console.log('OAuth2 client configured with refreshed token')

    // Fetch Search Console data
    const searchConsoleData: any = {
      summary: {},
      byDate: [],
      topQueries: [],
      topPages: [],
    }

    if (report.search_console_properties && report.search_console_properties.length > 0) {
      console.log('Fetching Search Console data for properties:', report.search_console_properties)
      
      for (const property of report.search_console_properties) {
        try {
          // Calculate date range (last 30 days)
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)

          const formatDate = (date: Date) => {
            return date.toISOString().split('T')[0]
          }

          console.log(`Fetching data for property: ${property} from ${formatDate(startDate)} to ${formatDate(endDate)}`)

          // Fetch summary metrics
          const summaryResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: [],
              rowLimit: 1,
            },
          })

          console.log('Summary response:', JSON.stringify(summaryResponse.data, null, 2))

          if (summaryResponse.data.rows && summaryResponse.data.rows[0]) {
            const row = summaryResponse.data.rows[0]
            searchConsoleData.summary = {
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: row.ctr || 0,
              position: row.position || 0,
            }
          }

          // Fetch data by date
          const byDateResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ["date"],
              rowLimit: 30,
            },
          })

          if (byDateResponse.data.rows) {
            searchConsoleData.byDate = byDateResponse.data.rows
          }

          // Fetch top queries
          const queriesResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ["query"],
              rowLimit: 10,
            },
          })

          if (queriesResponse.data.rows) {
            searchConsoleData.topQueries = queriesResponse.data.rows
          }

          // Fetch top pages
          const pagesResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ["page"],
              rowLimit: 10,
            },
          })

          if (pagesResponse.data.rows) {
            searchConsoleData.topPages = pagesResponse.data.rows
          }

          console.log('Successfully fetched all Search Console data')
        } catch (error: any) {
          console.error(`Error fetching data for property ${property}:`, error)
          // Continue with other properties if one fails
        }
      }
    }

    // Store the fetched data
    const { data: storedData, error: storeError } = await supabase
      .from("report_data")
      .upsert({
        report_id: report.id,
        data_type: "search_console",
        data: searchConsoleData,
        date_range: "last30days",
        fetched_at: new Date().toISOString(),
      }, {
        onConflict: "report_id,data_type",
      })

    if (storeError) {
      console.error('Error storing data:', storeError)
      // Try insert if upsert fails due to missing unique constraint
      const { error: insertError } = await supabase
        .from("report_data")
        .insert({
          report_id: report.id,
          data_type: "search_console",
          data: searchConsoleData,
          date_range: "last30days",
        })
      
      if (insertError) {
        console.error('Error inserting data:', insertError)
      }
    }

    console.log('Data stored successfully')

    return NextResponse.json({ 
      success: true, 
      message: "Data refreshed successfully",
      data: searchConsoleData
    })
  } catch (error: any) {
    console.error("Error refreshing report data:", error)
    return NextResponse.json(
      { error: "Failed to refresh data", details: error.message },
      { status: 500 }
    )
  }
}