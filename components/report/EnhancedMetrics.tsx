'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Users,
  Zap,
  Globe,
  Link,
  FileText,
  BarChart3,
  Activity,
  Eye,
  MousePointer,
  Search,
  Clock
} from 'lucide-react';

interface EnhancedMetricsProps {
  reportId: string;
  domain: string;
  metrics?: any;
}

export default function EnhancedMetrics({ reportId, domain, metrics }: EnhancedMetricsProps) {
  // Core Web Vitals data (could be fetched from PageSpeed API)
  const coreWebVitals = {
    lcp: { value: 2.5, score: 'good', benchmark: 2.5 },
    fid: { value: 95, score: 'good', benchmark: 100 },
    cls: { value: 0.08, score: 'good', benchmark: 0.1 },
    inp: { value: 200, score: 'needs-improvement', benchmark: 200 },
    ttfb: { value: 0.8, score: 'good', benchmark: 0.8 },
    fcp: { value: 1.8, score: 'good', benchmark: 1.8 }
  };

  // Calculate key metrics from actual data
  const searchMetrics = {
    totalClicks: metrics?.searchConsole?.current?.clicks || 0,
    totalImpressions: metrics?.searchConsole?.current?.impressions || 0,
    avgCTR: (metrics?.searchConsole?.current?.ctr || 0) * 100,
    avgPosition: metrics?.searchConsole?.current?.position || 0,
    topQueries: metrics?.searchConsole?.topQueries?.length || 0,
    topPages: metrics?.searchConsole?.topPages?.length || 0
  };

  const analyticsMetrics = {
    totalSessions: metrics?.analytics?.current?.sessions || 0,
    totalUsers: metrics?.analytics?.current?.users || 0,
    newUsers: metrics?.analytics?.current?.newUsers || 0,
    pageViews: metrics?.analytics?.current?.pageViews || 0,
    bounceRate: (metrics?.analytics?.current?.bounceRate || 0) * 100,
    avgSessionDuration: metrics?.analytics?.current?.avgSessionDuration || 0,
    engagementRate: (metrics?.analytics?.current?.engagementRate || 0) * 100
  };

  // Calculate performance trends
  const trends = {
    clicks: metrics?.comparisons?.weekOverWeek?.searchConsole?.clicks?.changePercent || 0,
    impressions: metrics?.comparisons?.weekOverWeek?.searchConsole?.impressions?.changePercent || 0,
    sessions: metrics?.comparisons?.weekOverWeek?.analytics?.sessions?.changePercent || 0,
    users: metrics?.comparisons?.weekOverWeek?.analytics?.users?.changePercent || 0
  };

  const getScoreColor = (score: string) => {
    switch(score) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getHealthScore = () => {
    let score = 100;

    // Deduct points for issues
    if (analyticsMetrics.bounceRate > 70) score -= 20;
    else if (analyticsMetrics.bounceRate > 55) score -= 10;

    if (searchMetrics.avgCTR < 1) score -= 15;
    else if (searchMetrics.avgCTR < 2) score -= 8;

    if (searchMetrics.avgPosition > 20) score -= 15;
    else if (searchMetrics.avgPosition > 10) score -= 8;

    if (analyticsMetrics.avgSessionDuration < 60) score -= 10;
    else if (analyticsMetrics.avgSessionDuration < 120) score -= 5;

    return Math.max(0, score);
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Overview
          </CardTitle>
          <CardDescription>Key performance indicators and health metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-800">Performing Well</p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                {searchMetrics.avgCTR >= 2 && <li>• CTR above industry average</li>}
                {analyticsMetrics.bounceRate < 55 && <li>• Good bounce rate</li>}
                {trends.clicks > 10 && <li>• Clicks up {trends.clicks.toFixed(1)}% WoW</li>}
                {trends.sessions > 10 && <li>• Sessions up {trends.sessions.toFixed(1)}% WoW</li>}
                {searchMetrics.avgPosition > 0 && searchMetrics.avgPosition <= 10 && <li>• Strong avg position</li>}
              </ul>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Areas to Watch</p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                {analyticsMetrics.bounceRate > 55 && analyticsMetrics.bounceRate <= 70 &&
                  <li>• Bounce rate at {analyticsMetrics.bounceRate.toFixed(1)}%</li>}
                {searchMetrics.avgCTR >= 1 && searchMetrics.avgCTR < 2 &&
                  <li>• CTR could be improved</li>}
                {searchMetrics.avgPosition > 10 && searchMetrics.avgPosition <= 20 &&
                  <li>• Avg position needs work</li>}
                {trends.clicks < -5 && <li>• Clicks down {Math.abs(trends.clicks).toFixed(1)}%</li>}
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Key Metrics</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• {searchMetrics.totalClicks.toLocaleString()} total clicks</li>
                <li>• {searchMetrics.totalImpressions.toLocaleString()} impressions</li>
                <li>• {analyticsMetrics.totalSessions.toLocaleString()} sessions</li>
                <li>• {analyticsMetrics.totalUsers.toLocaleString()} users</li>
              </ul>
            </div>
          </div>
          <Alert className="bg-gray-50">
            <AlertDescription className="text-sm">
              <strong>Overall Health Score: {getHealthScore()}/100</strong> -
              {getHealthScore() >= 80 ? ' Your site is performing well' :
               getHealthScore() >= 60 ? ' Your site has room for improvement' :
               ' Your site needs attention to improve performance'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Search Console Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Search Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Total Clicks</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{searchMetrics.totalClicks.toLocaleString()}</p>
                {trends.clicks !== 0 && (
                  <Badge variant="outline" className={trends.clicks > 0 ? 'text-green-600' : 'text-red-600'}>
                    {trends.clicks > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(trends.clicks).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Impressions</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{searchMetrics.totalImpressions.toLocaleString()}</p>
                {trends.impressions !== 0 && (
                  <Badge variant="outline" className={trends.impressions > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(trends.impressions).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Average CTR</p>
              <p className="text-2xl font-bold">{searchMetrics.avgCTR.toFixed(2)}%</p>
              <p className="text-xs text-gray-500">
                {searchMetrics.avgCTR >= 3 ? 'Excellent' :
                 searchMetrics.avgCTR >= 2 ? 'Good' :
                 searchMetrics.avgCTR >= 1 ? 'Fair' : 'Needs Improvement'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Avg Position</p>
              <p className="text-2xl font-bold">{searchMetrics.avgPosition.toFixed(1)}</p>
              <p className="text-xs text-gray-500">
                {searchMetrics.avgPosition <= 3 ? 'Top 3' :
                 searchMetrics.avgPosition <= 10 ? 'First Page' :
                 searchMetrics.avgPosition <= 20 ? 'Page 2' : 'Deep'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Performance Distribution</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Top Queries Tracked</span>
                  <span className="font-medium">{searchMetrics.topQueries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Top Pages Tracked</span>
                  <span className="font-medium">{searchMetrics.topPages}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Visibility Score</p>
              <Progress value={Math.min((searchMetrics.avgCTR * 10 + (30 - searchMetrics.avgPosition) * 2), 100)} className="mb-2" />
              <p className="text-xs text-gray-600">
                Based on CTR and average position
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            User Engagement Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Total Sessions</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{analyticsMetrics.totalSessions.toLocaleString()}</p>
                {trends.sessions !== 0 && (
                  <Badge variant="outline" className={trends.sessions > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(trends.sessions).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Total Users</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{analyticsMetrics.totalUsers.toLocaleString()}</p>
                {trends.users !== 0 && (
                  <Badge variant="outline" className={trends.users > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(trends.users).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Bounce Rate</p>
              <p className="text-2xl font-bold">{analyticsMetrics.bounceRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">
                {analyticsMetrics.bounceRate < 40 ? 'Excellent' :
                 analyticsMetrics.bounceRate < 55 ? 'Good' :
                 analyticsMetrics.bounceRate < 70 ? 'Fair' : 'Poor'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Avg Duration</p>
              <p className="text-2xl font-bold">{formatDuration(analyticsMetrics.avgSessionDuration)}</p>
              <p className="text-xs text-gray-500">
                {analyticsMetrics.avgSessionDuration >= 180 ? 'Excellent' :
                 analyticsMetrics.avgSessionDuration >= 120 ? 'Good' :
                 analyticsMetrics.avgSessionDuration >= 60 ? 'Fair' : 'Poor'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">User Types</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>New Users</span>
                  <span className="font-medium">{analyticsMetrics.newUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Returning</span>
                  <span className="font-medium">
                    {Math.max(0, analyticsMetrics.totalUsers - analyticsMetrics.newUsers).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Engagement</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Page Views</span>
                  <span className="font-medium">{analyticsMetrics.pageViews.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Engagement Rate</span>
                  <span className="font-medium">{analyticsMetrics.engagementRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Session Quality</p>
              <Progress
                value={Math.min(100, (analyticsMetrics.avgSessionDuration / 180) * 100)}
                className="mb-2"
              />
              <p className="text-xs text-gray-600">
                Based on session duration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Core Web Vitals
          </CardTitle>
          <CardDescription>Page experience and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">LCP</p>
                  <p className="text-xs text-gray-500">Largest Contentful Paint</p>
                </div>
                <Badge className={getScoreColor(coreWebVitals.lcp.score)}>
                  {coreWebVitals.lcp.score}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{coreWebVitals.lcp.value}s</p>
              <p className="text-xs text-gray-500 mt-1">Target: &lt;{coreWebVitals.lcp.benchmark}s</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">FID</p>
                  <p className="text-xs text-gray-500">First Input Delay</p>
                </div>
                <Badge className={getScoreColor(coreWebVitals.fid.score)}>
                  {coreWebVitals.fid.score}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{coreWebVitals.fid.value}ms</p>
              <p className="text-xs text-gray-500 mt-1">Target: &lt;{coreWebVitals.fid.benchmark}ms</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">CLS</p>
                  <p className="text-xs text-gray-500">Cumulative Layout Shift</p>
                </div>
                <Badge className={getScoreColor(coreWebVitals.cls.score)}>
                  {coreWebVitals.cls.score}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{coreWebVitals.cls.value}</p>
              <p className="text-xs text-gray-500 mt-1">Target: &lt;{coreWebVitals.cls.benchmark}</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">INP</p>
                  <p className="text-xs text-gray-500">Interaction to Next Paint</p>
                </div>
                <Badge className={getScoreColor(coreWebVitals.inp.score)}>
                  {coreWebVitals.inp.score}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{coreWebVitals.inp.value}ms</p>
              <p className="text-xs text-gray-500 mt-1">Target: &lt;{coreWebVitals.inp.benchmark}ms</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">TTFB</p>
                  <p className="text-xs text-gray-500">Time to First Byte</p>
                </div>
                <Badge className={getScoreColor(coreWebVitals.ttfb.score)}>
                  {coreWebVitals.ttfb.score}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{coreWebVitals.ttfb.value}s</p>
              <p className="text-xs text-gray-500 mt-1">Target: &lt;{coreWebVitals.ttfb.benchmark}s</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">FCP</p>
                  <p className="text-xs text-gray-500">First Contentful Paint</p>
                </div>
                <Badge className={getScoreColor(coreWebVitals.fcp.score)}>
                  {coreWebVitals.fcp.score}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{coreWebVitals.fcp.value}s</p>
              <p className="text-xs text-gray-500 mt-1">Target: &lt;{coreWebVitals.fcp.benchmark}s</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsMetrics.bounceRate > 70 && (
              <Alert className="border-red-500 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>High Bounce Rate:</strong> Your bounce rate of {analyticsMetrics.bounceRate.toFixed(1)}% is above recommended levels.
                  Consider improving page load speed, content relevance, and user experience.
                </AlertDescription>
              </Alert>
            )}

            {searchMetrics.avgCTR < 2 && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Low Click-Through Rate:</strong> Your CTR of {searchMetrics.avgCTR.toFixed(2)}% could be improved.
                  Consider optimizing meta titles and descriptions to be more compelling.
                </AlertDescription>
              </Alert>
            )}

            {trends.sessions < -10 && (
              <Alert className="border-red-500 bg-red-50">
                <TrendingDown className="h-4 w-4" />
                <AlertDescription>
                  <strong>Traffic Decline:</strong> Sessions have decreased by {Math.abs(trends.sessions).toFixed(1)}% week-over-week.
                  Investigate potential causes such as algorithm changes or technical issues.
                </AlertDescription>
              </Alert>
            )}

            {trends.clicks > 20 && (
              <Alert className="border-green-500 bg-green-50">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Strong Growth:</strong> Clicks have increased by {trends.clicks.toFixed(1)}% week-over-week.
                  Identify what's driving this growth and replicate the success.
                </AlertDescription>
              </Alert>
            )}

            {searchMetrics.avgPosition > 20 && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <Search className="h-4 w-4" />
                <AlertDescription>
                  <strong>Deep Rankings:</strong> Your average position of {searchMetrics.avgPosition.toFixed(1)} suggests most keywords rank beyond page 2.
                  Focus on content optimization and link building.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}