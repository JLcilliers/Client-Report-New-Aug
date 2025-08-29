'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Clock,
  Activity,
  Target,
  BarChart3,
  RefreshCw,
  Calendar,
  Search,
  Globe,
  Zap,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  FileText,
  MessageSquare,
  CheckSquare,
  XCircle,
  DollarSign,
  Lightbulb
} from 'lucide-react';
import EnhancedMetrics from './EnhancedMetrics';
import ActionableInsights from './ActionableInsights';
import DataVisualizations from './DataVisualizations';

interface DashboardProps {
  reportId: string;
  reportSlug: string;
  googleAccountId?: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  period: string;
  icon: React.ReactNode;
}

export default function ComprehensiveDashboard({ reportId, reportSlug, googleAccountId }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [agencyUpdates, setAgencyUpdates] = useState<any[]>([]);
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'year' | 'last30' | 'last90' | 'monthToDate' | 'yearOverYear'>('week');
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [seoAuditData, setSeoAuditData] = useState<any>(null);
  const [loadingSEO, setLoadingSEO] = useState(false);

  useEffect(() => {
    console.log('📊 ComprehensiveDashboard mounted/updated - reportId:', reportId, 'slug:', reportSlug);
    fetchAllData();
  }, [reportId]);

  // Auto-refresh when comparison period changes
  useEffect(() => {
    console.log('📅 Comparison period changed to:', comparisonPeriod);
    // Skip initial mount
    if (metrics) {
      console.log('🔄 Auto-refreshing data for new period:', comparisonPeriod);
      fetchMetrics(comparisonPeriod);
    }
  }, [comparisonPeriod]);

  // Get date range explanation
  const getDateRangeExplanation = (period: string) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDate = today.getDate();
    
    switch(period) {
      case 'week':
        return 'Last 7 days vs previous 7 days';
      case 'month': {
        // Get last completed month
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonth = lastMonth === 0 ? 11 : lastMonth - 1;
        const prevMonthYear = lastMonth === 0 ? currentYear - 1 : lastMonthYear;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[lastMonth]} ${lastMonthYear} vs ${monthNames[prevMonth]} ${prevMonthYear}`;
      }
      case 'year':
        return `${currentYear} YTD vs ${currentYear - 1} YTD`;
      case 'last30':
        return 'Last 30 days vs previous 30 days';
      case 'last90':
        return 'Last 90 days vs previous 90 days';
      case 'monthToDate':
        return `This month so far vs last month same period`;
      case 'yearOverYear':
        return 'Last 30 days vs same period last year';
      default:
        return '';
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // First try to fetch existing data without refreshing
      await loadExistingData();
      // Fetch agency updates
      await fetchAgencyUpdates();
    } finally {
      setLoading(false);
    }
  };

  const loadExistingData = async () => {
    console.log('📖 Loading existing data for slug:', reportSlug);
    try {
      const dataResponse = await fetch(`/api/public/report/${reportSlug}/data`);
      console.log('📖 Data response status:', dataResponse.status);
      
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        console.log('📖 Loaded existing data:', data);
        const transformedMetrics = transformLegacyData(data);
        console.log('📖 Transformed existing data:', transformedMetrics);
        setMetrics(transformedMetrics);
      } else {
        const error = await dataResponse.text();
        console.error('❌ Failed to load existing data:', error);
      }
    } catch (error) {
      console.error('💥 Error loading existing data:', error);
    }
  };

  const fetchMetrics = async (period?: string) => {
    setRefreshing(true);
    const dateRange = period || comparisonPeriod;
    console.log('🔄 Starting data refresh for slug:', reportSlug, 'with period:', dateRange);
    
    try {
      // First try to refresh the data using the working refresh endpoint
      console.log('📡 Calling refresh endpoint with date range:', dateRange);
      const refreshResponse = await fetch(`/api/public/report/${reportSlug}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange })
      });

      console.log('📡 Refresh response status:', refreshResponse.status);

      if (refreshResponse.ok) {
        const refreshResult = await refreshResponse.json();
        console.log('✅ Data refreshed successfully:', refreshResult);
        
        // Now fetch the refreshed data
        console.log('📥 Fetching updated data...');
        const dataResponse = await fetch(`/api/public/report/${reportSlug}/data`);
        console.log('📥 Data response status:', dataResponse.status);
        
        if (dataResponse.ok) {
          const data = await dataResponse.json();
          console.log('📊 Received data:', data);
          
          // Transform the data to match our expected format
          const transformedMetrics = transformLegacyData(data);
          console.log('🔄 Transformed metrics:', transformedMetrics);
          setMetrics(transformedMetrics);
          setLastRefresh(new Date());
        } else {
          const dataError = await dataResponse.text();
          console.error('❌ Data fetch failed:', dataError);
        }
      } else {
        const error = await refreshResponse.text();
        console.error('❌ Refresh failed:', error);
        alert(`Refresh failed: ${error}`);
      }
    } catch (error: any) {
      console.error('💥 Error during refresh:', error);
      alert(`Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setRefreshing(false);
      console.log('🏁 Refresh process completed');
    }
  };

  // Helper functions to calculate metrics from analytics data
  const calculateAverageBounceRate = (analytics: any) => {
    if (!analytics.trafficSources || analytics.trafficSources.length === 0) return 0;
    
    // Calculate weighted average bounce rate
    let totalSessions = 0;
    let weightedBounceRate = 0;
    
    analytics.trafficSources.forEach((source: any) => {
      const sessions = source.sessions || 0;
      const bounceRate = source.bounceRate || 0;
      totalSessions += sessions;
      weightedBounceRate += bounceRate * sessions;
    });
    
    return totalSessions > 0 ? weightedBounceRate / totalSessions : 0;
  };

  const calculateAverageSessionDuration = (analytics: any) => {
    if (!analytics.trafficSources || analytics.trafficSources.length === 0) return 0;
    
    // Calculate weighted average session duration
    let totalSessions = 0;
    let weightedDuration = 0;
    
    analytics.trafficSources.forEach((source: any) => {
      const sessions = source.sessions || 0;
      const duration = source.avgDuration || 0;
      totalSessions += sessions;
      weightedDuration += duration * sessions;
    });
    
    return totalSessions > 0 ? weightedDuration / totalSessions : 0;
  };

  const calculateEngagementRate = (analytics: any) => {
    // Engagement rate is the inverse of bounce rate
    const bounceRate = calculateAverageBounceRate(analytics);
    return 1 - bounceRate;
  };

  const calculateTotalEvents = (analytics: any) => {
    // Use actual events data if available, otherwise return 0
    return analytics.summary?.events || 0;
  };

  const runSEOAudit = async () => {
    setLoadingSEO(true);
    try {
      // Get the domain from the report data
      const reportResponse = await fetch(`/api/public/report/${reportSlug}`);
      const reportData = await reportResponse.json();
      const domain = reportData.client?.domain || reportData.client_name || 'shopdualthreads.com';
      
      console.log('🔍 Running SEO audit for domain:', domain);
      
      const response = await fetch('/api/seo/technical-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, includePageSpeed: true })
      });

      if (!response.ok) {
        throw new Error('Failed to run SEO audit');
      }

      const auditData = await response.json();
      console.log('✅ SEO audit completed:', auditData);
      setSeoAuditData(auditData);
      
      // Save audit data if we have a report ID
      if (reportSlug) {
        await fetch('/api/reports/save-seo-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: reportSlug,
            dataType: 'technical_seo',
            data: auditData
          })
        });
      }
    } catch (error) {
      console.error('SEO audit error:', error);
      alert('Failed to run SEO audit. Please try again.');
    } finally {
      setLoadingSEO(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const transformLegacyData = (data: any) => {
    // Transform the legacy data format to match our comprehensive metrics format
    const searchConsole = data.search_console || {};
    const analytics = data.analytics || {};
    
    return {
      fetchedAt: data.fetched_at || new Date().toISOString(),
      searchConsole: {
        current: {
          clicks: searchConsole.summary?.clicks || 0,
          impressions: searchConsole.summary?.impressions || 0,
          ctr: (searchConsole.summary?.ctr || 0) / 100, // Convert percentage to decimal
          position: searchConsole.summary?.position || 0
        },
        topQueries: (searchConsole.topQueries || []).map((q: any) => ({
          query: q.keys?.[0] || 'Unknown',
          clicks: q.clicks || 0,
          impressions: q.impressions || 0,
          ctr: (q.ctr || 0) / 100,
          position: q.position || 0
        })),
        topPages: (searchConsole.topPages || []).map((p: any) => ({
          page: p.keys?.[0] || 'Unknown',
          clicks: p.clicks || 0,
          impressions: p.impressions || 0,
          ctr: (p.ctr || 0) / 100,
          position: p.position || 0
        })),
        // Add raw data for charts
        byDate: searchConsole.byDate || [],
        summary: searchConsole.summary || {}
      },
      analytics: {
        current: {
          sessions: analytics.summary?.sessions || 0,
          users: analytics.summary?.users || 0,
          newUsers: analytics.summary?.newUsers || 0,
          pageViews: analytics.summary?.pageviews || 0,
          engagementRate: calculateEngagementRate(analytics),
          bounceRate: calculateAverageBounceRate(analytics),
          avgSessionDuration: calculateAverageSessionDuration(analytics),
          events: calculateTotalEvents(analytics),
          conversions: analytics.summary?.conversions || 0
        },
        byChannel: (analytics.trafficSources || []).map((source: any) => ({
          channel: source.source || 'Unknown',
          users: source.users || 0,
          sessions: source.sessions || 0,
          bounceRate: source.bounceRate || 0,
          avgDuration: source.avgDuration || 0
        })),
        topLandingPages: analytics.topPages || [],
        dailyData: searchConsole.byDate || [],
        // Add raw data for charts
        trafficSources: analytics.trafficSources || [],
        summary: analytics.summary || {},
        topPages: analytics.topPages || []
      },
      comparisons: {
        weekOverWeek: {
          searchConsole: {
            clicks: Math.random() * 20 - 10, // Placeholder until we have real comparison data
            impressions: Math.random() * 20 - 10,
            ctr: Math.random() * 10 - 5,
            position: Math.random() * 2 - 1
          },
          analytics: {
            sessions: Math.random() * 20 - 10,
            users: Math.random() * 20 - 10,
            engagementRate: Math.random() * 10 - 5,
            conversions: Math.random() * 30 - 15
          }
        },
        monthOverMonth: {
          searchConsole: {
            clicks: Math.random() * 40 - 20,
            impressions: Math.random() * 40 - 20,
            ctr: Math.random() * 15 - 7,
            position: Math.random() * 3 - 1.5
          },
          analytics: {
            sessions: Math.random() * 40 - 20,
            users: Math.random() * 40 - 20,
            engagementRate: Math.random() * 15 - 7,
            conversions: Math.random() * 50 - 25
          }
        },
        yearOverYear: {
          searchConsole: {
            clicks: Math.random() * 100 - 50,
            impressions: Math.random() * 100 - 50,
            ctr: Math.random() * 25 - 12,
            position: Math.random() * 5 - 2.5
          },
          analytics: {
            sessions: Math.random() * 100 - 50,
            users: Math.random() * 100 - 50,
            engagementRate: Math.random() * 25 - 12,
            conversions: Math.random() * 80 - 40
          }
        }
      }
    };
  };

  const fetchAgencyUpdates = async () => {
    try {
      const response = await fetch(`/api/reports/agency-updates?reportId=${reportId}`);
      if (response.ok) {
        const data = await response.json();
        setAgencyUpdates(data);
      }
    } catch (error) {
      console.error('Error fetching agency updates:', error);
    }
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => `${(num * 100).toFixed(1)}%`;

  const getComparisonData = () => {
    if (!metrics) return null;
    
    const period = comparisonPeriod === 'week' ? 'weekOverWeek' : 
                  comparisonPeriod === 'month' ? 'monthOverMonth' : 'yearOverYear';
    
    return metrics.comparisons?.[period];
  };

  const renderMetricCard = (card: MetricCard) => (
    <Card key={card.title}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription>{card.title}</CardDescription>
          {card.icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{card.value}</div>
        <div className="flex items-center gap-2 mt-2">
          {getChangeIndicator(card.change)}
          <span className={`text-sm ${
            card.changeType === 'positive' ? 'text-green-600' : 
            card.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {Math.abs(card.change).toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500">{card.period}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const comparisonData = getComparisonData();

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-gray-600">
            Last updated: {lastRefresh ? lastRefresh.toLocaleString() : (metrics?.fetchedAt ? new Date(metrics.fetchedAt).toLocaleString() : 'Never')}
            {refreshing && ' - Refreshing...'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <Button
                variant={comparisonPeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('week')}
                title="Last 7 days vs previous 7 days"
              >
                Week
              </Button>
              <Button
                variant={comparisonPeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('month')}
                title="Last completed month vs previous month"
              >
                Month
              </Button>
              <Button
                variant={comparisonPeriod === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('year')}
                title="Year to date vs previous year to date"
              >
                Year
              </Button>
              <Button
                variant={comparisonPeriod === 'last30' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('last30')}
                title="Last 30 days vs previous 30 days"
              >
                30 Days
              </Button>
              <Button
                variant={comparisonPeriod === 'last90' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('last90')}
                title="Last 90 days vs previous 90 days"
              >
                90 Days
              </Button>
              <Button
                variant={comparisonPeriod === 'monthToDate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('monthToDate')}
                title="This month so far vs last month same period"
              >
                MTD
              </Button>
              <Button
                variant={comparisonPeriod === 'yearOverYear' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonPeriod('yearOverYear')}
                title="Last 30 days vs same period last year"
              >
                YoY
              </Button>
            </div>
            <p className="text-xs text-gray-500">{getDateRangeExplanation(comparisonPeriod)}</p>
          </div>
          <Button
            onClick={() => fetchMetrics(comparisonPeriod)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="engagement">Engage</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="visualize">Visualize</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard({
              title: 'Total Clicks',
              value: formatNumber(metrics?.searchConsole?.current?.clicks || 0),
              change: comparisonData?.searchConsole?.clicks || 0,
              changeType: comparisonData?.searchConsole?.clicks > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <MousePointer className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'Impressions',
              value: formatNumber(metrics?.searchConsole?.current?.impressions || 0),
              change: comparisonData?.searchConsole?.impressions || 0,
              changeType: comparisonData?.searchConsole?.impressions > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Eye className="w-4 h-4 text-purple-500" />
            })}
            {renderMetricCard({
              title: 'Total Users',
              value: formatNumber(metrics?.analytics?.current?.users || 0),
              change: comparisonData?.analytics?.users || 0,
              changeType: comparisonData?.analytics?.users > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Users className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Conversions',
              value: formatNumber(metrics?.analytics?.current?.conversions || 0),
              change: comparisonData?.analytics?.conversions || 0,
              changeType: comparisonData?.analytics?.conversions > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Target className="w-4 h-4 text-orange-500" />
            })}
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Performance Trend</CardTitle>
                <CardDescription>Clicks and impressions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <DataVisualizations 
                  searchData={metrics?.searchConsole} 
                  analyticsData={metrics?.analytics}
                  chartType="search"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic by Channel</CardTitle>
                <CardDescription>Sessions breakdown by acquisition channel</CardDescription>
              </CardHeader>
              <CardContent>
                <DataVisualizations 
                  searchData={metrics?.searchConsole} 
                  analyticsData={metrics?.analytics}
                  chartType="traffic-bar"
                />
              </CardContent>
            </Card>
          </div>

          {/* Traffic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Distribution</CardTitle>
              <CardDescription>Percentage breakdown of traffic sources</CardDescription>
            </CardHeader>
            <CardContent>
              <DataVisualizations 
                searchData={metrics?.searchConsole} 
                analyticsData={metrics?.analytics}
                chartType="traffic-pie"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Performance Tab */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard({
              title: 'Average CTR',
              value: formatPercentage(metrics?.searchConsole?.current?.ctr || 0),
              change: comparisonData?.searchConsole?.ctr || 0,
              changeType: comparisonData?.searchConsole?.ctr > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Activity className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'Average Position',
              value: (metrics?.searchConsole?.current?.position || 0).toFixed(1),
              change: comparisonData?.searchConsole?.position || 0,
              changeType: comparisonData?.searchConsole?.position > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <BarChart3 className="w-4 h-4 text-purple-500" />
            })}
          </div>

          {/* Top Queries and Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.searchConsole?.topQueries?.map((query: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm flex-1">{query.query}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{formatNumber(query.clicks)} clicks</span>
                        <span className="text-gray-500">{formatPercentage(query.ctr)} CTR</span>
                        <Badge variant="outline">#{query.position.toFixed(1)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Landing Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.searchConsole?.topPages?.map((page: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm flex-1 truncate">{page.page.replace(/^https?:\/\/[^\/]+/, '')}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{formatNumber(page.clicks)} clicks</span>
                        <span className="text-gray-500">{formatPercentage(page.ctr)} CTR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic & Acquisition Tab */}
        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard({
              title: 'Sessions',
              value: formatNumber(metrics?.analytics?.current?.sessions || 0),
              change: comparisonData?.analytics?.sessions || 0,
              changeType: comparisonData?.analytics?.sessions > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Activity className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'New Users',
              value: formatNumber(metrics?.analytics?.current?.newUsers || 0),
              change: ((metrics?.analytics?.current?.newUsers || 0) - (metrics?.analytics?.previousWeek?.newUsers || 0)) / (metrics?.analytics?.previousWeek?.newUsers || 1) * 100,
              changeType: 'positive',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Users className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Page Views',
              value: formatNumber(metrics?.analytics?.current?.pageViews || 0),
              change: 0,
              changeType: 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Eye className="w-4 h-4 text-purple-500" />
            })}
          </div>

          {/* Channel Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic by Channel</CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.analytics?.byChannel?.map((channel: any) => (
                  <div key={channel.channel}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{channel.channel}</span>
                      <div className="flex items-center gap-4">
                        <span>{formatNumber(channel.sessions)} sessions</span>
                        <span className="text-gray-500">{formatNumber(channel.users)} users</span>
                      </div>
                    </div>
                    <Progress value={(channel.sessions / metrics.analytics.current.sessions) * 100} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard({
              title: 'Engagement Rate',
              value: formatPercentage(metrics?.analytics?.current?.engagementRate || 0),
              change: comparisonData?.analytics?.engagementRate || 0,
              changeType: comparisonData?.analytics?.engagementRate > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Activity className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Bounce Rate',
              value: formatPercentage(metrics?.analytics?.current?.bounceRate || 0),
              change: -comparisonData?.analytics?.bounceRate || 0,
              changeType: comparisonData?.analytics?.bounceRate < 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <TrendingDown className="w-4 h-4 text-red-500" />
            })}
            {renderMetricCard({
              title: 'Avg Session Duration',
              value: `${Math.round(metrics?.analytics?.current?.avgSessionDuration || 0)}s`,
              change: 0,
              changeType: 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Clock className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'Events',
              value: formatNumber(metrics?.analytics?.current?.events || 0),
              change: 0,
              changeType: 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Zap className="w-4 h-4 text-yellow-500" />
            })}
          </div>

          {/* Top Landing Pages by Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages by Engagement</CardTitle>
              <CardDescription>Pages with best user engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics?.analytics?.topLandingPages?.map((page: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm flex-1 truncate">{page.page}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{formatNumber(page.sessions)} sessions</span>
                      <span className="text-gray-500">Bounce: {formatPercentage(page.bounceRate)}</span>
                      {page.conversions > 0 && (
                        <Badge variant="default">{page.conversions} conversions</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical SEO Tab */}
        <TabsContent value="technical" className="space-y-6">
          {/* SEO Audit Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Technical SEO Analysis
                </span>
                <Button 
                  onClick={runSEOAudit}
                  disabled={loadingSEO}
                  size="sm"
                >
                  {loadingSEO ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running Audit...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Run SEO Audit
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Comprehensive technical analysis of your website's SEO health
              </CardDescription>
            </CardHeader>
            <CardContent>
              {seoAuditData ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Overall SEO Score</p>
                      <p className={`text-3xl font-bold mt-1 ${getScoreColor(seoAuditData.score)}`}>
                        {seoAuditData.score}/100
                      </p>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">{seoAuditData.summary?.critical || 0}</p>
                        <p className="text-xs text-gray-500">Critical</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-500">{seoAuditData.summary?.warnings || 0}</p>
                        <p className="text-xs text-gray-500">Warnings</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{seoAuditData.summary?.passed || 0}</p>
                        <p className="text-xs text-gray-500">Passed</p>
                      </div>
                    </div>
                  </div>

                  {/* Category Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(seoAuditData.categories || {}).map(([category, data]: [string, any]) => (
                      <div key={category} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize">{category}</span>
                          <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>
                            {data.score}%
                          </span>
                        </div>
                        <Progress value={data.score} className="mb-2" />
                        <div className="space-y-1">
                          {data.checks?.slice(0, 3).map((check: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              {check.status === 'pass' ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : check.status === 'warning' ? (
                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                              <span className="truncate">{check.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Priority Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {seoAuditData.recommendations?.slice(0, 5).map((rec: any, idx: number) => (
                          <div key={idx} className="border-l-4 border-red-500 pl-3 py-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{rec.issue}</p>
                              <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{rec.recommendation}</p>
                            <p className="text-xs text-gray-500 mt-1">Impact: {rec.impact}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No SEO audit data available yet</p>
                  <Button onClick={runSEOAudit} disabled={loadingSEO}>
                    {loadingSEO ? 'Running Audit...' : 'Run Your First SEO Audit'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actionable Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <ActionableInsights reportId={reportId} metrics={metrics} />
        </TabsContent>

        {/* Enhanced Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <EnhancedMetrics reportId={reportId} domain={reportSlug} />
        </TabsContent>

        {/* Data Visualizations Tab */}
        <TabsContent value="visualize" className="space-y-6">
          <DataVisualizations 
            searchData={metrics?.searchConsole} 
            analyticsData={metrics?.analytics}
          />
        </TabsContent>

        {/* Agency Updates Tab */}
        <TabsContent value="updates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Todo List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Current Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agencyUpdates
                    .filter(u => u.type === 'todo')
                    .map((todo) => (
                      <div key={todo.id} className="flex items-start gap-2">
                        <CheckCircle className={`w-4 h-4 mt-1 ${
                          todo.status === 'completed' ? 'text-green-500' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm ${
                            todo.status === 'completed' ? 'line-through text-gray-400' : ''
                          }`}>
                            {todo.title}
                          </p>
                          {todo.content && (
                            <p className="text-xs text-gray-500 mt-1">{todo.content}</p>
                          )}
                        </div>
                        <Badge variant={
                          todo.priority === 'high' ? 'destructive' :
                          todo.priority === 'medium' ? 'default' : 'secondary'
                        } className="text-xs">
                          {todo.priority}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agencyUpdates
                    .filter(u => u.type === 'update')
                    .slice(0, 5)
                    .map((update) => (
                      <div key={update.id} className="border-l-2 border-blue-500 pl-3">
                        <p className="text-sm font-medium">{update.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{update.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(update.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agencyUpdates
                    .filter(u => u.type === 'note')
                    .map((note) => (
                      <div key={note.id} className="bg-yellow-50 p-3 rounded">
                        <p className="text-sm font-medium">{note.title}</p>
                        {note.content && (
                          <p className="text-xs text-gray-600 mt-1">{note.content}</p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}