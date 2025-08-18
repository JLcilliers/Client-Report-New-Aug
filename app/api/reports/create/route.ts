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
      console.error("Error creating report:", reportError)
      console.error("Error code:", reportError.code)
      console.error("Error message:", reportError.message)
      
      // If table doesn't exist, provide helpful message
      if (reportError.code === "42P01") {
        return NextResponse.json(
          { 
            error: "Reports table does not exist. Please run the SQL in supabase/create-reports-table.sql",
            details: reportError.message 
          },
          { status: 500 }
        )
      }
      
      // If it's a foreign key constraint error
      if (reportError.code === "23503") {
        return NextResponse.json(
          { 
            error: "Client ID does not exist",
            details: reportError.message 
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create report",
          code: reportError.code,
          details: reportError.message 
        },
        { status: 500 }
      )
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