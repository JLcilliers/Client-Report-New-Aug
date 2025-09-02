"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { 
  Globe,
  Search,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Link,
  ExternalLink,
  User
} from "lucide-react"

interface SearchConsoleProperty {
  siteUrl: string
  permissionLevel?: string
}

interface AnalyticsProperty {
  propertyId: string
  displayName: string
  account: string
}

interface AccountProperties {
  accountId: string
  accountEmail: string
  error?: string
  searchConsole: SearchConsoleProperty[]
  analytics: AnalyticsProperty[]
}

export default function PropertiesPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [accountsProperties, setAccountsProperties] = useState<AccountProperties[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      console.log('[Properties Page] Fetching properties...')
      const response = await fetch("/api/google/fetch-properties")
      const data = await response.json()
      
      console.log('[Properties Page] Response:', data)
      
      if (data.success && data.accounts) {
        setAccountsProperties(data.accounts)
        
        // Check for any errors
        const accountsWithErrors = data.accounts.filter((acc: AccountProperties) => acc.error)
        if (accountsWithErrors.length > 0) {
          toast({
            title: "Some accounts have issues",
            description: `${accountsWithErrors.length} account(s) couldn't fetch properties. Token may be expired.`,
            variant: "destructive"
          })
        }
      } else if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("[Properties Page] Error fetching properties:", error)
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshProperties = async () => {
    setRefreshing(true)
    await fetchProperties()
    toast({
      title: "Properties refreshed",
      description: "Successfully refreshed all properties",
    })
  }

  // Combine all properties from all accounts
  const allSearchConsoleProperties = accountsProperties.flatMap(acc => 
    acc.searchConsole.map(prop => ({ ...prop, accountEmail: acc.accountEmail }))
  )
  
  const allAnalyticsProperties = accountsProperties.flatMap(acc => 
    acc.analytics.map(prop => ({ ...prop, accountEmail: acc.accountEmail }))
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Google Analytics and Search Console properties</p>
        </div>
        <div className="text-center py-8">
          <RefreshCw className="animate-spin h-12 w-12 text-gray-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Google Analytics and Search Console properties from all connected accounts</p>
        </div>
        <Button 
          onClick={refreshProperties} 
          variant="outline"
          disabled={refreshing}
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Account Summary */}
      {accountsProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Properties are fetched from {accountsProperties.length} Google account(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {accountsProperties.map((acc, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{acc.accountEmail}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {acc.error ? (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Error: {acc.error}
                      </Badge>
                    ) : (
                      <>
                        <span className="text-gray-600">
                          <Globe className="h-3 w-3 inline mr-1" />
                          {acc.searchConsole.length} SC
                        </span>
                        <span className="text-gray-600">
                          <BarChart3 className="h-3 w-3 inline mr-1" />
                          {acc.analytics.length} GA
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Console Properties */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              <CardTitle>Search Console Properties</CardTitle>
            </div>
            <Badge variant="secondary">{allSearchConsoleProperties.length} sites</Badge>
          </div>
          <CardDescription>
            Websites connected to your Google Search Console accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allSearchConsoleProperties.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No Search Console properties found</p>
              <p className="text-sm mt-1">Make sure you have verified sites in Google Search Console</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {allSearchConsoleProperties.map((property, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{property.siteUrl}</p>
                      <p className="text-sm text-gray-500">
                        Account: {property.accountEmail}
                        {property.permissionLevel && ` • Permission: ${property.permissionLevel}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <a 
                      href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(property.siteUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Properties */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <CardTitle>Google Analytics Properties</CardTitle>
            </div>
            <Badge variant="secondary">{allAnalyticsProperties.length} properties</Badge>
          </div>
          <CardDescription>
            Google Analytics 4 properties connected to your accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allAnalyticsProperties.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No Analytics properties found</p>
              <p className="text-sm mt-1">Make sure you have access to Google Analytics properties</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {allAnalyticsProperties.map((property, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{property.displayName}</p>
                      <p className="text-sm text-gray-500">
                        Account: {property.accountEmail} • ID: {property.propertyId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <a 
                      href={`https://analytics.google.com/analytics/web/#/p${property.propertyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {(allSearchConsoleProperties.length > 0 || allAnalyticsProperties.length > 0) && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Properties Connected</p>
                <p className="text-sm text-green-700">
                  You have {allSearchConsoleProperties.length + allAnalyticsProperties.length} properties connected from {accountsProperties.length} account(s) ready to use in reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No accounts message */}
      {accountsProperties.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No Google accounts connected</p>
              <p className="text-gray-500 mb-4">
                You need to connect a Google account to see properties
              </p>
              <Button onClick={() => window.location.href = '/admin/google-accounts'}>
                Go to Google Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}