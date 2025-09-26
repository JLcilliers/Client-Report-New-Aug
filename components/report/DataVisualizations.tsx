'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

interface VisualizationProps {
  searchData: any;
  analyticsData: any;
  competitorData?: any;
  chartType?: 'all' | 'search' | 'traffic-bar' | 'traffic-pie' | 'position' | 'ctr';
}

export default function DataVisualizations({ searchData, analyticsData, competitorData, chartType = 'all' }: VisualizationProps) {
  // Transform search console data for charts
  const searchTrendData = searchData?.byDate?.length > 0
    ? searchData.byDate.map((item: any) => {
        const dateKey = item.keys?.[0] || item.date;
        if (!dateKey) return null;

        return {
          date: new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          clicks: item.clicks || 0,
          impressions: item.impressions || 0,
          // Google returns CTR as decimal (0-1), convert to percentage for display
          ctr: ((item.ctr || 0) * 100).toFixed(2),
          position: (item.position || 0).toFixed(1)
        };
      }).filter(Boolean)
    : [];

  // Calculate summary statistics from the search data
  const calculateSummary = () => {
    if (!searchData?.byDate?.length) {
      return {
        totalClicks: 0,
        totalImpressions: 0,
        avgCTR: 0,
        avgPosition: 0
      };
    }

    const totals = searchData.byDate.reduce((acc: any, item: any) => {
      acc.clicks += item.clicks || 0;
      acc.impressions += item.impressions || 0;
      acc.ctrSum += item.ctr || 0;
      acc.positionSum += item.position || 0;
      acc.count += 1;
      return acc;
    }, { clicks: 0, impressions: 0, ctrSum: 0, positionSum: 0, count: 0 });

    return {
      totalClicks: totals.clicks,
      totalImpressions: totals.impressions,
      avgCTR: totals.count > 0 ? totals.ctrSum / totals.count : 0,
      avgPosition: totals.count > 0 ? totals.positionSum / totals.count : 0
    };
  };

  const summary = searchData?.summary || calculateSummary();

  // Transform analytics data for traffic sources
  const trafficSourceData = analyticsData?.trafficSources?.length > 0
    ? analyticsData.trafficSources.map((source: any) => ({
        name: source.source || 'Unknown',
        users: source.users || 0,
        sessions: source.sessions || 0,
        percentage: source.percentage?.toFixed(1) || 
                   (analyticsData.summary?.sessions > 0 
                     ? ((source.sessions / analyticsData.summary.sessions) * 100).toFixed(1)
                     : '0')
      }))
    : [];

  // Competitor comparison data - using mock data for demonstration
  const competitorComparisonData = [
    { metric: 'Visibility', yourSite: 75, competitor1: 65, industry: 70 },
    { metric: 'Keywords', yourSite: 82, competitor1: 78, industry: 75 },
    { metric: 'Backlinks', yourSite: 60, competitor1: 85, industry: 72 },
    { metric: 'Site Speed', yourSite: 88, competitor1: 72, industry: 80 },
    { metric: 'Content', yourSite: 70, competitor1: 80, industry: 76 },
    { metric: 'Technical SEO', yourSite: 85, competitor1: 70, industry: 78 }
  ];

  // Engagement metrics over time - using real analytics data or mock data for demonstration
  const engagementTrendData = analyticsData?.performanceData?.length > 0
    ? analyticsData.performanceData.map((item: any, index: number) => ({
        date: item.date || `Day ${index + 1}`,
        bounceRate: item.bounceRate || 0,
        avgDuration: item.avgSessionDuration || 0,
        pagesPerSession: item.pagesPerSession || 0
      }))
    : searchTrendData.length > 0
    ? searchTrendData.map((item: any) => ({
        date: item.date,
        bounceRate: 35 + Math.random() * 20,  // Mock bounce rate between 35-55%
        avgDuration: 120 + Math.random() * 180, // Mock duration between 120-300 seconds
        pagesPerSession: 2 + Math.random() * 3  // Mock pages between 2-5
      }))
    : [];

  // Colors for charts
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
  };

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.tertiary, COLORS.quaternary, COLORS.purple, COLORS.pink];

  // Custom tooltip for better formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Sparkline component for KPI cards
  const Sparkline = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );

  // Render search performance chart (ONLY Clicks & Impressions)
  if (chartType === 'search') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={searchTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" label={{ value: 'Clicks', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Impressions', angle: 90, position: 'insideRight' }} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="clicks"
            stroke={COLORS.primary}
            strokeWidth={3}
            dot={{ fill: COLORS.primary, r: 4 }}
            activeDot={{ r: 6 }}
            name="Clicks"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="impressions"
            stroke={COLORS.secondary}
            strokeWidth={2}
            dot={{ fill: COLORS.secondary, r: 3 }}
            activeDot={{ r: 5 }}
            name="Impressions"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Render traffic bar chart
  if (chartType === 'traffic-bar') {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={trafficSourceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="sessions" fill={COLORS.primary} radius={[4, 4, 0, 0]}>
            {trafficSourceData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Render traffic pie chart
  if (chartType === 'traffic-pie') {
    return (
      <div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={trafficSourceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="sessions"
            >
              {trafficSourceData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {trafficSourceData.map((entry: any, index: number) => (
            <div key={entry.name} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="truncate">{entry.name}</span>
              <span className="text-gray-500 ml-auto">{entry.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render position chart only (with proper 1-100 scaling)
  if (chartType === 'position') {
    // Calculate proper domain for position data
    const positions = searchTrendData.map((d: any) => parseFloat(d.position)).filter((p: number) => p > 0);
    const minPos = positions.length > 0 ? Math.min(...positions) : 1;
    const maxPos = positions.length > 0 ? Math.max(...positions) : 100;
    const domainMin = Math.max(1, Math.floor(minPos - 2));
    const domainMax = Math.min(100, Math.ceil(maxPos + 2));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={searchTrendData} margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[domainMin, domainMax]}
            tick={{ fontSize: 12 }}
            reversed={true}
            label={{ value: 'Position', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="position"
            stroke={COLORS.tertiary}
            strokeWidth={3}
            dot={{ fill: COLORS.tertiary, r: 4 }}
            activeDot={{ r: 6 }}
            name="Avg Position (lower is better)"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Render CTR chart only
  if (chartType === 'ctr') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={searchTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="ctr"
            stroke={COLORS.purple}
            strokeWidth={3}
            dot={{ fill: COLORS.purple, r: 4 }}
            activeDot={{ r: 6 }}
            name="Click-Through Rate (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Default: render all charts
  return (
    <div className="space-y-6">
      {/* Search Performance Trend - Split into separate charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Search Performance Trends
          </CardTitle>
          <CardDescription>Separate views for better clarity and accurate scaling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Clicks and Impressions Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-gray-700">Clicks & Impressions Over Time</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={searchTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" label={{ value: 'Clicks', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Impressions', angle: 90, position: 'insideRight' }} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="clicks"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    dot={{ fill: COLORS.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Clicks"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="impressions"
                    stroke={COLORS.secondary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.secondary, r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Impressions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Average Position Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-gray-700">Average Position Over Time</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={searchTrendData} margin={{ top: 10, right: 30, left: 60, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#666' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    domain={[0, 'dataMax + 5']}
                    label={{ value: 'Position', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#666' } }}
                    tick={{ fontSize: 11, fill: '#666' }}
                    reversed={true}
                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="position"
                    stroke={COLORS.tertiary}
                    strokeWidth={3}
                    dot={{ fill: COLORS.tertiary, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Avg Position (lower is better)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* CTR Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-gray-700">Click-Through Rate (CTR) Over Time</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={searchTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    label={{ value: 'CTR (%)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ctr"
                    stroke={COLORS.purple}
                    strokeWidth={3}
                    dot={{ fill: COLORS.purple, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Click-Through Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Traffic by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={trafficSourceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sessions" fill={COLORS.primary} radius={[4, 4, 0, 0]}>
                  {trafficSourceData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="w-5 h-5" />
              Traffic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={trafficSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="sessions"
                  >
                    {trafficSourceData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {trafficSourceData.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="truncate">{entry.name}</span>
                    <span className="text-gray-500 ml-auto">{entry.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Comparison Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Competitive Analysis Radar</CardTitle>
          <CardDescription>How you stack up against competitors across key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {competitorComparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={competitorComparisonData}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Your Site"
                  dataKey="yourSite"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Radar
                  name="Competitor 1"
                  dataKey="competitor1"
                  stroke={COLORS.secondary}
                  fill={COLORS.secondary}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Industry Avg"
                  dataKey="industry"
                  stroke={COLORS.tertiary}
                  fill={COLORS.tertiary}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
              <Activity className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium">No competitor data available</p>
              <p className="text-xs text-gray-400 mt-1">Competitor analysis requires external data sources</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Metrics Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Engagement Metrics Trend
          </CardTitle>
          <CardDescription>User engagement patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          {engagementTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="bounceRate"
                  stroke={COLORS.quaternary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.quaternary }}
                  name="Bounce Rate %"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgDuration"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.secondary }}
                  name="Avg Duration (s)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pagesPerSession"
                  stroke={COLORS.purple}
                  strokeWidth={2}
                  dot={{ fill: COLORS.purple }}
                  name="Pages/Session"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <TrendingUp className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium">No engagement data available</p>
              <p className="text-xs text-gray-400 mt-1">Engagement trends will appear after collecting analytics data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mini Sparklines for KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Organic Traffic Trend</p>
            <p className="text-2xl font-bold">
              {summary.totalClicks > 0 ? summary.totalClicks.toLocaleString() : '0'}
            </p>
            {searchTrendData.length > 0 && (
              <Sparkline
                data={searchTrendData.slice(-7)}
                dataKey="clicks"
                color={COLORS.primary}
              />
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">CTR Trend</p>
            <p className="text-2xl font-bold">
              {summary.avgCTR > 0 ? `${(summary.avgCTR * 100).toFixed(1)}%` : '0%'}
            </p>
            {searchTrendData.length > 0 && (
              <Sparkline
                data={searchTrendData.slice(-7)}
                dataKey="ctr"
                color={COLORS.secondary}
              />
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Avg Position</p>
            <p className="text-2xl font-bold">
              {summary.avgPosition > 0 ? summary.avgPosition.toFixed(1) : '0'}
            </p>
            {searchTrendData.length > 0 && (
              <Sparkline
                data={searchTrendData.slice(-7)}
                dataKey="position"
                color={COLORS.tertiary}
              />
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Impressions</p>
            <p className="text-2xl font-bold">
              {summary.totalImpressions > 0
                ? (summary.totalImpressions > 1000
                    ? `${(summary.totalImpressions / 1000).toFixed(1)}K`
                    : summary.totalImpressions.toLocaleString())
                : '0'}
            </p>
            {searchTrendData.length > 0 && (
              <Sparkline
                data={searchTrendData.slice(-7)}
                dataKey="impressions"
                color={COLORS.purple}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}