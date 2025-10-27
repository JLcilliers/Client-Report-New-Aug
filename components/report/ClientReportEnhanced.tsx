'use client';

import { useEffect, useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, subYears, parseISO } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointerClick,
  Target,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Activity,
  Globe,
  Search,
  Zap,
  Award,
  BarChart3,
  Clock,
  FileText,
  AlertCircle,
  Info,
  ChevronRight,
  Minus,
  TrendingUp as Trend,
  Shield,
  Gauge,
  Trophy,
  Lightbulb,
  TestTube,
  Star
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { ClientReport, ReportCache } from '@prisma/client';

// Sparkline Component
const Sparkline = ({ data, color = '#72a3bf' }: { data: number[], color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const height = 50;
  const width = 120;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block ml-2">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

// Health Score Component with enhanced gradient and animation
const HealthScore = ({ score }: { score: number }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setAnimatedScore(Math.min(Math.round(currentStep * increment), score));
      } else {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getGradientColors = () => {
    if (score >= 80) return { from: '#10b981', to: '#72a3bf' };
    if (score >= 60) return { from: '#eab308', to: '#72a3bf' };
    if (score >= 40) return { from: '#f97316', to: '#72a3bf' };
    return { from: '#ef4444', to: '#72a3bf' };
  };

  const getLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Attention';
    return 'Critical';
  };

  const getLabelColor = () => {
    if (score >= 80) return 'from-green-500 to-glacier';
    if (score >= 60) return 'from-yellow-500 to-glacier';
    if (score >= 40) return 'from-orange-500 to-glacier';
    return 'from-red-500 to-glacier';
  };

  const gradientColors = getGradientColors();
  const circumference = 2 * Math.PI * 60;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="60"
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-white/10"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors.from} />
              <stop offset="100%" stopColor={gradientColors.to} />
            </linearGradient>
          </defs>
          <circle
            cx="80"
            cy="80"
            r="60"
            stroke="url(#scoreGradient)"
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-300 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-4xl font-bold text-white">{animatedScore}</span>
          <span className="text-xs text-white/70 mt-1">out of 100</span>
        </div>
      </div>
      <div>
        <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${getLabelColor()} text-white text-base font-bold shadow-lg`}>
          {getLabel()}
        </div>
        <p className="text-sm text-white/90 mt-2">Overall Performance</p>
      </div>
    </div>
  );
};

// Performance Indicator Component
const PerformanceIndicator = ({ value, target, label }: { value: number; target: number; label: string }) => {
  const percentage = (value / target) * 100;
  const status = percentage >= 100 ? 'success' : percentage >= 75 ? 'warning' : 'danger';

  const statusColors = {
    success: 'text-green-600 bg-green-500/20',
    warning: 'text-yellow-600 bg-yellow-500/20',
    danger: 'text-red-600 bg-red-500/20'
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status]}`}>
          {percentage.toFixed(0)}% of target
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</span>
        <span className="text-sm text-gray-400">/ {target.toLocaleString()}</span>
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${status === 'success' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Formatting utility functions
const formatNumber = (value: number, decimals: number = 0): string => {
  if (!value && value !== 0) return '0';
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatPercentage = (value: number, decimals: number = 1, convertFromDecimal: boolean = false): string => {
  if (!value && value !== 0) return decimals === 2 ? '0.00%' : '0.0%';
  const displayValue = convertFromDecimal ? value * 100 : value;
  return `${displayValue.toFixed(decimals)}%`;
};

const formatDuration = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatMetric = (value: number, unit: string, decimals: number = 1): string => {
  if (!value && value !== 0) return `0${unit}`;
  if (unit === 'ms') return `${Math.round(value)}${unit}`;
  if (unit === '' && decimals === 3) return value.toFixed(3);
  return `${value.toFixed(decimals)}${unit}`;
};

const formatPercentageChange = (current: number, previous: number, absolute = false): string => {
  if (!previous || previous === 0) return '0.0%';
  if (!current && current !== 0) return '0.0%';
  let change = ((current - previous) / previous * 100);
  if (absolute) change = Math.abs(change);
  return `${change.toFixed(1)}%`;
};

// Helper functions for default data structures
const getDefaultAnalytics = () => ({
  summary: {
    users: 0,
    sessions: 0,
    pageviews: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    newUsers: 0
  },
  trafficSources: [],
  topPages: [],
  dailyData: [],
  lastMonth: {
    totalUsers: 0,
    totalPageviews: 0
  }
});

const getDefaultSearchConsole = () => ({
  summary: {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0
  },
  topQueries: [],
  topPages: [],
  byDate: [],
  lastMonth: {
    totalClicks: 0,
    totalImpressions: 0,
    avgCtr: 0,
    avgPosition: 0
  }
});

const getDefaultPagespeed = () => ({
  performanceScore: 0,
  metrics: {
    fcp: 0,
    lcp: 0,
    cls: 0,
    tti: 0,
    tbt: 0,
    si: 0
  }
});

interface ClientReportEnhancedProps {
  report: ClientReport & {
    cache?: ReportCache[]
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function ClientReportEnhanced({ report }: ClientReportEnhancedProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch data from the public API route
        const response = await fetch(`/api/public/report/${report.shareableId || report.id}/data`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch report data')
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching report data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load report data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [report.shareableId, report.id])

  // Helper functions for formatting
  const formatNumber = (num: number): string => {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (value: number, decimals: number = 1, convertFromDecimal: boolean = false): string => {
    if (!value && value !== 0) return decimals === 2 ? '0.00%' : '0.0%';
    const displayValue = convertFromDecimal ? value * 100 : value;
    return `${displayValue.toFixed(decimals)}%`;
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading report data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <h2 className="text-red-800 font-semibold text-xl mb-2">Error Loading Report</h2>
            <p className="text-red-600">{error || 'Unable to load report data'}</p>
          </div>
          <p className="text-gray-600">Please contact support if this issue persists.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white py-16 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {report.clientName} - Performance Report
            </h1>
          </div>
          <p className="text-blue-100 text-lg max-w-3xl">
            Comprehensive analytics and insights for your website performance
          </p>
          {data.last_updated && (
            <p className="text-blue-200 text-sm mt-4">
              Last updated: {formatDate(data.last_updated)}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Search Console Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Clicks</h3>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(data.search_console?.summary?.clicks || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">From search results</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Impressions</h3>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(data.search_console?.summary?.impressions || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Times shown in search</p>
          </div>

          {/* Analytics Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Users</h3>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(data.analytics?.summary?.users || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Unique visitors</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Pageviews</h3>
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(data.analytics?.summary?.pageviews || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Total page views</p>
          </div>
        </div>

        {/* Additional Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Click-Through Rate</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatPercentage(data.search_console?.summary?.ctr || 0, 2, true)}</p>
            <p className="text-xs text-gray-500 mt-1">Search result CTR</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg. Position</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{(data.search_console?.summary?.position || 0).toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">In search results</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Bounce Rate</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatPercentage(data.analytics?.summary?.bounceRate || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Visitor bounce rate</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg. Session</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatDuration(data.analytics?.summary?.avgSessionDuration || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Session duration</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Traffic Sources Chart */}
          {data.analytics?.trafficSources && data.analytics.trafficSources.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
              <h3 className="font-semibold text-lg mb-4 text-gray-900">Traffic Sources</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.analytics.trafficSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.source}: ${entry.percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="sessions"
                  >
                    {data.analytics.trafficSources.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Search Console Performance Chart */}
          {data.search_console?.byDate && data.search_console.byDate.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
              <h3 className="font-semibold text-lg mb-4 text-gray-900">Search Performance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.search_console.byDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="keys[0]"
                    tickFormatter={(value) => {
                      try {
                        return format(parseISO(value), 'MMM d')
                      } catch {
                        return value
                      }
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      try {
                        return format(parseISO(value), 'MMM d, yyyy')
                      } catch {
                        return value
                      }
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="clicks" stroke="#0088FE" name="Clicks" />
                  <Line type="monotone" dataKey="impressions" stroke="#00C49F" name="Impressions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Pages from Analytics */}
        {data.analytics?.topPages && data.analytics.topPages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Top Pages by Traffic</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Page</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sessions</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Users</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Bounce Rate</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg. Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.analytics.topPages.slice(0, 10).map((page: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-md truncate">{page.page}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatNumber(page.sessions)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatNumber(page.users)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatPercentage(page.bounceRate)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatDuration(page.avgSessionDuration)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Queries */}
        {data.search_console?.topQueries && data.search_console.topQueries.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Top Search Queries</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Query</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Clicks</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Impressions</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">CTR</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {data.search_console.topQueries.slice(0, 10).map((query: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900">{query.keys?.[0] || query.query}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatNumber(query.clicks)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatNumber(query.impressions)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatPercentage(query.ctr || 0, 1, true)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{(query.position || 0).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Pages from Search Console */}
        {data.search_console?.topPages && data.search_console.topPages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Top Pages in Search Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Page</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Clicks</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Impressions</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">CTR</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {data.search_console.topPages.slice(0, 10).map((page: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-md truncate">{page.keys?.[0] || page.page}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatNumber(page.clicks)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatNumber(page.impressions)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{formatPercentage(page.ctr || 0, 1, true)}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-700">{(page.position || 0).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Core Web Vitals */}
        {data.pagespeed && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Core Web Vitals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LCP */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Largest Contentful Paint</p>
                <p className="text-3xl font-bold text-gray-900">
                {data.pagespeed?.mobile?.coreWebVitals?.LCP || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const lcpValue = data.pagespeed?.mobile?.coreWebVitals?.LCP;
                    if (!lcpValue || lcpValue === 'N/A') return '—';
                    const lcp = parseFloat(lcpValue) * 1000; // Convert seconds to milliseconds
                    return lcp <= 2500 ? '✓ Good' : lcp <= 4000 ? '⚠ Needs Improvement' : '✗ Poor';
                  })()}
                </p>
              </div>

              {/* FID */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">First Input Delay</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.pagespeed?.mobile?.coreWebVitals?.FID || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                {(() => {
                 const fidValue = data.pagespeed?.mobile?.coreWebVitals?.FID;
                    if (!fidValue || fidValue === 'N/A') return '—';
                  const fid = parseFloat(fidValue);
                  return fid <= 100 ? '✓ Good' : fid <= 300 ? '⚠ Needs Improvement' : '✗ Poor';
                })()}
              </p>
              </div>

              {/* CLS */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Cumulative Layout Shift</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.pagespeed?.mobile?.coreWebVitals?.CLS || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const clsValue = data.pagespeed?.mobile?.coreWebVitals?.CLS;
                    if (!clsValue || clsValue === 'N/A') return '—';
                    const cls = parseFloat(clsValue);
                    return cls <= 0.1 ? '✓ Good' : cls <= 0.25 ? '⚠ Needs Improvement' : '✗ Poor';
                  })()}
                </p>
              </div>
            </div>

            {/* Performance Score */}
            {data.pagespeed?.mobile?.lighthouse?.performance !== undefined && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Performance Score</p>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={data.pagespeed?.mobile?.lighthouse?.performance >= 90 ? '#10b981' : 
                             data.pagespeed?.mobile?.lighthouse?.performance >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(data.pagespeed?.mobile?.lighthouse?.performance / 100) * 351.86} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {Math.round(data.pagespeed?.mobile?.lighthouse?.performance)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 text-sm">
            Report generated by Search Insights Hub
          </p>
          {data.date_range && (
            <p className="text-gray-500 text-xs mt-2">
              Data period: {formatDate(data.date_range.start)} - {formatDate(data.date_range.end)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
