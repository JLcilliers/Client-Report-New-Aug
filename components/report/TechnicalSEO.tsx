import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TechnicalSEO as TechnicalData } from "@/types"
import { 
  Zap,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"

interface TechnicalSEOProps {
  data: TechnicalData
}

export default function TechnicalSEO({ data }: TechnicalSEOProps) {
  const getCWVStatus = (metric: string, value: number) => {
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
      LCP: { good: 2.5, needsImprovement: 4 },
      FID: { good: 100, needsImprovement: 300 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      INP: { good: 200, needsImprovement: 500 },
      TTFB: { good: 800, needsImprovement: 1800 },
      FCP: { good: 1.8, needsImprovement: 3 }
    }

    const threshold = thresholds[metric]
    if (!threshold) return "unknown"

    if (value <= threshold.good) return "good"
    if (value <= threshold.needsImprovement) return "needs-improvement"
    return "poor"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "text-green-600 bg-green-50"
      case "needs-improvement": return "text-yellow-600 bg-yellow-50"
      case "poor": return "text-red-600 bg-red-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const webVitals = [
    { 
      key: "LCP", 
      label: "Largest Contentful Paint", 
      value: data.coreWebVitals.LCP,
      unit: "s",
      description: "Loading performance"
    },
    { 
      key: "FID", 
      label: "First Input Delay", 
      value: data.coreWebVitals.FID,
      unit: "ms",
      description: "Interactivity"
    },
    { 
      key: "CLS", 
      label: "Cumulative Layout Shift", 
      value: data.coreWebVitals.CLS,
      unit: "",
      description: "Visual stability"
    },
    { 
      key: "INP", 
      label: "Interaction to Next Paint", 
      value: data.coreWebVitals.INP,
      unit: "ms",
      description: "Responsiveness"
    },
    { 
      key: "TTFB", 
      label: "Time to First Byte", 
      value: data.coreWebVitals.TTFB,
      unit: "ms",
      description: "Server response"
    },
    { 
      key: "FCP", 
      label: "First Contentful Paint", 
      value: data.coreWebVitals.FCP,
      unit: "s",
      description: "First visual change"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Technical SEO</h2>
        <p className="text-gray-600 mt-1">Core Web Vitals and technical performance</p>
      </div>

      {/* PageSpeed Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Score</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(data.mobileScore)}`}>
              {data.mobileScore}/100
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {data.mobileScore >= 90 ? "Excellent" : data.mobileScore >= 50 ? "Needs Improvement" : "Poor"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desktop Score</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(data.desktopScore)}`}>
              {data.desktopScore}/100
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {data.desktopScore >= 90 ? "Excellent" : data.desktopScore >= 50 ? "Needs Improvement" : "Poor"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Core Web Vitals</CardTitle>
          </div>
          <CardDescription>Key metrics that impact user experience and SEO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {webVitals.map((vital) => {
              const status = getCWVStatus(vital.key, vital.value)
              const statusColor = getStatusColor(status)
              
              return (
                <div key={vital.key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{vital.key}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                      {status === "good" ? "Good" : status === "needs-improvement" ? "Needs Work" : "Poor"}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {vital.value}{vital.unit}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{vital.label}</p>
                  <p className="text-xs text-gray-400">{vital.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Issues and Opportunities */}
      {data.issues && data.issues.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle>Issues & Opportunities</CardTitle>
            </div>
            <CardDescription>Areas that need attention for better performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.issues.slice(0, 5).map((issue, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{issue.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crawl Errors */}
      {data.crawlErrors && data.crawlErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Crawl Errors</CardTitle>
            <CardDescription>Pages with crawling issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.crawlErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{error.url}</span>
                  </div>
                  <span className="text-xs text-gray-500">{error.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}