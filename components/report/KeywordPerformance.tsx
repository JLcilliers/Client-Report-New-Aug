import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { KeywordPerformance as KeywordData, GSCQuery } from "@/types"
import { 
  Search,
  TrendingUp,
  TrendingDown,
  Download,
  ArrowUp,
  ArrowDown
} from "lucide-react"

interface KeywordPerformanceProps {
  data: KeywordData
}

export default function KeywordPerformance({ data }: KeywordPerformanceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "improved" | "declined" | "new">("all")

  const getFilteredKeywords = () => {
    let keywords = data.keywords
    
    if (filter === "improved") keywords = data.improved
    if (filter === "declined") keywords = data.declined
    if (filter === "new") keywords = data.new
    
    if (searchTerm) {
      keywords = keywords.filter(k => 
        k.query.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return keywords
  }

  const filteredKeywords = getFilteredKeywords()

  const exportToCSV = () => {
    const csv = [
      ["Keyword", "Clicks", "Impressions", "CTR", "Position"],
      ...filteredKeywords.map(k => [
        k.query,
        k.clicks.toString(),
        k.impressions.toString(),
        k.ctr.toFixed(2) + "%",
        k.position.toFixed(1)
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "keywords.csv"
    a.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Keyword Performance</h2>
        <p className="text-gray-600 mt-1">Search query performance and rankings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Keywords</CardTitle>
              <CardDescription>Track your keyword rankings and performance</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All Keywords
              </Button>
              <Button
                variant={filter === "improved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("improved")}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Improved
              </Button>
              <Button
                variant={filter === "declined" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("declined")}
              >
                <TrendingDown className="h-4 w-4 mr-1" />
                Declined
              </Button>
              <Button
                variant={filter === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("new")}
              >
                New
              </Button>
            </div>
          </div>

          {/* Keywords Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Keyword</th>
                  <th className="text-right py-2 px-4">Impressions</th>
                  <th className="text-right py-2 px-4">Clicks</th>
                  <th className="text-right py-2 px-4">CTR</th>
                  <th className="text-right py-2 px-4">Position</th>
                  <th className="text-right py-2 px-4">Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No keywords found
                    </td>
                  </tr>
                ) : (
                  filteredKeywords.slice(0, 20).map((keyword, index) => {
                    const positionChange = keyword.positionChange || 0
                    const isImproved = positionChange < 0 // Lower position is better
                    
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 font-medium">{keyword.query}</td>
                        <td className="text-right py-2 px-4">{keyword.impressions.toLocaleString()}</td>
                        <td className="text-right py-2 px-4">{keyword.clicks.toLocaleString()}</td>
                        <td className="text-right py-2 px-4">{keyword.ctr.toFixed(2)}%</td>
                        <td className="text-right py-2 px-4">{keyword.position.toFixed(1)}</td>
                        <td className="text-right py-2 px-4">
                          {positionChange !== 0 && (
                            <span className={`flex items-center justify-end ${
                              isImproved ? "text-green-600" : "text-red-600"
                            }`}>
                              {isImproved ? (
                                <ArrowUp className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowDown className="h-3 w-3 mr-1" />
                              )}
                              {Math.abs(positionChange).toFixed(1)}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredKeywords.length > 20 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing 20 of {filteredKeywords.length} keywords
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}