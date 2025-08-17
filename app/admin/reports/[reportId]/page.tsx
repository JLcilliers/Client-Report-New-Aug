import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import ReportView from "./ReportView"

async function getReport(reportId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  const { data: report, error } = await supabase
    .from("reports")
    .select(`
      *,
      clients (
        id,
        name,
        email,
        url
      )
    `)
    .eq("id", reportId)
    .single()
  
  if (error || !report) {
    return null
  }
  
  return report
}

export default async function ReportPage({ 
  params 
}: { 
  params: Promise<{ reportId: string }> 
}) {
  const { reportId } = await params
  const report = await getReport(reportId)
  
  if (!report) {
    notFound()
  }
  
  return <ReportView report={report} />
}