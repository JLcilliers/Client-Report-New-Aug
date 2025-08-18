"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Globe, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function CreateReportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Get selected properties from URL params
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const selectedSC = params.get('sc')?.split(',').filter(Boolean) || []
  const selectedGA = params.get('ga')?.split(',').filter(Boolean) || []
  
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientUrl: "",
    reportName: "",
    description: "",
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          searchConsoleProperties: selectedSC,
          analyticsProperties: selectedGA,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create report')
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''))
      }
      
      toast({
        title: "Success",
        description: "Report created successfully!",
      })
      
      router.push(`/admin/reports/${data.reportId}`)
    } catch (error: any) {
      console.error('Error creating report:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Client Report</h1>
          <p className="text-gray-600 mt-1">Set up a new report with selected properties</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>
                Configure the client report settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      required
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      placeholder="Acme Corp"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                      placeholder="client@example.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientUrl">Client Website</Label>
                  <Input
                    id="clientUrl"
                    type="url"
                    value={formData.clientUrl}
                    onChange={(e) => setFormData({...formData, clientUrl: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reportName">Report Name *</Label>
                  <Input
                    id="reportName"
                    required
                    value={formData.reportName}
                    onChange={(e) => setFormData({...formData, reportName: e.target.value})}
                    placeholder="Monthly SEO Report"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Additional notes about this report..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Create Report
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Selected Properties */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Search Console
              </CardTitle>
              <CardDescription>
                {selectedSC.length} properties selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSC.length === 0 ? (
                <p className="text-sm text-gray-500">No properties selected</p>
              ) : (
                <div className="space-y-2">
                  {selectedSC.map((url) => (
                    <div key={url} className="text-sm p-2 bg-gray-50 rounded">
                      {url}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Analytics 4
              </CardTitle>
              <CardDescription>
                {selectedGA.length} properties selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedGA.length === 0 ? (
                <p className="text-sm text-gray-500">No properties selected</p>
              ) : (
                <div className="space-y-2">
                  {selectedGA.map((id) => (
                    <div key={id} className="text-sm p-2 bg-gray-50 rounded">
                      Property {id}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}