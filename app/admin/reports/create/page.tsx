"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SearchConsoleProperty {
  siteUrl: string
  verified: boolean
}

export default function CreateReportPage() {
  const [loading, setLoading] = useState(false)
  const [searchConsoleProperties, setSearchConsoleProperties] = useState<SearchConsoleProperty[]>([])
  const [formData, setFormData] = useState({
    newClientName: 'Lancer Skincare',
    newClientDomain: 'lancerskincare.com',
    reportName: 'Lancer Skincare - Monthly SEO Report',
    reportDescription: 'Monthly performance overview and insights',
    selectedSearchConsoleProps: [] as string[],
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
    fetchSearchConsoleProperties()
  }, [])

  const fetchSearchConsoleProperties = async () => {
    try {
      console.log('Fetching Search Console properties...')
      const response = await fetch('/api/test/verify-search-console')
      console.log('Search Console response:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Search Console data:', data)
        
        if (data.searchConsole?.sites) {
          console.log('Raw sites data:', data.searchConsole.sites)
          const properties = data.searchConsole.sites.map((site: any) => ({
            siteUrl: typeof site === 'string' ? site : site.siteUrl,
            verified: true
          }))
          console.log('Properties found:', properties.length)
          console.log('Mapped properties:', properties)
          setSearchConsoleProperties(properties)
          
          // Auto-select a suitable property
          const goodProperty = properties.find((p: SearchConsoleProperty) => 
            p.siteUrl && (
              p.siteUrl.includes('themachinemarket') ||
              p.siteUrl.includes('vocalegalglobal') ||
              p.siteUrl.includes('shopdualthreads')
            )
          )
          
          if (goodProperty) {
            console.log('Auto-selecting property:', goodProperty.siteUrl)
            setFormData(prev => ({
              ...prev,
              selectedSearchConsoleProps: [goodProperty.siteUrl]
            }))
          }
        } else {
          console.log('No sites in Search Console data:', data)
        }
      } else {
        const errorText = await response.text()
        console.error('Search Console API error:', response.status, errorText)
        toast({
          title: "Search Console API Error",
          description: `Status ${response.status}: ${errorText.substring(0, 100)}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching Search Console properties:', error)
      toast({
        title: "Network Error",
        description: "Could not connect to Search Console API. Check console for details.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async () => {
    if (formData.selectedSearchConsoleProps.length === 0) {
      toast({
        title: "Please select at least one Search Console property",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      console.log('Creating client with data:', {
        name: formData.newClientName,
        domain: formData.newClientDomain.startsWith('http') 
          ? formData.newClientDomain 
          : `https://${formData.newClientDomain}`
      })
      
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
      
      console.log('Client creation response:', clientResponse.status, clientResponse.ok)
      
      if (!clientResponse.ok) {
        const errorData = await clientResponse.json()
        console.error('Client creation failed:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to create client')
      }
      
      const clientData = await clientResponse.json()
      console.log('Client created:', clientData)
      const clientId = clientData.client?.id || clientData.id

      // Create the report
      const reportResponse = await fetch('/api/reports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          name: formData.reportName,
          description: formData.reportDescription,
          searchConsoleProperties: formData.selectedSearchConsoleProps,
          analyticsProperties: [],
          settings: {
            reportSections: Object.keys(formData.sections).filter(key => 
              formData.sections[key as keyof typeof formData.sections]
            )
          }
        })
      })

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json()
        console.error('Report creation failed:', errorData)
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
      console.error('Error creating report:', error)
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
    <div className="max-w-2xl mx-auto space-y-6">
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
            <p className="text-gray-600">Set up a new SEO report</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Create a new SEO report with real data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.newClientName}
                onChange={(e) => setFormData(prev => ({ ...prev, newClientName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientDomain">Domain</Label>
              <Input
                id="clientDomain"
                value={formData.newClientDomain}
                onChange={(e) => setFormData(prev => ({ ...prev, newClientDomain: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportName">Report Name</Label>
            <Input
              id="reportName"
              value={formData.reportName}
              onChange={(e) => setFormData(prev => ({ ...prev, reportName: e.target.value }))}
            />
          </div>

          <div>
            <Label className="text-base font-medium">Search Console Properties</Label>
            <p className="text-sm text-gray-500 mb-3">Select which properties to include (you have {searchConsoleProperties.length} available)</p>
            
            {/* Debug panel */}
            <div className="mb-4 p-3 bg-gray-50 border rounded-lg text-xs">
              <details>
                <summary className="cursor-pointer font-medium">🔧 Debug Info (click to expand)</summary>
                <div className="mt-2 space-y-1 text-gray-600">
                  <div>Properties loaded: {searchConsoleProperties.length}</div>
                  <div>Selected: {formData.selectedSearchConsoleProps.length}</div>
                  <div>Auth endpoint: /api/test/verify-search-console</div>
                  <div className="text-xs">
                    <details>
                      <summary>Raw properties:</summary>
                      <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-20">
                        {JSON.stringify(searchConsoleProperties.map(p => p.siteUrl), null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </details>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-4">
              {searchConsoleProperties.length === 0 ? (
                <div className="space-y-3">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No Search Console properties found. This could mean:
                    </p>
                    <ul className="text-xs text-yellow-700 mt-2 list-disc list-inside">
                      <li>Authentication expired</li>
                      <li>API endpoint error</li>
                      <li>Network connectivity issue</li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href="/admin/auth/setup">
                      <Button variant="outline" size="sm">
                        Check Auth Status
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open('/api/debug/report-creation', '_blank')}
                    >
                      Debug API
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchSearchConsoleProperties}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                searchConsoleProperties.map((property) => (
                  <div key={property.siteUrl} className="flex items-center space-x-2 p-2 border rounded">
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
                    <Label htmlFor={property.siteUrl} className="text-sm flex-1">
                      {property.siteUrl}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={loading || formData.selectedSearchConsoleProps.length === 0}
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

      {formData.selectedSearchConsoleProps.length === 0 && searchConsoleProperties.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-800">
            Please select at least one Search Console property to create the report.
          </p>
        </div>
      )}
    </div>
  )
}
