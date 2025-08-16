import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentPerformance as ContentData, GSCPage, GA4LandingPage } from "@/types"
import { 
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Eye
} from "lucide-react"

interface ContentPerformanceProps {
  data: ContentData
}

export default function ContentPerformance({ data }: ContentPerformanceProps) {
  // Mock data for demonstration since we don't have real data yet
  const mockTopPerforming: GSCPage[] = [
    { page: "/blog/seo-guide", clicks: 1234, impressions: 23456, ctr: 5.26, position: 4.2 },
    { page: "/products", clicks: 987, impressions: 18234, ctr: 5.41, position: 6.8 },
    { page: "/about", clicks: 765, impressions: 14567, ctr: 5.25, position: 8.1 },
  ]

  const mockHighEngagement: GA4LandingPage[] = [
    { 
      page: "/blog/complete-guide", 
      users: 3456, 
      sessions: 4123, 
      bounceRate: 23.4, 
      avgSessionDuration: 342,
      pageviews: 8234 
    },
    { 
      page: "/case-studies", 
      users: 2345, 
      sessions: 2890, 
      bounceRate: 31.2, 
      avgSessionDuration: 298,
      pageviews: 5678 
    },
  ]

  const mockDeclining: GSCPage[] = [
    { page: "/old-post", clicks: 123, impressions: 3456, ctr: 3.56, position: 24.5 },
    { page: "/outdated-guide", clicks: 89, impressions: 2345, ctr: 3.79, position: 28.3 },
  ]

  const topPerforming = data.topPerforming.length > 0 ? data.topPerforming : mockTopPerforming
  const highEngagement = data.highEngagement.length > 0 ? data.highEngagement : mockHighEngagement
  const declining = data.declining.length > 0 ? data.declining : mockDeclining

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Content Performance</h2>
        <p className="text-gray-600 mt-1">How your content is performing across different metrics</p>
      </div>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle>Top Performing Pages</CardTitle>
          </div>
          <CardDescription>Pages with the highest organic traffic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerforming.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-sm">{page.page}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Position: {page.position.toFixed(1)}</span>
                    <span>CTR: {page.ctr.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{page.clicks.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">clicks</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* High Engagement Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle>High Engagement Pages</CardTitle>
          </div>
          <CardDescription>Content with the best user engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Page</th>
                  <th className="text-right py-2 px-4">Users</th>
                  <th className="text-right py-2 px-4">Sessions</th>
                  <th className="text-right py-2 px-4">Bounce Rate</th>
                  <th className="text-right py-2 px-4">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {highEngagement.map((page, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{page.page}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 px-4">{page.users.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">{page.sessions.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">
                      <span className={page.bounceRate < 40 ? "text-green-600" : ""}>
                        {page.bounceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-4">
                      <div className="flex items-center justify-end space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{formatDuration(page.avgSessionDuration)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Declining Content */}
      {declining.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <CardTitle>Declining Performance</CardTitle>
            </div>
            <CardDescription>Pages that need attention or optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {declining.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-red-400" />
                      <p className="font-medium text-sm">{page.page}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                      <span>Position: {page.position.toFixed(1)}</span>
                      <span>CTR: {page.ctr.toFixed(2)}%</span>
                      <span className="text-red-600">↓ Declining traffic</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{page.clicks}</p>
                    <p className="text-xs text-gray-500">clicks</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}