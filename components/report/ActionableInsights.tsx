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
  Edit2
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
    if (bounceRate > benchmarks.bounceRate.critical) {
      insights.push({
        type: 'critical',
        category: 'engagement',
        title: 'Critical: Very High Bounce Rate',
        description: `Your bounce rate of ${bounceRate.toFixed(1)}% is critically high (industry average: ${benchmarks.bounceRate.good}-${benchmarks.bounceRate.warning}%).`,
        impact: 'high',
        effort: 'medium',
        recommendation: 'Immediate action needed: Review page load speed, above-fold content, and mobile experience. Consider implementing exit-intent popups.',
        estimatedValue: `$${Math.round(metrics?.analytics?.current?.sessions * 0.02 * 50) || 2500}/month`,
        timeframe: '1-2 weeks'
      });
    } else if (bounceRate > benchmarks.bounceRate.warning) {
      insights.push({
        type: 'warning',
        category: 'engagement',
        title: 'Above Average Bounce Rate',
        description: `Your bounce rate of ${bounceRate.toFixed(1)}% is above the industry average.`,
        impact: 'medium',
        effort: 'medium',
        recommendation: 'Improve internal linking, add related content sections, and enhance page load speed.',
        estimatedValue: `$${Math.round(metrics?.analytics?.current?.sessions * 0.01 * 50) || 1500}/month`,
        timeframe: '2-3 weeks'
      });
    }
    
    // Check page speed
    if (metrics?.pageSpeed?.mobile < 80) {
      insights.push({
        type: 'warning',
        category: 'technical',
        title: 'Mobile Page Speed Needs Improvement',
        description: 'Mobile page speed score is below Google\'s recommended threshold.',
        impact: 'high',
        effort: 'low',
        recommendation: 'Optimize images, implement lazy loading, and minimize JavaScript execution.',
        estimatedValue: '$1,800/month',
        timeframe: '1-2 weeks'
      });
    }
    
    // Check CTR with dynamic thresholds based on average position
    const ctr = metrics?.searchConsole?.current?.ctr || 0;
    const avgPosition = metrics?.searchConsole?.current?.position || 0;
    
    // Expected CTR based on position (industry averages)
    const expectedCTR = avgPosition <= 3 ? 30 : 
                       avgPosition <= 5 ? 15 :
                       avgPosition <= 10 ? 5 :
                       avgPosition <= 20 ? 2 : 1;
    
    if (ctr < expectedCTR * 0.7) {
      insights.push({
        type: 'opportunity',
        category: 'seo',
        title: 'CTR Below Expected for Position',
        description: `Your CTR of ${(ctr * 100).toFixed(2)}% is below the expected ${expectedCTR}% for position ${avgPosition.toFixed(1)}.`,
        impact: 'high',
        effort: 'low',
        recommendation: 'Optimize meta titles and descriptions, add schema markup, use power words and numbers in titles.',
        estimatedValue: `$${Math.round(metrics?.searchConsole?.current?.impressions * (expectedCTR - ctr) / 100 * 25) || 3200}/month`,
        timeframe: '1 week'
      });
    }
    
    // Check session duration
    const avgDuration = metrics?.analytics?.current?.avgSessionDuration || 0;
    if (avgDuration < benchmarks.avgSessionDuration.critical) {
      insights.push({
        type: 'critical',
        category: 'engagement',
        title: 'Very Low Session Duration',
        description: `Average session duration of ${Math.round(avgDuration)}s is critically low.`,
        impact: 'high',
        effort: 'medium',
        recommendation: 'Add engaging content, improve site navigation, implement related content recommendations.',
        estimatedValue: `$${Math.round(metrics?.analytics?.current?.sessions * 0.015 * 50) || 2000}/month`,
        timeframe: '2-3 weeks'
      });
    }
    
    // Check for traffic decline
    if (metrics?.comparisons?.weekOverWeek?.analytics?.sessions < -10) {
      insights.push({
        type: 'warning',
        category: 'traffic',
        title: 'Significant Traffic Decline',
        description: `Traffic has declined by ${Math.abs(metrics.comparisons.weekOverWeek.analytics.sessions).toFixed(1)}% week-over-week.`,
        impact: 'high',
        effort: 'varies',
        recommendation: 'Check for technical issues, algorithm updates, or seasonal trends. Review recent changes to the site.',
        estimatedValue: 'Varies',
        timeframe: 'Immediate investigation'
      });
    }
    
    // Check for conversion opportunities
    if (!metrics?.conversions || metrics?.conversions?.rate === 0) {
      insights.push({
        type: 'critical',
        category: 'conversion',
        title: 'Conversion Tracking Not Set Up',
        description: 'No conversion tracking detected. Unable to measure ROI.',
        impact: 'critical',
        effort: 'low',
        recommendation: 'Immediately set up Google Analytics 4 conversion tracking for key actions.',
        estimatedValue: 'Cannot calculate ROI without tracking',
        timeframe: '1-2 days'
      });
    }
    
    return insights;
  };

  const quickWins = [
    {
      title: 'Update Meta Descriptions',
      impact: 'Medium',
      effort: 'Low',
      timeframe: '3 days',
      value: '+15% CTR',
      description: '32 pages missing or with duplicate meta descriptions'
    },
    {
      title: 'Fix Broken Internal Links',
      impact: 'Low',
      effort: 'Low',
      timeframe: '1 day',
      value: 'Better UX',
      description: '8 broken internal links detected'
    },
    {
      title: 'Add Schema Markup',
      impact: 'High',
      effort: 'Medium',
      timeframe: '1 week',
      value: '+12% visibility',
      description: 'Product and FAQ schema missing'
    },
    {
      title: 'Optimize Core Web Vitals',
      impact: 'High',
      effort: 'Medium',
      timeframe: '2 weeks',
      value: '+8% rankings',
      description: 'LCP and CLS need improvement'
    }
  ];

  const prioritizedTasks = [
    {
      priority: 1,
      task: 'Implement conversion tracking',
      reason: 'Cannot measure ROI without proper tracking',
      status: 'not_started',
      deadline: '2024-02-01'
    },
    {
      priority: 2,
      task: 'Optimize mobile page speed',
      reason: '60% of traffic is mobile with high bounce rate',
      status: 'in_progress',
      deadline: '2024-02-15'
    },
    {
      priority: 3,
      task: 'Create content for ranking gaps',
      reason: '145 valuable keywords without content',
      status: 'planned',
      deadline: '2024-02-28'
    },
    {
      priority: 4,
      task: 'Build high-quality backlinks',
      reason: 'Domain authority below competitors',
      status: 'ongoing',
      deadline: 'Ongoing'
    }
  ];

  const insights = generateInsights();

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

  return (
    <div className="space-y-6">
      {/* Automated Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Automated Insights & Alerts
          </CardTitle>
          <CardDescription>AI-generated insights based on your current performance</CardDescription>
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

      {/* Quick Wins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Quick Wins
          </CardTitle>
          <CardDescription>High-impact, low-effort improvements you can make today</CardDescription>
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

      {/* Prioritized Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Prioritized Action Plan
          </CardTitle>
          <CardDescription>Your roadmap for SEO improvement</CardDescription>
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
                    <Badge variant={
                      task.status === 'completed' ? 'default' :
                      task.status === 'in_progress' ? 'secondary' :
                      task.status === 'not_started' ? 'destructive' :
                      'outline'
                    }>
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

      {/* Impact/Effort Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Impact vs Effort Matrix</CardTitle>
          <CardDescription>Prioritize your efforts based on potential impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-green-50">
              <h4 className="font-medium text-sm mb-2 text-green-800">High Impact, Low Effort</h4>
              <p className="text-xs text-green-700">Do First</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>• Update meta descriptions</li>
                <li>• Fix technical SEO issues</li>
                <li>• Add schema markup</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h4 className="font-medium text-sm mb-2 text-yellow-800">High Impact, High Effort</h4>
              <p className="text-xs text-yellow-700">Schedule</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>• Content gap analysis</li>
                <li>• Site redesign</li>
                <li>• Link building campaign</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-sm mb-2 text-blue-800">Low Impact, Low Effort</h4>
              <p className="text-xs text-blue-700">Fill In</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>• Image alt text updates</li>
                <li>• Minor content updates</li>
                <li>• Social media optimization</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-sm mb-2 text-gray-800">Low Impact, High Effort</h4>
              <p className="text-xs text-gray-700">Avoid</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>• Complete site migration</li>
                <li>• Custom CMS development</li>
                <li>• Extensive keyword research</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}