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
    
    const results: any = {
      tables: {}
    }
    
    // Check clients table
    const { error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .limit(1)
    
    results.tables.clients = {
      exists: !clientsError || clientsError.code !== "42P01",
      error: clientsError?.message || null
    }
    
    // Check reports table
    const { error: reportsError } = await supabase
      .from("reports")
      .select("*")
      .limit(1)
    
    results.tables.reports = {
      exists: !reportsError || reportsError.code !== "42P01",
      error: reportsError?.message || null,
      errorCode: reportsError?.code || null
    }
    
    // Check admin_google_connections table
    const { error: connectionsError } = await supabase
      .from("admin_google_connections")
      .select("*")
      .limit(1)
    
    results.tables.admin_google_connections = {
      exists: !connectionsError || connectionsError.code !== "42P01",
      error: connectionsError?.message || null
    }
    
    // Get count of clients
    const { count: clientCount } = await supabase
      .from("clients")
      .select("*", { count: 'exact', head: true })
    
    results.counts = {
      clients: clientCount || 0
    }
    
    // Try to get reports count if table exists
    if (results.tables.reports.exists) {
      const { count: reportCount } = await supabase
        .from("reports")
        .select("*", { count: 'exact', head: true })
      
      results.counts.reports = reportCount || 0
    }
    
    return NextResponse.json(results)
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Check failed",
      details: error.message 
    })
  }
}