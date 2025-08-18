"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  MousePointer,
  Clock,
  Globe,
  BarChart3
} from "lucide-react"

export default function PublicReportPage() {
  const params = useParams()
  const slug = params.slug as string
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchReport()
  }, [slug])
  
  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/public/report/${slug}`)
      if (!response.ok) {
        throw new Error('Report not found')
      }
      const data = await response.json()
      setReport(data)
    } catch (error: any) {
      console.error('Error fetching report:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }
  
  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Report Not Found</h2>
          <p className="text-gray-600">This report link may be invalid or expired.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{report.name}</h1>
            <p className="text-gray-600 mt-1">
              {report.client?.name || "SEO Report"}
              {report.client?.domain && (
                <a 
                  href={report.client.domain} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-700"
                >
                  {report.client.domain}
                </a>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center justify-between">
                <span>Total Clicks</span>
                <MousePointer className="h-4 w-4 text-gray-400" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-gray-500 mt-1">Data coming soon</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center justify-between">
                <span>Total Impressions</span>
                <Eye className="h-4 w-4 text-gray-400" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-gray-500 mt-1">Data coming soon</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center justify-between">
                <span>Avg. CTR</span>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--%</div>
              <p className="text-xs text-gray-500 mt-1">Data coming soon</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center justify-between">
                <span>Avg. Position</span>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-gray-500 mt-1">Data coming soon</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Connected Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Search Console Properties
              </CardTitle>
              <CardDescription>
                Connected properties for this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.search_console_properties?.length > 0 ? (
                <div className="space-y-2">
                  {report.search_console_properties.map((prop: string) => (
                    <div key={prop} className="p-3 bg-blue-50 rounded-lg text-sm">
                      {prop.replace('sc-domain:', '')}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No Search Console properties connected</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Analytics Properties
              </CardTitle>
              <CardDescription>
                Connected GA4 properties for this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.analytics_properties?.length > 0 ? (
                <div className="space-y-2">
                  {report.analytics_properties.map((prop: string) => (
                    <div key={prop} className="p-3 bg-purple-50 rounded-lg text-sm">
                      Property ID: {prop}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No Analytics properties connected</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Placeholder for charts */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>
              Click and impression trends for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Data visualization coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Generated by SEO Reporting Platform • 
            <span className="ml-1">Report ID: {report.slug}</span>
          </p>
        </div>
      </div>
    </div>
  )
}