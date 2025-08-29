import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OverviewMetrics } from "@/types"
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  TrendingUp,
  MousePointerClick,
  Eye,
  Target
} from "lucide-react"
import { formatNumber, formatPercentage } from "@/lib/utils/date-helpers"

interface ExecutiveOverviewProps {
  data: OverviewMetrics
}

export default function ExecutiveOverview({ data }: ExecutiveOverviewProps) {
  const metrics = [
    {
      title: "Total Clicks",
      value: formatNumber(data.totalClicks),
      change: data.clicksChange,
      icon: MousePointerClick,
      color: "text-blue-600"
    },
    {
      title: "Total Impressions",
      value: formatNumber(data.totalImpressions),
      change: data.impressionsChange,
      icon: Eye,
      color: "text-purple-600"
    },
    {
      title: "Average CTR",
      value: formatPercentage(data.avgCTR),
      change: data.ctrChange,
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Average Position",
      value: data.avgPosition.toFixed(1),
      change: data.positionChange * -1, // Lower is better for position
      icon: Target,
      color: "text-orange-600"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Executive Overview</h2>
        <p className="text-gray-600 mt-1">Key performance metrics at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const isPositive = metric.change > 0
          const ChangeIcon = isPositive ? ArrowUpIcon : ArrowDownIcon
          
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center mt-2">
                  <ChangeIcon 
                    className={`h-4 w-4 mr-1 ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`} 
                  />
                  <span className={`text-sm ${
                    isPositive ? "text-green-600" : "text-red-600"
                  }`}>
                    {Math.abs(metric.change).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs previous</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {data.insights && data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>Important observations from your data</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}