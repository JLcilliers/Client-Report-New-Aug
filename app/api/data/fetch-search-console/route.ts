import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface SearchConsoleMetrics {
  clicks: number
  impressions: number
  ctr: number
  position: number
  date?: string
}

export async function POST(request: NextRequest) {
  try {
    const { reportId, dateRange = 'last30days' } = await request.json()
    
    if (!reportId) {
      return NextResponse.json({ error: "Report ID required" }, { status: 400 })
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get report details
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single()
    
    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }
    
    // Get admin connection
    const { data: connection, error: connError } = await supabase
      .from("admin_google_connections")
      .select("*")
      .limit(1)
      .single()
    
    if (connError || !connection) {
      return NextResponse.json({ error: "No Google connection found" }, { status: 404 })
    }
    
    // Check if token needs refresh
    const tokenExpiry = new Date(connection.token_expiry)
    const now = new Date()
    let accessToken = connection.access_token
    
    if (now >= tokenExpiry) {
      console.log("Token expired, refreshing...")
      
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
        return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 })
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
        .eq("id", connection.id)
    }
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    if (dateRange === 'last7days') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (dateRange === 'last30days') {
      startDate.setDate(startDate.getDate() - 30)
    } else if (dateRange === 'last90days') {
      startDate.setDate(startDate.getDate() - 90)
    } else {
      startDate.setDate(startDate.getDate() - 30) // Default to 30 days
    }
    
    const allData: any = {
      summary: {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      },
      byProperty: [],
      byDate: [],
      topPages: [],
      topQueries: [],
    }
    
    // Fetch data for each Search Console property
    for (const property of report.search_console_properties || []) {
      try {
        // Clean up property URL (remove sc-domain: prefix if present)
        const siteUrl = property.replace('sc-domain:', 'domain:')
        
        console.log(`Fetching data for property: ${siteUrl}`)
        
        // Fetch overall metrics
        const metricsResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: [],
              rowLimit: 1,
            }),
          }
        )
        
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json()
          const metrics = metricsData.rows?.[0] || {}
          
          allData.summary.clicks += metrics.clicks || 0
          allData.summary.impressions += metrics.impressions || 0
          
          allData.byProperty.push({
            property: property,
            metrics: {
              clicks: metrics.clicks || 0,
              impressions: metrics.impressions || 0,
              ctr: metrics.ctr || 0,
              position: metrics.position || 0,
            }
          })
        }
        
        // Fetch data by date
        const dateResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: ["date"],
              rowLimit: 1000,
            }),
          }
        )
        
        if (dateResponse.ok) {
          const dateData = await dateResponse.json()
          allData.byDate = dateData.rows || []
        }
        
        // Fetch top pages
        const pagesResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: ["page"],
              rowLimit: 10,
            }),
          }
        )
        
        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json()
          allData.topPages = pagesData.rows || []
        }
        
        // Fetch top queries
        const queriesResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: ["query"],
              rowLimit: 20,
            }),
          }
        )
        
        if (queriesResponse.ok) {
          const queriesData = await queriesResponse.json()
          allData.topQueries = queriesData.rows || []
        }
        
      } catch (error: any) {
        console.error(`Error fetching data for ${property}:`, error)
      }
    }
    
    // Calculate summary CTR and position
    if (allData.summary.impressions > 0) {
      allData.summary.ctr = allData.summary.clicks / allData.summary.impressions
    }
    
    // Calculate average position from all properties
    if (allData.byProperty.length > 0) {
      const totalPosition = allData.byProperty.reduce((sum: number, p: any) => 
        sum + (p.metrics.position || 0), 0
      )
      allData.summary.position = totalPosition / allData.byProperty.length
    }
    
    // Store data in database
    const { error: storeError } = await supabase
      .from("report_data")
      .upsert({
        report_id: reportId,
        data_type: "search_console",
        data: allData,
        date_range: dateRange,
        fetched_at: new Date().toISOString(),
      }, {
        onConflict: "report_id,data_type",
      })
    
    if (storeError && storeError.code === "42P01") {
      // Table doesn't exist, create it
      console.log("Creating report_data table...")
      // Return data without storing for now
    }
    
    return NextResponse.json({
      success: true,
      data: allData,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      }
    })
    
  } catch (error: any) {
    console.error("Search Console fetch error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch Search Console data",
      details: error.message 
    }, { status: 500 })
  }
}