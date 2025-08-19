'use client';

import { useState, useEffect } from 'react';
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
  CheckSquare
} from 'lucide-react';

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
  const [metrics, setMetrics] = useState<any>(null);
  const [agencyUpdates, setAgencyUpdates] = useState<any[]>([]);
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, [reportId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch comprehensive metrics
      await fetchMetrics();
      // Fetch agency updates
      await fetchAgencyUpdates();
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    if (!googleAccountId) return;
    
    setRefreshing(true);
    try {
      const response = await fetch('/api/data/fetch-comprehensive-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, googleAccountId })
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setRefreshing(false);
    }
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
            Last updated: {metrics?.fetchedAt ? new Date(metrics.fetchedAt).toLocaleString() : 'Never'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={comparisonPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonPeriod('week')}
            >
              Week
            </Button>
            <Button
              variant={comparisonPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonPeriod('month')}
            >
              Month
            </Button>
            <Button
              variant={comparisonPeriod === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonPeriod('year')}
            >
              Year
            </Button>
          </div>
          <Button
            onClick={fetchMetrics}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard({
              title: 'Total Clicks',
              value: formatNumber(metrics?.searchConsole?.current?.clicks || 0),
              change: comparisonData?.searchConsole?.clicks || 0,
              changeType: comparisonData?.searchConsole?.clicks > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <MousePointer className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'Impressions',
              value: formatNumber(metrics?.searchConsole?.current?.impressions || 0),
              change: comparisonData?.searchConsole?.impressions || 0,
              changeType: comparisonData?.searchConsole?.impressions > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Eye className="w-4 h-4 text-purple-500" />
            })}
            {renderMetricCard({
              title: 'Total Users',
              value: formatNumber(metrics?.analytics?.current?.users || 0),
              change: comparisonData?.analytics?.users || 0,
              changeType: comparisonData?.analytics?.users > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Users className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Conversions',
              value: formatNumber(metrics?.analytics?.current?.conversions || 0),
              change: comparisonData?.analytics?.conversions || 0,
              changeType: comparisonData?.analytics?.conversions > 0 ? 'positive' : 'negative',
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
                {/* Add chart component here */}
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Chart visualization
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Breakdown by channel</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics?.analytics?.byChannel?.map((channel: any) => (
                  <div key={channel.channel} className="flex items-center justify-between py-2">
                    <span className="text-sm">{channel.channel}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{formatNumber(channel.sessions)}</span>
                      <Progress value={(channel.sessions / metrics.analytics.current.sessions) * 100} className="w-20" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Search Performance Tab */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard({
              title: 'Average CTR',
              value: formatPercentage(metrics?.searchConsole?.current?.ctr || 0),
              change: comparisonData?.searchConsole?.ctr || 0,
              changeType: comparisonData?.searchConsole?.ctr > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Activity className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'Average Position',
              value: (metrics?.searchConsole?.current?.position || 0).toFixed(1),
              change: comparisonData?.searchConsole?.position || 0,
              changeType: comparisonData?.searchConsole?.position > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <BarChart3 className="w-4 h-4 text-purple-500" />
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
              change: comparisonData?.analytics?.sessions || 0,
              changeType: comparisonData?.analytics?.sessions > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Activity className="w-4 h-4 text-blue-500" />
            })}
            {renderMetricCard({
              title: 'New Users',
              value: formatNumber(metrics?.analytics?.current?.newUsers || 0),
              change: ((metrics?.analytics?.current?.newUsers || 0) - (metrics?.analytics?.previousWeek?.newUsers || 0)) / (metrics?.analytics?.previousWeek?.newUsers || 1) * 100,
              changeType: 'positive',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Users className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Page Views',
              value: formatNumber(metrics?.analytics?.current?.pageViews || 0),
              change: 0,
              changeType: 'neutral',
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
              change: comparisonData?.analytics?.engagementRate || 0,
              changeType: comparisonData?.analytics?.engagementRate > 0 ? 'positive' : 'negative',
              period: `vs ${comparisonPeriod} ago`,
              icon: <Activity className="w-4 h-4 text-green-500" />
            })}
            {renderMetricCard({
              title: 'Bounce Rate',
              value: formatPercentage(metrics?.analytics?.current?.bounceRate || 0),
              change: -comparisonData?.analytics?.bounceRate || 0,
              changeType: comparisonData?.analytics?.bounceRate < 0 ? 'positive' : 'negative',
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
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Technical SEO Analysis</h3>
            <p className="text-gray-600 mb-4">Run comprehensive technical audits</p>
            <a href={`/report/${reportSlug}/seo-dashboard`} target="_blank">
              <Button>
                <Search className="w-4 h-4 mr-2" />
                Open SEO Dashboard
              </Button>
            </a>
          </div>
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