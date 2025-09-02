import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const results = {
    env_vars: {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    database: {
      connection: false,
      admin_google_connections_table: false,
      admin_users_table: false,
      clients_table: false,
    },
    errors: [] as string[],
  }

  try {
    // Test Supabase connection
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      results.database.connection = true

      // Check admin_google_connections table
      const { error: connError } = await supabase
        .from("admin_google_connections")
        .select("*")
        .limit(1)
      
      if (!connError) {
        results.database.admin_google_connections_table = true
      } else if (connError.code === "42P01") {
        results.errors.push("Table 'admin_google_connections' does not exist")
      } else {
        results.errors.push(`admin_google_connections error: ${connError.message}`)
      }

      // Check admin_users table
      const { error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .limit(1)
      
      if (!adminError) {
        results.database.admin_users_table = true
      } else {
        results.errors.push(`admin_users error: ${adminError.message}`)
      }

      // Check clients table
      const { error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .limit(1)
      
      if (!clientsError) {
        results.database.clients_table = true
      } else {
        results.errors.push(`clients error: ${clientsError.message}`)
      }
    } else {
      results.errors.push("Missing Supabase configuration")
    }
  } catch (error: any) {
    results.errors.push(`Setup check error: ${error.message}`)
  }

  return NextResponse.json(results, { status: 200 })
}