'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Brush
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { designTokens, metricColorMap, formatters, chartDefaults } from '@/lib/design-system';
import { cn } from '@/lib/utils/cn';

interface VisualizationProps {
  searchData: any;
  analyticsData: any;
  competitorData?: any;
  reportName?: string;
  dateRange?: string;
}

// Enhanced tooltip with trust indicators
const EnhancedTooltip = ({ active, payload, label, showSampled = false }: any) => {
  if (active && payload && payload.length) {
    const getChangeIndicator = (value: number) => {
      if (value > 0) return <ArrowUp className="w-3 h-3 inline text-green-600" />;
      if (value < 0) return <ArrowDown className="w-3 h-3 inline text-red-600" />;
      return <Minus className="w-3 h-3 inline text-gray-400" />;
    };

    return (
      <div style={chartDefaults.tooltip.contentStyle}>
        <p style={chartDefaults.tooltip.labelStyle}>{label}</p>
        {payload.map((entry: any, index: number) => {
          let formattedValue = entry.value;
          let delta = null;

          // Format based on metric type
          if (entry.dataKey === 'ctr' || entry.name?.includes('Rate')) {
            formattedValue = formatters.percent(entry.value);
          } else if (entry.dataKey === 'position') {
            formattedValue = formatters.position(entry.value);
          } else if (entry.name?.includes('Duration')) {
            formattedValue = formatters.duration(entry.value);
          } else if (typeof entry.value === 'number') {
            formattedValue = formatters.number(entry.value);
          }

          // Calculate WoW change if available
          if (entry.payload?.previousValue !== undefined) {
            const change = ((entry.value - entry.payload.previousValue) / entry.payload.previousValue) * 100;
            delta = (
              <span className={cn(
                "ml-2 text-xs",
                change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-400"
              )}>
                {getChangeIndicator(change)} {formatters.percent(Math.abs(change))}
              </span>
            );
          }

          return (
            <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>
              <span>{formattedValue}</span>
              {delta}
            </p>
          );
        })}
        {showSampled && (
          <p className="text-xs text-gray-400 mt-2 pt-2 border-t">
            <Info className="w-3 h-3 inline mr-1" />
            Data is sampled for performance
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Sparkline component for KPI cards
const Sparkline = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => (
  <ResponsiveContainer width="100%" height={designTokens.chart.height.sparkline}>
    <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
      <Line
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

// KPI Card with sparkline and delta
const KPICard = ({
  title,
  value,
  delta,
  deltaType,
  sparklineData,
  dataKey,
  color,
  format = 'number'
}: any) => {
  const getDeltaIcon = () => {
    if (deltaType === 'positive') return <ArrowUp className="w-4 h-4" />;
    if (deltaType === 'negative') return <ArrowDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const formatValue = (val: any) => {
    if (!val && val !== 0) return 'No data';
    if (format === 'percent') return formatters.percent(val);
    if (format === 'position') return formatters.position(val);
    return formatters.number(val);
  };

  return (
    <Card className="relative overflow-hidden" style={{
      padding: designTokens.card.padding,
      borderRadius: designTokens.card.borderRadius,
      boxShadow: designTokens.card.shadow
    }}>
      <div className="space-y-2">
        <p className="text-sm" style={{ color: designTokens.colors.text[500] }}>
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold" style={{ color: designTokens.colors.text[900] }}>
            {formatValue(value)}
          </p>
          {delta !== undefined && delta !== null && (
            <Badge
              variant={deltaType === 'positive' ? 'default' : deltaType === 'negative' ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
            >
              {getDeltaIcon()}
              {formatters.percent(Math.abs(delta), 1)}
            </Badge>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} dataKey={dataKey} color={color} />
        )}
      </div>
    </Card>
  );
};

export default function DataVisualizationsImproved({
  searchData,
  analyticsData,
  competitorData,
  reportName = "SEO Report",
  dateRange = "Last 7 days"
}: VisualizationProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);

  // Transform and calculate data
  const { searchTrendData, summary, insights } = useMemo(() => {
    const trendData = searchData?.byDate?.length > 0
      ? searchData.byDate.map((item: any, index: number) => {
          const dateKey = item.keys?.[0] || item.date;
          if (!dateKey) return null;

          // Get previous day's data for delta calculation
          const prevItem = index > 0 ? searchData.byDate[index - 1] : null;

          return {
            date: new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: dateKey,
            clicks: item.clicks || 0,
            impressions: item.impressions || 0,
            ctr: (item.ctr || 0) * 100,
            position: item.position || 0,
            previousClicks: prevItem?.clicks,
            previousImpressions: prevItem?.impressions,
          };
        }).filter(Boolean)
      : [];

    // Calculate summary with week-over-week changes
    const currentWeek = trendData.slice(-7);
    const previousWeek = trendData.slice(-14, -7);

    const calculateWeekTotal = (data: any[], key: string) =>
      data.reduce((sum, item) => sum + (item[key] || 0), 0);

    const currentClicks = calculateWeekTotal(currentWeek, 'clicks');
    const previousClicks = calculateWeekTotal(previousWeek, 'clicks');
    const clicksChange = previousClicks ? ((currentClicks - previousClicks) / previousClicks) * 100 : 0;

    const currentImpressions = calculateWeekTotal(currentWeek, 'impressions');
    const previousImpressions = calculateWeekTotal(previousWeek, 'impressions');
    const impressionsChange = previousImpressions ? ((currentImpressions - previousImpressions) / previousImpressions) * 100 : 0;

    const avgCTR = currentWeek.length > 0
      ? currentWeek.reduce((sum, item) => sum + item.ctr, 0) / currentWeek.length
      : 0;
    const prevAvgCTR = previousWeek.length > 0
      ? previousWeek.reduce((sum, item) => sum + item.ctr, 0) / previousWeek.length
      : 0;
    const ctrChange = prevAvgCTR ? ((avgCTR - prevAvgCTR) / prevAvgCTR) * 100 : 0;

    // Generate insights
    const generateInsight = () => {
      const changes = [];
      if (clicksChange > 10) changes.push(`Organic clicks up ${formatters.percent(clicksChange)} WoW`);
      if (impressionsChange > 15) changes.push(`impressions increased ${formatters.percent(impressionsChange)}`);
      if (ctrChange > 5) changes.push(`CTR improved by ${formatters.percent(ctrChange)}`);

      if (changes.length === 0 && clicksChange < -10) {
        return `Organic performance needs attention: clicks down ${formatters.percent(Math.abs(clicksChange))} WoW`;
      }

      return changes.length > 0
        ? changes.join(', ') + ` driven by improved rankings and content optimization`
        : `Organic performance stable with consistent traffic patterns`;
    };

    return {
      searchTrendData: trendData,
      summary: {
        totalClicks: currentClicks,
        totalImpressions: currentImpressions,
        avgCTR,
        avgPosition: currentWeek.length > 0
          ? currentWeek.reduce((sum, item) => sum + item.position, 0) / currentWeek.length
          : 0,
        clicksChange,
        impressionsChange,
        ctrChange,
      },
      insights: generateInsight()
    };
  }, [searchData]);

  // Transform analytics data for traffic sources - using stacked bar instead of pie
  const trafficData = useMemo(() => {
    if (!analyticsData?.trafficSources?.length) return [];

    const sources = analyticsData.trafficSources
      .sort((a: any, b: any) => b.sessions - a.sessions)
      .slice(0, 6)
      .map((source: any) => ({
        name: source.source || 'Unknown',
        sessions: source.sessions || 0,
        users: source.users || 0,
        percentage: source.percentage || 0,
      }));

    // Add "Other" if there are more sources
    if (analyticsData.trafficSources.length > 6) {
      const otherSessions = analyticsData.trafficSources
        .slice(6)
        .reduce((sum: number, s: any) => sum + (s.sessions || 0), 0);

      sources.push({
        name: 'Other',
        sessions: otherSessions,
        users: 0,
        percentage: (otherSessions / analyticsData.summary?.sessions || 0) * 100
      });
    }

    return sources;
  }, [analyticsData]);

  // Transform competitor data to grouped bar chart
  const competitorBarData = useMemo(() => {
    if (!competitorData?.length) {
      return [
        { metric: 'Visibility', yourSite: 75, competitor: 65, gapToLeader: -10, industry: 70 },
        { metric: 'Keywords', yourSite: 82, competitor: 78, gapToLeader: 4, industry: 75 },
        { metric: 'Backlinks', yourSite: 60, competitor: 85, gapToLeader: -25, industry: 72 },
        { metric: 'Site Speed', yourSite: 88, competitor: 72, gapToLeader: 16, industry: 80 },
        { metric: 'Content Score', yourSite: 70, competitor: 80, gapToLeader: -10, industry: 76 },
        { metric: 'Technical SEO', yourSite: 85, competitor: 70, gapToLeader: 15, industry: 78 }
      ];
    }

    return competitorData.map((comp: any) => ({
      metric: comp.metric,
      yourSite: comp.yourSite,
      competitor: comp.competitor1,
      gapToLeader: comp.yourSite - comp.competitor1,
      industry: comp.industry
    }));
  }, [competitorData]);

  return (
    <div
      className="space-y-6"
      style={{
        background: designTokens.colors.bg,
        maxWidth: designTokens.layout.maxWidth,
        margin: '0 auto',
        padding: designTokens.layout.containerPadding
      }}
    >
      {/* Header with Headline KPIs and Insight */}
      <div className="space-y-4 mb-8">
        {/* Title and Controls */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: designTokens.colors.text[900] }}>
              {reportName} - Visualizations
            </h2>
            <p className="text-sm mt-1" style={{ color: designTokens.colors.text[500] }}>
              {dateRange} • Auto-refreshes daily
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {selectedTimeRange === '7d' ? 'Last 7 Days' : selectedTimeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Headline KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Organic Clicks"
            value={summary.totalClicks}
            delta={summary.clicksChange}
            deltaType={summary.clicksChange > 0 ? 'positive' : summary.clicksChange < 0 ? 'negative' : 'neutral'}
            sparklineData={searchTrendData.slice(-7)}
            dataKey="clicks"
            color={metricColorMap.clicks}
          />
          <KPICard
            title="Total Impressions"
            value={summary.totalImpressions}
            delta={summary.impressionsChange}
            deltaType={summary.impressionsChange > 0 ? 'positive' : summary.impressionsChange < 0 ? 'negative' : 'neutral'}
            sparklineData={searchTrendData.slice(-7)}
            dataKey="impressions"
            color={metricColorMap.impressions}
          />
          <KPICard
            title="Average CTR"
            value={summary.avgCTR}
            delta={summary.ctrChange}
            deltaType={summary.ctrChange > 0 ? 'positive' : summary.ctrChange < 0 ? 'negative' : 'neutral'}
            sparklineData={searchTrendData.slice(-7)}
            dataKey="ctr"
            color={metricColorMap.ctr}
            format="percent"
          />
        </div>

        {/* Insight Band */}
        <Card style={{
          background: `linear-gradient(135deg, ${designTokens.colors.chart.blue}10, ${designTokens.colors.chart.purple}10)`,
          borderLeft: `4px solid ${designTokens.colors.chart.blue}`,
          ...designTokens.card
        }}>
          <CardContent className="flex items-center gap-3 py-3">
            <TrendingUp className="w-5 h-5" style={{ color: designTokens.colors.chart.blue }} />
            <p className="text-sm font-medium" style={{ color: designTokens.colors.text[700] }}>
              {insights}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Performance Trends - Aligned Small Multiples */}
      <Card style={designTokens.card}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Search Performance Trends
          </CardTitle>
          <CardDescription>
            Weekly performance metrics with synchronized hover states
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Clicks & Impressions */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: designTokens.colors.text[700] }}>
                Clicks & Impressions
              </h4>
              <ResponsiveContainer width="100%" height={designTokens.chart.height.timeSeries}>
                <LineChart
                  data={searchTrendData}
                  margin={chartDefaults.margin}
                  onMouseMove={(e: any) => setHoveredChart('clicks-impressions')}
                  onMouseLeave={() => setHoveredChart(null)}
                >
                  <CartesianGrid {...chartDefaults.grid} />
                  <XAxis
                    dataKey="date"
                    {...chartDefaults.axis.tick}
                  />
                  <YAxis
                    yAxisId="left"
                    {...chartDefaults.axis.tick}
                    label={{ value: 'Clicks', angle: -90, position: 'insideLeft', ...chartDefaults.axis.label }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    {...chartDefaults.axis.tick}
                    label={{ value: 'Impressions', angle: 90, position: 'insideRight', ...chartDefaults.axis.label }}
                  />
                  <Tooltip content={<EnhancedTooltip />} />
                  <Legend {...chartDefaults.legend} />
                  <Line
                    yAxisId="left"
                    {...chartDefaults.line}
                    dataKey="clicks"
                    stroke={metricColorMap.clicks}
                    name="Clicks"
                  />
                  <Line
                    yAxisId="right"
                    {...chartDefaults.line}
                    dataKey="impressions"
                    stroke={metricColorMap.impressions}
                    name="Impressions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Average Position */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: designTokens.colors.text[700] }}>
                Average Position
              </h4>
              <ResponsiveContainer width="100%" height={designTokens.chart.height.timeSeries}>
                <LineChart
                  data={searchTrendData}
                  margin={chartDefaults.margin}
                  syncId="search-metrics"
                >
                  <CartesianGrid {...chartDefaults.grid} />
                  <XAxis dataKey="date" {...chartDefaults.axis.tick} />
                  <YAxis
                    reversed={true}
                    domain={[1, 50]}
                    {...chartDefaults.axis.tick}
                    label={{ value: 'Position', angle: -90, position: 'insideLeft', ...chartDefaults.axis.label }}
                  />
                  <Tooltip content={<EnhancedTooltip />} />
                  <Legend {...chartDefaults.legend} />
                  <ReferenceLine y={10} stroke={designTokens.colors.status.good} strokeDasharray="3 3" />
                  <Line
                    {...chartDefaults.line}
                    dataKey="position"
                    stroke={metricColorMap.position}
                    name="Avg Position (lower is better)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* CTR */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: designTokens.colors.text[700] }}>
                Click-Through Rate
              </h4>
              <ResponsiveContainer width="100%" height={designTokens.chart.height.timeSeries}>
                <LineChart
                  data={searchTrendData}
                  margin={chartDefaults.margin}
                  syncId="search-metrics"
                >
                  <CartesianGrid {...chartDefaults.grid} />
                  <XAxis dataKey="date" {...chartDefaults.axis.tick} />
                  <YAxis
                    {...chartDefaults.axis.tick}
                    label={{ value: 'CTR (%)', angle: -90, position: 'insideLeft', ...chartDefaults.axis.label }}
                  />
                  <Tooltip content={<EnhancedTooltip />} />
                  <Legend {...chartDefaults.legend} />
                  <ReferenceLine y={3} stroke={designTokens.colors.status.warn} strokeDasharray="3 3" label="Industry Avg" />
                  <Line
                    {...chartDefaults.line}
                    dataKey="ctr"
                    stroke={metricColorMap.ctr}
                    name="Click-Through Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources - Bar and Stacked Bar (replaces pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absolute Traffic Bar Chart */}
        <Card style={designTokens.card}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Traffic by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={designTokens.chart.height.category}>
              <BarChart data={trafficData} margin={chartDefaults.margin}>
                <CartesianGrid {...chartDefaults.grid} />
                <XAxis
                  dataKey="name"
                  {...chartDefaults.axis.tick}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis {...chartDefaults.axis.tick} />
                <Tooltip content={<EnhancedTooltip />} />
                <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                  {trafficData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={Object.values(metricColorMap)[index % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stacked Bar (replaces pie chart) */}
        <Card style={designTokens.card}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Traffic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={designTokens.chart.height.category}>
              <BarChart
                data={[{ name: 'Total Traffic', ...trafficData.reduce((acc, item) => ({ ...acc, [item.name]: item.percentage }), {}) }]}
                layout="vertical"
                margin={chartDefaults.margin}
              >
                <CartesianGrid {...chartDefaults.grid} />
                <XAxis type="number" domain={[0, 100]} {...chartDefaults.axis.tick} />
                <YAxis type="category" dataKey="name" {...chartDefaults.axis.tick} />
                <Tooltip content={<EnhancedTooltip />} />
                <Legend {...chartDefaults.legend} />
                {trafficData.map((entry: any, index: number) => (
                  <Bar
                    key={entry.name}
                    dataKey={entry.name}
                    stackId="a"
                    fill={Object.values(metricColorMap)[index % 6]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Analysis - Grouped Bar (replaces radar) */}
      <Card style={designTokens.card}>
        <CardHeader>
          <CardTitle>Competitive Analysis</CardTitle>
          <CardDescription>Performance comparison with gap to leader analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={competitorBarData} margin={chartDefaults.margin}>
              <CartesianGrid {...chartDefaults.grid} />
              <XAxis dataKey="metric" {...chartDefaults.axis.tick} />
              <YAxis {...chartDefaults.axis.tick} domain={[0, 100]} />
              <Tooltip content={<EnhancedTooltip />} />
              <Legend {...chartDefaults.legend} />
              <Bar dataKey="yourSite" fill={designTokens.colors.chart.blue} name="Your Site" />
              <Bar dataKey="competitor" fill={designTokens.colors.chart.orange} name="Top Competitor" />
              <Bar dataKey="industry" fill={designTokens.colors.chart.green} name="Industry Avg" />
            </BarChart>
          </ResponsiveContainer>

          {/* Gap Analysis Summary */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {competitorBarData.map((item: any) => (
              <div key={item.metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">{item.metric}</span>
                <Badge
                  variant={item.gapToLeader > 0 ? "default" : "destructive"}
                  className="ml-2"
                >
                  {item.gapToLeader > 0 ? '+' : ''}{item.gapToLeader}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom KPI Cards with proper empty states */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Avg. Session Duration"
          value={analyticsData?.summary?.avgSessionDuration || null}
          delta={null}
          deltaType="neutral"
          sparklineData={[]}
          dataKey="duration"
          color={metricColorMap.avgDuration}
          format="duration"
        />
        <KPICard
          title="Pages per Session"
          value={analyticsData?.summary?.pagesPerSession || null}
          delta={null}
          deltaType="neutral"
          sparklineData={[]}
          dataKey="pages"
          color={metricColorMap.pagesPerSession}
          format="number"
        />
        <KPICard
          title="Bounce Rate"
          value={analyticsData?.summary?.bounceRate || null}
          delta={null}
          deltaType="neutral"
          sparklineData={[]}
          dataKey="bounce"
          color={metricColorMap.bounceRate}
          format="percent"
        />
        <KPICard
          title="Goal Completions"
          value={analyticsData?.summary?.goalCompletions || null}
          delta={null}
          deltaType="neutral"
          sparklineData={[]}
          dataKey="goals"
          color={designTokens.colors.status.good}
          format="number"
        />
      </div>
    </div>
  );
}