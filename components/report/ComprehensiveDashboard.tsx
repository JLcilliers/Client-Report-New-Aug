'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import CompetitorManagement from './CompetitorManagement';

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
  const refreshingRef = useRef(false);
  const [forceRender, setForceRender] = useState(0);
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

  // Only refresh when comparison period changes AND we have existing data
  // This prevents infinite loops and unnecessary API calls
  useEffect(() => {
    console.log('📅 Comparison period changed to:', comparisonPeriod);
    // Only refresh if we have metrics and we're not currently refreshing
    // and this isn't the initial load
    if (metrics && !refreshing && !loading) {
      console.log('🔄 Refreshing data for new period:', comparisonPeriod);
      // Add a small delay to prevent rapid-fire requests
      const timer = setTimeout(() => {
        fetchMetrics(comparisonPeriod);
      }, 500);
      return () => clearTimeout(timer);
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
        
        // Auto-refresh if data is older than 1 hour
        const dataAge = data?.fetched_at ? new Date().getTime() - new Date(data.fetched_at).getTime() : Infinity;
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
        
        if (dataAge > oneHour) {
          console.log('📅 Data is stale, auto-refreshing...');
          // Small delay to let the UI render first
          setTimeout(() => {
            if (!refreshing && !refreshingRef.current) {
              fetchMetrics(comparisonPeriod);
            }
          }, 1000);
        }
      } else {
        const error = await dataResponse.text();
        console.error('❌ Failed to load existing data:', error);
        // If no existing data, always try to refresh
        console.log('🔄 No existing data, attempting refresh...');
        setTimeout(() => {
          if (!refreshing && !refreshingRef.current) {
            fetchMetrics(comparisonPeriod);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('💥 Error loading existing data:', error);
    }
  };

  const clearRefreshingState = useCallback(() => {
    console.log('🧹 Clearing refreshing state');
    setRefreshing(false);
    refreshingRef.current = false;
    
    // Multiple failsafes to ensure state is cleared
    setTimeout(() => {
      setRefreshing(false);
      refreshingRef.current = false;
    }, 100);
    
    setTimeout(() => {
      setRefreshing(false);
      refreshingRef.current = false;
    }, 1000);
  }, []);

  const fetchMetrics = async (period?: string) => {
    // Prevent multiple simultaneous refresh calls
    if (refreshing || refreshingRef.current) {
      console.log('🚫 Already refreshing, skipping duplicate request');
      return;
    }
    
    // Set refreshing state
    setRefreshing(true);
    refreshingRef.current = true;
    const dateRange = period || comparisonPeriod;
    console.log('🔄 Starting data refresh for slug:', reportSlug, 'with period:', dateRange);
    
    // Set failsafe timeout to always clear refreshing state
    const failsafeTimeout = setTimeout(() => {
      console.warn('⚠️ Failsafe timeout triggered - clearing refreshing state');
      clearRefreshingState();
    }, 30000); // 30 second failsafe
    
    try {
      // First try to refresh the data using the working refresh endpoint with timeout
      console.log('📡 Calling refresh endpoint with date range:', dateRange);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      const refreshResponse = await fetch(`/api/public/report/${reportSlug}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📡 Refresh response status:', refreshResponse.status);

      if (refreshResponse.ok) {
        const refreshResult = await refreshResponse.json();
        console.log('✅ Data refreshed successfully:', refreshResult);
        
        // If the refresh endpoint returns data directly, use it
        if (refreshResult.data) {
          console.log('📊 Using data from refresh response');
          const transformedMetrics = transformLegacyData(refreshResult.data);
          console.log('🔄 Transformed metrics:', transformedMetrics);
          setMetrics(transformedMetrics);
          setLastRefresh(new Date());
        } else if (refreshResult.success) {
          // API returned success but no data - fetch it separately
          // Otherwise fetch the refreshed data
          console.log('📥 Fetching updated data...');
          const dataController = new AbortController();
          const dataTimeoutId = setTimeout(() => dataController.abort(), 10000);
          
          const dataResponse = await fetch(`/api/public/report/${reportSlug}/data`, {
            signal: dataController.signal
          });
          
          clearTimeout(dataTimeoutId);
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
            throw new Error('Unable to fetch updated data. Please try again.');
          }
        }
      } else {
        // Handle different error status codes
        if (refreshResponse.status === 401) {
          console.warn('🔐 Authentication required - using existing data');
          // Try to load existing cached data instead
          await loadExistingData();
          return; // Exit early, data has been loaded from cache
        }
        
        const errorText = await refreshResponse.text();
        console.error('❌ Refresh failed:', errorText);
        // Parse error for better display
        try {
          const errorJson = JSON.parse(errorText);
          console.warn(`Refresh failed: ${errorJson.error || 'Unknown error'}. Using cached data.`);
          // Try to load existing data as fallback
          await loadExistingData();
        } catch {
          console.warn('Unable to refresh data. Using cached data.');
          await loadExistingData();
        }
      }
    } catch (error: any) {
      console.error('💥 Error during refresh:', error);
      
      if (error.name === 'AbortError') {
        console.error('⏱️ Request timed out. The refresh is taking longer than expected.');
      } else {
        console.error('❌ Network error occurred. Please check your connection and try again.');
      }
      
      // Optionally show user feedback here if you have a toast system
      // toast.error(error.message || 'Failed to refresh data');
      
    } finally {
      // Clear failsafe timeout
      clearTimeout(failsafeTimeout);
      
      // Always clear the refreshing state using our comprehensive method
      clearRefreshingState();
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
      
      console.log('🔍 Running comprehensive SEO audit for domain:', domain);
      
      const response = await fetch('/api/seo/technical-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain, 
          includePageSpeed: true,
          includeCoreWebVitals: true,
          includeMobileUsability: true,
          includeCrawlability: true,
          includeSecurityChecks: true,
          includeStructuredData: true,
          reportId: reportId,
          clientReportId: reportSlug
        })
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
    const comparisons = data.comparisons || {};

    // Extract comparison percentages from the API data
    const getComparisonValue = (comparisonData: any, metric: string) => {
      return comparisonData?.[metric]?.changePercent || 0;
    };

    // Calculate previous period values based on current values and change percentages
    const calculatePreviousValue = (current: number, changePercent: number) => {
      if (changePercent === 0) return current;
      // If changePercent is positive, previous = current / (1 + changePercent/100)
      // If changePercent is negative, previous = current / (1 + changePercent/100)
      return current / (1 + changePercent / 100);
    };

    // Get the appropriate comparison based on what's available
    const monthComparison = comparisons.monthOverMonth || comparisons.weekOverWeek || {};
    const yearComparison = comparisons.yearOverYear || {};

    // Current values
    const currentSearchConsole = {
      clicks: searchConsole.summary?.clicks || 0,
      impressions: searchConsole.summary?.impressions || 0,
      ctr: searchConsole.summary?.ctr || 0,
      position: searchConsole.summary?.position || 0
    };

    const currentAnalytics = {
      sessions: analytics.summary?.sessions || 0,
      users: analytics.summary?.users || 0,
      newUsers: analytics.summary?.newUsers || 0,
      pageviews: analytics.summary?.pageviews || 0,
      events: analytics.summary?.events || 0,
      bounceRate: analytics.summary?.bounceRate || 0,
      avgSessionDuration: analytics.summary?.avgSessionDuration || 0
    };

    // Calculate previous period values using comparison data
    const previousSearchConsole = {
      clicks: calculatePreviousValue(currentSearchConsole.clicks, getComparisonValue(monthComparison.searchConsole, 'clicks')),
      impressions: calculatePreviousValue(currentSearchConsole.impressions, getComparisonValue(monthComparison.searchConsole, 'impressions')),
      ctr: calculatePreviousValue(currentSearchConsole.ctr, getComparisonValue(monthComparison.searchConsole, 'ctr')),
      position: currentSearchConsole.position - (getComparisonValue(monthComparison.searchConsole, 'position') || 0)
    };

    const previousAnalytics = {
      sessions: calculatePreviousValue(currentAnalytics.sessions, getComparisonValue(monthComparison.analytics, 'sessions')),
      users: calculatePreviousValue(currentAnalytics.users, getComparisonValue(monthComparison.analytics, 'users')),
      newUsers: calculatePreviousValue(currentAnalytics.newUsers, getComparisonValue(monthComparison.analytics, 'newUsers')),
      pageviews: calculatePreviousValue(currentAnalytics.pageviews, getComparisonValue(monthComparison.analytics, 'pageviews')),
      events: calculatePreviousValue(currentAnalytics.events, getComparisonValue(monthComparison.analytics, 'events')),
      bounceRate: currentAnalytics.bounceRate,
      avgSessionDuration: currentAnalytics.avgSessionDuration
    };

    // Calculate year-ago values using year-over-year comparison data
    const yearAgoSearchConsole = {
      clicks: calculatePreviousValue(currentSearchConsole.clicks, getComparisonValue(yearComparison.searchConsole, 'clicks')),
      impressions: calculatePreviousValue(currentSearchConsole.impressions, getComparisonValue(yearComparison.searchConsole, 'impressions')),
      ctr: calculatePreviousValue(currentSearchConsole.ctr, getComparisonValue(yearComparison.searchConsole, 'ctr')),
      position: currentSearchConsole.position - (getComparisonValue(yearComparison.searchConsole, 'position') || 0)
    };

    const yearAgoAnalytics = {
      sessions: calculatePreviousValue(currentAnalytics.sessions, getComparisonValue(yearComparison.analytics, 'sessions')),
      users: calculatePreviousValue(currentAnalytics.users, getComparisonValue(yearComparison.analytics, 'users')),
      newUsers: calculatePreviousValue(currentAnalytics.newUsers, getComparisonValue(yearComparison.analytics, 'newUsers')),
      pageviews: calculatePreviousValue(currentAnalytics.pageviews, getComparisonValue(yearComparison.analytics, 'pageviews')),
      events: calculatePreviousValue(currentAnalytics.events, getComparisonValue(yearComparison.analytics, 'events')),
      bounceRate: currentAnalytics.bounceRate,
      avgSessionDuration: currentAnalytics.avgSessionDuration
    };

    return {
      fetchedAt: data.fetched_at || new Date().toISOString(),
      // Current data structure for Executive Overview
      current: {
        search_console: {
          summary: currentSearchConsole
        },
        analytics: {
          summary: currentAnalytics
        }
      },
      // Previous period data for month-over-month comparison
      previous: {
        search_console: {
          summary: previousSearchConsole
        },
        analytics: {
          summary: previousAnalytics
        }
      },
      // Year-ago data for year-over-year comparison
      yearAgo: {
        search_console: {
          summary: yearAgoSearchConsole
        },
        analytics: {
          summary: yearAgoAnalytics
        }
      },
      // Keep the original structure for other components
      searchConsole: {
        current: currentSearchConsole,
        topQueries: (searchConsole.topQueries || []).map((q: any) => ({
          query: q.keys?.[0] || 'Unknown',
          clicks: q.clicks || 0,
          impressions: q.impressions || 0,
          ctr: q.ctr || 0,
          position: q.position || 0
        })),
        topPages: (searchConsole.topPages || []).map((p: any) => ({
          page: p.keys?.[0] || 'Unknown',
          clicks: p.clicks || 0,
          impressions: p.impressions || 0,
          ctr: p.ctr || 0,
          position: p.position || 0
        })),
        byDate: searchConsole.byDate || [],
        summary: searchConsole.summary || {}
      },
      analytics: {
        current: {
          sessions: currentAnalytics.sessions,
          users: currentAnalytics.users,
          newUsers: currentAnalytics.newUsers,
          pageViews: currentAnalytics.pageviews,
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
        trafficSources: analytics.trafficSources || [],
        summary: analytics.summary || {},
        topPages: analytics.topPages || []
      },
      comparisons: comparisons
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
            {(refreshing || refreshingRef.current) && ' - Refreshing...'}
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
            disabled={refreshing || refreshingRef.current}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${(refreshing || refreshingRef.current) ? 'animate-spin' : ''}`} />
            {(refreshing || refreshingRef.current) ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
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
              change: comparisonData?.searchConsole?.clicks?.changePercent || 0,
              changeType: comparisonData?.searchConsole?.clicks?.changePercent > 0 ? 'positive' : comparisonData?.searchConsole?.clicks?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <MousePointer className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'Impressions',
              value: formatNumber(metrics?.searchConsole?.current?.impressions || 0),
              change: comparisonData?.searchConsole?.impressions?.changePercent || 0,
              changeType: comparisonData?.searchConsole?.impressions?.changePercent > 0 ? 'positive' : comparisonData?.searchConsole?.impressions?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Eye className="w-4 h-4 text-purple-500" />
            })}
            {renderMetricCard({
              title: 'Total Users',
              value: formatNumber(metrics?.analytics?.current?.users || 0),
              change: comparisonData?.analytics?.users?.changePercent || 0,
              changeType: comparisonData?.analytics?.users?.changePercent > 0 ? 'positive' : comparisonData?.analytics?.users?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Users className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Conversions',
              value: formatNumber(metrics?.analytics?.current?.conversions || 0),
              change: comparisonData?.analytics?.conversions?.changePercent || 0,
              changeType: comparisonData?.analytics?.conversions?.changePercent > 0 ? 'positive' : comparisonData?.analytics?.conversions?.changePercent < 0 ? 'negative' : 'neutral',
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

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-6">
          <CompetitorManagement reportSlug={reportSlug} />
        </TabsContent>

        {/* Search Performance Tab */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard({
              title: 'Total Impressions',
              value: formatNumber(metrics?.searchConsole?.current?.impressions || 0),
              change: comparisonData?.searchConsole?.impressions?.changePercent || 0,
              changeType: comparisonData?.searchConsole?.impressions?.changePercent > 0 ? 'positive' : comparisonData?.searchConsole?.impressions?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Eye className="w-4 h-4 text-purple-500" />
            })}
            {renderMetricCard({
              title: 'Total Clicks',
              value: formatNumber(metrics?.searchConsole?.current?.clicks || 0),
              change: comparisonData?.searchConsole?.clicks?.changePercent || 0,
              changeType: comparisonData?.searchConsole?.clicks?.changePercent > 0 ? 'positive' : comparisonData?.searchConsole?.clicks?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <MousePointer className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'Average CTR',
              value: formatPercentage(metrics?.searchConsole?.current?.ctr || 0),
              change: comparisonData?.searchConsole?.ctr?.changePercent || 0,
              changeType: comparisonData?.searchConsole?.ctr?.changePercent > 0 ? 'positive' : comparisonData?.searchConsole?.ctr?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Activity className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Average Position',
              value: (metrics?.searchConsole?.current?.position || 0).toFixed(1),
              change: comparisonData?.searchConsole?.position?.changePercent || 0,
              changeType: comparisonData?.searchConsole?.position?.changePercent < 0 ? 'positive' : comparisonData?.searchConsole?.position?.changePercent > 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <BarChart3 className="w-4 h-4 text-orange-500" />
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
              change: comparisonData?.analytics?.sessions?.changePercent || 0,
              changeType: comparisonData?.analytics?.sessions?.changePercent > 0 ? 'positive' : comparisonData?.analytics?.sessions?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Activity className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'Engaged Sessions',
              value: formatNumber(Math.round((metrics?.analytics?.current?.sessions || 0) * (metrics?.analytics?.current?.engagementRate || 0)) || 0),
              change: comparisonData?.analytics?.engagementRate?.changePercent || 0,
              changeType: comparisonData?.analytics?.engagementRate?.changePercent > 0 ? 'positive' : comparisonData?.analytics?.engagementRate?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Target className="w-4 h-4 text-orange-500" />
            })}
            {renderMetricCard({
              title: 'New Users',
              value: formatNumber(metrics?.analytics?.current?.newUsers || 0),
              change: comparisonData?.analytics?.newUsers?.changePercent || 0,
              changeType: comparisonData?.analytics?.newUsers?.trend === 'up' ? 'positive' : comparisonData?.analytics?.newUsers?.trend === 'down' ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Users className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Page Views',
              value: formatNumber(metrics?.analytics?.current?.pageViews || 0),
              change: comparisonData?.analytics?.pageviews?.changePercent || 0,
              changeType: comparisonData?.analytics?.pageviews?.trend === 'up' ? 'positive' : comparisonData?.analytics?.pageviews?.trend === 'down' ? 'negative' : 'neutral',
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
              change: comparisonData?.analytics?.engagementRate?.changePercent || 0,
              changeType: comparisonData?.analytics?.engagementRate?.changePercent > 0 ? 'positive' : comparisonData?.analytics?.engagementRate?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Activity className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Bounce Rate',
              value: formatPercentage(metrics?.analytics?.current?.bounceRate || 0),
              change: -comparisonData?.analytics?.bounceRate?.changePercent || 0,
              changeType: comparisonData?.analytics?.bounceRate?.changePercent < 0 ? 'positive' : comparisonData?.analytics?.bounceRate?.changePercent > 0 ? 'negative' : 'neutral',
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
                      <p className={`text-3xl font-bold mt-1 ${getScoreColor(seoAuditData.overallScore || 0)}`}>
                        {seoAuditData.overallScore || 0}/100
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

                  {/* Performance-Mobile, Core Web Vitals, and Content Quality Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Performance-Mobile Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="w-4 h-4 text-pink-500" />
                          Performance-Mobile
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className={`text-4xl font-bold ${getScoreColor(seoAuditData.pageSpeed?.mobile?.performance || 0)}`}>
                              {seoAuditData.pageSpeed?.mobile?.performance || 0}
                            </div>
                            <p className="text-sm text-gray-500">Performance Score</p>
                          </div>
                          
                          {seoAuditData.pageSpeed?.mobile && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Accessibility</span>
                                <span className={getScoreColor(seoAuditData.pageSpeed.mobile.accessibility || 0)}>
                                  {seoAuditData.pageSpeed.mobile.accessibility || 0}/100
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Best Practices</span>
                                <span className={getScoreColor(seoAuditData.pageSpeed.mobile.bestPractices || 0)}>
                                  {seoAuditData.pageSpeed.mobile.bestPractices || 0}/100
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>SEO</span>
                                <span className={getScoreColor(seoAuditData.pageSpeed.mobile.seo || 0)}>
                                  {seoAuditData.pageSpeed.mobile.seo || 0}/100
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {seoAuditData.pageSpeed?.mobile?.audits && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-600">Key Issues:</p>
                              {Object.entries(seoAuditData.pageSpeed.mobile.audits)
                                .filter(([key, audit]: [string, any]) => audit.score < 1)
                                .slice(0, 3)
                                .map(([key, audit]: [string, any], idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <XCircle className="w-3 h-3 text-red-500" />
                                    <span className="truncate" title={audit.title}>{audit.title}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Core Web Vitals Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-500" />
                          Core Web Vitals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className={`text-4xl font-bold ${
                              seoAuditData.coreWebVitals?.grade === 'good' ? 'text-green-600' :
                              seoAuditData.coreWebVitals?.grade === 'needs-improvement' ? 'text-yellow-600' :
                              seoAuditData.coreWebVitals?.grade === 'poor' ? 'text-red-600' :
                              typeof seoAuditData.coreWebVitals?.grade === 'number' ? getScoreColor(seoAuditData.coreWebVitals.grade) :
                              'text-gray-500'
                            }`}>
                              {seoAuditData.coreWebVitals?.grade || 'N/A'}
                            </div>
                            <p className="text-sm text-gray-500">Overall Grade</p>
                          </div>
                          
                          {seoAuditData.coreWebVitals && (
                            <div className="space-y-2">
                              {seoAuditData.coreWebVitals.mobile && (
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">Mobile (Phone):</p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span>LCP</span>
                                      <span className={
                                        (seoAuditData.coreWebVitals.mobile.LCP?.value || seoAuditData.coreWebVitals.mobile.LCP || 0) <= 2500 ? 'text-green-600' :
                                        (seoAuditData.coreWebVitals.mobile.LCP?.value || seoAuditData.coreWebVitals.mobile.LCP || 0) <= 4000 ? 'text-yellow-600' : 'text-red-600'
                                      }>
                                        {((seoAuditData.coreWebVitals.mobile.LCP?.value || seoAuditData.coreWebVitals.mobile.LCP || 0) / 1000).toFixed(1)}s
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span>INP</span>
                                      <span className={
                                        (seoAuditData.coreWebVitals.mobile.INP?.value || seoAuditData.coreWebVitals.mobile.INP || 0) <= 200 ? 'text-green-600' :
                                        (seoAuditData.coreWebVitals.mobile.INP?.value || seoAuditData.coreWebVitals.mobile.INP || 0) <= 500 ? 'text-yellow-600' : 'text-red-600'
                                      }>
                                        {seoAuditData.coreWebVitals.mobile.INP?.value || seoAuditData.coreWebVitals.mobile.INP || 0}ms
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span>CLS</span>
                                      <span className={
                                        (seoAuditData.coreWebVitals.mobile.CLS?.value || seoAuditData.coreWebVitals.mobile.CLS || 0) <= 0.1 ? 'text-green-600' :
                                        (seoAuditData.coreWebVitals.mobile.CLS?.value || seoAuditData.coreWebVitals.mobile.CLS || 0) <= 0.25 ? 'text-yellow-600' : 'text-red-600'
                                      }>
                                        {(seoAuditData.coreWebVitals.mobile.CLS?.value || seoAuditData.coreWebVitals.mobile.CLS || 0).toFixed(3)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {seoAuditData.coreWebVitals.desktop && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Desktop:</p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span>LCP</span>
                                      <span className={
                                        (seoAuditData.coreWebVitals.desktop.LCP?.value || seoAuditData.coreWebVitals.desktop.LCP || 0) <= 2500 ? 'text-green-600' :
                                        (seoAuditData.coreWebVitals.desktop.LCP?.value || seoAuditData.coreWebVitals.desktop.LCP || 0) <= 4000 ? 'text-yellow-600' : 'text-red-600'
                                      }>
                                        {((seoAuditData.coreWebVitals.desktop.LCP?.value || seoAuditData.coreWebVitals.desktop.LCP || 0) / 1000).toFixed(1)}s
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span>INP</span>
                                      <span className={
                                        (seoAuditData.coreWebVitals.desktop.INP?.value || seoAuditData.coreWebVitals.desktop.INP || 0) <= 200 ? 'text-green-600' :
                                        (seoAuditData.coreWebVitals.desktop.INP?.value || seoAuditData.coreWebVitals.desktop.INP || 0) <= 500 ? 'text-yellow-600' : 'text-red-600'
                                      }>
                                        {seoAuditData.coreWebVitals.desktop.INP?.value || seoAuditData.coreWebVitals.desktop.INP || 0}ms
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span>CLS</span>
                                      <span className={
                                        (seoAuditData.coreWebVitals.desktop.CLS?.value || seoAuditData.coreWebVitals.desktop.CLS || 0) <= 0.1 ? 'text-green-600' :
                                        (seoAuditData.coreWebVitals.desktop.CLS?.value || seoAuditData.coreWebVitals.desktop.CLS || 0) <= 0.25 ? 'text-yellow-600' : 'text-red-600'
                                      }>
                                        {(seoAuditData.coreWebVitals.desktop.CLS?.value || seoAuditData.coreWebVitals.desktop.CLS || 0).toFixed(3)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Quality Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-500" />
                          Content Quality
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className={`text-4xl font-bold ${getScoreColor(seoAuditData.categories?.contentQuality?.score || 0)}`}>
                              {seoAuditData.categories?.contentQuality?.score || 0}
                            </div>
                            <p className="text-sm text-gray-500">Content Score</p>
                          </div>
                          
                          {(seoAuditData.categories?.contentQuality || seoAuditData.contentQuality) && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>H1 Present</span>
                                <span className={seoAuditData.contentQuality?.h1 ? 'text-green-600' : 'text-red-600'}>
                                  {seoAuditData.contentQuality?.h1 ? '✓' : '✗'}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Meta Description</span>
                                <span className={(seoAuditData.contentQuality?.metaDescLength || 0) > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {seoAuditData.contentQuality?.metaDescLength || 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Image Alt Coverage</span>
                                <span className="text-gray-600">
                                  {seoAuditData.contentQuality?.imageAltCoverage || '0/0'}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Reading Grade</span>
                                <span className={
                                  (seoAuditData.contentQuality?.readingGrade || 0) <= 14 ? 'text-green-600' : 'text-yellow-600'
                                }>
                                  {(seoAuditData.contentQuality?.readingGrade || 0).toFixed(1)}
                                </span>
                              </div>
                              
                              {seoAuditData.contentQuality?.issues && seoAuditData.contentQuality.issues.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  <p className="text-xs font-medium text-gray-600">Issues:</p>
                                  {seoAuditData.contentQuality.issues.slice(0, 3).map((issue: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                                      <span className="truncate" title={issue}>{issue}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Category Scores (other categories) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(seoAuditData.categories || {})
                      .filter(([category]) => !['performance', 'mobile', 'content'].includes(category))
                      .map(([category, data]: [string, any]) => (
                      <div key={category} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize flex items-center gap-2">
                            {category === 'seo' && <Search className="w-4 h-4 text-green-500" />}
                            {category === 'security' && <Globe className="w-4 h-4 text-purple-500" />}
                            {category === 'accessibility' && <Eye className="w-4 h-4 text-orange-500" />}
                            {category === 'crawlability' && <Globe className="w-4 h-4 text-blue-500" />}
                            {category}
                          </span>
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
                              <span className="truncate" title={check.name}>{check.name}</span>
                            </div>
                          ))}
                          {data.checks?.length > 3 && (
                            <p className="text-xs text-gray-400 mt-1">+{data.checks.length - 3} more checks</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Priority Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {seoAuditData.recommendations?.slice(0, 5).map((rec: any, idx: number) => (
                          <div key={idx} className={`border-l-4 pl-3 py-2 ${
                            rec.priority === 'high' ? 'border-red-500 bg-red-50' : 
                            rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 
                            'border-blue-500 bg-blue-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{rec.issue}</p>
                              <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{rec.recommendation}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Impact: {rec.impact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Core Web Vitals */}
                  {seoAuditData.coreWebVitals && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          Core Web Vitals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(seoAuditData.coreWebVitals).map(([metric, value]: [string, any]) => (
                            <div key={metric} className="text-center p-3 border rounded">
                              <p className="text-xs text-gray-500 uppercase">{metric}</p>
                              <p className="text-lg font-bold mt-1">{value}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Detailed Checks */}
                  {seoAuditData.checks && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-green-500" />
                          Detailed Analysis Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {seoAuditData.checks.map((check: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                              {check.status === 'pass' ? (
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                              ) : check.status === 'warning' ? (
                                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{check.name}</p>
                                <p className="text-xs text-gray-600">{check.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
          <EnhancedMetrics reportId={reportId} domain={reportSlug} metrics={metrics} />
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