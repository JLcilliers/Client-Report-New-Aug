"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface GoogleAccount {
  id: string
  account_email: string
  account_name: string
}

interface Property {
  id: string
  name: string
  type: 'ga4' | 'search_console'
}

interface ClientFormProps {
  onSuccess?: () => void
}

export default function ClientFormWithGoogleAccounts({ onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([])
  const [ga4Properties, setGa4Properties] = useState<Property[]>([])
  const [searchConsoleProperties, setSearchConsoleProperties] = useState<Property[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    googleAccountId: "",
    ga4PropertyId: "",
    searchConsolePropertyId: ""
  })

  useEffect(() => {
    fetchGoogleAccounts()
  }, [])

  useEffect(() => {
    if (formData.googleAccountId) {
      fetchProperties(formData.googleAccountId)
    }
  }, [formData.googleAccountId])

  const fetchGoogleAccounts = async () => {
    try {
      const response = await fetch("/api/admin/google-accounts")
      if (response.ok) {
        const data = await response.json()
        setGoogleAccounts(data.accounts || [])

        // Auto-select if only one account
        if (data.accounts?.length === 1) {
          setFormData(prev => ({ ...prev, googleAccountId: data.accounts[0].id }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch Google accounts:", error)
    }
  }

  const fetchProperties = async (accountId: string) => {
    try {
      const response = await fetch(`/api/admin/google-accounts/${accountId}/properties`)
      if (response.ok) {
        const data = await response.json()

        // Separate GA4 and Search Console properties
        const ga4 = data.properties?.analytics || data.analytics || data.ga4 || []
        const sc = data.properties?.searchConsole || data.searchConsole || data.gsc || []

        setGa4Properties(ga4.map((p: any) => ({
          id: p.propertyId || p.id || p.property,
          name: p.displayName || p.name || p.property || p.propertyId,
          type: 'ga4' as const
        })))

        setSearchConsoleProperties(sc.map((p: any) => ({
          id: p.siteUrl || p.url,
          name: p.siteUrl || p.url,
          type: 'search_console' as const
        })))
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.domain) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Client created successfully"
        })
        onSuccess?.()
      } else {
        throw new Error(data.error || "Failed to create client")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Client Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Acme Corp"
          required
        />
      </div>

      <div>
        <Label htmlFor="domain">Website Domain *</Label>
        <Input
          id="domain"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          placeholder="e.g., example.com"
          required
        />
      </div>

      {googleAccounts.length > 0 && (
        <div>
          <Label htmlFor="googleAccount">Google Account</Label>
          <Select
            value={formData.googleAccountId}
            onValueChange={(value) => setFormData({ ...formData, googleAccountId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a Google account" />
            </SelectTrigger>
            <SelectContent>
              {googleAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_name || account.account_email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {googleAccounts.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              No Google accounts connected. Connect one in Google Accounts tab.
            </p>
          )}
        </div>
      )}

      {formData.googleAccountId && ga4Properties.length > 0 && (
        <div>
          <Label htmlFor="ga4Property">Google Analytics Property</Label>
          <Select
            value={formData.ga4PropertyId}
            onValueChange={(value) => setFormData({ ...formData, ga4PropertyId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select GA4 property (optional)" />
            </SelectTrigger>
            <SelectContent>
              {ga4Properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {formData.googleAccountId && searchConsoleProperties.length > 0 && (
        <div>
          <Label htmlFor="searchConsole">Search Console Property</Label>
          <Select
            value={formData.searchConsolePropertyId}
            onValueChange={(value) => setFormData({ ...formData, searchConsolePropertyId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Search Console property (optional)" />
            </SelectTrigger>
            <SelectContent>
              {searchConsoleProperties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Client"
        )}
      </Button>
    </form>
  )
}