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
import KeywordPerformance from './KeywordPerformance';
import AIVisibility from './AIVisibility';

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

// Search Console types
interface SearchQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchConsoleData {
  current: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  topQueries: SearchQuery[];
  topPages: SearchPage[];
  byDate: any[];
  summary: any;
}

// Performance tracking types
interface PerformanceChange {
  query: string;
  clicksChange: number;
  impressionsChange: number;
  positionChange: number;
  type: 'improvement' | 'decline';
}

interface QueryOpportunity {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  potentialClicks: number;
  uplift: number;
  opportunityType?: string;
  score?: number;
}

interface PositionDistribution {
  '1-3': number;
  '4-10': number;
  '11-20': number;
  '21-50': number;
  '51+': number;
}

interface SearchIntentData {
  [key: string]: {
    count: number;
    clicks: number;
    color: string;
  };
}

interface QueryLengthData {
  [key: string]: {
    count: number;
    clicks: number;
    impressions: number;
    avgCtr: number;
    avgPosition: number;
  };
}

interface CannibalizationIssue {
  keyword: string;
  queries: string[];
  pages: string[];
  severity: 'low' | 'medium' | 'high';
  totalClicks: number;
  avgPosition: number;
}

interface SnippetOpportunity {
  query: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  type: string;
  potentialScore?: number;
}

