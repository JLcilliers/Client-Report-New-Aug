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
  DollarSign,
  Target,
  Users,
  Zap,
  Globe,
  Link,
  FileText,
  BarChart3,
  Activity
} from 'lucide-react';

interface EnhancedMetricsProps {
  reportId: string;
  domain: string;
}

export default function EnhancedMetrics({ reportId, domain }: EnhancedMetricsProps) {
  // Mock data for demonstration - will be replaced with real API calls
  const conversionMetrics = {
    conversionRate: 2.8,
    previousConversionRate: 2.3,
    totalConversions: 342,
    revenue: 45230,
    previousRevenue: 38900,
    costPerAcquisition: 23.50,
    goalCompletions: {
      'Newsletter Signup': 156,
      'Contact Form': 89,
      'Purchase': 97
    },
    roi: 325
  };

  const coreWebVitals = {
    lcp: { value: 2.5, score: 'good', benchmark: 2.5 },
    fid: { value: 95, score: 'good', benchmark: 100 },
    cls: { value: 0.08, score: 'good', benchmark: 0.1 },
    mobileUsability: 94,
    pageSpeedScore: {
      mobile: 78,
      desktop: 92
    }
  };

  const competitiveMetrics = {
    domainAuthority: 42,
    competitorAverage: 38,
    shareOfVoice: 23,
    visibilityScore: 67,
    rankingGaps: 145,
    competitors: [
      { name: 'Competitor A', visibility: 78, gap: '+11%' },
      { name: 'Competitor B', visibility: 65, gap: '-2%' },
      { name: 'Competitor C', visibility: 54, gap: '-13%' }
    ]
  };

  const contentPerformance = {
    newVsReturning: { new: 68, returning: 32 },
    topContent: [
      { title: 'Ultimate Guide to...', sessions: 3420, engagement: 4.2 },
      { title: 'How to Choose...', sessions: 2890, engagement: 3.8 },
      { title: '10 Best Practices...', sessions: 2340, engagement: 3.5 }
    ],
    contentVelocity: 12,
    contentGaps: 28
  };

  const linkProfile = {
    totalBacklinks: 3420,
    referringDomains: 234,
    newReferringDomains: 12,
    lostBacklinks: 3,
    domainRating: 42,
    toxicLinks: 2,
    anchorDistribution: {
      branded: 35,
      commercial: 25,
      informational: 30,
      other: 10
    }
  };

  const getScoreColor = (score: string) => {
    switch(score) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatPercentageChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Executive Summary
          </CardTitle>
          <CardDescription>Key performance indicators and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-800">Top Wins</p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>• Organic traffic up 22% MoM</li>
                <li>• Core Web Vitals all passing</li>
                <li>• 12 new referring domains</li>
              </ul>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Areas to Watch</p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Bounce rate above 60%</li>
                <li>• Mobile speed needs improvement</li>
                <li>• 3 lost backlinks this month</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Opportunities</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• 28 content gaps identified</li>
                <li>• 145 keyword ranking opportunities</li>
                <li>• Schema markup implementation</li>
              </ul>
            </div>
          </div>
          <Alert className="bg-gray-50">
            <AlertDescription className="text-sm">
              <strong>Overall Health Score: 78/100</strong> - Your site is performing well with room for improvement in conversion optimization and mobile performance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Conversion & Revenue Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Conversion & Revenue Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{conversionMetrics.conversionRate}%</p>
                <Badge variant="outline" className="text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {formatPercentageChange(conversionMetrics.conversionRate, conversionMetrics.previousConversionRate)}%
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Revenue from Organic</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{formatCurrency(conversionMetrics.revenue)}</p>
                <Badge variant="outline" className="text-green-600">
                  +{formatPercentageChange(conversionMetrics.revenue, conversionMetrics.previousRevenue)}%
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Cost Per Acquisition</p>
              <p className="text-2xl font-bold">{formatCurrency(conversionMetrics.costPerAcquisition)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">ROI</p>
              <p className="text-2xl font-bold text-green-600">{conversionMetrics.roi}%</p>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm font-medium mb-3">Goal Completions by Type</p>
            <div className="space-y-2">
              {Object.entries(conversionMetrics.goalCompletions).map(([goal, value]) => (
                <div key={goal} className="flex items-center justify-between">
                  <span className="text-sm">{goal}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(value / 200) * 100} className="w-32" />
                    <span className="text-sm font-medium w-12 text-right">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Core Web Vitals & Performance
          </CardTitle>
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Mobile Page Speed</span>
              <div className="flex items-center gap-2">
                <Progress value={coreWebVitals.pageSpeedScore.mobile} className="w-24" />
                <span className="text-sm font-bold">{coreWebVitals.pageSpeedScore.mobile}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Desktop Page Speed</span>
              <div className="flex items-center gap-2">
                <Progress value={coreWebVitals.pageSpeedScore.desktop} className="w-24" />
                <span className="text-sm font-bold">{coreWebVitals.pageSpeedScore.desktop}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Competitive Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Domain Authority</p>
              <p className="text-2xl font-bold">{competitiveMetrics.domainAuthority}</p>
              <p className="text-xs text-gray-500">Avg: {competitiveMetrics.competitorAverage}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Share of Voice</p>
              <p className="text-2xl font-bold">{competitiveMetrics.shareOfVoice}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Visibility Score</p>
              <p className="text-2xl font-bold">{competitiveMetrics.visibilityScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Ranking Gaps</p>
              <p className="text-2xl font-bold text-yellow-600">{competitiveMetrics.rankingGaps}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-3">Competitor Comparison</p>
            <div className="space-y-2">
              {competitiveMetrics.competitors.map((competitor) => (
                <div key={competitor.name} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{competitor.name}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Visibility:</span>
                      <span className="text-sm font-medium">{competitor.visibility}</span>
                    </div>
                    <Badge variant={competitor.gap.startsWith('+') ? 'default' : 'destructive'}>
                      {competitor.gap}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-indigo-600" />
            Link Profile Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Total Backlinks</p>
              <p className="text-xl font-bold">{linkProfile.totalBacklinks.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Referring Domains</p>
              <p className="text-xl font-bold">{linkProfile.referringDomains}</p>
              <p className="text-xs text-green-600">+{linkProfile.newReferringDomains} new</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Domain Rating</p>
              <p className="text-xl font-bold">{linkProfile.domainRating}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Toxic Links</p>
              <p className="text-xl font-bold text-red-600">{linkProfile.toxicLinks}</p>
              {linkProfile.toxicLinks > 0 && (
                <p className="text-xs text-red-600">Needs attention</p>
              )}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-3">Anchor Text Distribution</p>
            <div className="space-y-2">
              {Object.entries(linkProfile.anchorDistribution).map(([type, value]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{type}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={value} className="w-32" />
                    <span className="text-sm font-medium w-10 text-right">{value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}