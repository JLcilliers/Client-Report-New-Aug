import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Missing configuration" })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Get all reports
    const { data: reports, error } = await supabase
      .from("reports")
      .select(`
        *,
        client:clients (
          id,
          name,
          domain
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ 
        error: "Failed to fetch reports",
        details: error.message 
      })
    }
    
    return NextResponse.json({
      count: reports?.length || 0,
      reports: reports || []
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Test failed",
      details: error.message 
    })
  }
}