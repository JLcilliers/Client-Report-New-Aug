"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/db/supabase"
import { useToast } from "@/components/ui/use-toast"
import { 
  Globe,
  BarChart3,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Settings
} from "lucide-react"

interface GoogleConnection {
  id: string
  access_token: string
  refresh_token: string
  token_expiry: string
  email: string
  connected_at: string
}

export default function ConnectionsPage() {
  const [googleConnection, setGoogleConnection] = useState<GoogleConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkGoogleConnection()
    
    // Check for success/error params from OAuth callback
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    
    if (success === 'connected') {
      toast({
        title: "Success",
        description: "Google account connected successfully!"
      })
      // Remove params from URL
      window.history.replaceState({}, '', '/admin/connections')
      // Recheck connection
      checkGoogleConnection()
    } else if (error) {
      let errorMessage = "Failed to connect Google account"
      if (error === 'access_denied') {
        errorMessage = "Access was denied. Please try again."
      } else if (error === 'invalid_request') {
        errorMessage = "Invalid request. Please try again."
      } else if (error === 'database_not_configured') {
        errorMessage = "Database table not configured. Please run the SQL script in Supabase."
      } else if (error === 'server_configuration') {
        errorMessage = "Server configuration error. Please check environment variables."
      } else if (error === 'database_error') {
        errorMessage = "Database error. Please check Supabase connection and table permissions."
      } else if (error === 'oauth_exchange_failed') {
        errorMessage = "Failed to exchange authorization code. Please check OAuth configuration."
      }
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      })
      // Remove params from URL
      window.history.replaceState({}, '', '/admin/connections')
      setConnecting(false)
    }
  }, [])

  const checkGoogleConnection = async () => {
    try {
      // For now, check for any admin connection
      // We'll refine this once we have multiple admins
      const { data, error } = await supabase
        .from("admin_google_connections")
        .select("*")
        .limit(1)
        .single()

      if (data && !error) {
        setGoogleConnection(data)
        console.log("Found connection:", data.email)
      } else {
        console.log("No Google connection found")
      }
    } catch (error) {
      console.log("Error checking connection:", error)
    } finally {
      setLoading(false)
    }
  }

  const connectGoogle = () => {
    setConnecting(true)
    
    // Build OAuth URL for admin connection
    const params = new URLSearchParams({
      client_id: "998982098952-et4jamotfaitvlp5d1mim3ve144dbm2s.apps.googleusercontent.com",
      redirect_uri: `${window.location.origin}/api/auth/google/admin-callback`,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/webmasters",
        "https://www.googleapis.com/auth/analytics",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      state: "admin_connection"
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    window.location.href = authUrl
  }

  const disconnectGoogle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("admin_google_connections")
        .delete()
        .eq("admin_email", user.email)

      if (error) throw error

      setGoogleConnection(null)
      toast({
        title: "Disconnected",
        description: "Google account disconnected successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to disconnect Google account",
        variant: "destructive"
      })
    }
  }

  const refreshToken = async () => {
    toast({
      title: "Refreshing",
      description: "Refreshing Google connection..."
    })
    // Implementation for token refresh
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Connections</h1>
        <p className="text-gray-600 mt-1">Connect your Google account to access Search Console and Analytics data</p>
      </div>

      {/* Google Account Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Google Account</span>
            {googleConnection ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </CardTitle>
          <CardDescription>
            Connect your Google account to access Search Console and Analytics properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : googleConnection ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-green-900">Connected Account</p>
                    <p className="text-sm text-green-700 mt-1">{googleConnection.email}</p>
                    <p className="text-xs text-green-600 mt-2">
                      Connected {new Date(googleConnection.connected_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={refreshToken}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={disconnectGoogle}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Search Console Access</h3>
                  </div>
                  <p className="text-sm text-gray-600">You have access to all Search Console properties associated with your Google account</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <h3 className="font-medium">Analytics 4 Access</h3>
                  </div>
                  <p className="text-sm text-gray-600">You have access to all GA4 properties associated with your Google account</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Google Account Connected</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Connect your Google account to access Search Console and Analytics data for all your clients
              </p>
              <Button onClick={connectGoogle} disabled={connecting} size="lg">
                {connecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Google Account
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Properties (shown after connection) */}
      {googleConnection && (
        <Card>
          <CardHeader>
            <CardTitle>Available Properties</CardTitle>
            <CardDescription>
              Properties you can connect to client reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-8">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage Client Connections
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}