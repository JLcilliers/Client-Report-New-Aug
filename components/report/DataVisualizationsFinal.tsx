'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  ReferenceArea,
  Brush,
  LabelList
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
  RefreshCw,
  Link2,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { designTokens, metricColorMap, formatters, chartDefaults } from '@/lib/design-system';
import { cn } from '@/lib/utils/cn';

interface VisualizationProps {
  searchData: any;
  analyticsData: any;
  competitorData?: any;
  reportName?: string;
  dateRange?: string;
  chartType?: 'all' | 'search' | 'traffic-bar' | 'traffic-pie' | 'position' | 'ctr';
  propertyName?: string;
}

// Get responsive chart height
const getChartHeight = () => {
  if (typeof window === 'undefined') return designTokens.chart.height.timeSeries.desktop;
  const width = window.innerWidth;
  if (width >= 1440) return designTokens.chart.height.timeSeries.desktop;
  if (width >= 1024) return designTokens.chart.height.timeSeries.laptop;
  return designTokens.chart.height.timeSeries.tablet;
};

// Enhanced tooltip with better formatting and deltas
const EnhancedTooltip = ({ active, payload, label, showSampled = false }: any) => {
  if (active && payload && payload.length) {
    const getChangeIndicator = (value: number) => {
      if (value > 0) return <ArrowUp className="w-3 h-3 inline" style={{ color: designTokens.colors.status.good }} />;
      if (value < 0) return <ArrowDown className="w-3 h-3 inline" style={{ color: designTokens.colors.status.bad }} />;
      return <Minus className="w-3 h-3 inline" style={{ color: designTokens.colors.text[500] }} />;
    };

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border" style={{ borderColor: designTokens.colors.gridline }}>
        <p className="font-semibold text-sm mb-2" style={{ color: designTokens.colors.text[900] }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => {
          let formattedValue = entry.value;
          let unit = '';
          let delta = null;

          // Format based on metric type
          if (entry.dataKey === 'ctr' || entry.name?.includes('CTR') || entry.name?.includes('Rate')) {
            formattedValue = formatters.percent(entry.value);
            unit = '';
          } else if (entry.dataKey === 'position' || entry.name?.includes('Position')) {
            formattedValue = formatters.position(entry.value);
            unit = '';
          } else if (entry.name?.includes('Duration')) {
            formattedValue = formatters.duration(entry.value);
            unit = '';
          } else if (typeof entry.value === 'number') {
            formattedValue = formatters.number(entry.value);
            unit = entry.unit || '';
          }

          // Calculate WoW change if available
          if (entry.payload?.previousValue !== undefined && entry.payload?.previousValue !== null) {
            const change = ((entry.value - entry.payload.previousValue) / entry.payload.previousValue) * 100;
            const deltaColor = change > 0 ? designTokens.colors.status.good :
                              change < 0 ? designTokens.colors.status.bad :
                              designTokens.colors.text[500];
            delta = (
              <span className="ml-2 text-xs" style={{ color: deltaColor }}>
                {getChangeIndicator(change)} {formatters.delta(change)}
              </span>
            );
          }

          return (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span style={{ color: designTokens.colors.text[700] }}>{entry.name}:</span>
              </span>
              <span className="font-medium tabular-nums" style={{ color: designTokens.colors.text[900] }}>
                {formattedValue}{unit}
                {delta}
              </span>
            </div>
          );
        })}
        {showSampled && (
          <div className="mt-2 pt-2 border-t text-xs flex items-center gap-1" style={{
            borderColor: designTokens.colors.gridline,
            color: designTokens.colors.text[500]
          }}>
            <Info className="w-3 h-3" />
            Data is sampled for performance
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Improved KPI Card with better layout and empty states
const KPICard = ({
  title,
  value,
  delta,
  deltaType,
  sparklineData,
  dataKey,
  color,
  format = 'number',
  loading = false,
  emptyMessage = 'Not available for selected period',
  emptyAction = 'Change filters',
  onEmptyClick
}: any) => {
  const hasData = value !== null && value !== undefined;

  const formatValue = (val: any) => {
    if (!hasData) return null;
    if (format === 'percent') return formatters.percent(val);
    if (format === 'position') return formatters.position(val);
    return formatters.number(val);
  };

  const getDeltaPill = () => {
    if (!delta && delta !== 0) return null;

    const Icon = deltaType === 'positive' ? ArrowUp : deltaType === 'negative' ? ArrowDown : Minus;
    const bgColor = deltaType === 'positive' ? `${designTokens.colors.status.good}15` :
                    deltaType === 'negative' ? `${designTokens.colors.status.bad}15` :
                    `${designTokens.colors.text[500]}15`;
    const textColor = deltaType === 'positive' ? designTokens.colors.status.good :
                      deltaType === 'negative' ? designTokens.colors.status.bad :
                      designTokens.colors.text[500];

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium tabular-nums"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <Icon className="w-3 h-3" />
        {formatters.delta(Math.abs(delta))} WoW
      </span>
    );
  };

  // Enhanced sparkline with last value label
  const EnhancedSparkline = ({ data, dataKey, color }: any) => (
    <ResponsiveContainer width="100%" height={designTokens.chart.height.sparkline}>
      <LineChart data={data} margin={{ top: 0, right: 25, bottom: 0, left: 0 }}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
        {/* Last value dot and label */}
        {data && data.length > 0 && (
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={0}
            dot={(props: any) => {
              if (props.index === data.length - 1) {
                return (
                  <g>
                    <circle cx={props.cx} cy={props.cy} r={3} fill={color} />
                    <text
                      x={props.cx + 8}
                      y={props.cy}
                      fill={designTokens.colors.text[700]}
                      fontSize={10}
                      textAnchor="start"
                      dominantBaseline="middle"
                      className="tabular-nums"
                    >
                      {formatters.number(props.payload[dataKey])}
                    </text>
                  </g>
                );
              }
              return <g />;
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Card
      className="relative overflow-hidden h-full"
      style={{
        padding: designTokens.card.padding,
        borderRadius: designTokens.card.borderRadius,
        boxShadow: designTokens.card.shadow,
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      {hasData ? (
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: designTokens.colors.text[500] }}>
            {title}
          </p>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl font-bold" style={{ color: designTokens.colors.text[900] }}>
              {formatValue(value)}
            </p>
            {getDeltaPill()}
          </div>
          {sparklineData && sparklineData.length > 0 && (
            <EnhancedSparkline data={sparklineData} dataKey={dataKey} color={color} />
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <p className="text-sm font-medium mb-2" style={{ color: designTokens.colors.text[500] }}>
            {title}
          </p>
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
            <AlertCircle className="w-5 h-5 mb-2" style={{ color: designTokens.colors.text[400] }} />
            <p className="text-xs" style={{ color: designTokens.colors.text[500] }}>
              {emptyMessage}
            </p>
            {onEmptyClick && (
              <button
                onClick={onEmptyClick}
                className="text-xs mt-1 underline hover:no-underline"
                style={{ color: designTokens.colors.chart.blue }}
              >
                {emptyAction}
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// Custom axis tick with color coding for dual axis
const ColoredAxisTick = ({ x, y, payload, fill }: any) => (
  <text x={x} y={y} fill={fill} textAnchor="end" fontSize={designTokens.chart.tickLabelSize}>
    {payload.value}
  </text>
);

// Weekend shading component
const WeekendShading = ({ data }: { data: any[] }) => {
  const weekends = data.filter((item, index) => {
    const date = new Date(item.fullDate || item.date);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  });

  return (
    <>
      {weekends.map((weekend, index) => (
        <ReferenceArea
          key={`weekend-${index}`}
          x1={weekend.date}
          x2={weekend.date}
          fill={designTokens.colors.gridline}
          fillOpacity={0.3}
        />
      ))}
    </>
  );
};

// Last value label plugin for line charts
const renderLastValueLabel = (props: any, data: any[], color: string, format: string = 'number') => {
  const lastIndex = data.length - 1;
  if (props.index === lastIndex) {
    let value = props.value;
    if (format === 'percent') value = formatters.percent(value);
    else if (format === 'position') value = formatters.position(value);
    else value = formatters.number(value);

    return (
      <text
        x={props.x + 5}
        y={props.y}
        fill={color}
        fontSize={11}
        fontWeight="500"
        textAnchor="start"
        dominantBaseline="middle"
        className="tabular-nums"
      >
        {value}
      </text>
    );
  }
  return null;
};

export default function DataVisualizationsFinal({
  searchData,
  analyticsData,
  competitorData,
  reportName = "SEO Report",
  dateRange = "Last 7 days",
  chartType = 'all',
  propertyName = ''
}: VisualizationProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('visibility');
  const [trafficView, setTrafficView] = useState<'absolute' | 'share'>('absolute');
  const [smoothingEnabled, setSmoothingEnabled] = useState(true);
  const [syncId] = useState('search-sync');
  const chartHeight = getChartHeight();

  // Transform and calculate data with smoothing
  const { searchTrendData, summary, insights, smoothedData } = useMemo(() => {
    const trendData = searchData?.byDate?.length > 0
      ? searchData.byDate.map((item: any, index: number) => {
          const dateKey = item.keys?.[0] || item.date;
          if (!dateKey) return null;

          const prevItem = index > 0 ? searchData.byDate[index - 1] : null;

          return {
            date: formatters.date.short(new Date(dateKey)),
            fullDate: dateKey,
            clicks: item.clicks || 0,
            impressions: item.impressions || 0,
            ctr: (item.ctr || 0) * 100,
            position: item.position || 0,
            previousClicks: prevItem?.clicks,
            previousImpressions: prevItem?.impressions,
            previousCtr: prevItem ? prevItem.ctr * 100 : undefined,
            previousPosition: prevItem?.position,
          };
        }).filter(Boolean)
      : [];

    // Apply 7-day rolling average if enabled
    const smoothedData = smoothingEnabled && trendData.length > 7
      ? trendData.map((item: any, index: number) => {
          const window = trendData.slice(Math.max(0, index - 3), Math.min(trendData.length, index + 4));
          return {
            ...item,
            smoothedClicks: window.reduce((sum: number, d: any) => sum + d.clicks, 0) / window.length,
            smoothedImpressions: window.reduce((sum: number, d: any) => sum + d.impressions, 0) / window.length,
            smoothedCtr: window.reduce((sum: number, d: any) => sum + d.ctr, 0) / window.length,
            smoothedPosition: window.reduce((sum: number, d: any) => sum + d.position, 0) / window.length,
          };
        })
      : trendData;

    // Calculate summary with week-over-week changes
    const currentWeek = smoothedData.slice(-7);
    const previousWeek = smoothedData.slice(-14, -7);

    const calculateWeekTotal = (data: any[], key: string) =>
      data.reduce((sum, item) => sum + (item[key] || 0), 0);

    const currentClicks = calculateWeekTotal(currentWeek, 'clicks');
    const previousClicks = calculateWeekTotal(previousWeek, 'clicks');
    const clicksChange = previousClicks ? ((currentClicks - previousClicks) / previousClicks) * 100 : 0;

    const currentImpressions = calculateWeekTotal(currentWeek, 'impressions');
    const previousImpressions = calculateWeekTotal(previousWeek, 'impressions');
    const impressionsChange = previousImpressions ? ((currentImpressions - previousImpressions) / previousImpressions) * 100 : 0;

    const avgCTR = currentWeek.length > 0
      ? currentWeek.reduce((sum: number, item: any) => sum + item.ctr, 0) / currentWeek.length
      : 0;
    const prevAvgCTR = previousWeek.length > 0
      ? previousWeek.reduce((sum: number, item: any) => sum + item.ctr, 0) / previousWeek.length
      : 0;
    const ctrChange = prevAvgCTR ? ((avgCTR - prevAvgCTR) / prevAvgCTR) * 100 : 0;

    const avgPosition = currentWeek.length > 0
      ? currentWeek.reduce((sum: number, item: any) => sum + item.position, 0) / currentWeek.length
      : 0;

    // Generate insights
    const generateInsight = () => {
      const changes = [];
      if (Math.abs(clicksChange) > 10) {
        changes.push(`Organic clicks ${clicksChange > 0 ? 'up' : 'down'} ${formatters.percent(Math.abs(clicksChange))} WoW`);
      }
      if (Math.abs(impressionsChange) > 15) {
        changes.push(`impressions ${impressionsChange > 0 ? 'increased' : 'decreased'} ${formatters.percent(Math.abs(impressionsChange))}`);
      }
      if (Math.abs(ctrChange) > 5) {
        changes.push(`CTR ${ctrChange > 0 ? 'improved' : 'declined'} by ${formatters.percent(Math.abs(ctrChange))}`);
      }

      if (changes.length === 0) {
        return `Performance stable with consistent organic traffic patterns across all metrics`;
      }
      return changes.join(', ') + `. Focus on ${ctrChange < 0 ? 'improving meta descriptions' : 'maintaining momentum'}`;
    };

    return {
      searchTrendData: trendData,
      smoothedData,
      summary: {
        totalClicks: currentClicks,
        totalImpressions: currentImpressions,
        avgCTR,
        avgPosition,
        clicksChange,
        impressionsChange,
        ctrChange,
      },
      insights: generateInsight()
    };
  }, [searchData, smoothingEnabled]);

  // Transform traffic data with consistent sorting
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
      const totalSessions = analyticsData.summary?.sessions || 1;

      sources.push({
        name: 'Other',
        sessions: otherSessions,
        users: 0,
        percentage: (otherSessions / totalSessions) * 100
      });
    }

    return sources;
  }, [analyticsData]);

  // Transform and sort competitor data by selected metric
  const competitorBarData = useMemo(() => {
    let data = [];

    if (competitorData?.length) {
      data = competitorData.map((comp: any) => ({
        name: comp.name || 'Competitor',
        yourSite: comp.yourSite || 0,
        competitor: comp.competitor || 0,
        industry: comp.industry || 0,
        [selectedMetric]: comp[selectedMetric] || 0
      }));
    } else {
      // Mock data for demonstration
      data = [
        { name: 'Your Site', visibility: 75, keywords: 82, backlinks: 60, speed: 88, content: 70, technical: 85 },
        { name: 'Competitor 1', visibility: 65, keywords: 78, backlinks: 85, speed: 72, content: 80, technical: 70 },
        { name: 'Industry Avg', visibility: 70, keywords: 75, backlinks: 72, speed: 80, content: 76, technical: 78 }
      ];
    }

    // Sort by selected metric
    return data.sort((a: any, b: any) => (b[selectedMetric] || 0) - (a[selectedMetric] || 0));
  }, [competitorData, selectedMetric]);

  // Calculate gap to leader
  const gapToLeader = useMemo(() => {
    if (!competitorBarData.length) return 0;
    const yourScore = competitorBarData.find((d: any) => d.name.includes('Your'))?.[selectedMetric] || 0;
    const maxScore = Math.max(...competitorBarData.map((d: any) => d[selectedMetric] || 0));
    return yourScore - maxScore;
  }, [competitorBarData, selectedMetric]);

  // Remove UUID and use readable title
  const displayTitle = propertyName || reportName || "Search Performance";
  const cleanTitle = displayTitle.replace(/^[a-f0-9-]+\s*-?\s*/i, '').trim();

  // Handle specific chart types for backward compatibility
  if (chartType !== 'all') {
    // Return individual chart implementations...
    // (Previous implementation for backward compatibility)
  }

  return (
    <div
      className="space-y-6"
      style={{
        background: designTokens.colors.bg,
        maxWidth: designTokens.layout.maxWidth,
        margin: '0 auto',
        padding: designTokens.layout.containerPadding,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: designTokens.typography.fontFamily
      }}
    >
      {/* Header with clean title and controls */}
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2" style={{ color: designTokens.colors.text[900] }}>
              {cleanTitle}
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4" style={{ color: designTokens.colors.text[400] }} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Property ID: {reportName}</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </h2>
            <p className="text-sm mt-1" style={{ color: designTokens.colors.text[500] }}>
              {dateRange} • Auto-refreshes daily •
              <button
                onClick={() => setSmoothingEnabled(!smoothingEnabled)}
                className="ml-2 text-xs underline"
                style={{ color: designTokens.colors.chart.blue }}
              >
                {smoothingEnabled ? '7-day average on' : 'Show raw data'}
              </button>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {selectedTimeRange === '7d' ? 'Last 7 days' :
               selectedTimeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Headline KPIs with improved layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Organic clicks"
            value={summary.totalClicks}
            delta={summary.clicksChange}
            deltaType={summary.clicksChange > 0 ? 'positive' : summary.clicksChange < 0 ? 'negative' : 'neutral'}
            sparklineData={smoothedData.slice(-7)}
            dataKey={smoothingEnabled ? "smoothedClicks" : "clicks"}
            color={metricColorMap.clicks}
          />
          <KPICard
            title="Total impressions"
            value={summary.totalImpressions}
            delta={summary.impressionsChange}
            deltaType={summary.impressionsChange > 0 ? 'positive' : summary.impressionsChange < 0 ? 'negative' : 'neutral'}
            sparklineData={smoothedData.slice(-7)}
            dataKey={smoothingEnabled ? "smoothedImpressions" : "impressions"}
            color={metricColorMap.impressions}
          />
          <KPICard
            title="Average CTR"
            value={summary.avgCTR}
            delta={summary.ctrChange}
            deltaType={summary.ctrChange > 0 ? 'positive' : summary.ctrChange < 0 ? 'negative' : 'neutral'}
            sparklineData={smoothedData.slice(-7)}
            dataKey={smoothingEnabled ? "smoothedCtr" : "ctr"}
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

      {/* Search performance trends - three aligned small multiples */}
      <Card style={designTokens.card}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Search performance trends</CardTitle>
              <CardDescription>Weekly metrics with 7-day rolling average</CardDescription>
            </div>
            <Legend
              payload={[
                { value: 'Clicks', type: 'line', color: metricColorMap.clicks },
                { value: 'Impressions', type: 'line', color: metricColorMap.impressions }
              ]}
              layout="horizontal"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Clicks & Impressions with colored axes */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: designTokens.colors.text[700] }}>
                Clicks & impressions over time
              </h4>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart
                  data={smoothedData}
                  margin={chartDefaults.margin}
                  syncId={syncId}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={designTokens.colors.gridline}
                    horizontalPoints={Array(5).fill(0)}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
                    interval="preserveStartEnd"
                    tickCount={6}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: designTokens.chart.tickLabelSize, fill: metricColorMap.clicks }}
                    label={{
                      value: 'Clicks',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: designTokens.chart.axisLabelSize, fill: metricColorMap.clicks }
                    }}
                    tickFormatter={(value) => formatters.number(value)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: designTokens.chart.tickLabelSize, fill: metricColorMap.impressions }}
                    label={{
                      value: 'Impressions',
                      angle: 90,
                      position: 'insideRight',
                      style: { fontSize: designTokens.chart.axisLabelSize, fill: metricColorMap.impressions }
                    }}
                    tickFormatter={(value) => formatters.number(value)}
                  />
                  <Tooltip content={<EnhancedTooltip />} />
                  <WeekendShading data={smoothedData} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={smoothingEnabled ? "smoothedClicks" : "clicks"}
                    stroke={metricColorMap.clicks}
                    strokeWidth={designTokens.chart.lineWidth}
                    dot={false}
                    name="Clicks"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey={smoothingEnabled ? "smoothedImpressions" : "impressions"}
                    stroke={metricColorMap.impressions}
                    strokeWidth={designTokens.chart.lineWidth}
                    dot={false}
                    name="Impressions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Average Position with inverted axis */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: designTokens.colors.text[700] }}>
                Average position (lower is better)
              </h4>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart
                  data={smoothedData}
                  margin={chartDefaults.margin}
                  syncId={syncId}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={designTokens.colors.gridline}
                    horizontalPoints={[1, 3, 5, 10, 20]}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
                    interval="preserveStartEnd"
                    tickCount={6}
                  />
                  <YAxis
                    reversed={true}
                    domain={[1, 50]}
                    ticks={[1, 3, 5, 10, 20, 50]}
                    tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
                    label={{
                      value: 'Position',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: designTokens.chart.axisLabelSize, fill: designTokens.colors.text[700] }
                    }}
                  />
                  <Tooltip content={<EnhancedTooltip />} />
                  <WeekendShading data={smoothedData} />
                  <ReferenceLine y={10} stroke={designTokens.colors.status.good} strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey={smoothingEnabled ? "smoothedPosition" : "position"}
                    stroke={metricColorMap.position}
                    strokeWidth={designTokens.chart.lineWidth}
                    dot={false}
                    name="Avg position"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* CTR with target bands */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: designTokens.colors.text[700] }}>
                Click-through rate (CTR)
              </h4>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart
                  data={smoothedData}
                  margin={chartDefaults.margin}
                  syncId={syncId}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={designTokens.colors.gridline}
                    horizontalPoints={[0, 2, 4, 6, 8]}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
                    interval="preserveStartEnd"
                    tickCount={6}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
                    label={{
                      value: 'CTR (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: designTokens.chart.axisLabelSize, fill: designTokens.colors.text[700] }
                    }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<EnhancedTooltip />} />
                  <WeekendShading data={smoothedData} />
                  <ReferenceArea y1={2} y2={4} fill={designTokens.colors.status.good} fillOpacity={0.1} />
                  <ReferenceLine y={3} stroke={designTokens.colors.status.warn} strokeDasharray="3 3" label="Industry avg" />
                  <Line
                    type="monotone"
                    dataKey={smoothingEnabled ? "smoothedCtr" : "ctr"}
                    stroke={metricColorMap.ctr}
                    strokeWidth={designTokens.chart.lineWidth}
                    dot={false}
                    name="CTR"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic sources with toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart with values */}
        <Card style={designTokens.card}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Traffic by channel</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrafficView(trafficView === 'absolute' ? 'share' : 'absolute')}
              >
                {trafficView === 'absolute' ? 'Absolute' : 'Share %'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={designTokens.chart.height.category}>
              <BarChart data={trafficData} margin={chartDefaults.margin}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={designTokens.colors.gridline}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
                  tickFormatter={(value) => formatters.number(value)}
                />
                <Tooltip content={<EnhancedTooltip />} />
                <Bar
                  dataKey={trafficView === 'absolute' ? "sessions" : "percentage"}
                  radius={[designTokens.chart.barRadius, designTokens.chart.barRadius, 0, 0]}
                  barSize="64%"
                >
                  <LabelList
                    dataKey={trafficView === 'absolute' ? "sessions" : "percentage"}
                    position="top"
                    formatter={(value: number) =>
                      trafficView === 'absolute' ? formatters.number(value) : `${value.toFixed(1)}%`
                    }
                    style={{ fontSize: 10, fill: designTokens.colors.text[700] }}
                  />
                  {trafficData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={Object.values(metricColorMap)[index % 7]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stacked bar for distribution */}
        <Card style={designTokens.card}>
          <CardHeader>
            <CardTitle className="text-xl">Traffic distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={designTokens.chart.height.category}>
              <BarChart
                data={[{ name: 'Total Traffic', ...trafficData.reduce((acc: any, item: any) => ({ ...acc, [item.name]: item.percentage }), {}) }]}
                layout="vertical"
                margin={chartDefaults.margin}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={designTokens.colors.gridline}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
                />
                <Tooltip content={<EnhancedTooltip />} />
                {trafficData.map((entry: any, index: number) => (
                  <Bar
                    key={entry.name}
                    dataKey={entry.name}
                    stackId="a"
                    fill={Object.values(metricColorMap)[index % 7]}
                  >
                    {entry.percentage >= 12 && (
                      <LabelList
                        dataKey={entry.name}
                        position="center"
                        formatter={() => `${entry.percentage.toFixed(0)}%`}
                        style={{ fontSize: 11, fill: 'white', fontWeight: 500 }}
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Competitive analysis with sorting and gap indicator */}
      <Card style={designTokens.card}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Competitive analysis</CardTitle>
              <CardDescription>
                Gap to leader: {gapToLeader > 0 ? '+' : ''}{gapToLeader.toFixed(1)} points on {selectedMetric}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {['visibility', 'keywords', 'backlinks', 'speed', 'content', 'technical'].map((metric) => (
                <Button
                  key={metric}
                  variant={selectedMetric === metric ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric(metric)}
                  className="capitalize"
                >
                  {metric}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={competitorBarData} margin={chartDefaults.margin}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={designTokens.colors.gridline}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: designTokens.chart.tickLabelSize, fill: designTokens.colors.text[500] }}
              />
              <Tooltip content={<EnhancedTooltip />} />
              <Bar
                dataKey={selectedMetric}
                radius={[designTokens.chart.barRadius, designTokens.chart.barRadius, 0, 0]}
              >
                {competitorBarData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name.includes('Your') ? designTokens.colors.chart.blue :
                          entry.name.includes('Industry') ? designTokens.colors.chart.green :
                          designTokens.colors.chart.orange}
                    fillOpacity={entry.name.includes('Your') ? 0.9 : 0.7}
                    stroke={entry.name.includes('Your') ? designTokens.colors.chart.blue : 'none'}
                    strokeWidth={entry.name.includes('Your') ? 2 : 0}
                  />
                ))}
              </Bar>
              {gapToLeader < 0 && (
                <ReferenceLine
                  y={Math.max(...competitorBarData.map((d: any) => d[selectedMetric] || 0))}
                  stroke={designTokens.colors.status.warn}
                  strokeDasharray="3 3"
                  label="Leader"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom KPI cards with proper empty states */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Avg session duration"
          value={analyticsData?.summary?.avgSessionDuration}
          delta={null}
          deltaType="neutral"
          sparklineData={[]}
          dataKey="duration"
          color={metricColorMap.avgDuration}
          format="duration"
          emptyMessage="Connect GA4 for this metric"
          emptyAction="Connect GA4"
          onEmptyClick={() => console.log('Connect GA4')}
        />
        <KPICard
          title="Pages per session"
          value={analyticsData?.summary?.pagesPerSession}
          delta={null}
          deltaType="neutral"
          sparklineData={[]}
          dataKey="pages"
          color={metricColorMap.pagesPerSession}
          format="number"
          emptyMessage="Connect GA4 for this metric"
          emptyAction="Connect GA4"
          onEmptyClick={() => console.log('Connect GA4')}
        />
        <KPICard
          title="Bounce rate"
          value={analyticsData?.summary?.bounceRate}
          delta={null}
          deltaType="neutral"
          sparklineData={[]}
          dataKey="bounce"
          color={metricColorMap.bounceRate}
          format="percent"
          emptyMessage="Connect GA4 for this metric"
          emptyAction="Connect GA4"
          onEmptyClick={() => console.log('Connect GA4')}
        />
        <KPICard
          title="Goal completions"
          value={analyticsData?.summary?.goalCompletions}
          delta={null}
          deltaType="neutral"
          sparklineData={[]}
          dataKey="goals"
          color={designTokens.colors.status.good}
          format="number"
          emptyMessage="Set up goals in GA4"
          emptyAction="Configure goals"
          onEmptyClick={() => console.log('Configure goals')}
        />
      </div>
    </div>
  );
}