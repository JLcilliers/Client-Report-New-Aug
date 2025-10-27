"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, TrendingUp, TrendingDown, Minus, Brain, Search, BarChart3, Eye } from "lucide-react"
import { toast } from "sonner"

interface AIBrand {
  id: string
  brandName: string
  domain?: string
  industry: string
  trackingStatus: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  latestScore?: {
    overallScore: number
    visibilityRate: number
    shareOfVoice: number
    sentimentScore: number
    scoreChange?: number
    totalMentions: number
    citedMentions: number
  }
}

export default function AIBrandsListPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<AIBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBrands: 0,
    activeBrands: 0,
    avgVisibility: 0,
    totalMentions: 0
  })

  useEffect(() => {
    fetchBrands()
  }, [])

  async function fetchBrands() {
    try {
      const response = await fetch("/api/admin/ai-brands")
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands || [])

        // Calculate stats
        const active = data.brands.filter((b: AIBrand) => b.isActive).length
        const avgVis = data.brands.length > 0
          ? data.brands.reduce((sum: number, b: AIBrand) => sum + (b.latestScore?.visibilityRate || 0), 0) / data.brands.length
          : 0
        const totalMent = data.brands.reduce((sum: number, b: AIBrand) => sum + (b.latestScore?.totalMentions || 0), 0)

        setStats({
          totalBrands: data.brands.length,
          activeBrands: active,
          avgVisibility: avgVis,
          totalMentions: totalMent
        })
      } else {
        toast.error("Failed to load AI brands")
      }
    } catch (error) {
      console.error("Error fetching AI brands:", error)
      toast.error("Error loading AI brands")
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "paused": return "bg-yellow-100 text-yellow-800"
      case "archived": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  function getTrendIcon(change?: number) {
    if (!change || change === 0) return <Minus className="h-4 w-4 text-gray-400" />
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  function getScoreColor(score: number) {
    if (score >= 70) return "text-green-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">AI Brand Visibility</h1>
            </div>
            <p className="text-gray-600">Track your brand presence across AI platforms</p>
          </div>
          <Button
            onClick={() => router.push("/admin/ai-brands/new")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Brand
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Brands</CardDescription>
              <CardTitle className="text-3xl">{stats.totalBrands}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{stats.activeBrands} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Visibility</CardDescription>
              <CardTitle className="text-3xl">{stats.avgVisibility.toFixed(0)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stats.avgVisibility} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Mentions</CardDescription>
              <CardTitle className="text-3xl">{stats.totalMentions}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Across all platforms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Platforms</CardDescription>
              <CardTitle className="text-3xl">5</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">ChatGPT, Claude, Gemini +2</p>
            </CardContent>
          </Card>
        </div>

        {/* Brands List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : brands.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI brands yet</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first brand to track AI visibility</p>
                <Button
                  onClick={() => router.push("/admin/ai-brands/new")}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Brand
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {brands.map((brand) => (
              <Card
                key={brand.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/admin/ai-brands/${brand.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{brand.brandName}</h3>
                        <Badge className={getStatusColor(brand.trackingStatus)}>
                          {brand.trackingStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Search className="h-4 w-4" />
                          {brand.industry}
                        </span>
                        {brand.domain && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {brand.domain}
                          </span>
                        )}
                      </div>

                      {brand.latestScore ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Overall Score</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl font-bold ${getScoreColor(brand.latestScore.overallScore)}`}>
                                {brand.latestScore.overallScore.toFixed(0)}
                              </span>
                              {getTrendIcon(brand.latestScore.scoreChange)}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1">Visibility Rate</p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {brand.latestScore.visibilityRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1">Share of Voice</p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {brand.latestScore.shareOfVoice.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1">Sentiment</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-semibold ${getScoreColor(brand.latestScore.sentimentScore)}`}>
                                {brand.latestScore.sentimentScore.toFixed(0)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1">Citations</p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {brand.latestScore.citedMentions}/{brand.latestScore.totalMentions}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            <BarChart3 className="h-4 w-4 inline mr-2" />
                            No data yet - visibility testing will begin shortly
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
