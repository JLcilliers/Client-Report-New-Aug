import { createClient } from "@supabase/supabase-js"
import PropertiesClient from "./PropertiesClient"

async function getGoogleConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    const { data, error } = await supabase
      .from("admin_google_connections")
      .select("*")
      .limit(1)
      .single()
    
    if (error) return null
    return data
  } catch (error) {
    return null
  }
}

export default async function PropertiesPage() {
  const connection = await getGoogleConnection()
  
  if (!connection) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Google Properties</h1>
        <p className="text-gray-600">Please connect your Google account first in the Connections page.</p>
      </div>
    )
  }
  
  return <PropertiesClient connection={connection} />
}