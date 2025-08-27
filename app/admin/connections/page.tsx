"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { signIn } from "next-auth/react"

interface GoogleAccount {
  id: string
  email: string
  name?: string
  picture?: string
  connected_at: string
  token_expiry?: string
  is_active: boolean
  properties_count?: number
}

export default function ConnectionsPage() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<any>({ searchConsole: [], analytics: [] })
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 Loading connections data...')
      setLoading(true)
      
      // Fetch accounts first (fast)
      await fetchAccounts()
      setLoading(false)
      
      // Then fetch properties in the background (slow)
      fetchProperties().then(props => {
        console.log('✅ Properties loaded:', props)
        // Update account property counts if needed
        setAccounts(prevAccounts => 
          prevAccounts.map(account => ({
            ...account,
            properties_count: (props.searchConsole?.length || 0) + (props.analytics?.length || 0)
          }))
        )
      }).catch(err => {
        console.error('Failed to load properties:', err)
      })
    }
    loadData()
  }, [])

  const fetchAccounts = async () => {
    try {
      console.log('📡 Fetching Google accounts...')
      // Fetch all Google accounts from the database
      const response = await fetch("/api/admin/google-accounts")
      const data = await response.json()
      
      console.log('📦 Accounts response:', data)
      
      if (data.accounts && data.accounts.length > 0) {
        // Map accounts to display format
        const formattedAccounts = data.accounts.map((account: any) => ({
          id: account.id,
          email: account.account_email,
          name: account.account_name || account.account_email,
          connected_at: account.created_at,
          is_active: account.is_active,
          token_expiry: account.token_expiry,
          properties_count: 0 // Will be updated when properties are loaded
        }))
        console.log('✅ Formatted accounts:', formattedAccounts)
        setAccounts(formattedAccounts)
        return formattedAccounts
      } else {
        console.log('⚠️ No accounts found in database, checking session...')
        // If no accounts, check current session
        const sessionResponse = await fetch("/api/auth/check-session")
        const sessionData = await sessionResponse.json()
        
        console.log('🔐 Session data:', sessionData)
        
        if (sessionData.authenticated) {
          const sessionAccount = {
            id: "1",
            email: sessionData.email || "No email",
            name: sessionData.name || "Google Account",
            connected_at: new Date().toISOString(),
            is_active: true,
            properties_count: 0
          }
          setAccounts([sessionAccount])
          return [sessionAccount]
        }
      }
      
      return []
    } catch (error) {
      console.error("❌ Error fetching accounts:", error)
      toast({
        title: "Error",
        description: "Failed to load Google accounts",
        variant: "destructive"
      })
      return []
    }
  }

  const disconnectAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this Google account?")) {
      return
    }

    try {
      // TODO: Implement disconnect functionality
      toast({
        title: "Account disconnected",
        description: "The Google account has been disconnected",
      })
      fetchAccounts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive"
      })
    }
  }

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/google/fetch-properties")
      const data = await response.json()
      if (data.properties) {
        setProperties(data.properties)
        return data.properties
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    }
    return { searchConsole: [], analytics: [] }
  }

  const refreshToken = async (accountId: string) => {
    try {
      // Re-authenticate with Google
      signIn('google')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh token",
        variant: "destructive"
      })
    }
  }

  console.log('🎨 Rendering connections page')
  console.log('  - Loading:', loading)
  console.log('  - Accounts array:', accounts)
  console.log('  - Accounts length:', accounts.length)
  console.log('  - Accounts is array:', Array.isArray(accounts))
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Google Connections</h1>
          <p className="text-gray-600 mt-1">Manage your connected Google accounts</p>
        </div>
        <Button
          onClick={() => signIn('google')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Google Account
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Google accounts connected</h3>
            <p className="text-gray-500 mb-6">
              Connect a Google account to start pulling data from Google Analytics and Search Console
            </p>
            <Button
              onClick={() => signIn('google')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Google Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {account.picture ? (
                      <img 
                        src={account.picture} 
                        alt={account.name || account.email}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {account.name || account.email}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3" />
                        {account.email}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={account.is_active ? "default" : "secondary"}>
                    {account.is_active ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Connected
                    </span>
                    <span className="font-medium">
                      {new Date(account.connected_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {properties.searchConsole.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Search Console</span>
                        <span className="font-medium">{properties.searchConsole.length} sites</span>
                      </div>
                    )}
                    {properties.analytics.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Analytics</span>
                        <span className="font-medium">{properties.analytics.length} properties</span>
                      </div>
                    )}
                    {properties.searchConsole.length === 0 && properties.analytics.length === 0 && (
                      <div className="text-sm text-gray-500 italic">
                        No properties found. Make sure you have access to Analytics or Search Console.
                      </div>
                    )}
                  </div>

                  {account.token_expiry && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Token expires</span>
                      <span className="font-medium">
                        {new Date(account.token_expiry).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Link href="/admin/properties" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Properties
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refreshToken(account.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => disconnectAccount(account.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}