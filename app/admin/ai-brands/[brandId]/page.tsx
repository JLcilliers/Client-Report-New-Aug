"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Settings,
  BarChart3,
  MessageSquare,
  Users,
  Search,
  Eye,
  Link as LinkIcon,
  Heart,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface Brand {
  id: string
  brandName: string
  domain?: string
  industry: string
  trackingStatus: string
  isActive: boolean
  description?: string
  keywordCount: number
  competitorCount: number
  createdAt: string
}

interface VisibilityScore {
  overallScore: number
  visibilityRate: number
  avgPosition: number
  citationRate: number
  shareOfVoice: number
  sentimentScore: number
  totalTests: number
  totalMentions: number
  citedMentions: number
  scoreChange?: number
  visibilityChange?: number
  positionChange?: number
}

interface PlatformScore {
  platform: string
  displayName: string
  score: number
  mentions: number
  citations: number
  sentiment: number
  avgPosition: number
  color: string
}

export default function BrandDashboard() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.brandId as string

  const [brand, setBrand] = useState<Brand | null>(null)
  const [score, setScore] = useState<VisibilityScore | null>(null)
  const [platforms, setPlatforms] = useState<PlatformScore[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchBrandData()
  }, [brandId])

  async function fetchBrandData() {
    try {
      const response = await fetch(`/api/admin/ai-brands/${brandId}`)
      if (response.ok) {
        const data = await response.json()
        setBrand(data.brand)
        setScore(data.score)
        setPlatforms(data.platforms || [])
      } else if (response.status === 404) {
        toast.error("Brand not found")
        router.push("/admin/ai-brands")
      } else {
        toast.error("Failed to load brand data")
      }
    } catch (error) {
      console.error("Error fetching brand data:", error)
      toast.error("Error loading brand data")
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/admin/ai-brands/${brandId}/test`, {
        method: "POST"
      })
      if (response.ok) {
        toast.success("Visibility test started")
        setTimeout(() => {
          fetchBrandData()
          setRefreshing(false)
        }, 3000)
      } else {
        toast.error("Failed to start test")
        setRefreshing(false)
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Error starting test")
      setRefreshing(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Brand Not Found</h2>
          <p className="text-gray-600 mb-6">The requested brand could not be found.</p>
          <Button onClick={() => router.push("/admin/ai-brands")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Brands
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/ai-brands")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Brands
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{brand.brandName}</h1>
                <Badge className={brand.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {brand.trackingStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
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
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {brand.keywordCount} keywords
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {brand.competitorCount} competitors
                </span>
              </div>
              {brand.description && (
                <p className="text-gray-600 mt-2">{brand.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Testing...' : 'Run Test'}
              </Button>
              <Button
                onClick={() => router.push(`/admin/ai-brands/${brandId}/settings`)}
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        {score ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Overall Score</CardDescription>
                  <div className="flex items-center gap-2">
                    <CardTitle className={`text-3xl ${getScoreColor(score.overallScore)}`}>
                      {score.overallScore.toFixed(0)}
                    </CardTitle>
                    {getTrendIcon(score.scoreChange)}
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={score.overallScore} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Visibility Rate</CardDescription>
                  <CardTitle className="text-3xl">{score.visibilityRate.toFixed(0)}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{score.totalMentions}/{score.totalTests} tests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Avg Position</CardDescription>
                  <CardTitle className="text-3xl">#{score.avgPosition.toFixed(1)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">in AI responses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Citations</CardDescription>
                  <CardTitle className="text-3xl">{score.citationRate.toFixed(0)}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{score.citedMentions} with links</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Share of Voice</CardDescription>
                  <CardTitle className="text-3xl">{score.shareOfVoice.toFixed(0)}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">vs competitors</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Sentiment</CardDescription>
                  <CardTitle className={`text-3xl ${getScoreColor(score.sentimentScore)}`}>
                    {score.sentimentScore.toFixed(0)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={score.sentimentScore} className="h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="platforms" className="space-y-6">
              <TabsList>
                <TabsTrigger value="platforms">Platforms</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="competitors">Competitors</TabsTrigger>
                <TabsTrigger value="mentions">Recent Mentions</TabsTrigger>
              </TabsList>

              {/* Platforms Tab */}
              <TabsContent value="platforms" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {platforms.length > 0 ? platforms.map((platform) => (
                    <Card key={platform.platform}>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg">{platform.displayName}</CardTitle>
                          <div className={`text-2xl font-bold ${getScoreColor(platform.score)}`}>
                            {platform.score.toFixed(0)}
                          </div>
                        </div>
                        <Progress value={platform.score} className="h-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              Mentions
                            </span>
                            <span className="font-semibold">{platform.mentions}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-1">
                              <LinkIcon className="h-4 w-4" />
                              Citations
                            </span>
                            <span className="font-semibold">{platform.citations}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              Sentiment
                            </span>
                            <span className={`font-semibold ${getScoreColor(platform.sentiment)}`}>
                              {platform.sentiment.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-1">
                              <BarChart3 className="h-4 w-4" />
                              Avg Position
                            </span>
                            <span className="font-semibold">#{platform.avgPosition.toFixed(1)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <Card className="col-span-3">
                      <CardContent className="py-12">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Platform Data Yet</h3>
                          <p className="text-gray-600 mb-6">Run your first visibility test to see platform-specific metrics</p>
                          <Button onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Run First Test
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Keywords Tab */}
              <TabsContent value="keywords">
                <Card>
                  <CardHeader>
                    <CardTitle>Keyword Performance</CardTitle>
                    <CardDescription>How your brand performs for different queries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Keyword performance data coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Competitors Tab */}
              <TabsContent value="competitors">
                <Card>
                  <CardHeader>
                    <CardTitle>Competitor Analysis</CardTitle>
                    <CardDescription>Compare your visibility against competitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Competitor analysis coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mentions Tab */}
              <TabsContent value="mentions">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Mentions</CardTitle>
                    <CardDescription>Latest AI responses mentioning your brand</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Recent mentions will appear here after testing</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Visibility Data Yet</h3>
                <p className="text-gray-600 mb-6">
                  Your brand has been created! Run your first visibility test to start tracking AI mentions.
                </p>
                <Button onClick={handleRefresh} disabled={refreshing} className="bg-purple-600 hover:bg-purple-700">
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Starting Test...' : 'Run First Test'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
