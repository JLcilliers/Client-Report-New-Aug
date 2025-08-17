"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Globe,
  BarChart3,
  RefreshCw,
  Search,
  CheckCircle,
  Link2,
  AlertCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface GoogleConnection {
  id: string
  access_token: string
  refresh_token: string
  token_expiry: string
  email: string
  connected_at: string
}

interface SearchConsoleProperty {
  siteUrl: string
  permissionLevel: string
}

interface AnalyticsAccount {
  name: string
  id: string
  properties: AnalyticsProperty[]
}

interface AnalyticsProperty {
  name: string
  id: string
  displayName: string
}

interface PropertiesClientProps {
  connection: GoogleConnection
}

export default function PropertiesClient({ connection }: PropertiesClientProps) {
  const [searchConsoleProperties, setSearchConsoleProperties] = useState<SearchConsoleProperty[]>([])
  const [analyticsAccounts, setAnalyticsAccounts] = useState<AnalyticsAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/google/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId: connection.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch properties')
      }

      const data = await response.json()
      setSearchConsoleProperties(data.searchConsole || [])
      setAnalyticsAccounts(data.analytics || [])
    } catch (error: any) {
      console.error('Error fetching properties:', error)
      toast({
        title: "Error",
        description: "Failed to fetch Google properties. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePropertySelection = (propertyId: string) => {
    const newSelection = new Set(selectedProperties)
    if (newSelection.has(propertyId)) {
      newSelection.delete(propertyId)
    } else {
      newSelection.add(propertyId)
    }
    setSelectedProperties(newSelection)
  }

  const filteredSearchConsole = searchConsoleProperties.filter(prop => 
    prop.siteUrl.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAnalytics = analyticsAccounts.map(account => ({
    ...account,
    properties: account.properties.filter(prop => 
      prop.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(account => account.properties.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Google Properties</h1>
          <p className="text-gray-600 mt-1">Select properties to connect to client reports</p>
        </div>
        <Button onClick={fetchProperties} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Console Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Search Console Properties
              </CardTitle>
              <CardDescription>
                {searchConsoleProperties.length} properties available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSearchConsole.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchConsoleProperties.length === 0 ? (
                    <div>
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No Search Console properties found</p>
                      <p className="text-sm mt-1">Make sure you have properties added to your Google Search Console</p>
                    </div>
                  ) : (
                    "No properties match your search"
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredSearchConsole.map((property) => (
                    <div
                      key={property.siteUrl}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProperties.has(property.siteUrl)
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => togglePropertySelection(property.siteUrl)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {selectedProperties.has(property.siteUrl) && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{property.siteUrl}</p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {property.permissionLevel}
                            </Badge>
                          </div>
                        </div>
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
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Analytics 4 Properties
              </CardTitle>
              <CardDescription>
                {analyticsAccounts.reduce((acc, account) => acc + account.properties.length, 0)} properties available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAnalytics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {analyticsAccounts.length === 0 ? (
                    <div>
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No Analytics properties found</p>
                      <p className="text-sm mt-1">Make sure you have GA4 properties in your Google Analytics</p>
                    </div>
                  ) : (
                    "No properties match your search"
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAnalytics.map((account) => (
                    <div key={account.id} className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {account.name}
                      </p>
                      {account.properties.map((property) => (
                        <div
                          key={property.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedProperties.has(property.id)
                              ? 'bg-purple-50 border-purple-300'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => togglePropertySelection(property.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {selectedProperties.has(property.id) && (
                                <CheckCircle className="h-4 w-4 text-purple-600" />
                              )}
                              <div>
                                <p className="font-medium text-sm">{property.displayName}</p>
                                <p className="text-xs text-gray-500">{property.id}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action buttons */}
      {selectedProperties.size > 0 && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setSelectedProperties(new Set())}>
            Clear Selection ({selectedProperties.size})
          </Button>
          <Button>
            <Link2 className="h-4 w-4 mr-2" />
            Create Client Report
          </Button>
        </div>
      )}
    </div>
  )
}