"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Plus, Loader2, Globe, BarChart3, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface GoogleAccount {
  id: string
  account_email: string
  account_name?: string
  is_active: boolean
}

interface SearchConsoleProperty {
  siteUrl: string
  verified: boolean
}

interface AnalyticsProperty {
  account: string
  property: string
  propertyId: string
  displayName: string
}

export default function CreateReportPage() {
  const [loading, setLoading] = useState(false)
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([])
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<string>("")
  const [searchConsoleProperties, setSearchConsoleProperties] = useState<SearchConsoleProperty[]>([])
  const [analyticsProperties, setAnalyticsProperties] = useState<AnalyticsProperty[]>([])
  const [loadingProperties, setLoadingProperties] = useState(false)
  
  const [formData, setFormData] = useState({
    newClientName: '',
    newClientDomain: '',
    reportName: '',
    reportDescription: 'Monthly performance overview and insights',
    selectedSearchConsoleProps: [] as string[],
    selectedAnalyticsProps: [] as string[],
    sections: {
      overview: true,
      traffic: true,
      keywords: true,
      technical: true,
      content: true,
    }
  })
  
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchGoogleAccounts()
  }, [])

  useEffect(() => {
    if (selectedGoogleAccount) {
      fetchProperties(selectedGoogleAccount)
    } else {
      setSearchConsoleProperties([])
      setAnalyticsProperties([])
    }
  }, [selectedGoogleAccount])

  const fetchGoogleAccounts = async () => {
    try {
      const response = await fetch('/api/admin/google-accounts')
      if (response.ok) {
        const data = await response.json()
        setGoogleAccounts(data.accounts || [])
        
        // Auto-select first account if only one exists
        if (data.accounts && data.accounts.length === 1) {
          setSelectedGoogleAccount(data.accounts[0].id)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load Google accounts",
          variant: "destructive"
        })
      }
    } catch (error) {
      
      toast({
        title: "Error",
        description: "Failed to load Google accounts",
        variant: "destructive"
      })
    }
  }

  const fetchProperties = async (accountId: string) => {
    setLoadingProperties(true)
    console.log('[Create Report] Fetching properties for account:', accountId)
    
    try {
      // Fetch properties for the specific account
      const response = await fetch(`/api/google/fetch-properties?accountId=${accountId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Create Report] Properties response:', data)
        
        // Handle the response structure correctly
        if (data.success && data.properties) {
          // Set Search Console properties
          if (data.properties.searchConsole) {
            const properties = data.properties.searchConsole.map((site: any) => ({
              siteUrl: site.siteUrl,
              verified: true,
              permissionLevel: site.permissionLevel
            }))
            setSearchConsoleProperties(properties)
            console.log('[Create Report] Search Console properties:', properties.length)
          } else {
            setSearchConsoleProperties([])
          }
          
          // Set Analytics properties
          if (data.properties.analytics) {
            // Transform analytics properties to match expected format
            const analyticsProps = data.properties.analytics.map((prop: any) => ({
              account: prop.account,
              property: prop.propertyId,
              propertyId: prop.propertyId,
              displayName: prop.displayName || prop.propertyId
            }))
            setAnalyticsProperties(analyticsProps)
            console.log('[Create Report] Analytics properties:', analyticsProps.length)
          } else {
            setAnalyticsProperties([])
          }
          
          if ((!data.properties.searchConsole || data.properties.searchConsole.length === 0) && 
              (!data.properties.analytics || data.properties.analytics.length === 0)) {
            toast({
              title: "No properties found",
              description: "This account may not have access to any properties or the token may be expired",
              variant: "default"
            })
          }
        } else if (data.error) {
          console.error('[Create Report] Error from API:', data.error)
          toast({
            title: "Error loading properties",
            description: data.error === 'No valid access token available' 
              ? "Token expired. Please refresh the Google account connection."
              : "Failed to load properties for this account",
            variant: "destructive"
          })
          setSearchConsoleProperties([])
          setAnalyticsProperties([])
        }
      } else {
        const errorText = await response.text()
        console.error('[Create Report] Error response:', errorText)
        toast({
          title: "Error loading properties",
          description: "Failed to load properties for this account",
          variant: "destructive"
        })
        setSearchConsoleProperties([])
        setAnalyticsProperties([])
      }
    } catch (error) {
      console.error('[Create Report] Network error:', error)
      toast({
        title: "Network Error",
        description: "Could not connect to fetch properties",
        variant: "destructive"
      })
      setSearchConsoleProperties([])
      setAnalyticsProperties([])
    } finally {
      setLoadingProperties(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedGoogleAccount) {
      toast({
        title: "Please select a Google account",
        variant: "destructive"
      })
      return
    }
    
    if (!formData.newClientName || !formData.newClientDomain || !formData.reportName) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (formData.selectedSearchConsoleProps.length === 0 && formData.selectedAnalyticsProps.length === 0) {
      toast({
        title: "Please select at least one property",
        description: "Select Search Console or Analytics properties",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Create client first
      const clientResponse = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.newClientName,
          domain: formData.newClientDomain.startsWith('http') 
            ? formData.newClientDomain 
            : `https://${formData.newClientDomain}`
        })
      })
      
      if (!clientResponse.ok) {
        const errorData = await clientResponse.json()
        throw new Error(errorData.details || errorData.error || 'Failed to create client')
      }
      
      const clientData = await clientResponse.json()
      
      if (clientData.existing) {
        toast({
          title: "Using existing client",
          description: `Client "${clientData.client.name}" already exists with this domain`,
        })
      }
      
      const clientId = clientData.client?.id || clientData.id
      const clientName = clientData.client?.name || formData.newClientName

      // Create the report with Google account association
      const reportResponse = await fetch('/api/reports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          clientName,
          name: formData.reportName,
          description: formData.reportDescription,
          googleAccountId: selectedGoogleAccount,
          searchConsoleProperties: formData.selectedSearchConsoleProps,
          analyticsProperties: formData.selectedAnalyticsProps,
          settings: {
            reportSections: Object.keys(formData.sections).filter(key => 
              formData.sections[key as keyof typeof formData.sections]
            )
          }
        })
      })

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json()
        throw new Error(errorData.error || 'Failed to create report')
      }

      const reportData = await reportResponse.json()
      
      toast({
        title: "Report created successfully!",
        description: "Redirecting to the new report...",
      })

      // Copy report URL to clipboard
      const reportUrl = `${window.location.origin}/report/${reportData.slug}`
      await navigator.clipboard.writeText(reportUrl)

      // Redirect to the new report
      router.push(`/report/${reportData.slug}`)
      
    } catch (error: any) {
      
      toast({
        title: "Error creating report",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Report</h1>
            <p className="text-gray-600">Set up a new SEO report with real data</p>
          </div>
        </div>
      </div>

      {/* Step 1: Select Google Account */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Google Account</CardTitle>
          <CardDescription>Choose which Google account to use for data access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="googleAccount">Google Account</Label>
              {selectedGoogleAccount && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchProperties(selectedGoogleAccount)}
                  disabled={loadingProperties}
                >
                  {loadingProperties ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Refresh Properties</span>
                </Button>
              )}
            </div>
            <Select value={selectedGoogleAccount} onValueChange={setSelectedGoogleAccount}>
              <SelectTrigger id="googleAccount">
                <SelectValue placeholder="Select a Google account" />
              </SelectTrigger>
              <SelectContent>
                {googleAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{account.account_email}</span>
                      {!account.is_active && (
                        <span className="text-xs text-red-500 ml-2">(Token Expired)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {googleAccounts.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">No Google accounts connected</p>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                You need to add a Google account first to access Search Console and Analytics data.
              </p>
              <Link href="/admin/google-accounts">
                <Button size="sm" className="mt-2">
                  Add Google Account
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Client & Report Details */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Client & Report Details</CardTitle>
          <CardDescription>Enter the client and report information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.newClientName}
                onChange={(e) => setFormData(prev => ({ ...prev, newClientName: e.target.value }))}
                placeholder="e.g., Lancer Skincare"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientDomain">Domain *</Label>
              <Input
                id="clientDomain"
                value={formData.newClientDomain}
                onChange={(e) => setFormData(prev => ({ ...prev, newClientDomain: e.target.value }))}
                placeholder="e.g., lancerskincare.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportName">Report Name *</Label>
            <Input
              id="reportName"
              value={formData.reportName}
              onChange={(e) => setFormData(prev => ({ ...prev, reportName: e.target.value }))}
              placeholder="e.g., Monthly SEO Report"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportDescription">Report Description</Label>
            <Input
              id="reportDescription"
              value={formData.reportDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, reportDescription: e.target.value }))}
              placeholder="Optional description"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Select Properties */}
      {selectedGoogleAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Select Properties</CardTitle>
            <CardDescription>Choose which properties to include in this report</CardDescription>
            {loadingProperties && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading properties...
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Console Properties */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-5 w-5 text-marine" />
                <Label className="text-base font-medium">Search Console Properties</Label>
                <span className="text-sm text-gray-500">({searchConsoleProperties.length} available)</span>
                {searchConsoleProperties.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-marine hover:underline ml-auto"
                    onClick={() => {
                      const allSelected = searchConsoleProperties.every(p => 
                        formData.selectedSearchConsoleProps.includes(p.siteUrl)
                      )
                      if (allSelected) {
                        setFormData(prev => ({ ...prev, selectedSearchConsoleProps: [] }))
                      } else {
                        setFormData(prev => ({ 
                          ...prev, 
                          selectedSearchConsoleProps: searchConsoleProperties.map(p => p.siteUrl) 
                        }))
                      }
                    }}
                  >
                    {searchConsoleProperties.every(p => formData.selectedSearchConsoleProps.includes(p.siteUrl)) 
                      ? 'Deselect All' 
                      : 'Select All'
                    }
                  </button>
                )}
              </div>
              
              {searchConsoleProperties.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                  {searchConsoleProperties.map((property) => (
                    <div key={property.siteUrl} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={property.siteUrl}
                        checked={formData.selectedSearchConsoleProps.includes(property.siteUrl)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              selectedSearchConsoleProps: [...prev.selectedSearchConsoleProps, property.siteUrl]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              selectedSearchConsoleProps: prev.selectedSearchConsoleProps.filter(p => p !== property.siteUrl)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={property.siteUrl} className="text-sm flex-1 cursor-pointer">
                        {property.siteUrl.replace('sc-domain:', '')}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">
                    {loadingProperties ? "Loading..." : "No Search Console properties found for this account"}
                  </p>
                </div>
              )}
            </div>

            {/* Analytics Properties */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-marine" />
                <Label className="text-base font-medium">Analytics Properties</Label>
                <span className="text-sm text-gray-500">({analyticsProperties.length} available)</span>
                {analyticsProperties.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-marine hover:underline ml-auto"
                    onClick={() => {
                      const allSelected = analyticsProperties.every(p => 
                        formData.selectedAnalyticsProps.includes(p.propertyId)
                      )
                      if (allSelected) {
                        setFormData(prev => ({ ...prev, selectedAnalyticsProps: [] }))
                      } else {
                        setFormData(prev => ({ 
                          ...prev, 
                          selectedAnalyticsProps: analyticsProperties.map(p => p.propertyId) 
                        }))
                      }
                    }}
                  >
                    {analyticsProperties.every(p => formData.selectedAnalyticsProps.includes(p.propertyId)) 
                      ? 'Deselect All' 
                      : 'Select All'
                    }
                  </button>
                )}
              </div>
              
              {analyticsProperties.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                  {analyticsProperties.map((property) => (
                    <div key={property.propertyId} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={property.propertyId}
                        checked={formData.selectedAnalyticsProps.includes(property.propertyId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              selectedAnalyticsProps: [...prev.selectedAnalyticsProps, property.propertyId]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              selectedAnalyticsProps: prev.selectedAnalyticsProps.filter(p => p !== property.propertyId)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={property.propertyId} className="text-sm flex-1 cursor-pointer">
                        <div>
                          <div className="font-medium">{property.displayName}</div>
                          <div className="text-xs text-gray-500">
                            {property.account} • ID: {property.propertyId}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">
                    {loadingProperties ? "Loading..." : "No Analytics properties found for this account"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Button */}
      <div className="flex justify-end gap-4">
        <Link href="/admin">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !selectedGoogleAccount || googleAccounts.length === 0}
          className="min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Report...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </>
          )}
        </Button>
      </div>
    </div>
  )
}