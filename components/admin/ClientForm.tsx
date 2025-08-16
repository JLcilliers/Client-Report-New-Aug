"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabaseAdmin } from "@/lib/db/supabase"

interface ClientFormProps {
  onSuccess?: () => void
}

export default function ClientForm({ onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clean up domain URL
      let cleanDomain = formData.domain.trim()
      if (!cleanDomain.startsWith("http")) {
        cleanDomain = `https://${cleanDomain}`
      }
      // Remove trailing slash
      cleanDomain = cleanDomain.replace(/\/$/, "")

      const { data, error } = await supabaseAdmin
        .from("clients")
        .insert({
          name: formData.name.trim(),
          domain: cleanDomain,
        })
        .select()
        .single()

      if (error) throw error

      const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/report/${data.id}/${data.report_token}`
      
      // Copy report URL to clipboard
      await navigator.clipboard.writeText(reportUrl)

      toast({
        title: "Client Added Successfully!",
        description: "Report URL has been copied to your clipboard",
      })

      // Reset form
      setFormData({ name: "", domain: "" })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error adding client:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add client",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Client Name</Label>
        <Input
          id="name"
          placeholder="Acme Corporation"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Domain URL</Label>
        <Input
          id="domain"
          placeholder="example.com"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          required
        />
        <p className="text-xs text-gray-500">
          Enter the main domain (e.g., example.com or https://example.com)
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding Client..." : "Add Client"}
      </Button>
    </form>
  )
}