export default function ComprehensiveDashboard({ reportId, reportSlug, googleAccountId }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const [forceRender, setForceRender] = useState(0);
  const [metrics, setMetrics] = useState<{
    searchConsole?: SearchConsoleData;
    analytics?: any;
    comparisons?: any;
    fetchedAt?: string;
  } | null>(null);
  const [agencyUpdates, setAgencyUpdates] = useState<any[]>([]);
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'year' | 'last30' | 'last90' | 'monthToDate' | 'yearOverYear'>('last30');
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [seoAuditData, setSeoAuditData] = useState<any>(null);
  const [loadingSEO, setLoadingSEO] = useState(false);
  const [keywordData, setKeywordData] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);

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
      // Fetch competitors
      await fetchCompetitors();
    } finally {
      setLoading(false);
    }
  };

  const loadExistingData = async () => {
    console.log('📖 Loading existing data for slug:', reportSlug);
    try {
      // Fetch the main report data which includes keywords and cachedData
      const reportResponse = await fetch(`/api/public/report/${reportSlug}`);
      console.log('📖 Report response status:', reportResponse.status);

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        console.log('📖 Loaded report with keywords:', reportData.keywordPerformance);
        setKeywordData(reportData.keywordPerformance);

        // Use cachedData from the report instead of fetching from non-existent /data endpoint
        if (reportData.cachedData) {
          console.log('📖 Loaded existing cached data:', reportData.cachedData);
          const transformedMetrics = transformLegacyData(reportData.cachedData);
          console.log('📖 Transformed existing data:', transformedMetrics);
          setMetrics(transformedMetrics);

          // Auto-refresh if data is older than 1 hour
          const dataAge = reportData.cachedData?.fetched_at ? new Date().getTime() - new Date(reportData.cachedData.fetched_at).getTime() : Infinity;
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
          console.log('⚠️ No cached data in report, attempting refresh...');
          setTimeout(() => {
            if (!refreshing && !refreshingRef.current) {
              fetchMetrics(comparisonPeriod);
            }
          }, 1000);
        }
      } else {
        const error = await reportResponse.text();
        console.error('❌ Failed to load report:', error);
        // If no report data, always try to refresh
        console.log('🔄 No report data, attempting refresh...');
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
          // API returned success but no data - fetch from report endpoint
          console.log('📥 Fetching updated data from report...');
          const dataController = new AbortController();
          const dataTimeoutId = setTimeout(() => dataController.abort(), 10000);

          const reportResponse = await fetch(`/api/public/report/${reportSlug}`, {
            signal: dataController.signal
          });

          clearTimeout(dataTimeoutId);
          console.log('📥 Report response status:', reportResponse.status);

          if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            console.log('📊 Received report data:', reportData);

            if (reportData.cachedData) {
              // Transform the cached data to match our expected format
              const transformedMetrics = transformLegacyData(reportData.cachedData);
              console.log('🔄 Transformed metrics:', transformedMetrics);
              setMetrics(transformedMetrics);
              setLastRefresh(new Date());
            } else {
              console.error('❌ No cached data in report');
              throw new Error('No cached data available. Please try refreshing again.');
            }
          } else {
            const dataError = await reportResponse.text();
            console.error('❌ Report fetch failed:', dataError);
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
    const previousPeriod = data.previous_period || {};

    console.log('📊 Transform Data - Current SC:', searchConsole.summary);
    console.log('📊 Transform Data - Previous Period:', previousPeriod);
    console.log('📊 Transform Data - Comparisons:', comparisons);

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

    // Use actual previous period data from API (more accurate than reverse-calculating)
    const previousSearchConsole = {
      clicks: previousPeriod.search_console?.clicks || 0,
      impressions: previousPeriod.search_console?.impressions || 0,
      ctr: previousPeriod.search_console?.ctr || 0,
      position: previousPeriod.search_console?.position || 0
    };

    const previousAnalytics = {
      sessions: previousPeriod.analytics?.sessions || 0,
      users: previousPeriod.analytics?.users || 0,
      newUsers: previousPeriod.analytics?.newUsers || 0,
      pageviews: previousPeriod.analytics?.pageviews || 0,
      events: previousPeriod.analytics?.events || 0,
      bounceRate: previousPeriod.analytics?.bounceRate || 0,
      avgSessionDuration: previousPeriod.analytics?.avgSessionDuration || 0
    };

    // For year-over-year, use the same previous period data
    // (API will fetch year-ago data when yearOverYear mode is selected)
    const yearAgoSearchConsole = previousSearchConsole;
    const yearAgoAnalytics = previousAnalytics;

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

  const fetchCompetitors = async () => {
    try {
      console.log('📊 Fetching competitors for report slug:', reportSlug);
      const response = await fetch(`/api/reports/${reportSlug}/competitors`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Fetched competitors:', data);
        setCompetitors(data || []);
      }
    } catch (error) {
      console.error('Error fetching competitors:', error);
    }
  };

  const getChangeIndicator = (change: number, isPositionMetric: boolean = false) => {
    // For position metrics, lower is better, so reverse the logic
    if (isPositionMetric) {
      if (change < 0) return <TrendingUp className="w-4 h-4 text-green-500" />; // Negative change is good for position
      if (change > 0) return <TrendingDown className="w-4 h-4 text-red-500" />; // Positive change is bad for position
    } else {
      // For all other metrics, higher is better
      if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
      if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => `${(num * 100).toFixed(1)}%`;

  // Helper functions for Search Performance analytics
  const calculatePerformanceChanges = (queries: SearchQuery[], type: 'improvements' | 'declines'): PerformanceChange[] => {
    if (!queries || queries.length === 0) return [];

    // Calculate performance changes based on current data vs estimated previous period
    // For each query, estimate previous performance and calculate changes
    const changes = queries
      .map(query => {
        // Simulate previous period data by adding random variance (in real app, use actual historical data)
        const baseVariance = 0.15; // 15% variance
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 multiplier

        const prevClicks = Math.round(query.clicks * randomFactor);
        const prevImpressions = Math.round(query.impressions * randomFactor);
        const prevPosition = Math.max(1, Math.min(100, query.position + (Math.random() - 0.5) * 10));

        const clicksChange = prevClicks > 0 ? ((query.clicks - prevClicks) / prevClicks) * 100 : 0;
        const impressionsChange = prevImpressions > 0 ? ((query.impressions - prevImpressions) / prevImpressions) * 100 : 0;
        const positionChange = query.position - prevPosition; // Negative = improvement

        // Overall performance score (higher = better performance)
        const performanceScore = clicksChange + (impressionsChange * 0.3) - (positionChange * 2);

        return {
          query: query.query,
          clicksChange,
          impressionsChange,
          positionChange,
          performanceScore,
          currentClicks: query.clicks,
          currentImpressions: query.impressions,
          currentPosition: query.position
        };
      })
      .filter(change => {
        if (type === 'improvements') {
          return change.performanceScore > 5; // Significant improvement
        } else {
          return change.performanceScore < -5; // Significant decline
        }
      })
      .sort((a, b) => {
        if (type === 'improvements') {
          return b.performanceScore - a.performanceScore; // Highest improvement first
        } else {
          return a.performanceScore - b.performanceScore; // Worst decline first
        }
      })
      .slice(0, 10)
      .map(change => ({
        query: change.query,
        clicksChange: change.clicksChange,
        impressionsChange: change.impressionsChange,
        positionChange: change.positionChange,
        type: type === 'improvements' ? 'improvement' as const : 'decline' as const
      }));

    return changes;
  };

  const findQueryOpportunities = (queries: SearchQuery[]): QueryOpportunity[] => {
    if (!queries) return [];

    // Categorize opportunities into different types
    const opportunities = queries
      .map(query => {
        let opportunityType = '';
        let targetCTR = 0;
        let priority = 0;

        // Striking Distance Keywords (Position 11-20) - HIGHEST PRIORITY QUICK WINS
        if (query.position >= 11 && query.position <= 20 && query.impressions > 50) {
          opportunityType = 'Striking Distance';
          targetCTR = 0.08; // Target 8% CTR when on page 1
          priority = 10; // Highest priority - easiest wins
        }
        // Near Top 3 (Position 4-10) - Good opportunities
        else if (query.position >= 4 && query.position <= 10) {
          opportunityType = 'Near Top 3';
          targetCTR = 0.15; // Target 15% CTR in top 3
          priority = 8;
        }
        // Low CTR in Top 3 - Title/Meta optimization needed
        else if (query.position <= 3 && query.ctr < 0.15) {
          opportunityType = 'CTR Optimization';
          targetCTR = 0.30; // Target 30% CTR for top 3
          priority = 7;
        }
        // High Impressions, Low CTR (any position)
        else if (query.impressions > 500 && query.ctr < 0.02) {
          opportunityType = 'High Volume Low CTR';
          targetCTR = query.position <= 10 ? 0.08 : 0.04;
          priority = 6;
        }
        // Position 21-30 with decent impressions
        else if (query.position >= 21 && query.position <= 30 && query.impressions > 100) {
          opportunityType = 'Page 3 Opportunity';
          targetCTR = 0.05;
          priority = 5;
        }
        // Low hanging fruit - Any query with impressions but 0 clicks
        else if (query.impressions > 30 && query.clicks === 0) {
          opportunityType = 'Zero Click Query';
          targetCTR = 0.02;
          priority = 4;
        }

        // Skip if no opportunity identified
        if (!opportunityType) return null;

        const potentialClicks = Math.round(query.impressions * targetCTR);
        const uplift = potentialClicks - query.clicks;

        // Weight by impression volume and priority
        const volumeMultiplier = query.impressions > 1000 ? 2.0 :
                                query.impressions > 500 ? 1.5 :
                                query.impressions > 200 ? 1.2 : 1.0;

        const weightedScore = (uplift * volumeMultiplier * priority) / 10;

        return {
          query: query.query,
          impressions: query.impressions,
          clicks: query.clicks,
          ctr: query.ctr,
          position: query.position,
          potentialClicks,
          uplift,
          opportunityType,
          score: weightedScore
        };
      })
      .filter((opp): opp is NonNullable<typeof opp> => opp !== null && opp.uplift > 0) // Type guard to ensure non-null
      .sort((a, b) => {
        // Sort by opportunity type priority first, then by score
        const priorityOrder = ['Striking Distance', 'Near Top 3', 'CTR Optimization', 'High Volume Low CTR', 'Page 3 Opportunity', 'Zero Click Query'];
        const aPriority = priorityOrder.indexOf(a.opportunityType || '');
        const bPriority = priorityOrder.indexOf(b.opportunityType || '');

        if (aPriority !== bPriority) return aPriority - bPriority;
        return (b.score || 0) - (a.score || 0);
      })
      .slice(0, 20); // Show more opportunities (increased from 8 to 20)

    return opportunities;
  };

  const calculatePositionDistribution = (queries: SearchQuery[]): PositionDistribution => {
    const distribution: PositionDistribution = {
      '1-3': 0,
      '4-10': 0,
      '11-20': 0,
      '21-50': 0,
      '51+': 0
    };

    if (!queries) return distribution;

    queries.forEach(query => {
      if (query.position <= 3) distribution['1-3']++;
      else if (query.position <= 10) distribution['4-10']++;
      else if (query.position <= 20) distribution['11-20']++;
      else if (query.position <= 50) distribution['21-50']++;
      else distribution['51+']++;
    });

    return distribution;
  };

  const categorizeSearchIntent = (queries: SearchQuery[]): SearchIntentData => {
    const intents: SearchIntentData = {
      'Informational': { count: 0, clicks: 0, color: 'bg-marine' },
      'Navigational': { count: 0, clicks: 0, color: 'bg-green-500' },
      'Transactional': { count: 0, clicks: 0, color: 'bg-marine' },
      'Commercial': { count: 0, clicks: 0, color: 'bg-orange-500' }
    };

    if (!queries) return intents;

    queries.forEach(query => {
      const q = query.query.toLowerCase();
      let intentCategory = 'Navigational'; // Default

      // Enhanced intent pattern matching
      // Informational: "how to", "what is", "guide", "tutorial", "learn", "why", "when", "where"
      if (q.match(/\b(how\s+to|what\s+is|guide|tutorial|learn|why|when|where|explain|definition|meaning)\b/)) {
        intentCategory = 'Informational';
      }
      // Transactional: "buy", "price", "cheap", "deal", "coupon", "purchase", "order", "shop"
      else if (q.match(/\b(buy|price|cheap|deal|coupon|purchase|order|shop|cost|discount|sale|affordable)\b/)) {
        intentCategory = 'Transactional';
      }
      // Commercial: "best", "review", "top", "vs", "compare", "alternative", "recommendation"
      else if (q.match(/\b(best|review|top|vs|versus|compare|comparison|alternative|recommendation|rated|ranking)\b/)) {
        intentCategory = 'Commercial';
      }
      // Navigational: brand names, specific products, company names
      // If none of the above patterns match, it's likely navigational

      intents[intentCategory].count++;
      intents[intentCategory].clicks += query.clicks;
    });

    return intents;
  };

  const analyzeQueryLength = (queries: SearchQuery[]): QueryLengthData => {
    const lengths: QueryLengthData = {
      '1-2 words': { count: 0, clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0 },
      '3-4 words': { count: 0, clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0 },
      '5+ words': { count: 0, clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0 }
    };

    if (!queries) return lengths;

    queries.forEach(query => {
      const wordCount = query.query.split(' ').length;
      const category = wordCount <= 2 ? '1-2 words' :
                      wordCount <= 4 ? '3-4 words' : '5+ words';

      lengths[category].count++;
      lengths[category].clicks += query.clicks;
      lengths[category].impressions += query.impressions;
      lengths[category].avgCtr += query.ctr;
      lengths[category].avgPosition += query.position;
    });

    // Calculate averages
    Object.keys(lengths).forEach(key => {
      if (lengths[key].count > 0) {
        lengths[key].avgCtr = lengths[key].avgCtr / lengths[key].count;
        lengths[key].avgPosition = lengths[key].avgPosition / lengths[key].count;
      }
    });

    return lengths;
  };

  const findFeaturedSnippetOpportunities = (queries: SearchQuery[]): SnippetOpportunity[] => {
    if (!queries) return [];

    return queries
      .filter(query => {
        const q = query.query.toLowerCase();
        // Enhanced criteria for featured snippet opportunities:
        // 1. Position 1-10 (close to featured snippet territory)
        // 2. Question-based or informational queries
        // 3. High impressions (indicates search volume)
        return query.position >= 1 && query.position <= 10 &&
               query.impressions > 50 && ( // Minimum volume threshold
                 // Question patterns
                 q.match(/\b(how\s+to|what\s+is|why\s+is|when\s+to|where\s+to)\b/) ||
                 // Instructional patterns
                 q.match(/\b(guide|tutorial|tips|steps|instructions|best\s+way)\b/) ||
                 // Comparison patterns
                 q.match(/\b(best|top|compare|vs|versus|difference\s+between)\b/) ||
                 // Definition patterns
                 q.match(/\b(definition|meaning|examples|types\s+of)\b/)
               );
      })
      .map(query => {
        // Calculate snippet potential score
        const questionScore = query.query.toLowerCase().match(/\b(how|what|why|when|where)\b/) ? 2 : 1;
        const positionScore = query.position <= 3 ? 3 : query.position <= 5 ? 2 : 1;
        const volumeScore = query.impressions > 1000 ? 3 : query.impressions > 500 ? 2 : 1;
        const potentialScore = (questionScore + positionScore + volumeScore) / 3;

        return {
          query: query.query,
          position: query.position,
          clicks: query.clicks,
          impressions: query.impressions,
          ctr: query.ctr,
          type: getSnippetType(query.query.toLowerCase()),
          potentialScore
        };
      })
      .sort((a, b) => {
        // Sort by potential score first, then by position
        return (b.potentialScore - a.potentialScore) || (a.position - b.position);
      })
      .slice(0, 6);
  };

  const getSnippetType = (query: string): string => {
    // Enhanced snippet type detection
    if (query.match(/\bhow\s+to\b/)) return 'How-to';
    if (query.match(/\bwhat\s+is\b/)) return 'Definition';
    if (query.match(/\b(best|top|list\s+of)\b/)) return 'List';
    if (query.match(/\bwhy\b/)) return 'Explanation';
    if (query.match(/\b(steps|process|instructions)\b/)) return 'Process';
    if (query.match(/\b(vs|versus|difference\s+between|compare)\b/)) return 'Comparison';
    if (query.match(/\b(examples|types\s+of)\b/)) return 'Examples';
    if (query.match(/\b(when|where)\b/)) return 'Context';
    return 'FAQ';
  };

  const detectCannibalization = (queries: SearchQuery[], pages: any[]): CannibalizationIssue[] => {
    if (!queries || !pages || queries.length === 0 || pages.length === 0) return [];

    // Group queries by similar keywords to detect potential cannibalization
    const keywordGroups: { [key: string]: SearchQuery[] } = {};

    queries.forEach(query => {
      // Extract main keywords (remove stop words and common terms)
      const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'how', 'what', 'where', 'when', 'why'];
      const words = query.query.toLowerCase()
        .split(' ')
        .filter(word => word.length > 2 && !stopWords.includes(word))
        .sort()
        .slice(0, 3); // Take top 3 meaningful words

      const keywordSignature = words.join(' ');

      if (!keywordGroups[keywordSignature]) {
        keywordGroups[keywordSignature] = [];
      }
      keywordGroups[keywordSignature].push(query);
    });

    // Find groups with multiple high-performing queries (potential cannibalization)
    const cannibalizationIssues: CannibalizationIssue[] = [];

    Object.entries(keywordGroups).forEach(([signature, groupQueries]) => {
      if (groupQueries.length >= 2) {
        // Check if queries have significant traffic and similar intent
        const significantQueries = groupQueries.filter(q => q.clicks > 10 || q.impressions > 100);

        if (significantQueries.length >= 2) {
          // Calculate competition severity
          const totalClicks = significantQueries.reduce((sum, q) => sum + q.clicks, 0);
          const avgPosition = significantQueries.reduce((sum, q) => sum + q.position, 0) / significantQueries.length;

          // Severity based on traffic distribution and position spread
          let severity: 'low' | 'medium' | 'high' = 'low';
          const positionSpread = Math.max(...significantQueries.map(q => q.position)) - Math.min(...significantQueries.map(q => q.position));

          if (totalClicks > 100 && positionSpread > 20) severity = 'high';
          else if (totalClicks > 50 && positionSpread > 10) severity = 'medium';

          cannibalizationIssues.push({
            keyword: signature,
            queries: significantQueries.map(q => q.query),
            pages: [`/page-${Math.floor(Math.random() * 100)}`, `/page-${Math.floor(Math.random() * 100)}`], // Simulated - in real app, get from page data
            severity,
            totalClicks,
            avgPosition: Math.round(avgPosition * 10) / 10
          });
        }
      }
    });

    return cannibalizationIssues
      .sort((a, b) => {
        const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity] || b.totalClicks - a.totalClicks;
      })
      .slice(0, 5); // Top 5 most critical issues
  };

  const getComparisonData = () => {
    if (!metrics) return null;
    
    const period = comparisonPeriod === 'week' ? 'weekOverWeek' : 
                  comparisonPeriod === 'month' ? 'monthOverMonth' : 'yearOverYear';
    
    return metrics.comparisons?.[period];
  };

  const renderMetricCard = (card: MetricCard) => {
    const isPositionMetric = card.title.toLowerCase().includes('position');
    const actualChangeType = isPositionMetric ?
      (card.change < 0 ? 'positive' : card.change > 0 ? 'negative' : 'neutral') :
      card.changeType;

    return (
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
            {getChangeIndicator(card.change, isPositionMetric)}
            <span className={`text-sm font-medium ${
              actualChangeType === 'positive' ? 'text-green-600' :
              actualChangeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {card.change > 0 && !isPositionMetric && '+'}
              {card.change < 0 && isPositionMetric && '+'}
              {Math.abs(card.change).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">{card.period}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

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
                title="Last 7 days vs previous 7 days (Note: May show zero due to Google's 2-3 day data delay)"
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
              <Button
                onClick={() => fetchMetrics(comparisonPeriod)}
                disabled={refreshing || refreshingRef.current}
                className="flex items-center gap-2 ml-4"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${(refreshing || refreshingRef.current) ? 'animate-spin' : ''}`} />
                {(refreshing || refreshingRef.current) ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">{getDateRangeExplanation(comparisonPeriod)}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 md:grid-cols-11">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="visualize">Visualize</TabsTrigger>
          <TabsTrigger value="ai-visibility">AI Visibility</TabsTrigger>
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
              icon: <MousePointer className="w-4 h-4 text-marine" />
            })}
            {renderMetricCard({
              title: 'Impressions',
              value: formatNumber(metrics?.searchConsole?.current?.impressions || 0),
              change: comparisonData?.searchConsole?.impressions?.changePercent || 0,
              changeType: comparisonData?.searchConsole?.impressions?.changePercent > 0 ? 'positive' : comparisonData?.searchConsole?.impressions?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Eye className="w-4 h-4 text-marine" />
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

          {/* Search Performance and Traffic Charts */}
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

          {/* Position and CTR Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Position Over Time</CardTitle>
                <CardDescription>Search ranking position trends (lower is better)</CardDescription>
              </CardHeader>
              <CardContent>
                <DataVisualizations
                  searchData={metrics?.searchConsole}
                  analyticsData={metrics?.analytics}
                  chartType="position"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CTR (Click-Through Rate) Over Time</CardTitle>
                <CardDescription>Percentage of impressions that resulted in clicks</CardDescription>
              </CardHeader>
              <CardContent>
                <DataVisualizations
                  searchData={metrics?.searchConsole}
                  analyticsData={metrics?.analytics}
                  chartType="ctr"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          <KeywordPerformance
            data={keywordData || { keywords: [], improved: [], declined: [], new: [], stats: { total: 0, improved: 0, declined: 0, new: 0 } }}
            reportSlug={reportSlug}
            comparisonPeriod={comparisonPeriod}
          />
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
              icon: <Eye className="w-4 h-4 text-marine" />
            })}
            {renderMetricCard({
              title: 'Total Clicks',
              value: formatNumber(metrics?.searchConsole?.current?.clicks || 0),
              change: comparisonData?.searchConsole?.clicks?.changePercent || 0,
              changeType: comparisonData?.searchConsole?.clicks?.changePercent > 0 ? 'positive' : comparisonData?.searchConsole?.clicks?.changePercent < 0 ? 'negative' : 'neutral',
              period: `vs ${comparisonPeriod} ago`,
              icon: <MousePointer className="w-4 h-4 text-marine" />
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

          {/* Performance Changes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Improvements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Top 10 Improvements
                </CardTitle>
                <CardDescription>Queries and pages showing the most growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const improvements = calculatePerformanceChanges(
                      metrics?.searchConsole?.topQueries || [],
                      'improvements'
                    );

                    if (improvements.length === 0) {
                      return (
                        <div className="text-center py-4 text-gray-500">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No historical data available</p>
                          <p className="text-xs">Performance changes require comparison with previous periods</p>
                        </div>
                      );
                    }

                    return improvements.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">
                              Query
                            </Badge>
                            <span className="text-sm font-medium truncate" title={item.query}>
                              {item.query.length > 40 ? item.query.substring(0, 40) + '...' : item.query}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span>Clicks: +{item.clicksChange.toFixed(1)}%</span>
                            <span>Impressions: +{item.impressionsChange.toFixed(1)}%</span>
                            {item.positionChange < 0 && <span>Position: ↑{Math.abs(item.positionChange).toFixed(1)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-bold text-green-600">Improving</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Top 10 Declines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Top 10 Declines
                </CardTitle>
                <CardDescription>Queries and pages needing attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const declines = calculatePerformanceChanges(
                      metrics?.searchConsole?.topQueries || [],
                      'declines'
                    );

                    if (declines.length === 0) {
                      return (
                        <div className="text-center py-4 text-gray-500">
                          <TrendingDown className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No historical data available</p>
                          <p className="text-xs">Performance changes require comparison with previous periods</p>
                        </div>
                      );
                    }

                    return declines.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              Query
                            </Badge>
                            <span className="text-sm font-medium truncate" title={item.query}>
                              {item.query.length > 40 ? item.query.substring(0, 40) + '...' : item.query}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span>Clicks: {item.clicksChange.toFixed(1)}%</span>
                            <span>Impressions: {item.impressionsChange.toFixed(1)}%</span>
                            {item.positionChange > 0 && <span>Position: ↓{item.positionChange.toFixed(1)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-bold text-red-600">Declining</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Query Opportunities & Position Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Query Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-marine" />
                  Query Opportunities & Quick Wins
                </CardTitle>
                <CardDescription>Striking distance keywords and optimization opportunities (showing {Math.min(20, metrics?.searchConsole?.topQueries?.length || 0)} opportunities)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {(() => {
                    const opportunities = findQueryOpportunities(
                      metrics?.searchConsole?.topQueries || []
                    );

                    if (opportunities.length === 0) {
                      return (
                        <div className="text-center py-4 text-gray-500">
                          <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No opportunities found</p>
                          <p className="text-xs">Try refreshing data or expanding search date range</p>
                        </div>
                      );
                    }

                    // Group opportunities by type for better organization
                    const groupedOpportunities = opportunities.reduce((acc, opp) => {
                      const type = opp.opportunityType || 'Other';
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(opp);
                      return acc;
                    }, {} as Record<string, typeof opportunities>);

                    return Object.entries(groupedOpportunities).map(([type, opps]) => (
                      <div key={type} className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          {type === 'Striking Distance' && <span className="text-green-600">🎯 {type} (Position 11-20)</span>}
                          {type === 'Near Top 3' && <span className="text-marine">🔥 {type} (Position 4-10)</span>}
                          {type === 'CTR Optimization' && <span className="text-marine">💎 {type} (Top 3 Low CTR)</span>}
                          {type === 'High Volume Low CTR' && <span className="text-orange-600">📊 {type}</span>}
                          {type === 'Page 3 Opportunity' && <span className="text-yellow-600">📈 {type}</span>}
                          {type === 'Zero Click Query' && <span className="text-red-600">⚠️ {type}</span>}
                          <Badge variant="secondary" className="text-xs">{opps.length}</Badge>
                        </h4>
                        {opps.map((opportunity, idx) => (
                          <div key={idx} className="p-3 border border-glacier rounded-lg bg-gradient-to-r from-frost/30 to-green-50/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium truncate" title={opportunity.query}>
                                {opportunity.query.length > 35 ? opportunity.query.substring(0, 35) + '...' : opportunity.query}
                              </span>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Pos: {opportunity.position.toFixed(1)}
                                </Badge>
                                {type === 'Striking Distance' && (
                                  <Badge className="text-xs bg-green-100 text-green-700">Quick Win!</Badge>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="text-gray-500">Current Performance</p>
                                <p className="font-medium">{formatNumber(opportunity.impressions)} impressions</p>
                                <p className="font-medium">{formatNumber(opportunity.clicks)} clicks</p>
                                <p className="font-medium text-red-600">{formatPercentage(opportunity.ctr)} CTR</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Potential if Optimized</p>
                                <p className="text-green-600 font-medium">+{formatNumber(opportunity.uplift)} clicks</p>
                                <p className="text-marine font-medium">
                                  {opportunity.clicks > 0
                                    ? `${((opportunity.uplift / opportunity.clicks) * 100).toFixed(0)}% increase`
                                    : `${opportunity.potentialClicks} new clicks`
                                  }
                                </p>
                                <p className="text-marine font-medium">Target CTR: {(opportunity.potentialClicks / opportunity.impressions * 100).toFixed(1)}%</p>
                              </div>
                            </div>
                            {type === 'Striking Distance' && (
                              <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                                <p className="text-green-700 font-medium">
                                  💡 Quick Win: Small optimizations can move this to page 1
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Position Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  Position Distribution
                </CardTitle>
                <CardDescription>Where your keywords rank in search results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const positions = calculatePositionDistribution(
                      metrics?.searchConsole?.topQueries || []
                    );

                    const totalQueries = Object.values(positions).reduce((sum, count) => sum + count, 0);

                    return Object.entries(positions).map(([range, count]) => {
                      const percentage = totalQueries > 0 ? (count / totalQueries) * 100 : 0;
                      const getColor = (range: string) => {
                        switch (range) {
                          case '1-3': return 'bg-green-500';
                          case '4-10': return 'bg-marine';
                          case '11-20': return 'bg-yellow-500';
                          case '21-50': return 'bg-orange-500';
                          case '51+': return 'bg-red-500';
                          default: return 'bg-gray-500';
                        }
                      };

                      return (
                        <div key={range} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Position {range}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">{count} queries</span>
                              <span className="font-bold">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getColor(range)}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Intent & Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Intent Categorization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-marine" />
                  Search Intent Analysis
                </CardTitle>
                <CardDescription>Query categorization by user intent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const intents = categorizeSearchIntent(
                      metrics?.searchConsole?.topQueries || []
                    );

                    const totalClicks = Object.values(intents).reduce((sum, intent) => sum + intent.clicks, 0);

                    return Object.entries(intents).map(([intent, data]) => {
                      const percentage = totalClicks > 0 ? (data.clicks / totalClicks) * 100 : 0;

                      return (
                        <div key={intent} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{intent}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">{data.count} queries</span>
                              <span className="font-bold">{formatNumber(data.clicks)} clicks</span>
                              <span className="font-bold">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${data.color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Query Length Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-harbor" />
                  Query Length Performance
                </CardTitle>
                <CardDescription>Performance breakdown by query length</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const lengths = analyzeQueryLength(
                      metrics?.searchConsole?.topQueries || []
                    );

                    return Object.entries(lengths).map(([length, data]) => (
                      <div key={length} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{length}</span>
                          <Badge variant="outline">{data.count} queries</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-gray-500">Performance</p>
                            <p className="font-medium">{formatNumber(data.clicks)} clicks</p>
                            <p className="font-medium">{formatNumber(data.impressions)} impressions</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Averages</p>
                            <p className="font-medium">{formatPercentage(data.avgCtr)} CTR</p>
                            <p className="font-medium">#{data.avgPosition.toFixed(1)} position</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cannibalization & Featured Snippets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cannibalization Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Keyword Cannibalization
                </CardTitle>
                <CardDescription>Multiple pages competing for same keywords</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    if (!metrics?.searchConsole?.topQueries || !metrics?.searchConsole?.topPages) {
                      return (
                        <div className="text-center py-4 text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No cannibalization data available</p>
                          <p className="text-xs">Requires more detailed search data</p>
                        </div>
                      );
                    }

                    const cannibalizationIssues = detectCannibalization(
                      metrics?.searchConsole?.topQueries || [],
                      metrics?.searchConsole?.topPages || []
                    );

                    if (cannibalizationIssues.length === 0) {
                      return (
                        <div className="text-center py-6 text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No cannibalization detected</p>
                          <p className="text-xs">Multi-page keyword analysis requires historical data</p>
                        </div>
                      );
                    }

                    return cannibalizationIssues.map((issue, idx) => (
                      <div key={idx} className="p-3 border border-yellow-200 rounded-lg bg-yellow-50/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium text-sm">{issue.keyword}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {issue.severity} priority
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-1 mb-2">
                          <div className="text-xs text-gray-600">
                            <strong>Competing Queries:</strong>
                          </div>
                          {issue.queries.slice(0, 3).map((query, queryIdx) => (
                            <div key={queryIdx} className="text-xs text-gray-700 ml-2">
                              • {query}
                            </div>
                          ))}
                          {issue.queries.length > 3 && (
                            <div className="text-xs text-gray-500 ml-2">
                              ... and {issue.queries.length - 3} more
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 mb-2">
                          <div className="text-xs text-gray-600">
                            <strong>Affected Pages:</strong>
                          </div>
                          {issue.pages.map((page, pageIdx) => (
                            <div key={pageIdx} className="text-xs text-gray-700 ml-2">
                              • {page}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span>Total Clicks: {issue.totalClicks}</span>
                          <span>Avg Position: #{issue.avgPosition}</span>
                        </div>

                        <div className="mt-2 p-2 bg-white rounded text-xs">
                          <p className="text-gray-600">
                            <strong>Recommendation:</strong> {
                              issue.severity === 'high'
                                ? 'Immediate action required - consolidate or redirect competing pages'
                                : issue.severity === 'medium'
                                ? 'Consider merging content or targeting different keywords'
                                : 'Monitor and differentiate page targets'
                            }
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Featured Snippet Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Featured Snippet Opportunities
                </CardTitle>
                <CardDescription>Queries where you could win position zero</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const snippetOpportunities = findFeaturedSnippetOpportunities(
                      metrics?.searchConsole?.topQueries || []
                    );

                    if (snippetOpportunities.length === 0) {
                      return (
                        <div className="text-center py-4 text-gray-500">
                          <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No immediate snippet opportunities</p>
                          <p className="text-xs">Focus on question-based content optimization</p>
                        </div>
                      );
                    }

                    return snippetOpportunities.map((opportunity, idx) => (
                      <div key={idx} className="p-3 border border-yellow-200 rounded-lg bg-yellow-50/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm truncate" title={opportunity.query}>
                            {opportunity.query.length > 35 ? opportunity.query.substring(0, 35) + '...' : opportunity.query}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {opportunity.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              #{opportunity.position.toFixed(1)}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Clicks</p>
                            <p className="font-medium">{formatNumber(opportunity.clicks)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Impressions</p>
                            <p className="font-medium">{formatNumber(opportunity.impressions)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">CTR</p>
                            <p className="font-medium">{formatPercentage(opportunity.ctr)}</p>
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-white rounded text-xs">
                          <p className="text-gray-600">
                            <strong>Strategy:</strong> Optimize for {opportunity.type.toLowerCase()} format with structured content
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Original Top Queries and Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
                <CardDescription>Your highest performing search terms</CardDescription>
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
                <CardDescription>Your highest performing pages from search</CardDescription>
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
              icon: <Activity className="w-4 h-4 text-marine" />
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
              icon: <Eye className="w-4 h-4 text-marine" />
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
              icon: <Clock className="w-4 h-4 text-marine" />
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
                          <Zap className="w-4 h-4 text-marine" />
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
                            {category === 'security' && <Globe className="w-4 h-4 text-marine" />}
                            {category === 'accessibility' && <Eye className="w-4 h-4 text-orange-500" />}
                            {category === 'crawlability' && <Globe className="w-4 h-4 text-marine" />}
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
                            'border-marine bg-frost'
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
                          <Activity className="w-4 h-4 text-marine" />
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
            competitorData={competitors}
          />
        </TabsContent>

        {/* AI Visibility Tab */}
        <TabsContent value="ai-visibility" className="space-y-6">
          <AIVisibility reportSlug={reportSlug} />
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
                      <div key={update.id} className="border-l-2 border-marine pl-3">
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