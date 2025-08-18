import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get report by slug
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("id")
      .eq("slug", slug)
      .single()
    
    if (reportError || !report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }
    
    // Get stored data for this report
    const { data: reportData, error: dataError } = await supabase
      .from("report_data")
      .select("*")
      .eq("report_id", report.id)
    
    if (dataError && dataError.code !== "42P01") {
      console.error("Error fetching report data:", dataError)
    }
    
    // Transform data by type
    const result: any = {
      search_console: null,
      analytics: null,
      last_updated: null,
    }
    
    if (reportData && reportData.length > 0) {
      for (const item of reportData) {
        // Handle combined data format
        if (item.data_type === 'combined' && item.data) {
          result.search_console = item.data.search_console || null
          result.analytics = item.data.analytics || null
          result.last_updated = item.data.fetched_at || item.fetched_at
        } 
        // Handle legacy separate format
        else if (item.data_type === 'search_console') {
          result.search_console = item.data
        } else if (item.data_type === 'analytics') {
          result.analytics = item.data
        }
        
        // Track most recent update
        if (item.fetched_at && (!result.last_updated || new Date(item.fetched_at) > new Date(result.last_updated))) {
          result.last_updated = item.fetched_at
        }
      }
    }
    
    // If no stored data, return empty metrics
    if (!result.search_console) {
      result.search_console = {
        summary: {
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        },
        byDate: [],
        topPages: [],
        topQueries: [],
      }
    }
    
    if (!result.analytics) {
      result.analytics = {
        summary: {
          users: 0,
          sessions: 0,
          pageviews: 0,
          bounceRate: 0,
          avgSessionDuration: 0,
        },
        byDate: [],
        topPages: [],
        trafficSources: [],
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error("Error fetching report data:", error)
    return NextResponse.json(
      { error: "Failed to fetch report data", details: error.message },
      { status: 500 }
    )
  }
}