import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    // Delete all connections (for now we only have one)
    const { error } = await supabase
      .from("admin_google_connections")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all rows
    
    if (error) {
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}