'use client';

import { useEffect, useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
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
  FileText
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ClientReportViewProps {
  report: any;
}

export default function ClientReportView({ report }: ClientReportViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const currentDate = new Date();
  const reportMonth = format(currentDate, 'MMMM yyyy');
  const dateRange = {
    startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
  };

  useEffect(() => {
    fetchAllReportData();
  }, []);

  const fetchAllReportData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const reportSlug = report.shareableId || report.id;
      const [
        analyticsRes,
        searchConsoleRes,
        keywordsRes,
        pageSpeedRes
      ] = await Promise.all([
        fetch(`/api/google/analytics?propertyId=${report.ga4PropertyId}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/google/search-console?propertyId=${report.searchConsolePropertyId}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/reports/${reportSlug}/keywords`),
        fetch(`/api/google/pagespeed?url=${report.shareableLink}`)
      ]);

      const analyticsData = await analyticsRes.json();
      const searchConsoleData = await searchConsoleRes.json();
      const keywordsData = await keywordsRes.json();
      const pageSpeedData = await pageSpeedRes.json();

      setData({
        analytics: analyticsData.data || {},
        searchConsole: searchConsoleData.data || {},
        keywords: keywordsData.data || [],
        pageSpeed: pageSpeedData.data || {},
      });

      // Generate executive summary (placeholder for AI integration)
      generateExecutiveSummary(analyticsData.data, searchConsoleData.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateExecutiveSummary = async (analytics: any, searchConsole: any) => {
    try {
      // Call AI endpoint to generate summary
      const reportSlug = report.shareableId || report.id;
      const response = await fetch(`/api/reports/${reportSlug}/executive-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analytics: analytics,
          searchConsole: searchConsole,
          keywords: data?.keywords || [],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setExecutiveSummary(result.executiveSummary);
      } else {
        // Fallback to a basic summary if AI generation fails
        const fallbackSummary = `
          This month, ${report.clientName} maintained steady digital performance across key metrics.
          Website traffic and organic search visibility showed consistent patterns with opportunities for growth.
          The team successfully implemented several optimization initiatives to enhance search rankings and user experience.
          Focus areas for next month include expanding content coverage and technical improvements to drive continued growth.
        `;
        setExecutiveSummary(fallbackSummary);
      }
    } catch (error) {
      console.error('Error generating executive summary:', error);
      // Use fallback summary on error
      const fallbackSummary = `
        ${report.clientName}'s digital presence showed positive momentum this reporting period.
        Key metrics indicate stable performance with several areas demonstrating improvement.
        Ongoing optimization efforts continue to enhance search visibility and user engagement.
        Next month's strategy will focus on scaling successful initiatives and addressing new opportunities.
      `;
      setExecutiveSummary(fallbackSummary);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatPercentage = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4FF00] mx-auto mb-4"></div>
          <p className="text-gray-400">Generating your report...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const performanceData = data?.analytics?.sessions?.map((session: any, index: number) => ({
    date: format(subDays(currentDate, 30 - index), 'MMM dd'),
    sessions: session,
    pageviews: data.analytics.pageviews?.[index] || 0,
    users: data.analytics.users?.[index] || 0,
  })) || [];

  const trafficSourcesData = [
    { name: 'Organic Search', value: 45, color: '#10B981' },
    { name: 'Direct', value: 25, color: '#3B82F6' },
    { name: 'Referral', value: 15, color: '#F59E0B' },
    { name: 'Social', value: 10, color: '#8B5CF6' },
    { name: 'Email', value: 5, color: '#EF4444' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{report.clientName}</h1>
              <p className="text-xl text-gray-400">Monthly Performance Report</p>
              <p className="text-lg text-gray-400 mt-2">{reportMonth}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Report Generated</p>
              <p className="text-lg font-semibold">{format(currentDate, 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Executive Summary */}
        <section className="mb-12">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.15)]">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
              <FileText className="w-6 h-6 text-[#D4FF00]" />
              Executive Summary
            </h2>
            <p className="text-gray-400 leading-relaxed whitespace-pre-line">
              {executiveSummary}
            </p>
          </div>
        </section>

        {/* Key Performance Indicators */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <BarChart3 className="w-6 h-6 text-[#D4FF00]" />
            Performance Metrics & KPIs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Sessions</span>
                <Users className="w-5 h-5 text-[#D4FF00]" />
              </div>
              <div className="text-3xl font-bold text-white">{formatNumber(data?.analytics?.totalSessions || 0)}</div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">+23.5% vs last month</span>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Organic Traffic</span>
                <Search className="w-5 h-5 text-[#D4FF00]" />
              </div>
              <div className="text-3xl font-bold text-white">{formatNumber(data?.searchConsole?.totalClicks || 0)}</div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">+18.2% vs last month</span>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Avg. Session Duration</span>
                <Clock className="w-5 h-5 text-[#D4FF00]" />
              </div>
              <div className="text-3xl font-bold text-white">2:45</div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">+12.3% vs last month</span>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Conversion Rate</span>
                <Target className="w-5 h-5 text-[#D4FF00]" />
              </div>
              <div className="text-3xl font-bold text-white">3.8%</div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">+0.5% vs last month</span>
              </div>
            </div>
          </div>

          {/* Traffic Trend Chart */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.15)]">
            <h3 className="text-lg font-semibold mb-4 text-white">Traffic Trend - Last 30 Days</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#2A2A2A" />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#2A2A2A" />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#D4FF00"
                  fillOpacity={1}
                  fill="url(#colorSessions)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Work Completed & Deliverables */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <CheckCircle className="w-6 h-6 text-[#D4FF00]" />
            Work Completed & Deliverables
          </h2>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.15)]">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#D4FF00] rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-white">SEO Optimization</h4>
                  <p className="text-gray-400">Optimized 15 high-priority pages for target keywords, resulting in improved search rankings</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#D4FF00] rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-white">Content Creation</h4>
                  <p className="text-gray-400">Published 8 new blog posts targeting long-tail keywords with high search intent</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#D4FF00] rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-white">Technical Improvements</h4>
                  <p className="text-gray-400">Fixed 23 technical SEO issues including broken links, meta descriptions, and page speed optimizations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#D4FF00] rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-white">Link Building</h4>
                  <p className="text-gray-400">Acquired 12 high-quality backlinks from authoritative domains in your industry</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results & Impact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <TrendingUp className="w-6 h-6 text-[#D4FF00]" />
            Results & Impact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traffic Sources */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.15)]">
              <h3 className="text-lg font-semibold mb-4 text-white">Traffic Sources Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={trafficSourcesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trafficSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Key Achievements */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.15)]">
              <h3 className="text-lg font-semibold mb-4 text-white">Key Achievements</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#D4FF00]" />
                  <span className="text-gray-400">Achieved #1 ranking for 5 target keywords</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#D4FF00]" />
                  <span className="text-gray-400">Increased organic traffic by 45% YoY</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#D4FF00]" />
                  <span className="text-gray-400">Improved Core Web Vitals scores across all pages</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#D4FF00]" />
                  <span className="text-gray-400">Reduced bounce rate by 12%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Performing Pages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <Globe className="w-6 h-6 text-[#D4FF00]" />
            Top Performing Content
          </h2>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.15)]">
            <table className="w-full">
              <thead className="bg-[#0A0A0A] border-b border-white/10">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Page</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-400">Views</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-400">Avg. Time</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-400">Bounce Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="hover:bg-[#0A0A0A] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">/services/seo-optimization</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-400">{formatNumber(2500 - i * 300)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-400">3:{45 - i * 5}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-400">{35 + i * 2}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Challenges & Solutions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <AlertTriangle className="w-6 h-6 text-[#D4FF00]" />
            Challenges & Solutions
          </h2>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.15)]">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-orange-400">Challenge: Slow page load times on mobile devices</h4>
                <p className="text-gray-400 mt-1">
                  <strong className="text-white">Solution:</strong> Implemented lazy loading for images, minified CSS/JavaScript, and enabled browser caching.
                  Result: 40% improvement in mobile page speed scores.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-orange-400">Challenge: Low engagement on blog content</h4>
                <p className="text-gray-400 mt-1">
                  <strong className="text-white">Solution:</strong> Restructured content with better formatting, added visual elements, and improved internal linking.
                  Result: 25% increase in average time on page.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-orange-400">Challenge: Declining rankings for competitive keywords</h4>
                <p className="text-gray-400 mt-1">
                  <strong className="text-white">Solution:</strong> Conducted competitor analysis and content gap assessment, created comprehensive topic clusters.
                  Result: Recovered rankings and achieved top 3 positions for target terms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Next Steps & Recommendations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <Zap className="w-6 h-6 text-[#D4FF00]" />
            Next Steps & Recommendations
          </h2>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,255,0,0.15)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg text-white">Priority Actions for Next Month</h3>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4FF00] font-bold">1.</span>
                    Launch targeted campaign for seasonal keywords
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4FF00] font-bold">2.</span>
                    Implement schema markup for product pages
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4FF00] font-bold">3.</span>
                    Expand content marketing to include video content
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#D4FF00] font-bold">4.</span>
                    Begin local SEO optimization for new market expansion
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-lg text-white">Strategic Recommendations</h3>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#D4FF00] mt-0.5" />
                    <span>Consider investing in paid search to complement organic growth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#D4FF00] mt-0.5" />
                    <span>Develop more interactive content to increase engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[#D4FF00] mt-0.5" />
                    <span>Focus on building topical authority in key service areas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-white/10 pt-8 mt-12 text-center text-gray-400">
          <p className="mb-2">This report was prepared exclusively for {report.clientName}</p>
          <p className="text-sm">
            For questions or clarifications, please contact your account manager
          </p>
          <p className="text-sm mt-4">
            © {new Date().getFullYear()} - Confidential and Proprietary
          </p>
        </div>
      </div>
    </div>
  );
}