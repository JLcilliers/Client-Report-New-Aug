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
  ExternalLink
} from "lucide-react"

interface SearchConsoleProperty {
  siteUrl: string
  permissionLevel: string
}

interface AnalyticsProperty {
  name: string
  propertyId: string
  account: string
}

export default function PropertiesPage() {
  const [loading, setLoading] = useState(true)
  const [searchConsoleProperties, setSearchConsoleProperties] = useState<SearchConsoleProperty[]>([])
  const [analyticsProperties, setAnalyticsProperties] = useState<AnalyticsProperty[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/google/fetch-properties")
      const data = await response.json()
      
      if (data.properties) {
        setSearchConsoleProperties(data.properties.searchConsole || [])
        setAnalyticsProperties(data.properties.analytics || [])
      }
      
      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshProperties = async () => {
    setLoading(true)
    await fetchProperties()
    toast({
      title: "Properties refreshed",
      description: "Successfully refreshed all properties",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Google Analytics and Search Console properties</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
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
          <p className="text-gray-600 mt-1">Google Analytics and Search Console properties</p>
        </div>
        <Button onClick={refreshProperties} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search Console Properties */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              <CardTitle>Search Console Properties</CardTitle>
            </div>
            <Badge variant="secondary">{searchConsoleProperties.length} sites</Badge>
          </div>
          <CardDescription>
            Websites connected to your Google Search Console account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchConsoleProperties.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No Search Console properties found</p>
              <p className="text-sm mt-1">Make sure you have verified sites in Google Search Console</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {searchConsoleProperties.map((property, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{property.siteUrl}</p>
                      <p className="text-sm text-gray-500">
                        Permission: {property.permissionLevel}
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
            <Badge variant="secondary">{analyticsProperties.length} properties</Badge>
          </div>
          <CardDescription>
            Google Analytics 4 properties connected to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsProperties.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No Analytics properties found</p>
              <p className="text-sm mt-1">Make sure you have access to Google Analytics properties</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {analyticsProperties.map((property, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-sm text-gray-500">
                        Account: {property.account} • ID: {property.propertyId}
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
      {(searchConsoleProperties.length > 0 || analyticsProperties.length > 0) && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Properties Connected</p>
                <p className="text-sm text-green-700">
                  You have {searchConsoleProperties.length + analyticsProperties.length} properties connected and ready to use in reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}