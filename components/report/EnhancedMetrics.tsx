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
  Clock,
  AlertCircle,
  Info,
  Lightbulb,
  Settings,
  ShoppingCart,
  Navigation
} from 'lucide-react';

interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'content' | 'technical' | 'ux' | 'seo' | 'conversion';
  issue: string;
  impact: string;
  recommendation: string;
  metrics: string[];
  expectedImprovement: string;
}

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

  const generateIntelligentRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Analyze CTR performance
    if (searchMetrics.avgCTR < 1) {
      recommendations.push({
        priority: 'critical',
        category: 'seo',
        issue: 'Very Low Click-Through Rate',
        impact: 'Missing out on potential traffic despite search visibility',
        recommendation: 'Urgently review and optimize meta titles and descriptions. Make them more compelling, include power words, and ensure they match search intent.',
        metrics: [`CTR: ${searchMetrics.avgCTR.toFixed(2)}%`, 'Industry benchmark: 1-2%'],
        expectedImprovement: 'Could double your organic traffic without improving rankings'
      });
    } else if (searchMetrics.avgCTR >= 1 && searchMetrics.avgCTR < 2) {
      recommendations.push({
        priority: 'high',
        category: 'seo',
        issue: 'Below Average Click-Through Rate',
        impact: 'Losing potential traffic to competitors',
        recommendation: 'A/B test different meta titles and descriptions. Add structured data for rich snippets.',
        metrics: [`CTR: ${searchMetrics.avgCTR.toFixed(2)}%`, 'Target: 2-3%'],
        expectedImprovement: '30-50% increase in organic clicks'
      });
    }

    // Analyze bounce rate
    if (analyticsMetrics.bounceRate > 60) {
      if (analyticsMetrics.avgSessionDuration < 30) {
        recommendations.push({
          priority: 'critical',
          category: 'content',
          issue: 'Critical Content Quality Issue',
          impact: 'Users immediately leaving - severe engagement problem',
          recommendation: 'Content doesn\'t match user intent or expectations. Audit your landing pages, ensure content above the fold is relevant, and improve page load speed.',
          metrics: [`Bounce: ${analyticsMetrics.bounceRate.toFixed(1)}%`, `Duration: ${formatDuration(analyticsMetrics.avgSessionDuration)}`],
          expectedImprovement: 'Could reduce bounce rate by 20-30% and double session duration'
        });
      } else {
        recommendations.push({
          priority: 'high',
          category: 'ux',
          issue: 'Poor User Experience',
          impact: 'High bounce rate despite reasonable engagement time',
          recommendation: 'Improve internal navigation, add clear CTAs, and ensure mobile responsiveness. Users are reading but not finding next steps.',
          metrics: [`Bounce: ${analyticsMetrics.bounceRate.toFixed(1)}%`],
          expectedImprovement: '15-25% reduction in bounce rate'
        });
      }
    } else if (analyticsMetrics.bounceRate > 45 && analyticsMetrics.bounceRate <= 60) {
      recommendations.push({
        priority: 'medium',
        category: 'ux',
        issue: 'Bounce Rate Needs Improvement',
        impact: 'Losing engagement opportunities',
        recommendation: 'Add related content suggestions, improve page layout, and optimize load times.',
        metrics: [`Bounce: ${analyticsMetrics.bounceRate.toFixed(1)}%`, 'Target: 20-45%'],
        expectedImprovement: '10-15% reduction in bounce rate'
      });
    } else if (analyticsMetrics.bounceRate < 20) {
      recommendations.push({
        priority: 'low',
        category: 'technical',
        issue: 'Suspiciously Low Bounce Rate',
        impact: 'Analytics tracking may be incorrect',
        recommendation: 'Verify analytics implementation. Check for duplicate tracking codes or event tracking issues.',
        metrics: [`Bounce: ${analyticsMetrics.bounceRate.toFixed(1)}%`],
        expectedImprovement: 'Accurate data for better decision making'
      });
    }

    // Analyze session duration
    if (analyticsMetrics.avgSessionDuration < 30) {
      recommendations.push({
        priority: 'critical',
        category: 'content',
        issue: 'Extremely Poor Engagement',
        impact: 'Users not finding value in your content',
        recommendation: 'Completely revamp content strategy. Focus on user intent, add multimedia, improve readability.',
        metrics: [`Duration: ${formatDuration(analyticsMetrics.avgSessionDuration)}`],
        expectedImprovement: '200-300% increase in session duration'
      });
    } else if (analyticsMetrics.avgSessionDuration >= 30 && analyticsMetrics.avgSessionDuration < 60) {
      recommendations.push({
        priority: 'high',
        category: 'content',
        issue: 'Below Average Engagement Time',
        impact: 'Users not fully exploring your content',
        recommendation: 'Add interactive elements, improve content depth, use better formatting and visuals.',
        metrics: [`Duration: ${formatDuration(analyticsMetrics.avgSessionDuration)}`, 'Target: 60-120s'],
        expectedImprovement: '50-100% increase in engagement time'
      });
    }

    // Analyze average position
    if (searchMetrics.avgPosition > 50) {
      recommendations.push({
        priority: 'critical',
        category: 'seo',
        issue: 'Critical Ranking Problem',
        impact: 'Virtually no organic visibility',
        recommendation: 'Complete SEO overhaul needed. Conduct technical audit, improve content quality, build quality backlinks.',
        metrics: [`Position: ${searchMetrics.avgPosition.toFixed(1)}`],
        expectedImprovement: 'Could 10x your organic traffic'
      });
    } else if (searchMetrics.avgPosition > 20 && searchMetrics.avgPosition <= 50) {
      recommendations.push({
        priority: 'high',
        category: 'seo',
        issue: 'Poor Search Rankings',
        impact: 'Missing significant traffic opportunities',
        recommendation: 'Focus on on-page SEO, improve content depth, target long-tail keywords, build topical authority.',
        metrics: [`Position: ${searchMetrics.avgPosition.toFixed(1)}`, 'Target: Top 10'],
        expectedImprovement: '300-500% increase in organic traffic'
      });
    } else if (searchMetrics.avgPosition > 10 && searchMetrics.avgPosition <= 20) {
      recommendations.push({
        priority: 'medium',
        category: 'seo',
        issue: 'Second Page Rankings',
        impact: 'Close to first page but missing most clicks',
        recommendation: 'Small improvements can yield big results. Update content, improve internal linking, optimize Core Web Vitals.',
        metrics: [`Position: ${searchMetrics.avgPosition.toFixed(1)}`],
        expectedImprovement: '100-200% increase in clicks'
      });
    }

    // Correlation analysis

    // High bounce + low session duration = Content quality issue
    if (analyticsMetrics.bounceRate > 60 && analyticsMetrics.avgSessionDuration < 60) {
      recommendations.push({
        priority: 'critical',
        category: 'content',
        issue: 'Content-Expectation Mismatch',
        impact: 'Users immediately abandon due to irrelevant content',
        recommendation: 'Align content with search intent. Review top performing competitors and match user expectations.',
        metrics: [`Bounce: ${analyticsMetrics.bounceRate.toFixed(1)}%`, `Duration: ${formatDuration(analyticsMetrics.avgSessionDuration)}`],
        expectedImprovement: 'Could halve bounce rate and triple engagement'
      });
    }

    // Low CTR + good position = Title/meta description issue
    if (searchMetrics.avgCTR < 2 && searchMetrics.avgPosition <= 10) {
      recommendations.push({
        priority: 'high',
        category: 'seo',
        issue: 'Poor SERP Appearance Despite Good Rankings',
        impact: 'Ranking well but not attracting clicks',
        recommendation: 'Your rankings are good but titles/descriptions aren\'t compelling. Add emotional triggers, numbers, and clear value propositions.',
        metrics: [`CTR: ${searchMetrics.avgCTR.toFixed(2)}%`, `Position: ${searchMetrics.avgPosition.toFixed(1)}`],
        expectedImprovement: 'Could double clicks without improving rankings'
      });
    }

    // High impressions + low clicks = CTR optimization needed
    if (searchMetrics.totalImpressions > 1000 && searchMetrics.avgCTR < 1.5) {
      recommendations.push({
        priority: 'high',
        category: 'seo',
        issue: 'High Visibility but Low Engagement',
        impact: 'Wasting thousands of impression opportunities',
        recommendation: 'Focus on CTR optimization. Test different titles, add schema markup, use compelling meta descriptions.',
        metrics: [`Impressions: ${searchMetrics.totalImpressions.toLocaleString()}`, `CTR: ${searchMetrics.avgCTR.toFixed(2)}%`],
        expectedImprovement: 'Could gain hundreds of additional clicks immediately'
      });
    }

    // Good CTR + high bounce = Landing page expectation mismatch
    if (searchMetrics.avgCTR > 2 && analyticsMetrics.bounceRate > 70) {
      recommendations.push({
        priority: 'high',
        category: 'ux',
        issue: 'Landing Page Fails to Meet Expectations',
        impact: 'Good click attraction but poor experience delivery',
        recommendation: 'Your SERP presence is effective but landing pages disappoint. Ensure landing page content matches meta description promises.',
        metrics: [`CTR: ${searchMetrics.avgCTR.toFixed(2)}%`, `Bounce: ${analyticsMetrics.bounceRate.toFixed(1)}%`],
        expectedImprovement: 'Could reduce bounce by 30% and improve conversions'
      });
    }

    // Low position + low CTR = Overall SEO improvement needed
    if (searchMetrics.avgPosition > 15 && searchMetrics.avgCTR < 1) {
      recommendations.push({
        priority: 'critical',
        category: 'seo',
        issue: 'Comprehensive SEO Problems',
        impact: 'Both visibility and attractiveness issues',
        recommendation: 'Need complete SEO strategy: technical audit, content optimization, link building, and SERP snippet optimization.',
        metrics: [`Position: ${searchMetrics.avgPosition.toFixed(1)}`, `CTR: ${searchMetrics.avgCTR.toFixed(2)}%`],
        expectedImprovement: 'Could 5-10x your organic traffic with proper optimization'
      });
    }

    // High bounce + low pages per session (assuming single page views)
    const pagesPerSession = analyticsMetrics.pageViews / Math.max(1, analyticsMetrics.totalSessions);
    if (analyticsMetrics.bounceRate > 60 && pagesPerSession < 1.5) {
      recommendations.push({
        priority: 'high',
        category: 'ux',
        issue: 'Poor Navigation and Content Discovery',
        impact: 'Users can\'t find related content or next steps',
        recommendation: 'Improve internal linking, add related content sections, implement clear navigation menu, add search functionality.',
        metrics: [`Bounce: ${analyticsMetrics.bounceRate.toFixed(1)}%`, `Pages/Session: ${pagesPerSession.toFixed(2)}`],
        expectedImprovement: 'Could double pages per session and reduce bounce by 20%'
      });
    }

    // Good traffic + assumed low conversions (when bounce is high with good traffic)
    if (analyticsMetrics.totalSessions > 500 && analyticsMetrics.bounceRate > 65) {
      recommendations.push({
        priority: 'high',
        category: 'conversion',
        issue: 'Traffic Not Converting',
        impact: 'Wasting valuable traffic without conversions',
        recommendation: 'Implement conversion rate optimization: clear CTAs, trust signals, simplified forms, social proof, urgency elements.',
        metrics: [`Sessions: ${analyticsMetrics.totalSessions.toLocaleString()}`, `Bounce: ${analyticsMetrics.bounceRate.toFixed(1)}%`],
        expectedImprovement: 'Could 2-3x conversion rate with proper CRO'
      });
    }

    // Traffic trend analysis
    if (trends.sessions < -20 || trends.clicks < -20) {
      recommendations.push({
        priority: 'critical',
        category: 'technical',
        issue: 'Significant Traffic Decline',
        impact: 'Losing visibility and traffic rapidly',
        recommendation: 'Investigate immediately: check for penalties, technical issues, major algorithm updates, or competitive changes.',
        metrics: [`Sessions: ${trends.sessions.toFixed(1)}%`, `Clicks: ${trends.clicks.toFixed(1)}%`],
        expectedImprovement: 'Stop the decline and recover lost traffic'
      });
    }

    // Engagement rate issues
    if (analyticsMetrics.engagementRate < 30) {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        issue: 'Low User Engagement',
        impact: 'Content not resonating with audience',
        recommendation: 'Add interactive elements, videos, infographics. Improve content structure and readability.',
        metrics: [`Engagement Rate: ${analyticsMetrics.engagementRate.toFixed(1)}%`],
        expectedImprovement: 'Could double engagement metrics'
      });
    }

    // New vs returning users balance
    const returningUserRatio = (analyticsMetrics.totalUsers - analyticsMetrics.newUsers) / Math.max(1, analyticsMetrics.totalUsers);
    if (returningUserRatio < 0.2 && analyticsMetrics.totalUsers > 100) {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        issue: 'Low User Retention',
        impact: 'Failing to build loyal audience',
        recommendation: 'Implement email capture, create content series, improve user experience to encourage returns.',
        metrics: [`Returning Users: ${(returningUserRatio * 100).toFixed(1)}%`],
        expectedImprovement: 'Could double returning visitor rate'
      });
    }

    // Sort recommendations by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
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
                    {trends.clicks > 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                    {trends.clicks > 0 && '+'}{Math.abs(trends.clicks).toFixed(1)}%
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
                    {trends.impressions > 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                    {trends.impressions > 0 && '+'}{Math.abs(trends.impressions).toFixed(1)}%
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
                    {trends.sessions > 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                    {trends.sessions > 0 && '+'}{Math.abs(trends.sessions).toFixed(1)}%
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
                    {trends.users > 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                    {trends.users > 0 && '+'}{Math.abs(trends.users).toFixed(1)}%
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
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            Key Insights & Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your metrics with actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generateIntelligentRecommendations().map((rec, index) => {
              const getPriorityColor = (priority: string) => {
                switch(priority) {
                  case 'critical': return 'bg-red-100 text-red-700 border-red-300';
                  case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
                  case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
                  case 'low': return 'bg-green-100 text-green-700 border-green-300';
                  default: return 'bg-gray-100 text-gray-700 border-gray-300';
                }
              };

              const getCategoryIcon = (category: string) => {
                switch(category) {
                  case 'content': return <FileText className="w-4 h-4" />;
                  case 'technical': return <Settings className="w-4 h-4" />;
                  case 'ux': return <Navigation className="w-4 h-4" />;
                  case 'seo': return <Search className="w-4 h-4" />;
                  case 'conversion': return <ShoppingCart className="w-4 h-4" />;
                  default: return <Info className="w-4 h-4" />;
                }
              };

              const getPriorityIcon = (priority: string) => {
                switch(priority) {
                  case 'critical': return <AlertCircle className="w-4 h-4" />;
                  case 'high': return <AlertTriangle className="w-4 h-4" />;
                  case 'medium': return <Info className="w-4 h-4" />;
                  case 'low': return <CheckCircle className="w-4 h-4" />;
                  default: return <Info className="w-4 h-4" />;
                }
              };

              return (
                <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getPriorityIcon(rec.priority)}
                    </div>
                    <div className="flex-grow space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getPriorityColor(rec.priority)} font-semibold uppercase text-xs`}>
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getCategoryIcon(rec.category)}
                          <span className="capitalize">{rec.category}</span>
                        </Badge>
                      </div>

                      <h4 className="font-semibold text-base">{rec.issue}</h4>

                      <p className="text-sm opacity-90">
                        <strong>Impact:</strong> {rec.impact}
                      </p>

                      <div className="bg-white/50 rounded p-3 space-y-2">
                        <p className="text-sm">
                          <strong>Recommendation:</strong> {rec.recommendation}
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <strong>Related Metrics:</strong>
                          {rec.metrics.map((metric, idx) => (
                            <span key={idx} className="bg-white/70 px-2 py-1 rounded">
                              {metric}
                            </span>
                          ))}
                        </div>

                        <p className="text-sm font-medium text-green-700">
                          <TrendingUp className="inline w-3 h-3 mr-1" />
                          Expected Improvement: {rec.expectedImprovement}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {generateIntelligentRecommendations().length === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Excellent Performance!</strong> Your website is performing well across all key metrics.
                  Continue monitoring for any changes and maintain your current optimization strategies.
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> These recommendations are based on industry benchmarks and correlation analysis of your metrics.
                Prioritize critical and high-priority items for maximum impact. Recommendations are updated in real-time as your metrics change.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}