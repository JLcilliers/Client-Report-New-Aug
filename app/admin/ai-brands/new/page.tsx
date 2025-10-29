"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Check, Plus, X, Brain, Building2, Search, Users, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface BrandSetup {
  brandName: string
  alternateNames: string[]
  domain: string
  industry: string
  description: string
  competitors: Array<{ name: string; domain: string }>
  keywords: Array<{ prompt: string; category: string; priority: string }>
  platforms: string[]
}

const INDUSTRIES = [
  "Technology",
  "E-commerce",
  "Healthcare",
  "Finance",
  "Education",
  "Real Estate",
  "Marketing",
  "Consulting",
  "Manufacturing",
  "Retail",
  "Food & Beverage",
  "Entertainment",
  "Travel & Tourism",
  "Other"
]

const KEYWORD_CATEGORIES = [
  { value: "informational", label: "Informational" },
  { value: "commercial", label: "Commercial Intent" },
  { value: "comparison", label: "Comparison" },
  { value: "navigational", label: "Navigational" }
]

const AI_PLATFORMS = [
  { id: "chatgpt", name: "ChatGPT", description: "OpenAI's GPT models", recommended: true },
  { id: "claude", name: "Claude", description: "Anthropic's AI assistant", recommended: true },
  { id: "gemini", name: "Google Gemini", description: "Google's AI model", recommended: true },
  { id: "perplexity", name: "Perplexity AI", description: "AI-powered search", recommended: true },
  { id: "google_ai", name: "Google AI Overviews", description: "AI summaries in Google Search", recommended: true }
]

