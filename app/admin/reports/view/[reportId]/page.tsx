"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Globe, 
  BarChart3, 
  ExternalLink, 
  Copy, 
  Settings,
  RefreshCw,
  ArrowLeft
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ReportViewPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.reportId as string
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  useEffect(() => {
    fetchReport()
  }, [reportId])
  
  const fetchReport = async () => {
    try {
      
      const response = await fetch(`/api/reports/${reportId}`)
      const data = await response.json()
      
      
      if (!response.ok) {
        throw new Error(data.error || 'Report not found')
      }
      
      setReport(data)
    } catch (error: any) {
      
      toast({
        title: "Error",
        description: error.message || "Failed to load report",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const copyUrl = () => {
    const reportUrl = `${window.location.origin}/report/${report.slug}`
    navigator.clipboard.writeText(reportUrl)
    toast({
      title: "Copied!",
      description: "Report URL copied to clipboard",
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
  
  if (!report) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Report Not Found</h2>
        <p className="text-gray-600 mb-4">The report you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/admin/reports')}>
          Back to Reports
        </Button>
      </div>
    )
  }
  
  const reportUrl = `${window.location.origin}/report/${report.slug}`
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/reports')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{report.name}</h1>
          <p className="text-gray-600 mt-1">
            Client: {report.client?.name || "Unknown"}
            {report.client?.domain && ` - ${report.client.domain}`}
          </p>
        </div>
      </div>
      
      {/* Report URL */}
      <Card>
        <CardHeader>
          <CardTitle>Report URL</CardTitle>
          <CardDescription>Share this link with your client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={reportUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
            />
            <Button variant="outline" size="sm" onClick={copyUrl}>
              <Copy className="h-4 w-4" />
            </Button>
            <a href={reportUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Console Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-marine" />
              Search Console Properties
            </CardTitle>
            <CardDescription>
              {report.search_console_properties?.length || 0} connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.search_console_properties?.length > 0 ? (
              <div className="space-y-2">
                {report.search_console_properties.map((prop: string) => (
                  <div key={prop} className="p-2 bg-gray-50 rounded text-sm">
                    {prop}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No properties connected</p>
            )}
          </CardContent>
        </Card>
        
        {/* Analytics Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-marine" />
              Analytics Properties
            </CardTitle>
            <CardDescription>
              {report.analytics_properties?.length || 0} connected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.analytics_properties?.length > 0 ? (
              <div className="space-y-2">
                {report.analytics_properties.map((prop: string) => (
                  <div key={prop} className="p-2 bg-gray-50 rounded text-sm">
                    Property {prop}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No properties connected</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        <Button>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Edit Report
        </Button>
      </div>
    </div>
  )
}