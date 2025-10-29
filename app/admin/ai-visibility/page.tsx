"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, TrendingUp, MessageSquare, Target, Award, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { toast } from "sonner"

interface AIMetrics {
  overallScore: number
  sentimentScore: number
  shareOfVoice: number
  citationCount: number
  accuracyScore: number
}

interface PlatformMetric {
  platform: string
  displayName: string
  score: number
  citations: number
  sentiment: number
  color: string
}

interface QueryInsight {
  query: string
  triggerFrequency: number
  platforms: string[]
  status: "improving" | "stable" | "declining"
}

interface Recommendation {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  impact: number
}

interface Report {
  id: string
  clientName: string
}

export default function AIVisibilityDashboard() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string>("")
  const [metrics, setMetrics] = useState<AIMetrics | null>(null)
  const [platforms, setPlatforms] = useState<PlatformMetric[]>([])
  const [queries, setQueries] = useState<QueryInsight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  // Fetch available reports
  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch("/api/admin/reports")
        if (response.ok) {
          const data = await response.json()
          setReports(data.reports || [])
          if (data.reports && data.reports.length > 0) {
            setSelectedReportId(data.reports[0].id)
          }
        }
      } catch (error) {
        toast.error("Failed to load reports")
      }
    }
    fetchReports()
  }, [])

  // Fetch AI visibility data when report is selected
  useEffect(() => {
    if (!selectedReportId) {
      setLoading(false)
      return
    }

    async function fetchAIData() {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/reports/${selectedReportId}/ai-visibility`)
        if (response.ok) {
          const data = await response.json()

          // Set metrics
          setMetrics({
            overallScore: data.overallScore || 0,
            sentimentScore: data.sentimentScore || 0,
            shareOfVoice: data.shareOfVoice || 0,
            citationCount: data.citationCount || 0,
            accuracyScore: data.accuracyScore || 0,
          })

          // Set platforms
          const platformData: PlatformMetric[] = [
            {
              platform: "chatgpt",
              displayName: "ChatGPT",
              score: data.platforms?.chatgpt?.score || 0,
              citations: data.platforms?.chatgpt?.citations || 0,
              sentiment: data.platforms?.chatgpt?.sentiment || 0,
              color: "#10A37F",
            },
            {
              platform: "claude",
              displayName: "Claude",
              score: data.platforms?.claude?.score || 0,
              citations: data.platforms?.claude?.citations || 0,
              sentiment: data.platforms?.claude?.sentiment || 0,
              color: "#7C3AED",
            },
            {
              platform: "gemini",
              displayName: "Google Gemini",
              score: data.platforms?.gemini?.score || 0,
              citations: data.platforms?.gemini?.citations || 0,
              sentiment: data.platforms?.gemini?.sentiment || 0,
              color: "#4285F4",
            },
            {
              platform: "perplexity",
              displayName: "Perplexity AI",
              score: data.platforms?.perplexity?.score || 0,
              citations: data.platforms?.perplexity?.citations || 0,
              sentiment: data.platforms?.perplexity?.sentiment || 0,
              color: "#00D4FF",
            },
            {
              platform: "google_ai",
              displayName: "Google AI Overviews",
              score: data.platforms?.google_ai?.score || 0,
              citations: data.platforms?.google_ai?.citations || 0,
              sentiment: data.platforms?.google_ai?.sentiment || 0,
              color: "#EA4335",
            },
          ]
          setPlatforms(platformData)

          // Set queries
          setQueries(data.topQueries || [])

          // Set recommendations
          setRecommendations(data.recommendations || [])
        } else {
          toast.error("Failed to load AI visibility data")
        }
      } catch (error) {
        toast.error("Error loading AI visibility data")
      } finally {
        setLoading(false)
      }
    }

    fetchAIData()
  }, [selectedReportId])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading && !selectedReportId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading AI Visibility Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Visibility Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Track your visibility across all major AI platforms
          </p>
        </div>

        {/* Report Selector */}
        <div className="w-64">
          <Select value={selectedReportId} onValueChange={setSelectedReportId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a report" />
            </SelectTrigger>
            <SelectContent>
              {reports.map((report) => (
                <SelectItem key={report.id} value={report.id}>
                  {report.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Brain className="h-12 w-12 animate-pulse text-purple-600" />
        </div>
      ) : !metrics ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No AI visibility data available for this report.</p>
              <p className="text-sm text-gray-500 mt-2">Data will be collected during the next update cycle.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Hero Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Overall Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}
                  <span className="text-sm font-normal text-gray-500">/100</span>
                </div>
                <Progress value={metrics.overallScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Sentiment Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(metrics.sentimentScore)}`}>
                  {metrics.sentimentScore}
                  <span className="text-sm font-normal text-gray-500">/100</span>
                </div>
                <Progress value={metrics.sentimentScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Share of Voice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {metrics.shareOfVoice}
                  <span className="text-sm font-normal text-gray-500">%</span>
                </div>
                <Progress value={metrics.shareOfVoice} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Citations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {metrics.citationCount}
                </div>
                <p className="text-xs text-gray-500 mt-2">across all platforms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Accuracy Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(metrics.accuracyScore)}`}>
                  {metrics.accuracyScore}
                  <span className="text-sm font-normal text-gray-500">%</span>
                </div>
                <Progress value={metrics.accuracyScore} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Platform Breakdown Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Platform Breakdown
              </CardTitle>
              <CardDescription>
                Your visibility score across each AI platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {platforms.map((platform) => (
                  <div
                    key={platform.platform}
                    className="p-4 rounded-lg border-2 hover:shadow-md transition-shadow"
                    style={{ borderColor: platform.color }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{platform.displayName}</h3>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: platform.color }}
                      />
                    </div>
                    <div className="text-2xl font-bold mb-2" style={{ color: platform.color }}>
                      {platform.score}
                      <span className="text-sm font-normal text-gray-500">/100</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Citations:</span>
                        <span className="font-medium">{platform.citations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sentiment:</span>
                        <span className="font-medium">{platform.sentiment}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Platform Comparison Chart */}
              <div className="mt-8">
                <h4 className="text-sm font-medium mb-4">Platform Comparison</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={platforms}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayName" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Queries Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Top Performing Queries
              </CardTitle>
              <CardDescription>
                Queries that trigger AI responses mentioning your brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queries.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No query data available yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="text-center">Trigger Frequency</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queries.map((query, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{query.query}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{query.triggerFrequency}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {query.platforms.map((platform) => (
                              <Badge key={platform} variant="outline" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              query.status === "improving" ? "default" :
                              query.status === "stable" ? "secondary" :
                              "destructive"
                            }
                          >
                            {query.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recommendations Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                AI Optimization Recommendations
              </CardTitle>
              <CardDescription>
                Actionable insights to improve your AI visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No recommendations available</p>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Impact:</span>
                        <Progress value={rec.impact} className="h-2 flex-1" />
                        <span className="text-xs font-medium">{rec.impact}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
