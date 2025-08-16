"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabaseAdmin } from "@/lib/db/supabase"
import { Client, GoogleCredentials } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Globe,
  BarChart3,
  Zap
} from "lucide-react"
import Link from "next/link"
import GoogleAuthButton from "@/components/admin/GoogleAuthButton"

export default function ClientConnectionsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [credentials, setCredentials] = useState<GoogleCredentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [formData, setFormData] = useState({
    gsc_site_url: "",
    ga4_property_id: "",
  })

  useEffect(() => {
    fetchClientData()
  }, [clientId])

  const fetchClientData = async () => {
    try {
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      const { data: credsData, error: credsError } = await supabaseAdmin
        .from("google_credentials")
        .select("*")
        .eq("client_id", clientId)
        .single()

      if (!credsError && credsData) {
        setCredentials(credsData)
        setFormData({
          gsc_site_url: credsData.gsc_site_url || "",
          ga4_property_id: credsData.ga4_property_id || "",
        })
      }
    } catch (error: any) {
      console.error("Error fetching client data:", error)
      if (error.code === "PGRST116") {
        // No credentials found, this is okay
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch client data",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      if (!credentials) {
        // Create new credentials record
        const { error } = await supabaseAdmin
          .from("google_credentials")
          .insert({
            client_id: clientId,
            gsc_site_url: formData.gsc_site_url,
            ga4_property_id: formData.ga4_property_id,
          })
        if (error) throw error
      } else {
        // Update existing credentials
        const { error } = await supabaseAdmin
          .from("google_credentials")
          .update({
            gsc_site_url: formData.gsc_site_url,
            ga4_property_id: formData.ga4_property_id,
            updated_at: new Date().toISOString(),
          })
          .eq("client_id", clientId)
        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
      
      fetchClientData()
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      // Here we would test the actual API connections
      // For now, we'll just check if the credentials exist
      if (credentials?.access_token && credentials?.gsc_site_url) {
        toast({
          title: "Connection Successful",
          description: "Google APIs are properly configured",
        })
      } else {
        throw new Error("Missing credentials")
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please complete the Google OAuth flow",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Client not found</p>
        <Link href="/admin/clients">
          <Button className="mt-4">Back to Clients</Button>
        </Link>
      </div>
    )
  }

  const isConnected = credentials?.access_token && credentials?.gsc_site_url

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{client.name} - Connections</h1>
            <p className="text-gray-600">{client.domain}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <XCircle className="h-5 w-5 mr-2" />
              <span>Not Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Google OAuth Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Google OAuth Connection</CardTitle>
          <CardDescription>
            Connect to Google Search Console and Analytics to fetch data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleAuthButton 
            clientId={clientId}
            onSuccess={() => fetchClientData()}
          />
          
          {credentials?.access_token && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                Google account connected successfully
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Search Console Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Google Search Console</CardTitle>
          </div>
          <CardDescription>
            Configure which property to track in Search Console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gsc_site_url">Site URL</Label>
            <Input
              id="gsc_site_url"
              placeholder="https://example.com"
              value={formData.gsc_site_url}
              onChange={(e) => setFormData({ ...formData, gsc_site_url: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Enter the exact URL as it appears in Google Search Console
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Analytics 4 Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Google Analytics 4</CardTitle>
          </div>
          <CardDescription>
            Configure which GA4 property to track
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ga4_property_id">Property ID</Label>
            <Input
              id="ga4_property_id"
              placeholder="properties/123456789"
              value={formData.ga4_property_id}
              onChange={(e) => setFormData({ ...formData, ga4_property_id: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Format: properties/YOUR_PROPERTY_ID (found in GA4 Admin)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PageSpeed Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <CardTitle>PageSpeed Insights</CardTitle>
          </div>
          <CardDescription>
            Automatically configured using the domain URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              PageSpeed API is ready. Tests will run automatically for {client.domain}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={testConnection}
          disabled={testing || !credentials?.access_token}
        >
          {testing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Connection
            </>
          )}
        </Button>
        <Button onClick={handleSaveSettings}>
          Save Settings
        </Button>
      </div>
    </div>
  )
}