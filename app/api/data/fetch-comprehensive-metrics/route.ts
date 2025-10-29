import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import {
  validateAnalyticsResponse,
  validateSearchConsoleResponse,
  normalizeSearchConsoleMetrics,
  extractAnalyticsMetric,
  extractAnalyticsDimension,
  calculateSafePercentageChange,
  checkApiQuotaError
} from '@/lib/utils/api-validation';
import { calculatePositionChange, calculateCTR } from '@/lib/utils/metric-calculations';

// Initialize Google APIs
const searchconsole = google.searchconsole('v1');
const analyticsdata = google.analyticsdata('v1beta');

interface MetricsRequest {
  reportId: string;
  googleAccountId: string;
}

interface DateRange {
  current: { startDate: string; endDate: string };
  previousWeek: { startDate: string; endDate: string };
  previousMonth: { startDate: string; endDate: string };
  previousYear: { startDate: string; endDate: string };
}

function getDateRanges(): DateRange {
  const today = new Date();
  const currentDate = today.toISOString().split('T')[0];
  
  // Helper function to safely subtract days
  const subtractDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() - days);
    return result;
  };
  
  // Current period (last 7 days)
  const weekAgo = subtractDays(today, 7);
  
  // Previous week (8-14 days ago)
  const twoWeeksAgo = subtractDays(today, 14);
  
  // Current month (last 30 days)
  const monthAgo = subtractDays(today, 30);
  
  // Previous month (31-60 days ago)
  const twoMonthsAgo = subtractDays(today, 60);
  
  // Year ago (365 days ago) - use days to avoid leap year issues
  const yearAgo = subtractDays(today, 365);
  const yearAgoPlusWeek = subtractDays(today, 358); // 365 - 7 days
  
  return {
    current: {
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: currentDate
    },
    previousWeek: {
      startDate: twoWeeksAgo.toISOString().split('T')[0],
      endDate: weekAgo.toISOString().split('T')[0]
    },
    previousMonth: {
      startDate: twoMonthsAgo.toISOString().split('T')[0],
      endDate: monthAgo.toISOString().split('T')[0]
    },
    previousYear: {
      startDate: yearAgo.toISOString().split('T')[0],
      endDate: yearAgoPlusWeek.toISOString().split('T')[0]
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const { reportId, googleAccountId } = await request.json();
    
    if (!reportId || !googleAccountId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get Google account credentials
    const { data: googleAccount, error: accountError } = await supabase
      .from('google_accounts')
      .select('*')
      .eq('id', googleAccountId)
      .single();

    if (accountError || !googleAccount) {
      return NextResponse.json({ error: 'Google account not found' }, { status: 404 });
    }

    // Get report details with properties
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*, report_properties(*)')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: googleAccount.access_token,
      refresh_token: googleAccount.refresh_token,
    });

    // Check for token refresh (with 5-minute buffer)
    const tokenExpiry = googleAccount.token_expiry ? new Date(googleAccount.token_expiry) : null;
    const needsRefresh = !tokenExpiry || tokenExpiry < new Date(Date.now() + 5 * 60 * 1000);
    
    if (needsRefresh) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        
        // Update tokens in database
        if (credentials.access_token && credentials.expiry_date) {
          await supabase
            .from('google_accounts')
            .update({
              access_token: credentials.access_token,
              token_expiry: new Date(credentials.expiry_date).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', googleAccountId);
        }
      } catch (refreshError) {
        
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
    }

    const dateRanges = getDateRanges();
    const metrics = {
      searchConsole: {},
      analytics: {},
      coreWebVitals: {},
      comparisons: {
        weekOverWeek: {},
        monthOverMonth: {},
        yearOverYear: {}
      },
      fetchedAt: new Date().toISOString()
    };

    // Fetch Search Console data for all periods
    const searchConsoleProperties = (report.report_properties && Array.isArray(report.report_properties))
      ? report.report_properties.filter((p: any) => p.property_type === 'search_console')
      : [];

    for (const property of searchConsoleProperties) {
      try {
        // Current period
        const currentData = await searchconsole.searchanalytics.query({
          auth: oauth2Client,
          siteUrl: property.property_id,
          requestBody: {
            startDate: dateRanges.current.startDate,
            endDate: dateRanges.current.endDate,
            dimensions: ['date', 'query', 'page'],
            rowLimit: 1000,
            dataState: 'all'
          }
        });

        // Previous week
        const prevWeekData = await searchconsole.searchanalytics.query({
          auth: oauth2Client,
          siteUrl: property.property_id,
          requestBody: {
            startDate: dateRanges.previousWeek.startDate,
            endDate: dateRanges.previousWeek.endDate,
            dimensions: ['date'],
            rowLimit: 100,
            dataState: 'all'
          }
        });

        // Previous month
        const prevMonthData = await searchconsole.searchanalytics.query({
          auth: oauth2Client,
          siteUrl: property.property_id,
          requestBody: {
            startDate: dateRanges.previousMonth.startDate,
            endDate: dateRanges.previousMonth.endDate,
            dimensions: ['date'],
            rowLimit: 100,
            dataState: 'all'
          }
        });

        // Year ago
        const yearAgoData = await searchconsole.searchanalytics.query({
          auth: oauth2Client,
          siteUrl: property.property_id,
          requestBody: {
            startDate: dateRanges.previousYear.startDate,
            endDate: dateRanges.previousYear.endDate,
            dimensions: ['date'],
            rowLimit: 100,
            dataState: 'all'
          }
        });

        // Process and aggregate data
        const processedData = processSearchConsoleData(
          currentData.data,
          prevWeekData.data,
          prevMonthData.data,
          yearAgoData.data
        );

        metrics.searchConsole = {
          ...metrics.searchConsole,
          [property.property_id]: processedData
        };
      } catch (error: any) {
        const quotaCheck = checkApiQuotaError(error);
        if (quotaCheck.isQuotaError) {
          
        } else {
          
        }
      }
    }

    // Fetch Google Analytics data
    const analyticsProperties = (report.report_properties && Array.isArray(report.report_properties))
      ? report.report_properties.filter((p: any) => p.property_type === 'analytics')
      : [];

    for (const property of analyticsProperties) {
      try {
        // Current period metrics
        const currentAnalytics = await analyticsdata.properties.runReport({
          auth: oauth2Client,
          property: `properties/${property.property_id}`,
          requestBody: {
            dateRanges: [{
              startDate: dateRanges.current.startDate,
              endDate: dateRanges.current.endDate
            }],
            dimensions: [
              { name: 'date' },
              { name: 'sessionDefaultChannelGroup' },
              { name: 'landingPage' }
            ],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'newUsers' },
              { name: 'engagedSessions' },
              { name: 'engagementRate' },
              { name: 'bounceRate' },
              { name: 'averageSessionDuration' },
              { name: 'screenPageViews' },
              { name: 'conversions' },
              { name: 'eventCount' }
            ]
          }
        });

        // Previous periods for comparison
        const comparisonAnalytics = await analyticsdata.properties.runReport({
          auth: oauth2Client,
          property: `properties/${property.property_id}`,
          requestBody: {
            dateRanges: [
              {
                startDate: dateRanges.previousWeek.startDate,
                endDate: dateRanges.previousWeek.endDate
              },
              {
                startDate: dateRanges.previousMonth.startDate,
                endDate: dateRanges.previousMonth.endDate
              },
              {
                startDate: dateRanges.previousYear.startDate,
                endDate: dateRanges.previousYear.endDate
              }
            ],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'engagementRate' },
              { name: 'bounceRate' },
              { name: 'conversions' }
            ]
          }
        });

        const processedAnalytics = processAnalyticsData(
          currentAnalytics.data,
          comparisonAnalytics.data
        );

        metrics.analytics = {
          ...metrics.analytics,
          [property.property_id]: processedAnalytics
        };
      } catch (error: any) {
        const quotaCheck = checkApiQuotaError(error);
        if (quotaCheck.isQuotaError) {
          
        } else {
          
        }
      }
    }

    // Calculate comparisons
    metrics.comparisons = calculateComparisons(metrics);

    // Save to database
    const { error: saveError } = await supabase
      .from('report_data')
      .upsert({
        report_id: reportId,
        data_type: 'comprehensive_metrics',
        data: metrics,
        date_range: `${dateRanges.current.startDate} to ${dateRanges.current.endDate}`,
        fetched_at: new Date().toISOString()
      }, {
        onConflict: 'report_id,data_type'
      });

    if (saveError) {
      
    }

    return NextResponse.json(metrics);
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to fetch comprehensive metrics' },
      { status: 500 }
    );
  }
}

