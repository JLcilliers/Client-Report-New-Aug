import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    console.log('Fetching public report with slug:', slug)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get report by slug with client info
    const { data: report, error } = await supabase
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
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: "Report not found", details: error.message },
        { status: 404 }
      )
    }
    
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }
    
    // Return public data only (no sensitive info)
    return NextResponse.json({
      id: report.id,
      name: report.name,
      description: report.description,
      slug: report.slug,
      search_console_properties: report.search_console_properties,
      analytics_properties: report.analytics_properties,
      client: report.client,
      created_at: report.created_at,
      updated_at: report.updated_at,
    })
    
  } catch (error: any) {
    console.error("Error fetching public report:", error)
    return NextResponse.json(
      { error: "Failed to fetch report", details: error.message },
      { status: 500 }
    )
  }
}