export default function NewAIBrandWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<BrandSetup>({
    brandName: "",
    alternateNames: [],
    domain: "",
    industry: "",
    description: "",
    competitors: [],
    keywords: [],
    platforms: ["chatgpt", "gemini", "google_ai"] // Default recommendations
  })

  // Temporary input states
  const [newAlternateName, setNewAlternateName] = useState("")
  const [newCompetitor, setNewCompetitor] = useState({ name: "", domain: "" })
  const [newKeyword, setNewKeyword] = useState({ prompt: "", category: "informational", priority: "medium" })

  function addAlternateName() {
    if (newAlternateName.trim()) {
      setFormData({
        ...formData,
        alternateNames: [...formData.alternateNames, newAlternateName.trim()]
      })
      setNewAlternateName("")
    }
  }

  function removeAlternateName(index: number) {
    setFormData({
      ...formData,
      alternateNames: formData.alternateNames.filter((_, i) => i !== index)
    })
  }

  function addCompetitor() {
    if (newCompetitor.name.trim()) {
      setFormData({
        ...formData,
        competitors: [...formData.competitors, { ...newCompetitor }]
      })
      setNewCompetitor({ name: "", domain: "" })
    }
  }

  function removeCompetitor(index: number) {
    setFormData({
      ...formData,
      competitors: formData.competitors.filter((_, i) => i !== index)
    })
  }

  function addKeyword() {
    if (newKeyword.prompt.trim()) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, { ...newKeyword }]
      })
      setNewKeyword({ prompt: "", category: "informational", priority: "medium" })
    }
  }

  function removeKeyword(index: number) {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((_, i) => i !== index)
    })
  }

  function togglePlatform(platformId: string) {
    if (formData.platforms.includes(platformId)) {
      setFormData({
        ...formData,
        platforms: formData.platforms.filter(p => p !== platformId)
      })
    } else {
      setFormData({
        ...formData,
        platforms: [...formData.platforms, platformId]
      })
    }
  }

  function canProceed() {
    switch (step) {
      case 1:
        return formData.brandName.trim() && formData.industry.trim()
      case 2:
        return formData.competitors.length >= 1
      case 3:
        return formData.keywords.length >= 5
      case 4:
        return formData.platforms.length >= 1
      default:
        return true
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      // Create brand
      const brandResponse = await fetch("/api/admin/ai-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: formData.brandName,
          alternateNames: formData.alternateNames,
          domain: formData.domain,
          industry: formData.industry,
          description: formData.description
        })
      })

      if (!brandResponse.ok) {
        throw new Error("Failed to create brand")
      }

      const { brand } = await brandResponse.json()

      // Add competitors
      if (formData.competitors.length > 0) {
        await fetch(`/api/admin/ai-brands/${brand.id}/competitors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ competitors: formData.competitors })
        })
      }

      // Add keywords
      if (formData.keywords.length > 0) {
        await fetch(`/api/admin/ai-brands/${brand.id}/keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: formData.keywords })
        })
      }

      toast.success("AI Brand created successfully!")
      router.push(`/admin/ai-brands/${brand.id}`)
    } catch (error) {
      toast.error("Failed to create AI brand")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? router.push("/admin/ai-brands") : setStep(step - 1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Add New AI Brand</h1>
          </div>
          <p className="text-gray-600">Set up AI visibility tracking for your brand</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: "Brand Info", icon: Building2 },
              { num: 2, title: "Competitors", icon: Users },
              { num: 3, title: "Keywords", icon: Search },
              { num: 4, title: "Platforms", icon: Sparkles }
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    step >= s.num ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > s.num ? <Check className="h-6 w-6" /> : <s.icon className="h-6 w-6" />}
                  </div>
                  <span className={`text-sm font-medium ${step >= s.num ? 'text-purple-600' : 'text-gray-600'}`}>
                    {s.title}
                  </span>
                </div>
                {i < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${step > s.num ? 'bg-purple-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Brand Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>Tell us about your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="e.g., Acme Corp"
                />
              </div>

              <div>
                <Label>Alternate Names (Optional)</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newAlternateName}
                    onChange={(e) => setNewAlternateName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAlternateName()}
                    placeholder="Add brand variation"
                  />
                  <Button onClick={addAlternateName} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.alternateNames.map((name, i) => (
                    <Badge key={i} variant="secondary">
                      {name}
                      <X
                        className="h-3 w-3 ml-2 cursor-pointer"
                        onClick={() => removeAlternateName(i)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="domain">Website Domain (Optional)</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="e.g., acmecorp.com"
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your brand"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Competitors */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Add Competitors</CardTitle>
              <CardDescription>Add 3-10 direct competitors to track share of voice (minimum 1)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Competitor Name *</Label>
                  <Input
                    value={newCompetitor.name}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                    placeholder="e.g., Competitor Inc"
                  />
                </div>
                <div>
                  <Label>Domain (Optional)</Label>
                  <Input
                    value={newCompetitor.domain}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
                    placeholder="e.g., competitor.com"
                  />
                </div>
              </div>
              <Button onClick={addCompetitor} type="button" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>

              <div className="space-y-2">
                {formData.competitors.map((comp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{comp.name}</p>
                      {comp.domain && <p className="text-sm text-gray-600">{comp.domain}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompetitor(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {formData.competitors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No competitors added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Keywords */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Add Keywords & Prompts</CardTitle>
              <CardDescription>Add 10-20 prompts to test across AI platforms (minimum 5)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Prompt / Query *</Label>
                  <Input
                    value={newKeyword.prompt}
                    onChange={(e) => setNewKeyword({ ...newKeyword, prompt: e.target.value })}
                    placeholder="e.g., What are the best project management tools?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={newKeyword.category}
                      onValueChange={(value) => setNewKeyword({ ...newKeyword, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KEYWORD_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={newKeyword.priority}
                      onValueChange={(value) => setNewKeyword({ ...newKeyword, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={addKeyword} type="button" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Keyword
              </Button>

              <div className="space-y-2">
                {formData.keywords.map((kw, i) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{kw.prompt}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{kw.category}</Badge>
                        <Badge variant="outline">{kw.priority}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyword(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {formData.keywords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No keywords added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Platforms */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Select AI Platforms</CardTitle>
              <CardDescription>Choose which AI platforms to track (recommended platforms are pre-selected)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {AI_PLATFORMS.map((platform) => (
                  <div
                    key={platform.id}
                    role="button"
                    tabIndex={0}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.platforms.includes(platform.id)
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePlatform(platform.id)}
                    onKeyDown={(e) => e.key === 'Enter' && togglePlatform(platform.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{platform.name}</h4>
                          {platform.recommended && (
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        formData.platforms.includes(platform.id)
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300'
                      }`}>
                        {formData.platforms.includes(platform.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "Creating..." : "Create Brand"}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
