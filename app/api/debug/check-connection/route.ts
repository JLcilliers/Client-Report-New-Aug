import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase configuration" })
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    // Get all connections
    const { data: connections, error: connError } = await supabase
      .from("admin_google_connections")
      .select("*")
    
    // Get count
    const { count, error: countError } = await supabase
      .from("admin_google_connections")
      .select("*", { count: 'exact', head: true })
    
    return NextResponse.json({
      success: true,
      count: count || 0,
      connections: connections || [],
      error: connError?.message || countError?.message,
      debug: {
        has_service_role: !!supabaseServiceRoleKey,
        table_accessible: !connError,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}