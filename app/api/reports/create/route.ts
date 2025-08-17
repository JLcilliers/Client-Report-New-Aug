import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientName,
      clientEmail,
      clientUrl,
      reportName,
      description,
      searchConsoleProperties,
      analyticsProperties,
    } = body

    if (!clientName || !reportName) {
      return NextResponse.json(
        { error: "Client name and report name are required" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // First, create or get the client
    let clientId: string
    
    // Check if client exists
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("name", clientName)
      .single()
    
    if (existingClient) {
      clientId = existingClient.id
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: clientName,
          email: clientEmail || null,
          url: clientUrl || null,
        })
        .select()
        .single()
      
      if (clientError || !newClient) {
        console.error("Error creating client:", clientError)
        return NextResponse.json(
          { error: "Failed to create client" },
          { status: 500 }
        )
      }
      
      clientId = newClient.id
    }
    
    // Create the report
    const reportId = crypto.randomUUID()
    const reportSlug = crypto.randomUUID()
    
    // Store report in database (we'll create this table if it doesn't exist)
    const { error: reportError } = await supabase
      .from("reports")
      .insert({
        id: reportId,
        client_id: clientId,
        name: reportName,
        description: description || null,
        slug: reportSlug,
        search_console_properties: searchConsoleProperties || [],
        analytics_properties: analyticsProperties || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    
    if (reportError) {
      // If table doesn't exist, create it
      if (reportError.code === "42P01") {
        // Create reports table
        const { error: createTableError } = await supabase.rpc("exec_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS reports (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              description TEXT,
              slug TEXT UNIQUE NOT NULL,
              search_console_properties TEXT[] DEFAULT '{}',
              analytics_properties TEXT[] DEFAULT '{}',
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Enable RLS
            ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
            
            -- Create policy
            CREATE POLICY "Service role can manage reports" ON reports
              FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
          `,
        })
        
        if (createTableError) {
          // Try without rpc
          console.log("Please create reports table manually in Supabase")
        }
        
        // Try to insert again
        const { error: retryError } = await supabase
          .from("reports")
          .insert({
            id: reportId,
            client_id: clientId,
            name: reportName,
            description: description || null,
            slug: reportSlug,
            search_console_properties: searchConsoleProperties || [],
            analytics_properties: analyticsProperties || [],
          })
        
        if (retryError) {
          console.error("Error creating report after table creation:", retryError)
          return NextResponse.json(
            { error: "Failed to create report. Please create reports table in Supabase." },
            { status: 500 }
          )
        }
      } else {
        console.error("Error creating report:", reportError)
        return NextResponse.json(
          { error: "Failed to create report" },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json({
      success: true,
      reportId,
      clientId,
      reportSlug,
      message: "Report created successfully",
    })
    
  } catch (error: any) {
    console.error("Create report error:", error)
    return NextResponse.json(
      { error: "Failed to create report", details: error.message },
      { status: 500 }
    )
  }
}