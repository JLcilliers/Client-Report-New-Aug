'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  BarChart3,
  MessageSquare,
  Search,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface AIVisibilityProps {
  reportSlug: string;
}

interface AIMetrics {
  overallScore: number;
  sentimentScore: number;
  shareOfVoice: number;
  citationCount: number;
  accuracyScore: number;
  platformBreakdown: {
    platform: string;
    score: number;
    citations: number;
    sentiment: string;
  }[];
  topQueries: {
    query: string;
    frequency: number;
    platforms: string[];
    status: string;
  }[];
  competitors: {
    domain: string;
    shareOfVoice: number;
    gap: number;
  }[];
  recommendations: {
    title: string;
    description: string;
    priority: string;
    impact: string;
  }[];
}

const PLATFORM_COLORS: { [key: string]: string } = {
  'ChatGPT': '#10A37F',
  'Claude': '#7C3AED',
  'Google Gemini': '#4285F4',
  'Perplexity AI': '#00D4FF',
  'Google AI Overviews': '#EA4335',
};

export default function AIVisibility({ reportSlug }: AIVisibilityProps) {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIVisibilityData();
  }, [reportSlug]);

  const fetchAIVisibilityData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const endpoint = `/api/reports/${reportSlug}/ai-visibility`;
      console.log(`Fetching AI visibility data from ${endpoint}, forceRefresh: ${forceRefresh}`);

      const response = await fetch(endpoint, {
        method: forceRefresh ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: forceRefresh ? JSON.stringify({ forceRefresh: true }) : undefined,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch AI visibility data: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      setMetrics(data.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    console.log('Refreshing AI Visibility data...');
    await fetchAIVisibilityData(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'captured':
        return <Badge className="bg-green-100 text-green-700">Captured</Badge>;
      case 'missed':
        return <Badge className="bg-red-100 text-red-700">Missed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marine mx-auto mb-4"></div>
        <p className="text-gray-600">Loading AI visibility data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button onClick={() => fetchAIVisibilityData()} className="ml-4" size="sm">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics || metrics.citationCount === 0) {
    return (
      <Alert className="m-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          No AI visibility data available yet. Click the button below to generate your first AI visibility report. This will analyze how your brand appears across AI platforms like ChatGPT, Claude, and Google AI.
          <Button
            onClick={handleRefresh}
            className="ml-4"
            size="sm"
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Visibility Report
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare chart data
  const platformChartData = metrics.platformBreakdown.map(p => ({
    name: p.platform,
    score: p.score,
    citations: p.citations,
  }));

  const radarData = metrics.platformBreakdown.map(p => ({
    platform: p.platform.split(' ')[0],
    visibility: p.score,
  }));

  const competitorChartData = metrics.competitors.map(c => ({
    name: c.domain.split('.')[0],
    shareOfVoice: c.shareOfVoice,
    gap: Math.abs(c.gap),
  }));

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-marine" />
            AI Search Visibility Overview
          </h2>
          <p className="text-gray-600 mt-1">
            Track how your brand appears across AI-powered search platforms
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Updating...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                {metrics.overallScore.toFixed(0)}
              </span>
              <Progress value={metrics.overallScore} className="w-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Citations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{metrics.citationCount}</span>
              <MessageSquare className="w-5 h-5 text-marine" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Share of Voice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{metrics.shareOfVoice.toFixed(1)}%</span>
              <Users className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sentiment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{metrics.sentimentScore.toFixed(0)}</span>
              {getSentimentIcon(
                metrics.sentimentScore >= 70 ? 'positive' :
                metrics.sentimentScore <= 30 ? 'negative' : 'neutral'
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{metrics.accuracyScore.toFixed(0)}%</span>
              <CheckCircle className="w-5 h-5 text-marine" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Visibility Scores</CardTitle>
            <CardDescription>Your visibility across different AI platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart data={platformChartData} margin={{ top: 30, right: 40, left: 70, bottom: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  height={140}
                  interval={0}
                  tick={{ fontSize: 12, fill: '#666' }}
                  tickMargin={10}
                />
                <YAxis
                  label={{ value: 'Visibility Score', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 14, fill: '#666' } }}
                  tick={{ fontSize: 12, fill: '#666' }}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickMargin={5}
                />
                <Tooltip />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {platformChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.name] || '#8884d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Citation Distribution</CardTitle>
            <CardDescription>Number of citations per platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={450}>
              <PieChart margin={{ top: 20, right: 20, bottom: 100, left: 20 }}>
                <Pie
                  data={platformChartData}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={(entry) => {
                    const percent = ((entry.citations / metrics.citationCount) * 100).toFixed(0);
                    return `${percent}%`;
                  }}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="citations"
                >
                  {platformChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const percent = ((Number(value) / metrics.citationCount) * 100).toFixed(1);
                    return [`${value} citations (${percent}%)`, name];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={80}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '30px',
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                  formatter={(value: any) => {
                    const item = platformChartData.find(p => p.name === value);
                    if (item) {
                      return `${value} (${item.citations})`;
                    }
                    return String(value);
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Queries & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Top AI-Triggering Queries
            </CardTitle>
            <CardDescription>Queries where your brand appears in AI responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topQueries && metrics.topQueries.length > 0 ? (
                metrics.topQueries.slice(0, 5).map((query, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{query.query}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {query.platforms && query.platforms.length > 0 ? (
                          query.platforms.slice(0, 3).map(p => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {p.split(' ')[0]}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs">Multiple</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(query.status)}
                      <Badge variant="secondary">{query.frequency}x</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No query data available yet. Data will populate after the first analysis.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Competitor Analysis
            </CardTitle>
            <CardDescription>Share of voice comparison with competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={competitorChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="shareOfVoice" fill="#82ca9d" name="Share of Voice %" />
              </BarChart>
            </ResponsiveContainer>
            {metrics.competitors.map((comp, index) => (
              <div key={index} className="flex items-center justify-between mt-2 text-sm">
                <span>{comp.domain}</span>
                <span className={comp.gap > 0 ? 'text-green-600' : 'text-red-600'}>
                  {comp.gap > 0 ? '+' : ''}{comp.gap.toFixed(1)}% gap
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Optimization Recommendations
          </CardTitle>
          <CardDescription>
            Actionable insights to improve your AI search visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg">{rec.title}</h4>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority} priority
                    </Badge>
                    <Badge variant="outline">{rec.impact}</Badge>
                  </div>
                </div>
                <p className="text-gray-600">{rec.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Details */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance Details</CardTitle>
          <CardDescription>Detailed breakdown by AI platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Platform</th>
                  <th className="text-center p-2">Visibility Score</th>
                  <th className="text-center p-2">Citations</th>
                  <th className="text-center p-2">Sentiment</th>
                  <th className="text-center p-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {metrics.platformBreakdown.map((platform, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{platform.platform}</td>
                    <td className="text-center p-2">
                      <span className={getScoreColor(platform.score)}>
                        {platform.score.toFixed(0)}
                      </span>
                    </td>
                    <td className="text-center p-2">{platform.citations}</td>
                    <td className="text-center p-2">
                      <div className="flex justify-center">
                        {getSentimentIcon(platform.sentiment)}
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <Badge variant="outline">
                        {platform.score > 50 ? '↑' : platform.score < 30 ? '↓' : '→'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Query Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Query Performance Details
          </CardTitle>
          <CardDescription>
            Actual search queries triggering AI citations for your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>How queries trigger AI responses:</strong></p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Direct brand searches (e.g., "what is {metrics.platformBreakdown[0]?.platform ? 'your brand' : 'example.com'}")</li>
              <li>Comparison queries (e.g., "best alternatives to competitors")</li>
              <li>Problem-solving queries (e.g., "how to solve [specific problem]")</li>
              <li>Review and recommendation queries (e.g., "is [brand] worth it")</li>
            </ul>
          </div>

          {metrics.topQueries && metrics.topQueries.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Top Performing Queries:</h4>
              <div className="grid grid-cols-1 gap-2">
                {metrics.topQueries.map((query, idx) => (
                  <div key={idx} className="text-sm bg-gray-50 p-2 rounded flex justify-between">
                    <span className="font-medium">{query.query}</span>
                    <span className="text-gray-600">Triggered {query.frequency} times</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <strong>AI Visibility Tip:</strong> AI-driven traffic typically converts at 10-40% compared to 1-2% for traditional SEO.
          Focus on improving your visibility in AI responses to capture high-intent users.
          Engage on Reddit and forums to boost citations by up to 35%.
        </AlertDescription>
      </Alert>
    </div>
  );
}