function processSearchConsoleData(current: any, prevWeek: any, prevMonth: any, yearAgo: any) {
  // Validate input data
  if (!current || typeof current !== 'object') {
    
    current = { rows: [] };
  }
  if (!prevWeek || typeof prevWeek !== 'object') prevWeek = { rows: [] };
  if (!prevMonth || typeof prevMonth !== 'object') prevMonth = { rows: [] };
  if (!yearAgo || typeof yearAgo !== 'object') yearAgo = { rows: [] };
  
  // Calculate totals and averages
  const currentTotals = calculateTotals(current.rows || []);
  const prevWeekTotals = calculateTotals(prevWeek.rows || []);
  const prevMonthTotals = calculateTotals(prevMonth.rows || []);
  const yearAgoTotals = calculateTotals(yearAgo.rows || []);

  // Extract top queries and pages
  const topQueries = extractTopQueries(current?.rows || []);
  const topPages = extractTopPages(current?.rows || []);

  return {
    current: currentTotals,
    previousWeek: prevWeekTotals,
    previousMonth: prevMonthTotals,
    previousYear: yearAgoTotals,
    topQueries,
    topPages,
    trends: calculateTrends(currentTotals, prevWeekTotals, prevMonthTotals, yearAgoTotals)
  };
}

function calculateTotals(rows: any[]) {
  const totals = {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0
  };

  if (!Array.isArray(rows) || rows.length === 0) return totals;

  let positionSum = 0;
  let positionCount = 0;
  
  rows.forEach(row => {
    if (row && typeof row === 'object') {
      totals.clicks += Number(row.clicks) || 0;
      totals.impressions += Number(row.impressions) || 0;
      
      // Only count position if it's valid (> 0)
      if (row.position && row.position > 0) {
        positionSum += Number(row.position);
        positionCount++;
      }
    }
  });

  if (totals.impressions > 0) {
    totals.ctr = totals.clicks / totals.impressions;
  }

  totals.position = positionCount > 0 ? positionSum / positionCount : 0;

  return totals;
}

