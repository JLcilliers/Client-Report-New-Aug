import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
    
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get report with client info
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
      .eq("id", reportId)
      .single()
    
    
    
    if (error) {
      
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      )
    }
    
    if (!report) {
      return NextResponse.json(
        { error: "Report not found", reportId },
        { status: 404 }
      )
    }
    
    return NextResponse.json(report)
    
  } catch (error: any) {
    
    return NextResponse.json(
      { error: "Failed to fetch report", details: error.message },
      { status: 500 }
    )
  }
}