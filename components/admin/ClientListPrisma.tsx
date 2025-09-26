"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  ExternalLink,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
  Globe,
  Search,
  Users,
  Eye,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Client {
  id: string;
  name: string;
  domain: string;
  report_token: string;
  slug: string;
  created_at: string;
  updated_at: string;
  keyword_count?: number;
  google_account_id?: string;
  search_console_properties?: string[];
  analytics_properties?: string[];
}

export default function ClientListPrisma() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/admin/clients")
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      } else {
        throw new Error("Failed to fetch clients")
      }
    } catch (error: any) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch clients",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyReportUrl = (client: Client) => {
    const url = `${window.location.origin}/report/${client.slug}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Copied!",
      description: "Report URL copied to clipboard",
    })
  }

  const handleDeleteClient = async () => {
    if (!deleteClient) return

    try {
      const response = await fetch(`/api/admin/clients/${deleteClient.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Client deleted successfully",
        })
        fetchClients()
      } else {
        const errorData = await response.json()
        console.error("Delete error response:", errorData)
        throw new Error(errorData.error || errorData.details || "Failed to delete client")
      }
    } catch (error: any) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      })
    } finally {
      setDeleteClient(null)
    }
  }

  const isConnected = (client: Client) => {
    return client.google_account_id &&
           client.search_console_properties &&
           client.search_console_properties.length > 0
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading clients...</div>
        </CardContent>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No clients added yet</p>
            <p className="text-sm text-gray-400">Click "Add Client" to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {clients.map((client) => {
          const connected = isConnected(client)
          const reportUrl = `/report/${client.slug}`

          return (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{client.domain || 'No domain set'}</span>
                        </div>
                        {client.keyword_count !== undefined && (
                          <div className="flex items-center space-x-2">
                            <Search className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">{client.keyword_count} keywords</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {connected ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Setup Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Created {new Date(client.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/admin/clients/${client.id}/details`}>
                      <Button variant="default" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Client
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyReportUrl(client)}
                      title="Copy report URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Link href={reportUrl} target="_blank">
                      <Button variant="outline" size="sm" title="View report">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteClient(client)}
                      title="Delete client"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                {!connected && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      Google APIs not connected. Click "Manage Client" to configure properties and keywords.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client "{deleteClient?.name}" and all associated data including keywords, reports, and analytics.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}