function extractTopQueries(rows: any[], limit = 10) {
  const queryMap = new Map();
  
  rows.forEach(row => {
    if (row.keys?.[1]) { // Query is the second dimension
      const query = row.keys[1];
      if (!queryMap.has(query)) {
        queryMap.set(query, {
          query,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
          count: 0
        });
      }
      
      const data = queryMap.get(query);
      data.clicks += row.clicks || 0;
      data.impressions += row.impressions || 0;
      data.position += row.position || 0;
      data.count += 1;
    }
  });

  return Array.from(queryMap.values())
    .map(data => ({
      ...data,
      position: data.count > 0 ? data.position / data.count : 0,
      ctr: calculateCTR(data.clicks, data.impressions) // Fixed: using centralized CTR calculation
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

function extractTopPages(rows: any[], limit = 10) {
  const pageMap = new Map();
  
  rows.forEach(row => {
    if (row.keys?.[2]) { // Page is the third dimension
      const page = row.keys[2];
      if (!pageMap.has(page)) {
        pageMap.set(page, {
          page,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
          count: 0
        });
      }
      
      const data = pageMap.get(page);
      data.clicks += row.clicks || 0;
      data.impressions += row.impressions || 0;
      data.position += row.position || 0;
      data.count += 1;
    }
  });

  return Array.from(pageMap.values())
    .map(data => ({
      ...data,
      position: data.count > 0 ? data.position / data.count : 0,
      ctr: calculateCTR(data.clicks, data.impressions) // Fixed: using centralized CTR calculation
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

function calculateTrends(current: any, prevWeek: any, prevMonth: any, yearAgo: any) {
  return {
    weekOverWeek: {
      clicks: calculateChange(current.clicks, prevWeek.clicks),
      impressions: calculateChange(current.impressions, prevWeek.impressions),
      ctr: calculateChange(current.ctr, prevWeek.ctr),
      position: calculatePositionChange(current.position, prevWeek.position) // Fixed: using proper position change calculation
    },
    monthOverMonth: {
      clicks: calculateChange(current.clicks, prevMonth.clicks),
      impressions: calculateChange(current.impressions, prevMonth.impressions),
      ctr: calculateChange(current.ctr, prevMonth.ctr),
      position: calculatePositionChange(current.position, prevMonth.position) // Fixed
    },
    yearOverYear: {
      clicks: calculateChange(current.clicks, yearAgo.clicks),
      impressions: calculateChange(current.impressions, yearAgo.impressions),
      ctr: calculateChange(current.ctr, yearAgo.ctr),
      position: calculatePositionChange(current.position, yearAgo.position) // Fixed
    }
  };
}

function calculateChange(current: number, previous: number): number {
  // Handle edge cases
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  
  // Calculate percentage change and handle Infinity/NaN
  const change = ((current - previous) / previous) * 100;
  
  if (!isFinite(change)) {
    return 0;
  }
  
  // Cap at reasonable limits (-100% to +1000%)
  return Math.max(-100, Math.min(1000, change));
}

function processAnalyticsData(current: any, comparisons: any) {
  // Process current data
  const currentMetrics = aggregateAnalyticsMetrics(current);
  
  // Process comparison data (3 date ranges) - validate array length
  const comparisonRows = comparisons?.rows || [];
  const prevWeek = comparisonRows[0] || null;
  const prevMonth = comparisonRows[1] || null;
  const yearAgo = comparisonRows[2] || null;
  
  return {
    current: currentMetrics,
    previousWeek: prevWeek ? parseAnalyticsRow(prevWeek) : {},
    previousMonth: prevMonth ? parseAnalyticsRow(prevMonth) : {},
    previousYear: yearAgo ? parseAnalyticsRow(yearAgo) : {},
    byChannel: extractChannelData(current),
    topLandingPages: extractLandingPages(current),
    trends: calculateAnalyticsTrends(currentMetrics, prevWeek, prevMonth, yearAgo)
  };
}

function aggregateAnalyticsMetrics(data: any) {
  const rows = data?.rows || [];
  const totals = {
    sessions: 0,
    users: 0,
    newUsers: 0,
    engagedSessions: 0,
    engagementRate: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    pageViews: 0,
    conversions: 0,
    events: 0
  };

  if (!Array.isArray(rows) || rows.length === 0) return totals;

  let totalSessionDuration = 0;
  let totalBounceRate = 0;
  
  rows.forEach((row: any) => {
    if (row && row.metricValues && Array.isArray(row.metricValues)) {
      const metrics = row.metricValues;
      const sessionCount = parseInt(metrics[0]?.value || '0', 10);
      
      totals.sessions += sessionCount;
      totals.users += parseInt(metrics[1]?.value || '0', 10);
      totals.newUsers += parseInt(metrics[2]?.value || '0', 10);
      totals.engagedSessions += parseInt(metrics[3]?.value || '0', 10);
      
      // For rate metrics, weight by sessions
      const engagementRate = parseFloat(metrics[4]?.value || '0');
      const bounceRate = parseFloat(metrics[5]?.value || '0');
      const avgDuration = parseFloat(metrics[6]?.value || '0');
      
      totalBounceRate += bounceRate * sessionCount;
      totalSessionDuration += avgDuration * sessionCount;
      
      totals.pageViews += parseInt(metrics[7]?.value || '0', 10);
      totals.conversions += parseInt(metrics[8]?.value || '0', 10);
      totals.events += parseInt(metrics[9]?.value || '0', 10);
    }
  });

  // Calculate weighted averages for rate metrics
  if (totals.sessions > 0) {
    totals.engagementRate = totals.engagedSessions / totals.sessions;
    totals.bounceRate = totalBounceRate / totals.sessions;
    totals.avgSessionDuration = totalSessionDuration / totals.sessions;
  }

  return totals;
}

function parseAnalyticsRow(row: any) {
  const metrics = row?.metricValues || [];
  return {
    sessions: parseInt(metrics[0]?.value || 0),
    users: parseInt(metrics[1]?.value || 0),
    engagementRate: parseFloat(metrics[2]?.value || 0),
    bounceRate: parseFloat(metrics[3]?.value || 0),
    conversions: parseInt(metrics[4]?.value || 0)
  };
}

function extractChannelData(data: any) {
  const channelMap = new Map();
  const rows = data?.rows || [];

  rows.forEach((row: any) => {
    const channel = row.dimensionValues?.[1]?.value; // Channel is second dimension
    if (channel && channel !== '(not set)') {
      if (!channelMap.has(channel)) {
        channelMap.set(channel, {
          channel,
          sessions: 0,
          users: 0,
          engagementRate: 0,
          conversions: 0,
          count: 0
        });
      }

      const channelData = channelMap.get(channel);
      const metrics = row.metricValues || [];
      channelData.sessions += parseInt(metrics[0]?.value || 0);
      channelData.users += parseInt(metrics[1]?.value || 0);
      channelData.engagementRate += parseFloat(metrics[4]?.value || 0);
      channelData.conversions += parseInt(metrics[8]?.value || 0);
      channelData.count += 1;
    }
  });

  return Array.from(channelMap.values())
    .map(data => ({
      ...data,
      engagementRate: data.count > 0 ? data.engagementRate / data.count : 0
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

function extractLandingPages(data: any) {
  const pageMap = new Map();
  const rows = data?.rows || [];

  rows.forEach((row: any) => {
    const page = row.dimensionValues?.[2]?.value; // Landing page is third dimension
    if (page) {
      if (!pageMap.has(page)) {
        pageMap.set(page, {
          page,
          sessions: 0,
          users: 0,
          bounceRate: 0,
          conversions: 0,
          count: 0
        });
      }

      const pageData = pageMap.get(page);
      const metrics = row.metricValues || [];
      pageData.sessions += parseInt(metrics[0]?.value || 0);
      pageData.users += parseInt(metrics[1]?.value || 0);
      pageData.bounceRate += parseFloat(metrics[5]?.value || 0);
      pageData.conversions += parseInt(metrics[8]?.value || 0);
      pageData.count += 1;
    }
  });

  return Array.from(pageMap.values())
    .map(data => ({
      ...data,
      bounceRate: data.count > 0 ? data.bounceRate / data.count : 0
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);
}

function calculateAnalyticsTrends(current: any, prevWeek: any, prevMonth: any, yearAgo: any) {
  const prevWeekMetrics = prevWeek ? parseAnalyticsRow(prevWeek) : { sessions: 0, users: 0, engagementRate: 0, conversions: 0 };
  const prevMonthMetrics = prevMonth ? parseAnalyticsRow(prevMonth) : { sessions: 0, users: 0, engagementRate: 0, conversions: 0 };
  const yearAgoMetrics = yearAgo ? parseAnalyticsRow(yearAgo) : { sessions: 0, users: 0, engagementRate: 0, conversions: 0 };

  return {
    weekOverWeek: {
      sessions: calculateChange(current.sessions, prevWeekMetrics.sessions),
      users: calculateChange(current.users, prevWeekMetrics.users),
      engagementRate: calculateChange(current.engagementRate, prevWeekMetrics.engagementRate),
      conversions: calculateChange(current.conversions, prevWeekMetrics.conversions)
    },
    monthOverMonth: {
      sessions: calculateChange(current.sessions, prevMonthMetrics.sessions),
      users: calculateChange(current.users, prevMonthMetrics.users),
      engagementRate: calculateChange(current.engagementRate, prevMonthMetrics.engagementRate),
      conversions: calculateChange(current.conversions, prevMonthMetrics.conversions)
    },
    yearOverYear: {
      sessions: calculateChange(current.sessions, yearAgoMetrics.sessions),
      users: calculateChange(current.users, yearAgoMetrics.users),
      engagementRate: calculateChange(current.engagementRate, yearAgoMetrics.engagementRate),
      conversions: calculateChange(current.conversions, yearAgoMetrics.conversions)
    }
  };
}

function calculateComparisons(metrics: any) {
  // Aggregate all comparisons into a single object
  const comparisons = {
    weekOverWeek: {},
    monthOverMonth: {},
    yearOverYear: {}
  };

  // Merge Search Console comparisons
  Object.values(metrics.searchConsole).forEach((data: any) => {
    if (data.trends) {
      Object.assign(comparisons.weekOverWeek, {
        searchConsole: data.trends.weekOverWeek
      });
      Object.assign(comparisons.monthOverMonth, {
        searchConsole: data.trends.monthOverMonth
      });
      Object.assign(comparisons.yearOverYear, {
        searchConsole: data.trends.yearOverYear
      });
    }
  });

  // Merge Analytics comparisons
  Object.values(metrics.analytics).forEach((data: any) => {
    if (data.trends) {
      Object.assign(comparisons.weekOverWeek, {
        analytics: data.trends.weekOverWeek
      });
      Object.assign(comparisons.monthOverMonth, {
        analytics: data.trends.monthOverMonth
      });
      Object.assign(comparisons.yearOverYear, {
        analytics: data.trends.yearOverYear
      });
    }
  });

  return comparisons;
}