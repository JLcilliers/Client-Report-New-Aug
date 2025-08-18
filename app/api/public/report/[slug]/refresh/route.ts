import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

const searchconsole = google.searchconsole("v1")
const analyticsData = google.analyticsdata("v1beta")

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

    // Get report by slug with Google account info
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select(`
        *,
        client:clients (
          id,
          name,
          domain
        ),
        google_account:google_accounts!google_account_id (
          id,
          account_email,
          refresh_token,
          access_token,
          token_expiry
        )
      `)
      .eq("slug", slug)
      .single()

    if (reportError || !report) {
      console.error('Report not found:', reportError)
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    console.log('Found report:', report.name, 'with ID:', report.id)
    
    // Check if report has a Google account associated
    let googleAccount = report.google_account
    
    // Fallback to admin connection if no Google account is associated (for legacy reports)
    if (!googleAccount || !googleAccount.refresh_token) {
      console.log('No Google account associated with report, trying admin fallback')
      
      const { data: adminConnection, error: adminError } = await supabase
        .from("admin_google_connections")
        .select("*")
        .eq("admin_email", "johanlcilliers@gmail.com")
        .single()

      if (adminError || !adminConnection || !adminConnection.refresh_token) {
        console.error('No Google account found for data refresh')
        return NextResponse.json({ 
          error: "No Google account configured for this report. Please edit the report to select a Google account." 
        }, { status: 401 })
      }
      
      // Transform admin connection to match google_accounts structure
      googleAccount = {
        id: 'admin',
        account_email: adminConnection.admin_email,
        refresh_token: adminConnection.refresh_token,
        access_token: adminConnection.access_token,
        token_expiry: adminConnection.token_expiry
      }
    }

    console.log('Using Google account:', googleAccount.account_email)

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
      refresh_token: googleAccount.refresh_token,
    })

    // Get new access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)

    console.log('OAuth2 client configured with refreshed token')

    // Update stored access token if using google_accounts table
    if (googleAccount.id !== 'admin') {
      await supabase
        .from("google_accounts")
        .update({
          access_token: credentials.access_token,
          token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
        })
        .eq("id", googleAccount.id)
    }

    // Initialize data structures
    const searchConsoleData: any = {
      summary: {},
      byDate: [],
      topQueries: [],
      topPages: [],
    }

    const analyticsResult: any = {
      summary: {},
      trafficSources: [],
      topPages: [],
    }

    // Date range for data fetching
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    // Fetch Search Console data
    if (report.search_console_properties && report.search_console_properties.length > 0) {
      console.log('Fetching Search Console data for properties:', report.search_console_properties)
      
      let aggregatedMetrics: SearchConsoleMetrics = {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0
      }

      for (const property of report.search_console_properties) {
        try {
          console.log('Fetching data for property:', property)
          
          // Overall metrics
          const overallResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: [],
              rowLimit: 1,
            },
          })

          if (overallResponse.data.rows && overallResponse.data.rows[0]) {
            const row = overallResponse.data.rows[0]
            aggregatedMetrics.clicks += row.clicks || 0
            aggregatedMetrics.impressions += row.impressions || 0
          }

          // Get top queries
          const queriesResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ['query'],
              rowLimit: 10,
            },
          })

          if (queriesResponse.data.rows) {
            searchConsoleData.topQueries.push(...queriesResponse.data.rows)
          }

          // Get top pages
          const pagesResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ['page'],
              rowLimit: 10,
            },
          })

          if (pagesResponse.data.rows) {
            searchConsoleData.topPages.push(...pagesResponse.data.rows)
          }

          // Get data by date
          const dateResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ['date'],
              rowLimit: 30,
            },
          })

          if (dateResponse.data.rows) {
            searchConsoleData.byDate.push(...dateResponse.data.rows)
          }

        } catch (error: any) {
          console.error(`Error fetching Search Console data for ${property}:`, error.message)
        }
      }

      // Calculate aggregated metrics
      if (aggregatedMetrics.impressions > 0) {
        aggregatedMetrics.ctr = (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100
      }

      // Calculate average position
      if (searchConsoleData.topQueries.length > 0) {
        const totalPosition = searchConsoleData.topQueries.reduce((sum: number, q: any) => 
          sum + (q.position || 0), 0)
        aggregatedMetrics.position = totalPosition / searchConsoleData.topQueries.length
      }

      searchConsoleData.summary = aggregatedMetrics

      // Sort and limit results
      searchConsoleData.topQueries = searchConsoleData.topQueries
        .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10)
      
      searchConsoleData.topPages = searchConsoleData.topPages
        .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10)
    }

    // Fetch Analytics data
    if (report.analytics_properties && report.analytics_properties.length > 0) {
      console.log('Fetching Analytics data for properties:', report.analytics_properties)
      
      for (const propertyId of report.analytics_properties) {
        try {
          console.log('Fetching Analytics data for property:', propertyId)
          
          // Overall metrics
          const response = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            requestBody: {
              dateRanges: [{
                startDate: formatDate(startDate),
                endDate: formatDate(endDate)
              }],
              dimensions: [
                { name: "sessionDefaultChannelGroup" }
              ],
              metrics: [
                { name: "sessions" },
                { name: "activeUsers" },
                { name: "newUsers" },
                { name: "bounceRate" },
                { name: "averageSessionDuration" },
                { name: "screenPageViews" }
              ]
            },
            auth: oauth2Client
          })

          // Process Analytics data
          if (response.data.rows) {
            response.data.rows.forEach(row => {
              const channel = row.dimensionValues?.[0]?.value || "Unknown"
              const sessions = parseInt(row.metricValues?.[0]?.value || "0")
              const users = parseInt(row.metricValues?.[1]?.value || "0")
              const newUsers = parseInt(row.metricValues?.[2]?.value || "0")
              const bounceRate = parseFloat(row.metricValues?.[3]?.value || "0")
              const avgDuration = parseFloat(row.metricValues?.[4]?.value || "0")
              const pageviews = parseInt(row.metricValues?.[5]?.value || "0")
              
              // Add to summary
              analyticsResult.summary.sessions = (analyticsResult.summary.sessions || 0) + sessions
              analyticsResult.summary.users = (analyticsResult.summary.users || 0) + users
              analyticsResult.summary.newUsers = (analyticsResult.summary.newUsers || 0) + newUsers
              analyticsResult.summary.pageviews = (analyticsResult.summary.pageviews || 0) + pageviews
              
              // Add to traffic sources
              analyticsResult.trafficSources.push({
                source: channel,
                users,
                sessions,
                bounceRate,
                avgDuration
              })
            })
          }

          // Get top pages
          const pagesResponse = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            requestBody: {
              dateRanges: [{
                startDate: formatDate(startDate),
                endDate: formatDate(endDate)
              }],
              dimensions: [
                { name: "pagePath" }
              ],
              metrics: [
                { name: "sessions" },
                { name: "activeUsers" },
                { name: "bounceRate" },
                { name: "averageSessionDuration" }
              ],
              orderBys: [{
                metric: { metricName: "sessions" },
                desc: true
              }],
              limit: "10"
            },
            auth: oauth2Client
          })

          if (pagesResponse.data.rows) {
            analyticsResult.topPages = pagesResponse.data.rows.map(row => ({
              page: row.dimensionValues?.[0]?.value || "",
              sessions: parseInt(row.metricValues?.[0]?.value || "0"),
              users: parseInt(row.metricValues?.[1]?.value || "0"),
              bounceRate: parseFloat(row.metricValues?.[2]?.value || "0"),
              avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0")
            }))
          }

        } catch (error: any) {
          console.error(`Error fetching Analytics data for ${propertyId}:`, error.message)
        }
      }

      // Calculate averages
      if (analyticsResult.summary.sessions > 0) {
        const totalSessions = analyticsResult.summary.sessions
        analyticsResult.trafficSources.forEach((source: any) => {
          source.percentage = (source.sessions / totalSessions) * 100
        })
      }
    }

    // Combine all data
    const combinedData = {
      search_console: searchConsoleData,
      analytics: analyticsResult,
      fetched_at: new Date().toISOString()
    }

    console.log('Data fetched successfully')

    // Store in report_data table
    const { error: storeError } = await supabase
      .from("report_data")
      .upsert({
        report_id: report.id,
        data_type: "combined",
        data: combinedData,
        date_range: "last30days",
        fetched_at: new Date().toISOString(),
      }, {
        onConflict: "report_id,data_type",
      })

    if (storeError) {
      console.error('Error storing data:', storeError)
      // Try insert if upsert fails
      const { error: insertError } = await supabase
        .from("report_data")
        .insert({
          report_id: report.id,
          data_type: "combined",
          data: combinedData,
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
      data: combinedData
    })
  } catch (error: any) {
    console.error("Error refreshing report data:", error)
    return NextResponse.json(
      { error: "Failed to refresh data", details: error.message },
      { status: 500 }
    )
  }
}