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
    
    // Get all reports without join
    const { data: reports, error, count } = await supabase
      .from("reports")
      .select("*", { count: 'exact' })
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ 
        error: "Failed to fetch reports",
        details: error.message,
        code: error.code
      })
    }
    
    // Get all clients separately
    const { data: clients, error: clientError } = await supabase
      .from("clients")
      .select("*")
    
    return NextResponse.json({
      reportCount: count || 0,
      reports: reports || [],
      clients: clients || [],
      clientError: clientError?.message
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Test failed",
      details: error.message 
    })
  }
}