'use client';

import { useEffect, useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, subYears } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
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

interface ClientReportEnhancedProps {
  report: any;
}

// Sparkline Component
const Sparkline = ({ data, color = '#72a3bf' }: { data: number[], color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const height = 30;
  const width = 80;

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

// Health Score Component
const HealthScore = ({ score }: { score: number }) => {
  const getColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Attention';
    return 'Critical';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-white/10"
          />
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${(score / 100) * 226} 226`}
            className={`${getColor().replace('bg-', 'text-')} transition-all duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{score}</span>
        </div>
      </div>
      <div>
        <div className={`inline-block px-3 py-1 rounded-full text-gray-900 text-sm font-semibold ${getColor()}`}>
          {getLabel()}
        </div>
        <p className="text-xs text-gray-400 mt-1">Overall Performance</p>
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

export default function ClientReportEnhanced({ report }: ClientReportEnhancedProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const currentDate = new Date();
  const reportMonth = format(currentDate, 'MMMM yyyy');
  const dateRange = {
    startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
  };

  // Calculate comparative periods
  const lastMonth = subMonths(currentDate, 1);
  const lastYear = subYears(currentDate, 1);

  useEffect(() => {
    fetchAllReportData();
  }, []);

  const fetchAllReportData = async () => {
    try {
      setLoading(true);

      // Simulated data fetch (replace with actual API calls)
      const mockData = {
        analytics: {
          totalSessions: 45234,
          totalUsers: 28456,
          totalPageviews: 123456,
          bounceRate: 42.3,
          avgSessionDuration: 165,
          pagesPerSession: 2.7,
          lastMonth: {
            totalSessions: 38500,
            totalUsers: 24200,
            totalPageviews: 105000,
          },
          lastYear: {
            totalSessions: 32000,
            totalUsers: 20100,
            totalPageviews: 87000,
          }
        },
        searchConsole: {
          totalClicks: 12543,
          totalImpressions: 234567,
          avgCtr: 5.35,
          avgPosition: 14.2,
          lastMonth: {
            totalClicks: 10200,
            totalImpressions: 198000,
            avgCtr: 5.15,
            avgPosition: 15.8,
          }
        },
        competitors: [
          { name: 'Competitor A', shareOfVoice: 35, trend: 'up' },
          { name: 'Competitor B', shareOfVoice: 28, trend: 'down' },
          { name: 'Your Brand', shareOfVoice: 22, trend: 'up' },
          { name: 'Competitor C', shareOfVoice: 15, trend: 'stable' }
        ],
        coreWebVitals: {
          lcp: 2.1,
          fid: 85,
          cls: 0.05,
          performance: 92
        },
        testing: {
          testsRun: 4,
          successfulTests: 3,
          avgImprovement: 15.5
        }
      };

      setData(mockData);

      // Generate executive summary
      generateExecutiveSummary(mockData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateExecutiveSummary = (data: any) => {
    const summary = `This month delivered strong performance across all key metrics with significant year-over-year growth.
    Website traffic increased by ${((data.analytics.totalSessions - data.analytics.lastMonth.totalSessions) / data.analytics.lastMonth.totalSessions * 100).toFixed(1)}% compared to last month,
    with organic search driving exceptional results.`;
    setExecutiveSummary(summary);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(Math.round(num));
  const formatPercentage = (num: number) => `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  const calculateChange = (current: number, previous: number) => ((current - previous) / previous * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#72a3bf] mx-auto mb-4"></div>
          <p className="text-gray-400">Generating your enhanced report...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const overallHealthScore = Math.round(
    (data.analytics.totalSessions / 50000) * 50 +
    (data.searchConsole.totalClicks / 15000) * 50
  );

  const momSessionChange = calculateChange(data.analytics.totalSessions, data.analytics.lastMonth.totalSessions);
  const yoySessionChange = calculateChange(data.analytics.totalSessions, data.analytics.lastYear.totalSessions);
  const momClickChange = calculateChange(data.searchConsole.totalClicks, data.searchConsole.lastMonth.totalClicks);

  // Sample sparkline data
  const sessionSparkline = [32000, 35000, 38500, 37000, 39000, 42000, 45234];
  const clickSparkline = [9000, 9500, 10200, 10800, 11500, 12000, 12543];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-glacier to-marine text-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{report.clientName}</h1>
              <p className="text-xl opacity-90">Monthly Performance Report</p>
              <p className="text-lg opacity-80 mt-2">{reportMonth}</p>
            </div>
            <HealthScore score={overallHealthScore} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Executive Summary */}
        <section className="mb-12">
          <div className="bg-white border border-gray-200 rounded-xl p-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <FileText className="w-6 h-6 text-[#72a3bf]" />
              Executive Summary
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-green-400">Top Achievement</span>
                </div>
                <p className="text-sm text-gray-400">Organic traffic increased 23% MoM, exceeding quarterly targets</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-400">Needs Attention</span>
                </div>
                <p className="text-sm text-gray-400">Page load speed affecting mobile conversion rates</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-[#72a3bf]" />
                  <span className="font-semibold text-[#72a3bf]">Key Focus</span>
                </div>
                <p className="text-sm text-gray-400">Capitalize on high-performing keywords for Q4 campaigns</p>
              </div>
            </div>

            <p className="text-gray-400 leading-relaxed">
              {executiveSummary}
            </p>
          </div>
        </section>

        {/* Enhanced KPI Dashboard with Comparisons */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-6 h-6 text-[#72a3bf]" />
            Key Performance Indicators - Comparative Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)] transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Sessions</span>
                <Users className="w-5 h-5 text-[#72a3bf]" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatNumber(data.analytics.totalSessions)}</div>
              <Sparkline data={sessionSparkline} color="#72a3bf" />
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-400">vs Last Month</p>
                  <p className={`text-sm font-semibold ${momSessionChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(momSessionChange)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">vs Last Year</p>
                  <p className={`text-sm font-semibold ${yoySessionChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(yoySessionChange)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)] transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Organic Clicks</span>
                <Search className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatNumber(data.searchConsole.totalClicks)}</div>
              <Sparkline data={clickSparkline} color="#10B981" />
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-400">vs Last Month</p>
                  <p className={`text-sm font-semibold ${momClickChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(momClickChange)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">CTR</p>
                  <p className="text-sm font-semibold text-gray-900">{data.searchConsole.avgCtr.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)] transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Conversion Rate</span>
                <Target className="w-5 h-5 text-[#72a3bf]" />
              </div>
              <div className="text-3xl font-bold text-gray-900">3.8%</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-[#72a3bf] h-2 rounded-full" style={{ width: '76%' }}></div>
                </div>
                <span className="text-xs text-gray-400">Target: 5%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-400">vs Last Month</p>
                  <p className="text-sm font-semibold text-green-500">+0.5%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Conversions</p>
                  <p className="text-sm font-semibold text-gray-900">1,719</p>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* Enhanced Metrics Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Activity className="w-6 h-6 text-[#72a3bf]" />
            Enhanced Performance Metrics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Behavior */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <Users className="w-5 h-5 text-[#72a3bf]" />
                User Behavior
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Pages per Session</span>
                  <span className="font-semibold text-gray-900">{data.analytics.pagesPerSession}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Avg. Session Duration</span>
                  <span className="font-semibold text-gray-900">{Math.floor(data.analytics.avgSessionDuration / 60)}:{(data.analytics.avgSessionDuration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Bounce Rate</span>
                  <span className="font-semibold text-gray-900">{data.analytics.bounceRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Scroll Depth</span>
                  <span className="font-semibold text-gray-900">73%</span>
                </div>
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <Gauge className="w-5 h-5 text-green-500" />
                Core Web Vitals
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">LCP</span>
                  <span className={`font-semibold ${data.coreWebVitals.lcp < 2.5 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {data.coreWebVitals.lcp}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">FID</span>
                  <span className={`font-semibold ${data.coreWebVitals.fid < 100 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {data.coreWebVitals.fid}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">CLS</span>
                  <span className={`font-semibold ${data.coreWebVitals.cls < 0.1 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {data.coreWebVitals.cls}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Performance Score</span>
                  <span className="font-semibold text-green-500">{data.coreWebVitals.performance}/100</span>
                </div>
              </div>
            </div>

            {/* Lead Quality */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <Star className="w-5 h-5 text-yellow-500" />
                Lead Quality Indicators
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Marketing Qualified</span>
                  <span className="font-semibold text-gray-900">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Sales Qualified</span>
                  <span className="font-semibold text-gray-900">42%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Conversion to Customer</span>
                  <span className="font-semibold text-gray-900">18%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Lead Score Avg</span>
                  <span className="font-semibold text-gray-900">7.2/10</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Against Targets */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Target className="w-6 h-6 text-[#72a3bf]" />
            Performance Against Targets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PerformanceIndicator value={45234} target={50000} label="Sessions Target" />
            <PerformanceIndicator value={12543} target={15000} label="Organic Clicks Target" />
            <PerformanceIndicator value={1719} target={2000} label="Conversions Target" />
            <PerformanceIndicator value={3.8} target={5} label="Conversion Rate Target (%)" />
            <PerformanceIndicator value={14.2} target={10} label="Avg Position Target" />
          </div>
        </section>

        {/* Competitive Context */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Trophy className="w-6 h-6 text-[#72a3bf]" />
            Competitive Landscape
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Share of Voice</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.competitors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1d4052', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Bar dataKey="shareOfVoice" fill="#72a3bf">
                    {data.competitors.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Your Brand' ? '#72a3bf' : '#555'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Competitive Opportunities</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ChevronRight className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-green-400">Content Gap</span>
                  </div>
                  <p className="text-sm text-gray-400">15 high-value keywords where competitors rank but you don't</p>
                </div>
                <div className="p-3 bg-[#72a3bf]/10 border border-[#72a3bf]/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ChevronRight className="w-4 h-4 text-[#72a3bf]" />
                    <span className="font-semibold text-[#72a3bf]">Link Opportunities</span>
                  </div>
                  <p className="text-sm text-gray-400">23 domains linking to competitors but not to you</p>
                </div>
                <div className="p-3 bg-glacier/10 border border-glacier/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ChevronRight className="w-4 h-4 text-glacier" />
                    <span className="font-semibold text-glacier">Technical Advantage</span>
                  </div>
                  <p className="text-sm text-gray-400">Your site loads 1.2s faster than industry average</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testing & Optimization Results */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <TestTube className="w-6 h-6 text-[#72a3bf]" />
            Testing & Optimization Results
          </h2>

          <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900">A/B Tests Completed</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold border border-green-500/30">
                  {data.testing.successfulTests}/{data.testing.testsRun} Successful
                </span>
              </div>
              <p className="text-sm text-gray-400">Average improvement: +{data.testing.avgImprovement}%</p>
            </div>

            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-500/5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Homepage Hero CTA Test</p>
                    <p className="text-sm text-gray-400">Button color and copy variation</p>
                  </div>
                  <span className="text-green-400 font-semibold">+23% CTR</span>
                </div>
              </div>
              <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-500/5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Product Page Layout Test</p>
                    <p className="text-sm text-gray-400">Image placement and size optimization</p>
                  </div>
                  <span className="text-green-400 font-semibold">+18% Conversion</span>
                </div>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-500/5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Checkout Flow Simplification</p>
                    <p className="text-sm text-gray-400">Reduced form fields and steps</p>
                  </div>
                  <span className="text-yellow-400 font-semibold">+5% Completion</span>
                </div>
              </div>
              <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-500/5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Pop-up Timing Test</p>
                    <p className="text-sm text-gray-400">Exit intent vs time-based trigger</p>
                  </div>
                  <span className="text-red-400 font-semibold">-2% Engagement</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Opportunities */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Lightbulb className="w-6 h-6 text-[#72a3bf]" />
            Upcoming Opportunities & Market Trends
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-[#72a3bf]/20 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#72a3bf]" />
                <h3 className="font-semibold text-gray-900">Seasonal Opportunities</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Black Friday prep (45 days)</li>
                <li>• Holiday shopping season</li>
                <li>• Q4 budget allocation</li>
                <li>• Year-end reporting prep</li>
              </ul>
            </div>

            <div className="bg-white border border-green-500/20 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2 mb-3">
                <Trend className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Trending Keywords</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• "AI-powered" (+380% search volume)</li>
                <li>• "sustainable" (+120% search volume)</li>
                <li>• "remote work tools" (+85% search volume)</li>
                <li>• "automation software" (+65% search volume)</li>
              </ul>
            </div>

            <div className="bg-white border border-marine/20 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(68,110,135,0.15)]">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-marine" />
                <h3 className="font-semibold text-gray-900">Industry Events</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Industry Conference (Nov 15-17)</li>
                <li>• Product launch window</li>
                <li>• Partner webinar series</li>
                <li>• Awards submission deadline</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Recommendations with Priority Matrix */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Zap className="w-6 h-6 text-[#72a3bf]" />
            Strategic Recommendations - Priority Matrix
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-red-400">High Priority - Quick Wins</span>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">Do First</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-red-400 mt-0.5" />
                    <span>Fix mobile page speed issues (2-day effort, +15% conversion impact)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-red-400 mt-0.5" />
                    <span>Optimize top 10 landing pages for Core Web Vitals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-red-400 mt-0.5" />
                    <span>Implement schema markup on product pages</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-yellow-400">Medium Priority - Strategic</span>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">Plan Next</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <span>Develop content hub for trending topics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <span>Launch competitor gap analysis campaign</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <span>Expand link building to industry publications</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
              <h3 className="font-semibold mb-4 text-gray-900">Impact vs Effort Matrix</h3>
              <div className="relative h-64 bg-gray-50 border border-gray-200 rounded">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">High Impact</div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">Low Impact</div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 -rotate-90">Low Effort</div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 -rotate-90">High Effort</div>

                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div className="border-r border-b border-gray-200 p-2">
                    <div className="text-xs font-semibold text-green-400">Quick Wins</div>
                    <div className="mt-1 space-y-1">
                      <div className="text-xs bg-green-500/20 border border-green-500/30 rounded px-1 py-0.5 text-green-400">Speed Fix</div>
                      <div className="text-xs bg-green-500/20 border border-green-500/30 rounded px-1 py-0.5 text-green-400">Schema</div>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 p-2">
                    <div className="text-xs font-semibold text-[#72a3bf]">Major Projects</div>
                    <div className="mt-1 space-y-1">
                      <div className="text-xs bg-[#72a3bf]/20 border border-[#72a3bf]/30 rounded px-1 py-0.5 text-[#72a3bf]">Site Redesign</div>
                    </div>
                  </div>
                  <div className="border-r border-gray-200 p-2">
                    <div className="text-xs font-semibold text-gray-400">Fill-ins</div>
                    <div className="mt-1 space-y-1">
                      <div className="text-xs bg-gray-200 border border-gray-300 rounded px-1 py-0.5 text-gray-400">Meta Updates</div>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-semibold text-yellow-400">Consider Later</div>
                    <div className="mt-1 space-y-1">
                      <div className="text-xs bg-yellow-500/20 border border-yellow-500/30 rounded px-1 py-0.5 text-yellow-400">New Markets</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Scorecard */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Shield className="w-6 h-6 text-[#72a3bf]" />
            Performance Scorecard
          </h2>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(114,163,191,0.15)]">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Category</th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Score</th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Status</th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Trend</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Organic Performance</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-green-400">A</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">Excellent</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowUp className="w-4 h-4 text-green-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">23% growth MoM</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Technical SEO</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-yellow-400">B</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-500/30">Good</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Minus className="w-4 h-4 text-gray-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">Mobile speed needs improvement</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Content Quality</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-green-400">A</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">Excellent</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowUp className="w-4 h-4 text-green-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">High engagement metrics</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">User Experience</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-yellow-400">B</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-500/30">Good</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowUp className="w-4 h-4 text-green-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">Bounce rate improving</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Conversion Rate</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-orange-400">C</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-semibold border border-orange-500/30">Needs Work</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowDown className="w-4 h-4 text-red-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">Below target by 24%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-center">
            <div>
              <p className="font-semibold text-gray-900">Next Review Date</p>
              <p className="text-sm text-gray-400">{format(subMonths(currentDate, -1), 'MMMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Report Prepared By</p>
              <p className="text-sm text-gray-400">Your Account Team</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Questions?</p>
              <p className="text-sm text-gray-400">Contact your account manager</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            © {new Date().getFullYear()} - Confidential and Proprietary
          </p>
        </div>
      </div>
    </div>
  );
}