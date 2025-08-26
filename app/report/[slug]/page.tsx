"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ComprehensiveDashboard from "@/components/report/ComprehensiveDashboard"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  MousePointer,
  Clock,
  Globe,
  BarChart3,
  RefreshCw,
  Calendar,
  Search
} from "lucide-react"
import Link from "next/link"

interface ReportData {
  search_console?: {
    summary: {
      clicks: number
      impressions: number
      ctr: number
      position: number
    }
    byDate: any[]
    topPages: any[]
    topQueries: any[]
  }
  analytics?: any
  last_updated: string | null
}

export default function PublicReportPage() {
  const params = useParams()
  const slug = params.slug as string
  const [report, setReport] = useState<any>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchingData, setFetchingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLegacyView, setShowLegacyView] = useState(false)
  
  useEffect(() => {
    fetchReport()
  }, [slug])
  
  useEffect(() => {
    if (report) {
      fetchReportData()
      // Only refresh if data is stale (older than 1 hour)
      // Don't auto-refresh on every page load
      if (isDataStale()) {
        console.log('Data is stale, refreshing...')
        refreshData()
      }
    }
  }, [report])
  
  const fetchReport = async () => {
    try {
      console.log('Fetching report with slug:', slug)
      const response = await fetch(`/api/public/report/${slug}`)
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('Error fetching report:', errorData)
        throw new Error('Report not found')
      }
      
      const data = await response.json()
      console.log('Report data received:', data)
      setReport(data)
    } catch (error: any) {
      console.error('Error in fetchReport:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchReportData = async () => {
    
    try {
      const response = await fetch(`/api/public/report/${slug}/data`)
      
      if (response.ok) {
        const data = await response.json()
        
        setReportData(data)
        // Force a re-render of the dashboard
        if (!showLegacyView) {
          
        }
      } else {
        
      }
    } catch (error: any) {
      
    }
  }

  const isDataStale = () => {
    if (!reportData?.last_updated) return true
    const lastUpdate = new Date(reportData.last_updated)
    const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)
    return hoursSinceUpdate > 1 // Consider stale if older than 1 hour
  }
  
  const refreshData = async () => {
    if (!report) return
    
    setFetchingData(true)
    try {
      // Trigger data fetch from Google APIs using the public refresh endpoint
      const response = await fetch(`/api/public/report/${slug}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Refetch the report data after update
        await fetchReportData()
      } else {
        const error = await response.json()
        
        alert(`Failed to refresh data: ${error.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      
      alert('Failed to refresh data. Please try again.')
    } finally {
      setFetchingData(false)
    }
  }
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }
  
  const formatPercentage = (num: number): string => {
    return (num * 100).toFixed(2) + '%'
  }
  
  const formatPosition = (num: number): string => {
    return num.toFixed(1)
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
            <div className="flex items-center gap-4 mt-2">
              <p className="text-sm text-gray-500">
                Auto-refreshing data{fetchingData && '...'}
              </p>
              <Button
                onClick={refreshData}
                disabled={fetchingData}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${fetchingData ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button
                onClick={() => setShowLegacyView(!showLegacyView)}
                variant="outline"
                size="sm"
              >
                {showLegacyView ? 'Show Dashboard' : 'Show Legacy View'}
              </Button>
              <Link href={`/report/${slug}/seo-dashboard`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Technical SEO
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showLegacyView ? (
          /* Comprehensive Dashboard */
          <ComprehensiveDashboard 
            reportId={report.id}
            reportSlug={slug}
            googleAccountId={report.google_account_id}
          />
        ) : (
        <>
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
              <div className="text-2xl font-bold">
                {reportData?.search_console?.summary?.clicks 
                  ? formatNumber(reportData.search_console.summary.clicks)
                  : '--'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reportData?.search_console ? 'Last 30 days' : 'No data available'}
              </p>
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
              <div className="text-2xl font-bold">
                {reportData?.search_console?.summary?.impressions 
                  ? formatNumber(reportData.search_console.summary.impressions)
                  : '--'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reportData?.search_console ? 'Last 30 days' : 'No data available'}
              </p>
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
              <div className="text-2xl font-bold">
                {reportData?.search_console?.summary?.ctr 
                  ? formatPercentage(reportData.search_console.summary.ctr)
                  : '--%'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reportData?.search_console ? 'Last 30 days' : 'No data available'}
              </p>
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
              <div className="text-2xl font-bold">
                {reportData?.search_console?.summary?.position 
                  ? formatPosition(reportData.search_console.summary.position)
                  : '--'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reportData?.search_console ? 'Last 30 days' : 'No data available'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* SEO Analysis Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Technical SEO Analysis Available
            </CardTitle>
            <CardDescription>
              Comprehensive SEO audit tools with no monthly fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-sm">
                <p className="font-medium">✓ Technical Audit</p>
                <p className="text-gray-500">Site health check</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">✓ Meta Tags</p>
                <p className="text-gray-500">Title & description</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">✓ PageSpeed</p>
                <p className="text-gray-500">Core Web Vitals</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">✓ Content Analysis</p>
                <p className="text-gray-500">Readability & keywords</p>
              </div>
            </div>
            <Link href={`/report/${slug}/seo-dashboard`}>
              <Button className="w-full" variant="default">
                <Search className="h-4 w-4 mr-2" />
                Open SEO Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
        
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
        
        {/* Top Queries and Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
              <CardDescription>
                Keywords driving the most traffic
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData?.search_console?.topQueries && reportData.search_console.topQueries.length > 0 ? (
                <div className="space-y-3">
                  {reportData.search_console.topQueries.slice(0, 5).map((query: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words">
                          {query.keys?.[0] || 'Direct traffic'}
                        </p>
                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          <span>{formatNumber(query.clicks || 0)} clicks</span>
                          <span>{formatPercentage(query.ctr || 0)} CTR</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold">#{formatPosition(query.position || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No query data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>
                Best performing pages by clicks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportData?.search_console?.topPages && reportData.search_console.topPages.length > 0 ? (
                <div className="space-y-3">
                  {reportData.search_console.topPages.slice(0, 5).map((page: any, index: number) => {
                    const url = page.keys?.[0] || ''
                    const path = url.replace(/^https?:\/\/[^\/]+/, '') || '/'
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium break-all" title={url}>
                            {path}
                          </p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>{formatNumber(page.clicks || 0)} clicks</span>
                            <span>{formatNumber(page.impressions || 0)} impressions</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold">{formatPercentage(page.ctr || 0)}</p>
                          <p className="text-xs text-gray-500">CTR</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No page data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Performance Over Time */}
          <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>
              Click and impression trends for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData?.search_console?.byDate && reportData.search_console.byDate.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1">
                  {reportData.search_console.byDate.slice(-7).map((day: any, index: number) => {
                    const date = new Date(day.keys?.[0] || '')
                    const dayName = date.toLocaleDateString('en', { weekday: 'short' })
                    const dateStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
                    return (
                      <div key={index} className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">{dayName}</p>
                        <p className="text-xs font-medium">{dateStr}</p>
                        <p className="text-lg font-bold mt-1">{formatNumber(day.clicks || 0)}</p>
                        <p className="text-xs text-gray-500">clicks</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Showing last 7 days of data
                </p>
              </div>
            ) : (
              <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No time series data available</p>
              </div>
            )}
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
        </>
        )}
      </div>
    </div>
  )
}