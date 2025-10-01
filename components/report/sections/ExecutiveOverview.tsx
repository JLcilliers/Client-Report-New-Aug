import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  Target,
  Trophy,
  AlertTriangle,
  ArrowRight
} from "lucide-react"

interface ExecutiveOverviewProps {
  data: any
  compareMode: 'mom' | 'yoy'
  dateRange: '30d' | '90d' | '12m'
}

export default function ExecutiveOverview({ data, compareMode, dateRange }: ExecutiveOverviewProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Executive Overview</CardTitle>
          <CardDescription>Loading overview data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const current = data.current || {}
  const previous = compareMode === 'mom' ? data.previous : data.yearAgo
  
  // Calculate key metrics changes
  const calculateChange = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  const trafficChange = calculateChange(
    current.analytics?.summary?.sessions || 0,
    previous?.analytics?.summary?.sessions || 0
  )

  const clicksChange = calculateChange(
    current.search_console?.summary?.clicks || 0,
    previous?.search_console?.summary?.clicks || 0
  )

  const impressionsChange = calculateChange(
    current.search_console?.summary?.impressions || 0,
    previous?.search_console?.summary?.impressions || 0
  )

  const positionChange = current.search_console?.summary?.position - (previous?.search_console?.summary?.position || 0)

  // Determine wins and challenges
  const wins = []
  const challenges = []
  
  if (trafficChange > 10) wins.push({ metric: "Organic Traffic", change: trafficChange })
  if (trafficChange < -10) challenges.push({ metric: "Organic Traffic", change: trafficChange })
  
  if (clicksChange > 10) wins.push({ metric: "Search Clicks", change: clicksChange })
  if (clicksChange < -10) challenges.push({ metric: "Search Clicks", change: clicksChange })
  
  if (positionChange < -1) wins.push({ metric: "Average Position", change: Math.abs(positionChange) })
  if (positionChange > 1) challenges.push({ metric: "Average Position", change: positionChange })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Executive Overview</h2>
        <p className="text-gray-600">
          Performance summary for {dateRange === '30d' ? 'last 30 days' : dateRange === '90d' ? 'last 90 days' : 'last 12 months'}
          {' '}compared to {compareMode === 'mom' ? 'previous period' : 'year ago'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Results Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-marine" />
              Results Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Organic Sessions</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {(current.analytics?.summary?.sessions || 0).toLocaleString()}
                  </span>
                  {trafficChange !== 0 && (
                    <Badge variant={trafficChange > 0 ? "default" : "destructive"}>
                      {trafficChange > 0 ? '+' : ''}{trafficChange.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Search Clicks</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {(current.search_console?.summary?.clicks || 0).toLocaleString()}
                  </span>
                  {clicksChange !== 0 && (
                    <Badge variant={clicksChange > 0 ? "default" : "destructive"}>
                      {clicksChange > 0 ? '+' : ''}{clicksChange.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Position</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {(current.search_console?.summary?.position || 0).toFixed(1)}
                  </span>
                  {positionChange !== 0 && (
                    <Badge variant={positionChange < 0 ? "default" : "destructive"}>
                      {positionChange > 0 ? '+' : ''}{positionChange.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Wins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              Top Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wins.length > 0 ? (
              <ul className="space-y-2">
                {wins.slice(0, 3).map((win, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{win.metric}</p>
                      <p className="text-xs text-green-600">
                        +{win.change.toFixed(1)}% improvement
                      </p>
                    </div>
                  </li>
                ))}
                {current.search_console?.topQueries?.filter((q: any) => 
                  q.position < 4 && q.clicks > 100
                ).slice(0, 2).map((query: any, index: number) => (
                  <li key={`query-${index}`} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Top 3 ranking</p>
                      <p className="text-xs text-gray-600">"{query.keys?.[0]}"</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No significant wins this period</p>
            )}
          </CardContent>
        </Card>

        {/* Key Challenges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Key Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {challenges.length > 0 ? (
              <ul className="space-y-2">
                {challenges.slice(0, 3).map((challenge, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{challenge.metric}</p>
                      <p className="text-xs text-amber-600">
                        {challenge.change.toFixed(1)}% decline
                      </p>
                    </div>
                  </li>
                ))}
                {current.analytics?.summary?.bounceRate > 60 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">High Bounce Rate</p>
                      <p className="text-xs text-gray-600">
                        {current.analytics.summary.bounceRate.toFixed(1)}% bouncing
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No major challenges identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-600" />
            Strategic Focus Areas
          </CardTitle>
          <CardDescription>
            Recommended priorities based on current performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Immediate (This Week)</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {positionChange > 1 && (
                  <li className="flex items-start gap-2">
                    <span className="text-marine">•</span>
                    Review and optimize declining rankings
                  </li>
                )}
                {current.analytics?.summary?.bounceRate > 60 && (
                  <li className="flex items-start gap-2">
                    <span className="text-marine">•</span>
                    Improve page load speed and UX
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-marine">•</span>
                  Update meta descriptions for top pages
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Short-term (This Month)</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-marine">•</span>
                  Create content for high-opportunity keywords
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-marine">•</span>
                  Build internal links to underperforming pages
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-marine">•</span>
                  Optimize for featured snippets
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Long-term (This Quarter)</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-marine">•</span>
                  Develop comprehensive content hub
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-marine">•</span>
                  Implement structured data markup
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-marine">•</span>
                  Build high-quality backlinks
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}