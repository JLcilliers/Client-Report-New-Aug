"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/db/supabase"
import { Client, ReportData, DateRange } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ExecutiveOverview from "@/components/report/ExecutiveOverview"
import TrafficMetrics from "@/components/report/TrafficMetrics"
import KeywordPerformance from "@/components/report/KeywordPerformance"
import TechnicalSEO from "@/components/report/TechnicalSEO"
import ContentPerformance from "@/components/report/ContentPerformance"
import { 
  Download, 
  Calendar,
  RefreshCw,
  BarChart3
} from "lucide-react"
import { formatDate } from "@/lib/utils/date-helpers"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ReportPage() {
  const params = useParams()
  const clientId = params.clientId as string
  const token = params.token as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    validateAndFetchData()
  }, [clientId, token, dateRange])

  const validateAndFetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate client and token
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .eq("report_token", token)
        .single()

      if (clientError || !clientData) {
        setError("Invalid report URL. Please check with your administrator.")
        return
      }

      setClient(clientData)

      // Fetch report data from API
      const response = await fetch(`/api/data/${clientId}?range=${dateRange}`)
      if (!response.ok) {
        throw new Error("Failed to fetch report data")
      }

      const data = await response.json()
      setReportData(data)
    } catch (err: any) {
      console.error("Error fetching report:", err)
      setError("Failed to load report data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await validateAndFetchData()
    setRefreshing(false)
  }

  const handleExportPDF = async () => {
    // This would be implemented with jspdf
    console.log("Exporting PDF...")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error || "Report not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mock data for demonstration
  const mockReportData: ReportData = {
    client,
    dateRange,
    overview: {
      totalClicks: 12543,
      totalImpressions: 234567,
      avgCTR: 5.35,
      avgPosition: 12.4,
      clicksChange: 15.2,
      impressionsChange: 8.7,
      ctrChange: 0.5,
      positionChange: -2.1,
      insights: [
        "Organic traffic increased by 15.2% compared to the previous period",
        "Average position improved by 2.1 positions",
        "Mobile traffic accounts for 68% of total visits"
      ]
    },
    traffic: {
      organicTraffic: [
        { date: "2024-01-01", value: 450 },
        { date: "2024-01-02", value: 520 },
        { date: "2024-01-03", value: 480 },
        { date: "2024-01-04", value: 610 },
        { date: "2024-01-05", value: 580 },
        { date: "2024-01-06", value: 490 },
        { date: "2024-01-07", value: 550 },
      ],
      trafficSources: [
        { source: "organic", medium: "search", users: 8234, sessions: 10234, percentage: 68 },
        { source: "direct", medium: "none", users: 2345, sessions: 2890, percentage: 19 },
        { source: "referral", medium: "website", users: 1234, sessions: 1567, percentage: 10 },
        { source: "social", medium: "social", users: 456, sessions: 512, percentage: 3 },
      ],
      clicksVsImpressions: [
        { date: "2024-01-01", value: 12000, label: "Impressions" },
        { date: "2024-01-01", value: 450, label: "Clicks" },
      ],
      metrics: {
        users: 12543,
        sessions: 15234,
        pageviews: 45678,
        bounceRate: 42.3,
        avgSessionDuration: 234,
        newUsers: 8234,
        engagementRate: 67.8,
        conversions: 234
      }
    },
    keywords: {
      keywords: [
        { query: "best seo tools", clicks: 234, impressions: 5678, ctr: 4.12, position: 8.2 },
        { query: "seo reporting", clicks: 189, impressions: 4234, ctr: 4.46, position: 6.7 },
        { query: "google analytics", clicks: 156, impressions: 3890, ctr: 4.01, position: 12.3 },
      ],
      improved: [],
      declined: [],
      new: []
    },
    technical: {
      coreWebVitals: {
        LCP: 2.3,
        FID: 89,
        CLS: 0.08,
        INP: 123,
        TTFB: 890,
        FCP: 1.8
      },
      mobileScore: 87,
      desktopScore: 92,
      issues: [],
      crawlErrors: []
    },
    content: {
      topPerforming: [],
      highEngagement: [],
      declining: []
    },
    lastUpdated: new Date().toISOString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <p className="text-sm text-gray-500">{client.domain}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Executive Overview */}
          <ExecutiveOverview data={mockReportData.overview} />

          {/* Traffic Metrics */}
          <TrafficMetrics data={mockReportData.traffic} />

          {/* Keyword Performance */}
          <KeywordPerformance data={mockReportData.keywords} />

          {/* Technical SEO */}
          <TechnicalSEO data={mockReportData.technical} />

          {/* Content Performance */}
          <ContentPerformance data={mockReportData.content} />

          {/* Footer */}
          <div className="text-center py-8 text-sm text-gray-500">
            <p>Last updated: {formatDate(mockReportData.lastUpdated)}</p>
            <p className="mt-2">Report generated for {client.name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}