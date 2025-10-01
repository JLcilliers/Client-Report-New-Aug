'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Calendar,
  Edit2,
  Loader2
} from 'lucide-react';

interface ActionPlan {
  id: string;
  title: string;
  description?: string;
  priority: number;
  category: string;
  status: string;
  impact?: string;
  effort?: string;
  deadline?: string;
  tasks?: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
  }>;
}

export default function ActionPlansPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchActionPlans();
  }, [slug]);

  const fetchActionPlans = async () => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-marine animate-spin" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-glacier text-harbor';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      seo: 'bg-frost text-marine',
      technical: 'bg-glacier text-harbor',
      conversion: 'bg-green-100 text-green-800',
      engagement: 'bg-yellow-100 text-yellow-800',
      traffic: 'bg-orange-100 text-orange-800',
      content: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const calculateProgress = (tasks?: Array<{ isCompleted: boolean }>) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.isCompleted).length;
    return (completed / tasks.length) * 100;
  };

  const filteredPlans = filter === 'all' 
    ? actionPlans 
    : actionPlans.filter(plan => plan.status === filter);

  const stats = {
    total: actionPlans.length,
    notStarted: actionPlans.filter(p => p.status === 'not_started').length,
    inProgress: actionPlans.filter(p => p.status === 'in_progress').length,
    completed: actionPlans.filter(p => p.status === 'completed').length,
    blocked: actionPlans.filter(p => p.status === 'blocked').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Action Plans</h1>
              <p className="text-gray-600 mt-1">Manage and track your SEO improvement tasks</p>
            </div>
            <Button
              onClick={() => router.push(`/report/${slug}/action-plan/new`)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Action Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card
            className={`cursor-pointer ${filter === 'all' ? 'ring-2 ring-marine' : ''}`}
            onClick={() => setFilter('all')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Plans</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer ${filter === 'not_started' ? 'ring-2 ring-gray-500' : ''}`}
            onClick={() => setFilter('not_started')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
              <div className="text-sm text-gray-600">Not Started</div>
            </CardContent>
          </Card>
          
          <Card
            className={`cursor-pointer ${filter === 'in_progress' ? 'ring-2 ring-marine' : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-marine">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer ${filter === 'completed' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setFilter('completed')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer ${filter === 'blocked' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setFilter('blocked')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
              <div className="text-sm text-gray-600">Blocked</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Plans List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/report/${slug}/action-plan/${plan.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    {plan.description && (
                      <CardDescription className="mt-1 text-sm">
                        {plan.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(plan.status)}
                    <Badge className={`text-xs ${getStatusColor(plan.status)}`}>
                      {plan.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(plan.category)}`}>
                    {plan.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Priority {plan.priority}
                  </Badge>
                  {plan.impact && (
                    <Badge variant="outline" className="text-xs">
                      {plan.impact} impact
                    </Badge>
                  )}
                  {plan.effort && (
                    <Badge variant="outline" className="text-xs">
                      {plan.effort} effort
                    </Badge>
                  )}
                </div>

                {plan.tasks && plan.tasks.length > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{plan.tasks.filter(t => t.isCompleted).length}/{plan.tasks.length} tasks</span>
                    </div>
                    <Progress value={calculateProgress(plan.tasks)} className="h-2" />
                  </div>
                )}

                {plan.deadline && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {new Date(plan.deadline).toLocaleDateString()}</span>
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/report/${slug}/action-plan/${plan.id}`);
                  }}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit Plan
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}

          {filteredPlans.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No action plans yet' : `No ${filter.replace('_', ' ')} plans`}
              </h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? 'Create your first action plan to start tracking improvements'
                  : 'No plans match this status filter'}
              </p>
              {filter === 'all' && (
                <Button onClick={() => router.push(`/report/${slug}/action-plan/new`)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create First Plan
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}