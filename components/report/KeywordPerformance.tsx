'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KeywordPerformance as KeywordData, GSCQuery } from "@/types"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Download,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Plus,
  ExternalLink,
  BarChart3
} from "lucide-react"

interface KeywordPerformanceProps {
  data: KeywordData
  reportSlug?: string
  comparisonPeriod?: 'week' | 'month' | 'year' | 'last30' | 'last90' | 'monthToDate' | 'yearOverYear'
}

export default function KeywordPerformance({ data, reportSlug, comparisonPeriod = 'week' }: KeywordPerformanceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "improved" | "declined" | "new">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [keywordHistory, setKeywordHistory] = useState<any[]>([])

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

  // Calculate change based on the selected comparison period
  const calculatePeriodChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Generate mock historical data for selected keywords
  const generateKeywordHistory = () => {
    const periods = comparisonPeriod === 'week' ? 7 :
                    comparisonPeriod === 'month' ? 30 :
                    comparisonPeriod === 'last30' ? 30 :
                    comparisonPeriod === 'last90' ? 90 : 7;

    const history = [];
    const today = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dataPoint: any = {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      selectedKeywords.slice(0, 5).forEach(keyword => {
        const basePosition = filteredKeywords.find(k => k.query === keyword)?.position || 10;
        dataPoint[keyword] = Math.max(1, basePosition + (Math.random() - 0.5) * 5);
      });

      history.push(dataPoint);
    }

    return history;
  };

  useEffect(() => {
    if (selectedKeywords.length > 0) {
      setKeywordHistory(generateKeywordHistory());
    }
  }, [selectedKeywords, comparisonPeriod]);

  const toggleKeywordSelection = (keyword: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      }
      if (prev.length < 5) {
        return [...prev, keyword];
      }
      return prev;
    });
  };

  const handleRefresh = async () => {
    if (!reportSlug) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/public/report/${reportSlug}/keywords/refresh`, {
        method: 'POST'
      });

      if (response.ok) {
        window.location.reload();
      } else {
        
      }
    } catch (error) {
      
    } finally {
      setIsRefreshing(false);
    }
  };

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
              <CardTitle>Tracked Keywords Performance</CardTitle>
              <CardDescription>Monitor your targeted keywords rankings - {comparisonPeriod} comparison</CardDescription>
            </div>
            <div className="flex gap-2">
              {reportSlug && (
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Updating...' : 'Refresh'}
                </Button>
              )}
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
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
                aria-label="Search keywords"
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
                  <th className="text-left py-2 px-2 w-8">
                    <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    aria-label="Select all keywords for comparison"
                    onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedKeywords(filteredKeywords.slice(0, 5).map(k => k.query));
                    } else {
                      setSelectedKeywords([]);
                      }
                    }}
                      checked={selectedKeywords.length > 0 && selectedKeywords.length === Math.min(filteredKeywords.length, 5)}
              />
                  </th>
                  <th className="text-left py-2 px-4">Keyword</th>
                  <th className="text-right py-2 px-4">Impressions</th>
                  <th className="text-right py-2 px-4">Clicks</th>
                  <th className="text-right py-2 px-4">CTR</th>
                  <th className="text-right py-2 px-4">Position</th>
                  <th className="text-right py-2 px-4">Change ({comparisonPeriod})</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        <p>No keywords are being tracked yet</p>
                        <p className="text-sm mt-2">Keywords need to be configured by the administrator</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredKeywords.slice(0, 20).map((keyword, index) => {
                    const positionChange = keyword.positionChange || 0
                    const isImproved = positionChange > 0 // Positive change means improvement
                    const isNew = !keyword.previousPosition
                    const isSelected = selectedKeywords.includes(keyword.query)

                    return (
                      <tr key={index} className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-frost' : ''}`}>
                        <td className="py-2 px-2">
                          <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          aria-label={`Select ${keyword.query} for comparison`}
                          checked={isSelected}
                          onChange={() => toggleKeywordSelection(keyword.query)}
                            disabled={!isSelected && selectedKeywords.length >= 5}
              />
                        </td>
                        <td className="py-2 px-4">
                          <div>
                            <div className="font-medium">{keyword.query}</div>
                            {isNew && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                New
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-2 px-4">{keyword.impressions.toLocaleString()}</td>
                        <td className="text-right py-2 px-4">{keyword.clicks.toLocaleString()}</td>
                        <td className="text-right py-2 px-4">{(keyword.ctr * 100).toFixed(2)}%</td>
                        <td className="text-right py-2 px-4">
                          {keyword.position < 999 ? keyword.position.toFixed(1) : '—'}
                        </td>
                        <td className="text-right py-2 px-4">
                          {positionChange !== 0 && !isNew && (
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
                          {isNew && <span className="text-gray-400">—</span>}
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

      {/* Keyword Progress Graph */}
      {selectedKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Keyword Position Trends
                </CardTitle>
                <CardDescription>
                  Tracking {selectedKeywords.length} keyword{selectedKeywords.length > 1 ? 's' : ''} over {comparisonPeriod}
                </CardDescription>
              </div>
              <Button
                onClick={() => setSelectedKeywords([])}
                variant="outline"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={keywordHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  reversed={true}
                  domain={[1, 'dataMax + 2']}
                  label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                {selectedKeywords.map((keyword, index) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                  return (
                    <Line
                      key={keyword}
                      type="monotone"
                      dataKey={keyword}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name={keyword.length > 20 ? keyword.substring(0, 20) + '...' : keyword}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">
              Select up to 5 keywords from the table above to track their position trends
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}