"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { 
  Plus, 
  ExternalLink, 
  Calendar,
  Globe,
  BarChart3,
  Search,
  RefreshCw,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react"

interface Report {
  id: string
  slug: string
  name: string
  report_name?: string
  client_name?: string
  domain?: string
  created_at: string
  updated_at?: string
  is_public: boolean
  google_account_id?: string
  search_console_properties?: string[]
  analytics_properties?: string[]
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/reports")
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyReportUrl = (slug: string) => {
    const url = `${window.location.origin}/report/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const filteredReports = reports.filter(report => 
    report.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.report_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getReportStatus = (report: Report) => {
    if (!report.google_account_id) {
      return { label: "No Google Account", variant: "destructive" as const, icon: AlertCircle }
    }
    if (!report.search_console_properties?.length && !report.analytics_properties?.length) {
      return { label: "No Properties", variant: "secondary" as const, icon: AlertCircle }
    }
    return { label: "Active", variant: "default" as const, icon: CheckCircle }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">View and manage all client reports</p>
        </div>
        <Link href="/admin/reports/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchReports} variant="outline" size="icon">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900">No reports found</p>
            <p className="text-gray-500 mt-1">
              {searchTerm ? "Try adjusting your search" : "Create your first report to get started"}
            </p>
            {!searchTerm && (
              <Link href="/admin/reports/create">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Report
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const status = getReportStatus(report)
            const StatusIcon = status.icon
            
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {report.report_name || report.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {report.client_name || "No client name"}
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant} className="ml-2">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Domain */}
                  {report.domain && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 truncate">{report.domain}</span>
                    </div>
                  )}

                  {/* Properties */}
                  <div className="flex items-center gap-4 text-sm">
                    {report.search_console_properties?.length ? (
                      <div className="flex items-center gap-1">
                        <Search className="w-4 h-4 text-blue-500" />
                        <span>{report.search_console_properties.length} SC</span>
                      </div>
                    ) : null}
                    {report.analytics_properties?.length ? (
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        <span>{report.analytics_properties.length} GA</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(report.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Link href={`/report/${report.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Report
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyReportUrl(report.slug)}
                      className="px-3"
                    >
                      {copiedSlug === report.slug ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Link href={`/report/${report.slug}/seo-dashboard`}>
                      <Button variant="outline" size="sm" className="px-3">
                        <Search className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>

                  {/* Quick Links */}
                  <div className="flex items-center gap-2 text-xs">
                    <Link 
                      href={`/admin/reports/${report.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <span className="text-gray-400">•</span>
                    <a 
                      href={`${window.location.origin}/report/${report.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Client View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-gray-500">Total Reports</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {reports.filter(r => r.google_account_id).length}
              </div>
              <p className="text-xs text-gray-500">Connected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {reports.filter(r => r.is_public).length}
              </div>
              <p className="text-xs text-gray-500">Public</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(reports.map(r => r.client_name).filter(Boolean)).size}
              </div>
              <p className="text-xs text-gray-500">Clients</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}