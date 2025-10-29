"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Sparkles
} from "lucide-react"

interface AICitationCheckerProps {
  clientReportId: string
  clientName: string
}

interface CitationResult {
  query: string
  responseText: string
  citations: string[]
  brandMentioned: boolean
  citationPosition: number | null
  citedUrl: string | null
  sentiment: 'positive' | 'neutral' | 'negative'
  context: string | null
}

interface CitationSummary {
  keywordsChecked: number
  citationsFound: number
  mentionsFound: number
  shareOfVoice: number
  sentimentScore: number
  overallScore: number
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
}

export default function AICitationChecker({ clientReportId, clientName }: AICitationCheckerProps) {
  const [checking, setChecking] = useState(false)
  const [summary, setSummary] = useState<CitationSummary | null>(null)
  const [details, setDetails] = useState<CitationResult[]>([])
  const { toast } = useToast()

  const checkCitations = async () => {
    setChecking(true)
    setSummary(null)
    setDetails([])

    try {
      const response = await fetch('/api/ai-visibility/check-citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientReportId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to check citations')
      }

      setSummary(data.summary)
      setDetails(data.details)

      toast({
        title: "Citations Checked!",
        description: `Found ${data.summary.citationsFound} citations and ${data.summary.mentionsFound} mentions across ${data.summary.keywordsChecked} keywords.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check citations",
        variant: "destructive",
      })
    } finally {
      setChecking(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50'
      case 'negative': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4" />
      case 'negative': return <AlertCircle className="h-4 w-4" />
      default: return <CheckCircle2 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Citation Tracking
          </CardTitle>
          <CardDescription>
            Check if {clientName} appears in Perplexity AI search results for your tracked keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={checkCitations}
            disabled={checking}
            className="w-full sm:w-auto"
          >
            {checking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Citations...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Check AI Citations
              </>
            )}
          </Button>
          {checking && (
            <p className="text-sm text-gray-500 mt-2">
              This may take a minute... Checking citations for all active keywords.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Citation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{summary.keywordsChecked}</div>
                <div className="text-sm text-gray-600 mt-1">Keywords Checked</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{summary.citationsFound}</div>
                <div className="text-sm text-gray-600 mt-1">Citations Found</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{summary.mentionsFound}</div>
                <div className="text-sm text-gray-600 mt-1">Brand Mentions</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{summary.shareOfVoice}%</div>
                <div className="text-sm text-gray-600 mt-1">Share of Voice</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Positive</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {summary.sentiment.positive}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Neutral</span>
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  {summary.sentiment.neutral}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium">Negative</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {summary.sentiment.negative}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Cards */}
      {details.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Citation Details</h3>
          {details.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      {result.query}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.brandMentioned && (
                      <Badge variant="secondary" className={getSentimentColor(result.sentiment)}>
                        {getSentimentIcon(result.sentiment)}
                        <span className="ml-1">{result.sentiment}</span>
                      </Badge>
                    )}
                    {result.citedUrl && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Cited #{result.citationPosition}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.context && (
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                    <p className="font-medium text-gray-900 mb-1">Context:</p>
                    <p className="italic">{result.context}</p>
                  </div>
                )}

                {result.citedUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Citation URL:</span>
                    <a
                      href={result.citedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {result.citedUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {!result.brandMentioned && !result.citedUrl && (
                  <div className="text-sm text-gray-500 italic">
                    No brand mention or citation found for this keyword.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
