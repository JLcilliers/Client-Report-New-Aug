"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/db/supabase"
import { Client } from "@/types"
import Link from "next/link"
import { 
  Users, 
  Globe, 
  CheckCircle, 
  XCircle,
  Plus,
  Copy,
  ExternalLink,
  RefreshCw,
  Settings,
  BarChart3,
  Eye
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatDate, getRelativeTimeLabel } from "@/lib/utils/date-helpers"

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClients: 0,
    connectedClients: 0,
    totalReports: 0,
    lastSync: null as Date | null
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
    fetchStats()
    fetchRecentReports()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Dashboard fetch error:", error)
        throw error
      }
      setClients(data || [])
    } catch (error: any) {
      console.error("Error fetching clients - Full error:", error)
      toast({
        title: "Error fetching clients",
        description: error.message || "Please check console for details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { count: totalClients } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })

      const { data: connectedData } = await supabase
        .from("google_credentials")
        .select("client_id")

      const { count: totalReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })

      const { data: lastSyncData, error: syncError } = await supabase
        .from("report_data")
        .select("fetched_at")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .single()

      // Handle case where no data exists yet
      if (syncError && syncError.code !== 'PGRST116') {
        console.error('Error fetching sync data:', syncError)
      }

      setStats({
        totalClients: totalClients || 0,
        connectedClients: connectedData?.length || 0,
        totalReports: totalReports || 0,
        lastSync: lastSyncData ? new Date(lastSyncData.fetched_at) : null
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchRecentReports = async () => {
    try {
      const response = await fetch("/api/admin/reports")
      if (response.ok) {
        const data = await response.json()
        setReports(data.slice(0, 5)) // Get only 5 most recent
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    }
  }

  const copyReportUrl = (client: Client) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/report/${client.id}/${client.report_token}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Copied!",
      description: "Report URL copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to your SEO Reporting Platform</p>
        </div>
        <Link href="/admin/reports/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/admin/google-accounts">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Google Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Manage connected Google accounts</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/reports/create">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Set up a new client report</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/auth/setup">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Auth Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Check authentication status</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connectedClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClients > 0 
                ? `${Math.round((stats.connectedClients / stats.totalClients) * 100)}% connected`
                : "No clients yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats.lastSync ? getRelativeTimeLabel(stats.lastSync) : "Never"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
          <CardDescription>Your latest added clients</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No clients added yet</p>
              <Link href="/admin/reports/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Report
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{client.name}</h3>
                      <span className="text-sm text-gray-500">{client.domain}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Added {formatDate(client.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyReportUrl(client)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/clients/${client.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Reports</CardTitle>
              <Link href="/admin/reports">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>Latest client reports</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No reports created yet</p>
                <Link href="/admin/reports/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Report
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-sm">{report.report_name || report.name}</h3>
                        <span className="text-xs text-gray-500">{report.client_name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {formatDate(new Date(report.created_at))}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/report/${report.slug}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/reports/create">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create New Report
              </Button>
            </Link>
            <Link href="/admin/google-accounts">
              <Button variant="outline" className="w-full justify-start">
                <Globe className="h-4 w-4 mr-2" />
                Manage Google Accounts
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View All Reports
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}