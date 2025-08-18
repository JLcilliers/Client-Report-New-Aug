import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { createClient } from "@supabase/supabase-js"

const analyticsData = google.analyticsdata("v1beta")

export async function POST(request: NextRequest) {
  try {
    const { propertyId, startDate, endDate } = await request.json()
    
    if (!propertyId) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 })
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get admin Google connection
    const { data: adminConnection, error: adminError } = await supabase
      .from("admin_google_connections")
      .select("*")
      .eq("admin_email", "johanlcilliers@gmail.com")
      .single()
    
    if (adminError || !adminConnection || !adminConnection.refresh_token) {
      return NextResponse.json({ 
        error: "Admin Google connection not found or invalid",
        details: adminError
      }, { status: 401 })
    }
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/auth/google/callback`
    )
    
    oauth2Client.setCredentials({
      refresh_token: adminConnection.refresh_token,
    })
    
    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(credentials)
    
    // Format dates
    const endDateObj = endDate ? new Date(endDate) : new Date()
    const startDateObj = startDate ? new Date(startDate) : (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d
    })()
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    // Fetch Analytics data
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{
          startDate: formatDate(startDateObj),
          endDate: formatDate(endDateObj)
        }],
        dimensions: [
          { name: "date" },
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
    
    // Get top pages data
    const pagesResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{
          startDate: formatDate(startDateObj),
          endDate: formatDate(endDateObj)
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
    
    // Process the data
    const analyticsResult = {
      summary: {
        users: 0,
        sessions: 0,
        pageviews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        newUsers: 0
      },
      trafficSources: [] as any[],
      topPages: [] as any[],
      dailyData: [] as any[]
    }
    
    // Process summary data
    if (response.data.rows) {
      response.data.rows.forEach(row => {
        const sessions = parseInt(row.metricValues?.[0]?.value || "0")
        const users = parseInt(row.metricValues?.[1]?.value || "0")
        const newUsers = parseInt(row.metricValues?.[2]?.value || "0")
        const bounceRate = parseFloat(row.metricValues?.[3]?.value || "0")
        const avgDuration = parseFloat(row.metricValues?.[4]?.value || "0")
        const pageviews = parseInt(row.metricValues?.[5]?.value || "0")
        
        analyticsResult.summary.sessions += sessions
        analyticsResult.summary.users += users
        analyticsResult.summary.newUsers += newUsers
        analyticsResult.summary.pageviews += pageviews
        
        // Calculate weighted averages
        if (sessions > 0) {
          analyticsResult.summary.bounceRate += bounceRate * sessions
          analyticsResult.summary.avgSessionDuration += avgDuration * sessions
        }
        
        // Group by channel
        const channel = row.dimensionValues?.[1]?.value || "Unknown"
        const existingChannel = analyticsResult.trafficSources.find(s => s.source === channel)
        if (existingChannel) {
          existingChannel.users += users
          existingChannel.sessions += sessions
        } else {
          analyticsResult.trafficSources.push({
            source: channel,
            users,
            sessions,
            percentage: 0
          })
        }
      })
      
      // Calculate final averages
      if (analyticsResult.summary.sessions > 0) {
        analyticsResult.summary.bounceRate /= analyticsResult.summary.sessions
        analyticsResult.summary.avgSessionDuration /= analyticsResult.summary.sessions
      }
      
      // Calculate percentages for traffic sources
      const totalSessions = analyticsResult.summary.sessions
      analyticsResult.trafficSources.forEach(source => {
        source.percentage = totalSessions > 0 ? (source.sessions / totalSessions) * 100 : 0
      })
    }
    
    // Process top pages data
    if (pagesResponse.data.rows) {
      analyticsResult.topPages = pagesResponse.data.rows.slice(0, 10).map(row => ({
        page: row.dimensionValues?.[0]?.value || "",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
        bounceRate: parseFloat(row.metricValues?.[2]?.value || "0"),
        avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0")
      }))
    }
    
    return NextResponse.json({
      success: true,
      analytics: analyticsResult,
      propertyId,
      dateRange: {
        startDate: formatDate(startDateObj),
        endDate: formatDate(endDateObj)
      }
    })
    
  } catch (error: any) {
    console.error("Error fetching Analytics data:", error)
    return NextResponse.json({
      error: "Failed to fetch Analytics data",
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}