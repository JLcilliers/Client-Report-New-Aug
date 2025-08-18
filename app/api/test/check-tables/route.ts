import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Try admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .limit(5)
    
    // Try clients table
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .limit(5)
    
    return NextResponse.json({
      admin_users: {
        data: adminUsers || [],
        count: adminUsers?.length || 0,
        error: adminError
      },
      clients: {
        data: clients || [],
        count: clients?.length || 0,
        error: clientsError
      }
    })
  } catch (error: any) {
    console.error('Error checking tables:', error)
    return NextResponse.json({
      error: "Failed to check tables",
      details: error.message
    }, { status: 500 })
  }
}
