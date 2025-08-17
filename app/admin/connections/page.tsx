import { createClient } from "@supabase/supabase-js"
import ConnectionsClient from "./ConnectionsClient"

async function getGoogleConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase configuration")
    return null
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    const { data, error } = await supabase
      .from("admin_google_connections")
      .select("*")
      .limit(1)
      .single()
    
    if (error) {
      console.log("No connection found or error:", error.message)
      return null
    }
    
    return data
  } catch (error) {
    console.error("Error fetching connection:", error)
    return null
  }
}

export default async function ConnectionsPage() {
  const connection = await getGoogleConnection()
  
  return <ConnectionsClient initialConnection={connection} />
}