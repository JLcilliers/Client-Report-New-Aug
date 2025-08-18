"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  MousePointer,
  BarChart3,
  Globe,
  Search,
  FileText,
  Link,
  MapPin,
  Users,
  Target,
  Activity
} from "lucide-react"

// Import all section components
import ExecutiveOverview from "@/components/report/sections/ExecutiveOverview"
import TrafficVisibility from "@/components/report/sections/TrafficVisibility"
import KeywordPerformance from "@/components/report/sections/KeywordPerformance"
import ConversionsROI from "@/components/report/sections/ConversionsROI"
import ContentPerformance from "@/components/report/sections/ContentPerformance"
import TechnicalSEO from "@/components/report/sections/TechnicalSEO"
import BacklinkProfile from "@/components/report/sections/BacklinkProfile"
import LocalSEO from "@/components/report/sections/LocalSEO"
import CompetitorInsights from "@/components/report/sections/CompetitorInsights"
import ActionPlan from "@/components/report/sections/ActionPlan"

interface ReportData {
  current: any
  previous: any
  yearAgo: any
  fetched_at: string
}

export default function ComprehensiveReportPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [report, setReport] = useState<any>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchingData, setFetchingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '12m'>('30d')
  const [compareMode, setCompareMode] = useState<'mom' | 'yoy'>('mom')

  useEffect(() => {
    fetchReport()
  }, [slug])

  useEffect(() => {
    if (report) {
      fetchReportData()
    }
  }, [report, dateRange])

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

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/public/report/${slug}/comprehensive-data?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error: any) {
      console.error('Error fetching report data:', error)
    }
  }

  const refreshData = async () => {
    if (!report) return
    
    setFetchingData(true)
    try {
      const response = await fetch(`/api/public/report/${slug}/refresh-comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dateRange })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Data refreshed:', result)
        await fetchReportData()
      } else {
        const error = await response.json()
        console.error('Error response:', error)
        alert(`Failed to refresh data: ${error.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Error refreshing data:', error)
      alert('Failed to refresh data. Please try again.')
    } finally {
      setFetchingData(false)
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
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
              <p className="text-gray-600">
                {report.client?.name || "SEO Report"} • {report.client?.domain}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Date Range Selector */}
              <div className="flex gap-2">
                <Button
                  variant={dateRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('30d')}
                >
                  30 Days
                </Button>
                <Button
                  variant={dateRange === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('90d')}
                >
                  90 Days
                </Button>
                <Button
                  variant={dateRange === '12m' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('12m')}
                >
                  12 Months
                </Button>
              </div>
              
              {/* Compare Mode */}
              <div className="flex gap-2">
                <Button
                  variant={compareMode === 'mom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCompareMode('mom')}
                >
                  MoM
                </Button>
                <Button
                  variant={compareMode === 'yoy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCompareMode('yoy')}
                >
                  YoY
                </Button>
              </div>
              
              {/* Refresh Button */}
              <Button
                onClick={refreshData}
                disabled={fetchingData}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${fetchingData ? 'animate-spin' : ''}`} />
                {fetchingData ? 'Fetching...' : 'Refresh'}
              </Button>
              
              {/* Last Updated */}
              <div className="text-sm text-gray-500">
                Last updated: {reportData?.fetched_at 
                  ? new Date(reportData.fetched_at).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto py-3">
            <a href="#executive-overview" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Executive Overview
            </a>
            <a href="#traffic-visibility" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Traffic & Visibility
            </a>
            <a href="#keyword-performance" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Keywords
            </a>
            <a href="#conversions-roi" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Conversions & ROI
            </a>
            <a href="#content-performance" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Content
            </a>
            <a href="#technical-seo" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Technical SEO
            </a>
            <a href="#backlink-profile" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Backlinks
            </a>
            <a href="#local-seo" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Local SEO
            </a>
            <a href="#competitor-insights" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Competitors
            </a>
            <a href="#action-plan" className="text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap">
              Action Plan
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Executive Overview */}
          <section id="executive-overview">
            <ExecutiveOverview 
              data={reportData} 
              compareMode={compareMode}
              dateRange={dateRange}
            />
          </section>

          {/* Traffic & Visibility Metrics */}
          <section id="traffic-visibility">
            <TrafficVisibility 
              data={reportData}
              compareMode={compareMode}
              dateRange={dateRange}
            />
          </section>

          {/* Keyword Performance */}
          <section id="keyword-performance">
            <KeywordPerformance 
              data={reportData}
              compareMode={compareMode}
              dateRange={dateRange}
            />
          </section>

          {/* Conversions & ROI */}
          <section id="conversions-roi">
            <ConversionsROI 
              data={reportData}
              compareMode={compareMode}
              dateRange={dateRange}
            />
          </section>

          {/* Content Performance */}
          <section id="content-performance">
            <ContentPerformance 
              data={reportData}
              compareMode={compareMode}
              dateRange={dateRange}
            />
          </section>

          {/* Technical SEO */}
          <section id="technical-seo">
            <TechnicalSEO 
              data={reportData}
              compareMode={compareMode}
              dateRange={dateRange}
            />
          </section>

          {/* Backlink Profile */}
          <section id="backlink-profile">
            <BacklinkProfile 
              data={reportData}
              compareMode={compareMode}
              dateRange={dateRange}
            />
          </section>

          {/* Local SEO */}
          {report.client?.has_local && (
            <section id="local-seo">
              <LocalSEO 
                data={reportData}
                compareMode={compareMode}
                dateRange={dateRange}
              />
            </section>
          )}

          {/* Competitor Insights */}
          <section id="competitor-insights">
            <CompetitorInsights 
              data={reportData}
              compareMode={compareMode}
              dateRange={dateRange}
            />
          </section>

          {/* Action Plan */}
          <section id="action-plan">
            <ActionPlan 
              data={reportData}
              compareMode={compareMode}
              dateRange={dateRange}
            />
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} SEO Report</p>
            <p className="mt-1">Generated for {report.client?.name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}