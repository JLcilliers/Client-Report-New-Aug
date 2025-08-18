import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      clients: clients || []
    })
  } catch (error: any) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({
      error: "Failed to fetch clients",
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const { name, domain } = await request.json()
    
    if (!name || !domain) {
      return NextResponse.json({ error: "Name and domain are required" }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Check if client with this domain already exists
    const { data: existingClient, error: checkError } = await supabase
      .from("clients")
      .select("*")
      .eq("domain", domain.trim())
      .single()
    
    if (existingClient) {
      // Return the existing client instead of creating a duplicate
      console.log('Client already exists with domain:', domain)
      return NextResponse.json({
        client: existingClient,
        message: "Using existing client",
        existing: true
      })
    }
    
    // Create new client if it doesn't exist
    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        name: name.trim(),
        domain: domain.trim()
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      client,
      message: "Client created successfully",
      existing: false
    })
  } catch (error: any) {
    console.error('Error creating client:', error)
    return NextResponse.json({
      error: "Failed to create client",
      details: error.message
    }, { status: 500 })
  }
}