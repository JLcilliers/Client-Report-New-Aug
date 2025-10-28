"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Tag,
  Users as UsersIcon,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface Brand {
  id: string
  brandName: string
  alternateName: string[]
  domain: string | null
  industry: string
  description: string | null
  isActive: boolean
  trackingStatus: string
}

interface Keyword {
  id: string
  prompt: string
  category: string
  isActive: boolean
}

interface Competitor {
  id: string
  competitorName: string
  domain: string | null
}

export default function BrandSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.brandId as string

  // Brand basic info
  const [brand, setBrand] = useState<Brand | null>(null)
  const [brandName, setBrandName] = useState("")
  const [domain, setDomain] = useState("")
  const [industry, setIndustry] = useState("")
  const [description, setDescription] = useState("")
  const [alternateNames, setAlternateNames] = useState<string[]>([])
  const [newAlternateName, setNewAlternateName] = useState("")

  // Keywords
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [newKeywordCategory, setNewKeywordCategory] = useState("general")

  // Competitors
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [newCompetitorName, setNewCompetitorName] = useState("")
  const [newCompetitorDomain, setNewCompetitorDomain] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBrandData()
  }, [brandId])

  async function fetchBrandData() {
    try {
      // Fetch brand details
      const brandResponse = await fetch(`/api/admin/ai-brands/${brandId}`)
      if (brandResponse.ok) {
        const brandData = await brandResponse.json()
        const fetchedBrand = brandData.brand
        setBrand(fetchedBrand)
        setBrandName(fetchedBrand.brandName)
        setDomain(fetchedBrand.domain || "")
        setIndustry(fetchedBrand.industry)
        setDescription(fetchedBrand.description || "")
        setAlternateNames(fetchedBrand.alternateName || [])
      } else if (brandResponse.status === 404) {
        toast.error("Brand not found")
        router.push("/admin/ai-brands")
        return
      }

      // Fetch keywords
      const keywordsResponse = await fetch(`/api/admin/ai-brands/${brandId}/keywords`)
      if (keywordsResponse.ok) {
        const keywordsData = await keywordsResponse.json()
        setKeywords(keywordsData.keywords || [])
      }

      // Fetch competitors
      const competitorsResponse = await fetch(`/api/admin/ai-brands/${brandId}/competitors`)
      if (competitorsResponse.ok) {
        const competitorsData = await competitorsResponse.json()
        setCompetitors(competitorsData.competitors || [])
      }
    } catch (error: any) {
      console.error("Error fetching brand data:", error)
      toast.error("Error loading brand data")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBrandInfo() {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/ai-brands/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          domain: domain || null,
          industry,
          description: description || null,
          alternateName: alternateNames
        })
      })

      if (response.ok) {
        toast.success("Brand info updated successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update brand info")
      }
    } catch (error: any) {
      console.error("Error updating brand:", error)
      toast.error("Error updating brand info")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddKeyword() {
    if (!newKeyword.trim()) {
      toast.error("Please enter a keyword prompt")
      return
    }

    try {
      const response = await fetch(`/api/admin/ai-brands/${brandId}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newKeyword,
          category: newKeywordCategory
        })
      })

      if (response.ok) {
        const data = await response.json()
        setKeywords([...keywords, data.keyword])
        setNewKeyword("")
        setNewKeywordCategory("general")
        toast.success("Keyword added successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add keyword")
      }
    } catch (error: any) {
      console.error("Error adding keyword:", error)
      toast.error("Error adding keyword")
    }
  }

  async function handleDeleteKeyword(keywordId: string) {
    try {
      const response = await fetch(`/api/admin/ai-brands/${brandId}/keywords/${keywordId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setKeywords(keywords.filter(k => k.id !== keywordId))
        toast.success("Keyword deleted successfully")
      } else {
        toast.error("Failed to delete keyword")
      }
    } catch (error: any) {
      console.error("Error deleting keyword:", error)
      toast.error("Error deleting keyword")
    }
  }

  async function handleToggleKeyword(keywordId: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/admin/ai-brands/${brandId}/keywords/${keywordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        setKeywords(keywords.map(k =>
          k.id === keywordId ? { ...k, isActive: !isActive } : k
        ))
        toast.success(`Keyword ${!isActive ? 'activated' : 'deactivated'}`)
      } else {
        toast.error("Failed to update keyword")
      }
    } catch (error: any) {
      console.error("Error toggling keyword:", error)
      toast.error("Error updating keyword")
    }
  }

  async function handleAddCompetitor() {
    if (!newCompetitorName.trim()) {
      toast.error("Please enter competitor name")
      return
    }

    try {
      const response = await fetch(`/api/admin/ai-brands/${brandId}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorName: newCompetitorName,
          domain: newCompetitorDomain || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCompetitors([...competitors, data.competitor])
        setNewCompetitorName("")
        setNewCompetitorDomain("")
        toast.success("Competitor added successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add competitor")
      }
    } catch (error: any) {
      console.error("Error adding competitor:", error)
      toast.error("Error adding competitor")
    }
  }

  async function handleDeleteCompetitor(competitorId: string) {
    try {
      const response = await fetch(`/api/admin/ai-brands/${brandId}/competitors/${competitorId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setCompetitors(competitors.filter(c => c.id !== competitorId))
        toast.success("Competitor deleted successfully")
      } else {
        toast.error("Failed to delete competitor")
      }
    } catch (error: any) {
      console.error("Error deleting competitor:", error)
      toast.error("Error deleting competitor")
    }
  }

  function handleAddAlternateName() {
    if (!newAlternateName.trim()) return
    if (alternateNames.includes(newAlternateName.trim())) {
      toast.error("This alternate name already exists")
      return
    }
    setAlternateNames([...alternateNames, newAlternateName.trim()])
    setNewAlternateName("")
  }

  function handleRemoveAlternateName(name: string) {
    setAlternateNames(alternateNames.filter(n => n !== name))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading brand settings...</p>
        </div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Brand not found</p>
          <Button
            onClick={() => router.push("/admin/ai-brands")}
            className="mt-4"
          >
            Back to Brands
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/ai-brands/${brandId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Brand Settings</h1>
          <p className="text-gray-600 mt-1">Manage brand information, keywords, and competitors</p>
        </div>

        {/* Brand Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
            <CardDescription>Update your brand's basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your brand"
                rows={3}
              />
            </div>

            {/* Alternate Names */}
            <div>
              <Label>Alternate Brand Names</Label>
              <p className="text-sm text-gray-500 mb-2">
                Add variations of your brand name for better tracking
              </p>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newAlternateName}
                  onChange={(e) => setNewAlternateName(e.target.value)}
                  placeholder="Add alternate name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddAlternateName()
                    }
                  }}
                />
                <Button onClick={handleAddAlternateName} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {alternateNames.map((name, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {name}
                    <button
                      onClick={() => handleRemoveAlternateName(name)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveBrandInfo} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Keywords Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Keywords
            </CardTitle>
            <CardDescription>
              Add search prompts to test your brand visibility across AI platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add Keyword Form */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="newKeyword">Keyword Prompt</Label>
                  <Input
                    id="newKeyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g., best project management tools"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddKeyword()
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newKeywordCategory} onValueChange={setNewKeywordCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="comparison">Comparison</SelectItem>
                      <SelectItem value="how-to">How-to</SelectItem>
                      <SelectItem value="reviews">Reviews</SelectItem>
                      <SelectItem value="alternatives">Alternatives</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddKeyword} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Keyword
              </Button>
            </div>

            {/* Keywords Table */}
            {keywords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((keyword) => (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">{keyword.prompt}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{keyword.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={keyword.isActive ? "default" : "secondary"}>
                          {keyword.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleKeyword(keyword.id, keyword.isActive)}
                          >
                            {keyword.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteKeyword(keyword.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No keywords added yet</p>
                <p className="text-sm">Add keywords to start tracking visibility</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Competitors
            </CardTitle>
            <CardDescription>
              Track how your brand compares against competitors in AI responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add Competitor Form */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newCompetitor">Competitor Name</Label>
                  <Input
                    id="newCompetitor"
                    value={newCompetitorName}
                    onChange={(e) => setNewCompetitorName(e.target.value)}
                    placeholder="e.g., Competitor Inc"
                  />
                </div>
                <div>
                  <Label htmlFor="competitorDomain">Domain (Optional)</Label>
                  <Input
                    id="competitorDomain"
                    value={newCompetitorDomain}
                    onChange={(e) => setNewCompetitorDomain(e.target.value)}
                    placeholder="competitor.com"
                  />
                </div>
              </div>
              <Button onClick={handleAddCompetitor} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </div>

            {/* Competitors Table */}
            {competitors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((competitor) => (
                    <TableRow key={competitor.id}>
                      <TableCell className="font-medium">{competitor.competitorName}</TableCell>
                      <TableCell>{competitor.domain || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCompetitor(competitor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No competitors added yet</p>
                <p className="text-sm">Add competitors to compare visibility</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
