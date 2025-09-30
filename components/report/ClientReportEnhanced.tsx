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
  DollarSign,
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
const Sparkline = ({ data, color = '#3B82F6' }: { data: number[], color?: string }) => {
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
            className="text-gray-200"
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
          <span className="text-2xl font-bold">{score}</span>
        </div>
      </div>
      <div>
        <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${getColor()}`}>
          {getLabel()}
        </div>
        <p className="text-xs text-gray-600 mt-1">Overall Performance</p>
      </div>
    </div>
  );
};

// Performance Indicator Component
const PerformanceIndicator = ({ value, target, label }: { value: number; target: number; label: string }) => {
  const percentage = (value / target) * 100;
  const status = percentage >= 100 ? 'success' : percentage >= 75 ? 'warning' : 'danger';

  const statusColors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    danger: 'text-red-600 bg-red-50'
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status]}`}>
          {percentage.toFixed(0)}% of target
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value.toLocaleString()}</span>
        <span className="text-sm text-gray-500">/ {target.toLocaleString()}</span>
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
        financial: {
          monthlySpend: 5000,
          roi: 3.2,
          costPerAcquisition: 45.50,
          revenue: 16000,
          budget: 6000,
          budgetUtilized: 83.3
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
    with organic search driving exceptional results. ROI reached ${data.financial.roi}x, exceeding targets by 20%.`;
    setExecutiveSummary(summary);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(Math.round(num));
  const formatPercentage = (num: number) => `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  const calculateChange = (current: number, previous: number) => ((current - previous) / previous * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your enhanced report...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const overallHealthScore = Math.round(
    (data.analytics.totalSessions / 50000) * 30 +
    (data.searchConsole.totalClicks / 15000) * 30 +
    (data.financial.roi / 5) * 40
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
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
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Executive Summary
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-green-700">Top Achievement</span>
                </div>
                <p className="text-sm text-gray-700">Organic traffic increased 23% MoM, exceeding quarterly targets</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-700">Needs Attention</span>
                </div>
                <p className="text-sm text-gray-700">Page load speed affecting mobile conversion rates</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-700">Key Focus</span>
                </div>
                <p className="text-sm text-gray-700">Capitalize on high-performing keywords for Q4 campaigns</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed">
              {executiveSummary}
            </p>
          </div>
        </section>

        {/* Enhanced KPI Dashboard with Comparisons */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Key Performance Indicators - Comparative Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Sessions</span>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold">{formatNumber(data.analytics.totalSessions)}</div>
              <Sparkline data={sessionSparkline} color="#3B82F6" />
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-500">vs Last Month</p>
                  <p className={`text-sm font-semibold ${momSessionChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(momSessionChange)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">vs Last Year</p>
                  <p className={`text-sm font-semibold ${yoySessionChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(yoySessionChange)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Organic Clicks</span>
                <Search className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold">{formatNumber(data.searchConsole.totalClicks)}</div>
              <Sparkline data={clickSparkline} color="#10B981" />
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-500">vs Last Month</p>
                  <p className={`text-sm font-semibold ${momClickChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(momClickChange)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">CTR</p>
                  <p className="text-sm font-semibold">{data.searchConsole.avgCtr.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Conversion Rate</span>
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold">3.8%</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '76%' }}></div>
                </div>
                <span className="text-xs text-gray-600">Target: 5%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-500">vs Last Month</p>
                  <p className="text-sm font-semibold text-green-600">+0.5%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Conversions</p>
                  <p className="text-sm font-semibold">1,719</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">ROI</span>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold">{data.financial.roi}x</div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">20% above target</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="text-sm font-semibold">${formatNumber(data.financial.revenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Spend</p>
                  <p className="text-sm font-semibold">${formatNumber(data.financial.monthlySpend)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Performance & Budget Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Financial Performance & Budget
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Budget Utilization</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Monthly Budget Used</span>
                    <span className="text-sm font-semibold">${formatNumber(data.financial.monthlySpend)} / ${formatNumber(data.financial.budget)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full relative"
                      style={{ width: `${data.financial.budgetUtilized}%` }}
                    >
                      <span className="absolute right-2 top-0 text-xs text-white font-semibold leading-3">
                        {data.financial.budgetUtilized}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">${formatNumber(data.financial.revenue)}</p>
                    <p className="text-xs text-gray-600">Revenue Generated</p>
                  </div>
                  <div className="text-center border-l border-r">
                    <p className="text-2xl font-bold text-blue-600">{data.financial.roi}x</p>
                    <p className="text-xs text-gray-600">Return on Investment</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">${data.financial.costPerAcquisition}</p>
                    <p className="text-xs text-gray-600">Cost per Acquisition</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Investment Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'SEO', value: 35, color: '#3B82F6' },
                      { name: 'Content', value: 25, color: '#10B981' },
                      { name: 'Technical', value: 20, color: '#F59E0B' },
                      { name: 'Link Building', value: 15, color: '#8B5CF6' },
                      { name: 'Tools', value: 5, color: '#EF4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'SEO', value: 35, color: '#3B82F6' },
                      { name: 'Content', value: 25, color: '#10B981' },
                      { name: 'Technical', value: 20, color: '#F59E0B' },
                      { name: 'Link Building', value: 15, color: '#8B5CF6' },
                      { name: 'Tools', value: 5, color: '#EF4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Enhanced Metrics Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-600" />
            Enhanced Performance Metrics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Behavior */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                User Behavior
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pages per Session</span>
                  <span className="font-semibold">{data.analytics.pagesPerSession}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Session Duration</span>
                  <span className="font-semibold">{Math.floor(data.analytics.avgSessionDuration / 60)}:{(data.analytics.avgSessionDuration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bounce Rate</span>
                  <span className="font-semibold">{data.analytics.bounceRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Scroll Depth</span>
                  <span className="font-semibold">73%</span>
                </div>
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-green-500" />
                Core Web Vitals
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">LCP</span>
                  <span className={`font-semibold ${data.coreWebVitals.lcp < 2.5 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {data.coreWebVitals.lcp}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">FID</span>
                  <span className={`font-semibold ${data.coreWebVitals.fid < 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {data.coreWebVitals.fid}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CLS</span>
                  <span className={`font-semibold ${data.coreWebVitals.cls < 0.1 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {data.coreWebVitals.cls}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Performance Score</span>
                  <span className="font-semibold text-green-600">{data.coreWebVitals.performance}/100</span>
                </div>
              </div>
            </div>

            {/* Lead Quality */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Lead Quality Indicators
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Marketing Qualified</span>
                  <span className="font-semibold">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Sales Qualified</span>
                  <span className="font-semibold">42%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversion to Customer</span>
                  <span className="font-semibold">18%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lead Score Avg</span>
                  <span className="font-semibold">7.2/10</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Against Targets */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-red-600" />
            Performance Against Targets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PerformanceIndicator value={45234} target={50000} label="Sessions Target" />
            <PerformanceIndicator value={12543} target={15000} label="Organic Clicks Target" />
            <PerformanceIndicator value={1719} target={2000} label="Conversions Target" />
            <PerformanceIndicator value={16000} target={18000} label="Revenue Target" />
            <PerformanceIndicator value={3.8} target={5} label="Conversion Rate Target (%)" />
            <PerformanceIndicator value={14.2} target={10} label="Avg Position Target" />
          </div>
        </section>

        {/* Competitive Context */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            Competitive Landscape
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Share of Voice</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.competitors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="shareOfVoice" fill="#3B82F6">
                    {data.competitors.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Your Brand' ? '#10B981' : '#94A3B8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Competitive Opportunities</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ChevronRight className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-700">Content Gap</span>
                  </div>
                  <p className="text-sm text-gray-700">15 high-value keywords where competitors rank but you don't</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-700">Link Opportunities</span>
                  </div>
                  <p className="text-sm text-gray-700">23 domains linking to competitors but not to you</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-700">Technical Advantage</span>
                  </div>
                  <p className="text-sm text-gray-700">Your site loads 1.2s faster than industry average</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testing & Optimization Results */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TestTube className="w-6 h-6 text-purple-600" />
            Testing & Optimization Results
          </h2>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold">A/B Tests Completed</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  {data.testing.successfulTests}/{data.testing.testsRun} Successful
                </span>
              </div>
              <p className="text-sm text-gray-600">Average improvement: +{data.testing.avgImprovement}%</p>
            </div>

            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Homepage Hero CTA Test</p>
                    <p className="text-sm text-gray-600">Button color and copy variation</p>
                  </div>
                  <span className="text-green-600 font-semibold">+23% CTR</span>
                </div>
              </div>
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Product Page Layout Test</p>
                    <p className="text-sm text-gray-600">Image placement and size optimization</p>
                  </div>
                  <span className="text-green-600 font-semibold">+18% Conversion</span>
                </div>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Checkout Flow Simplification</p>
                    <p className="text-sm text-gray-600">Reduced form fields and steps</p>
                  </div>
                  <span className="text-yellow-600 font-semibold">+5% Completion</span>
                </div>
              </div>
              <div className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Pop-up Timing Test</p>
                    <p className="text-sm text-gray-600">Exit intent vs time-based trigger</p>
                  </div>
                  <span className="text-red-600 font-semibold">-2% Engagement</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Opportunities */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            Upcoming Opportunities & Market Trends
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Seasonal Opportunities</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Black Friday prep (45 days)</li>
                <li>• Holiday shopping season</li>
                <li>• Q4 budget allocation</li>
                <li>• Year-end reporting prep</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Trend className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Trending Keywords</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• "AI-powered" (+380% search volume)</li>
                <li>• "sustainable" (+120% search volume)</li>
                <li>• "remote work tools" (+85% search volume)</li>
                <li>• "automation software" (+65% search volume)</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Industry Events</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
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
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Strategic Recommendations - Priority Matrix
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-red-700">High Priority - Quick Wins</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Do First</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    <span>Fix mobile page speed issues (2-day effort, +15% conversion impact)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    <span>Optimize top 10 landing pages for Core Web Vitals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    <span>Implement schema markup on product pages</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-yellow-700">Medium Priority - Strategic</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Plan Next</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span>Develop content hub for trending topics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span>Launch competitor gap analysis campaign</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span>Expand link building to industry publications</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Impact vs Effort Matrix</h3>
              <div className="relative h-64 bg-gray-50 rounded">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">High Impact</div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">Low Impact</div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 -rotate-90">Low Effort</div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 -rotate-90">High Effort</div>

                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div className="border-r border-b border-gray-300 p-2">
                    <div className="text-xs font-semibold text-green-600">Quick Wins</div>
                    <div className="mt-1 space-y-1">
                      <div className="text-xs bg-green-100 rounded px-1 py-0.5">Speed Fix</div>
                      <div className="text-xs bg-green-100 rounded px-1 py-0.5">Schema</div>
                    </div>
                  </div>
                  <div className="border-b border-gray-300 p-2">
                    <div className="text-xs font-semibold text-blue-600">Major Projects</div>
                    <div className="mt-1 space-y-1">
                      <div className="text-xs bg-blue-100 rounded px-1 py-0.5">Site Redesign</div>
                    </div>
                  </div>
                  <div className="border-r border-gray-300 p-2">
                    <div className="text-xs font-semibold text-gray-600">Fill-ins</div>
                    <div className="mt-1 space-y-1">
                      <div className="text-xs bg-gray-100 rounded px-1 py-0.5">Meta Updates</div>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-semibold text-yellow-600">Consider Later</div>
                    <div className="mt-1 space-y-1">
                      <div className="text-xs bg-yellow-100 rounded px-1 py-0.5">New Markets</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Scorecard */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            Performance Scorecard
          </h2>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-700">Trend</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Organic Performance</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-green-600">A</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Excellent</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowUp className="w-4 h-4 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">23% growth MoM</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Technical SEO</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-yellow-600">B</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Good</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Minus className="w-4 h-4 text-gray-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">Mobile speed needs improvement</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Content Quality</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-green-600">A</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Excellent</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowUp className="w-4 h-4 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">High engagement metrics</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">User Experience</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-yellow-600">B</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Good</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowUp className="w-4 h-4 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">Bounce rate improving</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">Conversion Rate</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-orange-600">C</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Needs Work</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowDown className="w-4 h-4 text-red-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">Below target by 24%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t pt-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-center">
            <div>
              <p className="font-semibold text-gray-700">Next Review Date</p>
              <p className="text-sm text-gray-600">{format(subMonths(currentDate, -1), 'MMMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Report Prepared By</p>
              <p className="text-sm text-gray-600">Your Account Team</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Questions?</p>
              <p className="text-sm text-gray-600">Contact your account manager</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            © {new Date().getFullYear()} - Confidential and Proprietary
          </p>
        </div>
      </div>
    </div>
  );
}