"use client"

import { useEffect, useState } from "react"
import { supabaseAdmin } from "@/lib/db/supabase"
import { Client, GoogleCredentials } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Copy, 
  ExternalLink, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Settings,
  Globe
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date-helpers"
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

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [credentials, setCredentials] = useState<Record<string, GoogleCredentials>>({})
  const [loading, setLoading] = useState(true)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabaseAdmin
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })

      if (clientsError) throw clientsError

      const { data: credsData, error: credsError } = await supabaseAdmin
        .from("google_credentials")
        .select("*")

      if (credsError) throw credsError

      setClients(clientsData || [])
      
      const credsMap: Record<string, GoogleCredentials> = {}
      credsData?.forEach((cred: GoogleCredentials) => {
        credsMap[cred.client_id] = cred
      })
      setCredentials(credsMap)
    } catch (error: any) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  const handleDeleteClient = async () => {
    if (!deleteClient) return

    try {
      const { error } = await supabaseAdmin
        .from("clients")
        .delete()
        .eq("id", deleteClient.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Client deleted successfully",
      })

      fetchClients()
    } catch (error: any) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      })
    } finally {
      setDeleteClient(null)
    }
  }

  const isConnected = (clientId: string) => {
    const cred = credentials[clientId]
    return cred && cred.access_token && cred.gsc_site_url
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
          const connected = isConnected(client.id)
          const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/report/${client.id}/${client.report_token}`
          
          return (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{client.domain}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {connected ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm">Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600">
                          <XCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm">Not Connected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/clients/${client.id}/connections`}>
                      <Button variant="outline" size="sm" title="Configure connections">
                        <Settings className="h-4 w-4" />
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
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(client.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(client.updated_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Report Token</p>
                    <p className="font-mono text-xs">{client.report_token.substring(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium">{connected ? "Active" : "Setup Required"}</p>
                  </div>
                </div>
                {!connected && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      Google APIs not connected. Click the settings icon to configure.
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
              This will permanently delete the client "{deleteClient?.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient}>
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}