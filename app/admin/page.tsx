"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabaseAdmin } from "@/lib/db/supabase"
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
  RefreshCw
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatDate, getRelativeTimeLabel } from "@/lib/utils/date-helpers"

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([])
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
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabaseAdmin
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
      const { count: totalClients } = await supabaseAdmin
        .from("clients")
        .select("*", { count: "exact", head: true })

      const { data: connectedData } = await supabaseAdmin
        .from("google_credentials")
        .select("client_id")

      const { data: lastSyncData } = await supabaseAdmin
        .from("metrics_cache")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      setStats({
        totalClients: totalClients || 0,
        connectedClients: connectedData?.length || 0,
        totalReports: totalClients || 0,
        lastSync: lastSyncData ? new Date(lastSyncData.created_at) : null
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
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
        <Link href="/admin/clients">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
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
              <Link href="/admin/clients">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Client
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
    </div>
  )
}