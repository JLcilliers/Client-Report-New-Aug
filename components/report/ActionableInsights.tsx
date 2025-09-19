'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Clock,
  Zap,
  DollarSign,
  Plus,
  Edit2,
  TrendingDown,
  Activity
} from 'lucide-react';

interface InsightProps {
  reportId: string;
  metrics: any;
}

interface ActionPlan {
  id: string;
  title: string;
  status: string;
  priority: number;
  deadline?: string;
  tasks?: Array<{ id: string; isCompleted: boolean; }>
}

export default function ActionableInsights({ reportId, metrics }: InsightProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string || reportId;
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActionPlans();
  }, [slug]);

  const fetchActionPlans = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${slug}/action-plans`);
      if (response.ok) {
        const data = await response.json();
        setActionPlans(data);
      }
    } catch (error) {
      console.error('Failed to fetch action plans:', error);
    }
    setLoading(false);
  };

  const handleViewDetails = (task: any) => {
    // Check if an action plan already exists for this task
    const existingPlan = actionPlans.find(plan =>
      plan.title.toLowerCase() === task.task?.toLowerCase() ||
      plan.title.toLowerCase() === task.title?.toLowerCase()
    );

    if (existingPlan) {
      router.push(`/report/${slug}/action-plan/${existingPlan.id}`);
    } else {
      // Create new action plan with pre-filled data
      const params = new URLSearchParams({
        title: task.task || task.title || '',
        category: task.category || 'seo',
        impact: task.impact || 'medium',
        effort: task.effort || 'medium',
        deadline: task.deadline || '',
        timeframe: task.timeframe || ''
      });
      router.push(`/report/${slug}/action-plan/new?${params.toString()}`);
    }
  };

  // Generate insights based on actual metrics with proper thresholds
  const generateInsights = () => {
    const insights = [];

    // Industry benchmarks for comparison
    const benchmarks = {
      bounceRate: { good: 40, warning: 55, critical: 70 },
      avgSessionDuration: { good: 180, warning: 120, critical: 60 },
      ctr: { good: 3, warning: 2, critical: 1 },
      pageSpeed: { good: 90, warning: 70, critical: 50 },
      mobileSpeed: { good: 85, warning: 65, critical: 45 }
    };

    // Check bounce rate with proper thresholds
    const bounceRate = metrics?.analytics?.current?.bounceRate || 0;
    const bounceRatePercent = bounceRate * 100;
    if (bounceRatePercent > benchmarks.bounceRate.critical) {
      insights.push({
        type: 'critical',
        category: 'engagement',
        title: 'Critical: Very High Bounce Rate',
        description: `Your bounce rate of ${bounceRatePercent.toFixed(1)}% is critically high (industry average: ${benchmarks.bounceRate.good}-${benchmarks.bounceRate.warning}%).`,
        impact: 'high',
        effort: 'medium',
        recommendation: 'Immediate action needed: Review page load speed, above-fold content, and mobile experience. Consider implementing exit-intent popups.',
        estimatedValue: `$${Math.round((metrics?.analytics?.current?.sessions || 1000) * 0.02 * 50)}/month`,
        timeframe: '1-2 weeks'
      });
    } else if (bounceRatePercent > benchmarks.bounceRate.warning) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        title: 'Above Average Bounce Rate',
        description: `Your bounce rate of ${bounceRatePercent.toFixed(1)}% is above the industry average.`,
        impact: 'medium',
        effort: 'medium',
        recommendation: 'Improve internal linking, add related content sections, and enhance page load speed.',
        estimatedValue: `$${Math.round((metrics?.analytics?.current?.sessions || 1000) * 0.01 * 50)}/month`,
        timeframe: '2-3 weeks'
      });
    }

    // Check CTR with dynamic thresholds based on average position
    const ctr = metrics?.searchConsole?.current?.ctr || 0;
    const ctrPercent = ctr * 100;
    const avgPosition = metrics?.searchConsole?.current?.position || 0;

    // Expected CTR based on position (industry averages)
    const expectedCTR = avgPosition > 0 && avgPosition <= 3 ? 30 :
                       avgPosition <= 5 ? 15 :
                       avgPosition <= 10 ? 5 :
                       avgPosition <= 20 ? 2 : 1;

    if (avgPosition > 0 && ctrPercent < expectedCTR * 0.7) {
      insights.push({
        type: 'opportunity',
        category: 'seo',
        title: 'CTR Below Expected for Position',
        description: `Your CTR of ${ctrPercent.toFixed(2)}% is below the expected ${expectedCTR}% for position ${avgPosition.toFixed(1)}.`,
        impact: 'high',
        effort: 'low',
        recommendation: 'Optimize meta titles and descriptions, add schema markup, use power words and numbers in titles.',
        estimatedValue: `$${Math.round((metrics?.searchConsole?.current?.impressions || 1000) * (expectedCTR - ctrPercent) / 100 * 0.25)}/month`,
        timeframe: '1 week'
      });
    }

    // Check session duration
    const avgDuration = metrics?.analytics?.current?.avgSessionDuration || 0;
    if (avgDuration > 0 && avgDuration < benchmarks.avgSessionDuration.critical) {
      insights.push({
        type: 'critical',
        category: 'engagement',
        title: 'Very Low Session Duration',
        description: `Average session duration of ${Math.round(avgDuration)}s is critically low.`,
        impact: 'high',
        effort: 'medium',
        recommendation: 'Add engaging content, improve site navigation, implement related content recommendations.',
        estimatedValue: `$${Math.round((metrics?.analytics?.current?.sessions || 1000) * 0.015 * 50)}/month`,
        timeframe: '2-3 weeks'
      });
    } else if (avgDuration > 0 && avgDuration < benchmarks.avgSessionDuration.warning) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        title: 'Below Average Session Duration',
        description: `Average session duration of ${Math.round(avgDuration)}s is below industry standard.`,
        impact: 'medium',
        effort: 'medium',
        recommendation: 'Enhance content quality, add videos or interactive elements, improve internal linking.',
        estimatedValue: `$${Math.round((metrics?.analytics?.current?.sessions || 1000) * 0.01 * 50)}/month`,
        timeframe: '2-3 weeks'
      });
    }

    // Check for traffic changes
    const sessionChange = metrics?.comparisons?.weekOverWeek?.analytics?.sessions?.changePercent || 0;
    if (sessionChange < -10) {
      insights.push({
        type: 'warning',
        category: 'traffic',
        title: 'Significant Traffic Decline',
        description: `Traffic has declined by ${Math.abs(sessionChange).toFixed(1)}% week-over-week.`,
        impact: 'high',
        effort: 'varies',
        recommendation: 'Check for technical issues, algorithm updates, or seasonal trends. Review recent changes to the site.',
        estimatedValue: 'Varies',
        timeframe: 'Immediate investigation'
      });
    } else if (sessionChange > 20) {
      insights.push({
        type: 'opportunity',
        category: 'traffic',
        title: 'Strong Traffic Growth',
        description: `Traffic has increased by ${sessionChange.toFixed(1)}% week-over-week.`,
        impact: 'high',
        effort: 'low',
        recommendation: 'Identify what drove this growth and replicate across other pages. Consider increasing content production.',
        estimatedValue: 'High potential',
        timeframe: 'Ongoing'
      });
    }

    // Check click growth
    const clickChange = metrics?.comparisons?.weekOverWeek?.searchConsole?.clicks?.changePercent || 0;
    if (clickChange < -15) {
      insights.push({
        type: 'critical',
        category: 'seo',
        title: 'Search Click Decline',
        description: `Search clicks have dropped by ${Math.abs(clickChange).toFixed(1)}% week-over-week.`,
        impact: 'high',
        effort: 'high',
        recommendation: 'Review search rankings, check for SERP feature losses, analyze competitor activity.',
        estimatedValue: 'Revenue impact',
        timeframe: 'Immediate'
      });
    }

    // Check position changes
    const positionChange = metrics?.comparisons?.weekOverWeek?.searchConsole?.position?.changePercent || 0;
    if (positionChange > 10) { // Higher position number = worse ranking
      insights.push({
        type: 'warning',
        category: 'seo',
        title: 'Ranking Position Declining',
        description: `Average position has worsened by ${Math.abs(positionChange).toFixed(1)}%.`,
        impact: 'high',
        effort: 'medium',
        recommendation: 'Review content freshness, check backlink profile, analyze competitor improvements.',
        estimatedValue: 'Traffic at risk',
        timeframe: '1-2 weeks'
      });
    }

    // Check impressions vs clicks ratio
    const impressions = metrics?.searchConsole?.current?.impressions || 0;
    const clicks = metrics?.searchConsole?.current?.clicks || 0;
    if (impressions > 1000 && clicks < impressions * 0.01) {
      insights.push({
        type: 'opportunity',
        category: 'seo',
        title: 'Low Click-Through Rate',
        description: `Only ${clicks} clicks from ${impressions.toLocaleString()} impressions.`,
        impact: 'high',
        effort: 'low',
        recommendation: 'Urgent: Update meta titles and descriptions. Add rich snippets and schema markup.',
        estimatedValue: `$${Math.round(impressions * 0.02 * 0.25)}/month potential`,
        timeframe: '3-5 days'
      });
    }

    return insights;
  };

  // Generate dynamic quick wins based on actual data
  const generateQuickWins = () => {
    const wins = [];

    // CTR optimization if below threshold
    const ctr = (metrics?.searchConsole?.current?.ctr || 0) * 100;
    if (ctr < 2 && metrics?.searchConsole?.current?.impressions > 100) {
      wins.push({
        title: 'Optimize Meta Descriptions',
        impact: 'High',
        effort: 'Low',
        timeframe: '3 days',
        value: `+${(2 - ctr).toFixed(1)}% CTR`,
        description: `Current CTR of ${ctr.toFixed(1)}% can be improved to industry standard`
      });
    }

    // Bounce rate improvement
    const bounceRate = (metrics?.analytics?.current?.bounceRate || 0) * 100;
    if (bounceRate > 60) {
      wins.push({
        title: 'Improve Page Load Speed',
        impact: 'High',
        effort: 'Medium',
        timeframe: '1 week',
        value: `-${Math.min(20, bounceRate - 40).toFixed(0)}% bounce`,
        description: `Current bounce rate of ${bounceRate.toFixed(1)}% needs attention`
      });
    }

    // Position improvements for keywords in striking distance
    const avgPosition = metrics?.searchConsole?.current?.position || 0;
    if (avgPosition > 3 && avgPosition < 11) {
      wins.push({
        title: 'Target Position 1-3 Keywords',
        impact: 'High',
        effort: 'Low',
        timeframe: '2 weeks',
        value: '+40% traffic',
        description: `Average position ${avgPosition.toFixed(1)} - close to top positions`
      });
    }

    // Content freshness if no recent updates
    const lastUpdated = metrics?.fetchedAt ? new Date(metrics.fetchedAt) : new Date();
    const daysSinceUpdate = Math.floor((new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 30) {
      wins.push({
        title: 'Update Stale Content',
        impact: 'Medium',
        effort: 'Low',
        timeframe: '1 week',
        value: '+15% rankings',
        description: `Content hasn't been updated in ${daysSinceUpdate} days`
      });
    }

    // Add schema if CTR is low
    if (ctr < 3) {
      wins.push({
        title: 'Add Rich Snippets',
        impact: 'High',
        effort: 'Medium',
        timeframe: '5 days',
        value: '+25% visibility',
        description: 'Stand out in search results with structured data'
      });
    }

    return wins;
  };

  // Generate prioritized tasks based on actual issues
  const generatePrioritizedTasks = () => {
    const tasks = [];
    let priority = 1;

    // Get current date for deadlines
    const now = new Date();
    const getDeadline = (days: number) => {
      const deadline = new Date(now);
      deadline.setDate(deadline.getDate() + days);
      return deadline.toISOString().split('T')[0];
    };

    // Critical issues first
    const bounceRate = (metrics?.analytics?.current?.bounceRate || 0) * 100;
    if (bounceRate > 70) {
      tasks.push({
        priority: priority++,
        task: 'Fix critical bounce rate issue',
        reason: `${bounceRate.toFixed(1)}% bounce rate is damaging user experience`,
        status: 'not_started',
        deadline: getDeadline(7),
        category: 'critical'
      });
    }

    // Traffic decline
    const sessionChange = metrics?.comparisons?.weekOverWeek?.analytics?.sessions?.changePercent || 0;
    if (sessionChange < -10) {
      tasks.push({
        priority: priority++,
        task: 'Investigate traffic decline',
        reason: `${Math.abs(sessionChange).toFixed(1)}% traffic drop requires immediate attention`,
        status: 'not_started',
        deadline: getDeadline(3),
        category: 'urgent'
      });
    }

    // CTR optimization
    const ctr = (metrics?.searchConsole?.current?.ctr || 0) * 100;
    if (ctr < 2) {
      tasks.push({
        priority: priority++,
        task: 'Optimize click-through rates',
        reason: `${ctr.toFixed(1)}% CTR is below industry standard`,
        status: 'planned',
        deadline: getDeadline(14),
        category: 'seo'
      });
    }

    // Position improvements
    const avgPosition = metrics?.searchConsole?.current?.position || 0;
    if (avgPosition > 10) {
      tasks.push({
        priority: priority++,
        task: 'Improve search rankings',
        reason: `Average position ${avgPosition.toFixed(1)} needs improvement`,
        status: 'planned',
        deadline: getDeadline(30),
        category: 'seo'
      });
    }

    // Session duration
    const avgDuration = metrics?.analytics?.current?.avgSessionDuration || 0;
    if (avgDuration < 60) {
      tasks.push({
        priority: priority++,
        task: 'Increase engagement time',
        reason: `${Math.round(avgDuration)}s average duration is too low`,
        status: 'planned',
        deadline: getDeadline(21),
        category: 'content'
      });
    }

    return tasks.slice(0, 5); // Return top 5 priorities
  };

  const insights = generateInsights();
  const quickWins = generateQuickWins();
  const prioritizedTasks = generatePrioritizedTasks();

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getEffortColor = (effort: string) => {
    switch(effort) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'not_started': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {insights.filter(i => i.type === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {insights.filter(i => i.type === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold text-blue-600">
                  {insights.filter(i => i.type === 'opportunity').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quick Wins</p>
                <p className="text-2xl font-bold text-green-600">
                  {quickWins.length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automated Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Data-Driven Insights & Alerts
            </CardTitle>
            <CardDescription>Real-time insights based on your actual performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <Alert key={idx} className={
                  insight.type === 'critical' ? 'border-red-500 bg-red-50' :
                  insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {insight.type === 'critical' ? <AlertTriangle className="w-4 h-4 text-red-600" /> :
                         insight.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-600" /> :
                         <TrendingUp className="w-4 h-4 text-blue-600" />}
                        <span className="font-semibold">{insight.title}</span>
                        <Badge variant={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <AlertDescription>
                        <p className="text-sm mb-2">{insight.description}</p>
                        <p className="text-sm font-medium mb-1">Recommendation:</p>
                        <p className="text-sm mb-2">{insight.recommendation}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Est. Value: {insight.estimatedValue}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {insight.timeframe}
                          </span>
                          <span className={getEffortColor(insight.effort)}>
                            Effort: {insight.effort}
                          </span>
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Quick Wins
            </CardTitle>
            <CardDescription>High-impact improvements based on your current metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickWins.map((win, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm">{win.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {win.value}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{win.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-3">
                      <span>Impact: <strong className={
                        win.impact === 'High' ? 'text-green-600' :
                        win.impact === 'Medium' ? 'text-yellow-600' :
                        'text-gray-600'
                      }>{win.impact}</strong></span>
                      <span>Effort: <strong className={
                        win.effort === 'Low' ? 'text-green-600' :
                        win.effort === 'Medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }>{win.effort}</strong></span>
                    </div>
                    <span className="text-gray-500">{win.timeframe}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-2 text-xs"
                    onClick={() => handleViewDetails({
                      title: win.title,
                      category: 'seo',
                      impact: win.impact.toLowerCase(),
                      effort: win.effort.toLowerCase(),
                      timeframe: win.timeframe,
                      estimatedValue: win.value
                    })}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Action Plan
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prioritized Action Plan */}
      {prioritizedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Priority Action Items
            </CardTitle>
            <CardDescription>Your personalized roadmap based on current performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prioritizedTasks.map((task) => (
                <div key={task.priority} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                    {task.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{task.task}</h4>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{task.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Deadline: {task.deadline}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => handleViewDetails(task)}
                      >
                        {actionPlans.find(p => p.title.toLowerCase() === task.task.toLowerCase()) ?
                          <><Edit2 className="w-3 h-3 mr-1" /> Edit Plan</> :
                          <><Plus className="w-3 h-3 mr-1" /> Create Plan</>
                        }
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data Message */}
      {insights.length === 0 && quickWins.length === 0 && prioritizedTasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Insufficient Data for Insights</h3>
            <p className="text-sm text-gray-600">
              We need more data to generate actionable insights. Please ensure your Google Analytics and Search Console are properly connected and have collected data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}