'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Target,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface ActionPlanTask {
  id?: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  order: number;
}

interface ActionPlan {
  id?: string;
  title: string;
  description?: string;
  priority: number;
  category: string;
  status: string;
  impact?: string;
  effort?: string;
  estimatedValue?: string;
  timeframe?: string;
  deadline?: string;
  notes?: string;
  blockers?: string;
  tasks: ActionPlanTask[];
}

export default function ActionPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const planId = params.planId as string;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionPlan, setActionPlan] = useState<ActionPlan>({
    title: '',
    description: '',
    priority: 1,
    category: 'seo',
    status: 'not_started',
    impact: 'medium',
    effort: 'medium',
    estimatedValue: '',
    timeframe: '',
    deadline: '',
    notes: '',
    blockers: '',
    tasks: []
  });
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Load action plan data
  useEffect(() => {
    if (planId !== 'new') {
      fetchActionPlan();
    } else {
      // Initialize with data from query params if creating new from insights
      const urlParams = new URLSearchParams(window.location.search);
      const title = urlParams.get('title');
      const category = urlParams.get('category');
      const impact = urlParams.get('impact');
      const effort = urlParams.get('effort');
      
      if (title) {
        setActionPlan(prev => ({
          ...prev,
          title,
          category: category || 'seo',
          impact: impact || 'medium',
          effort: effort || 'medium'
        }));
      }
    }
  }, [planId]);

  const fetchActionPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${slug}/action-plans/${planId}`);
      if (response.ok) {
        const data = await response.json();
        setActionPlan(data);
      }
    } catch (error) {
      console.error('Failed to fetch action plan:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = planId === 'new' 
        ? `/api/reports/${slug}/action-plans`
        : `/api/reports/${slug}/action-plans/${planId}`;
      
      const method = planId === 'new' ? 'POST' : 'PUT';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionPlan),
      });

      if (response.ok) {
        const data = await response.json();
        if (planId === 'new') {
          // Redirect to the new action plan page
          router.push(`/report/${slug}/action-plan/${data.id}`);
        } else {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      }
    } catch (error) {
      console.error('Failed to save action plan:', error);
    }
    setSaving(false);
  };

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: ActionPlanTask = {
        title: newTaskTitle,
        isCompleted: false,
        order: actionPlan.tasks.length
      };
      setActionPlan(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask]
      }));
      setNewTaskTitle('');
    }
  };

  const updateTask = (index: number, updates: Partial<ActionPlanTask>) => {
    setActionPlan(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, ...updates } : task
      )
    }));
  };

  const deleteTask = (index: number) => {
    setActionPlan(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'blocked':
        return <XCircle className="w-4 h-4 text-red-600" />;
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-xl font-bold">
                {planId === 'new' ? 'Create Action Plan' : 'Edit Action Plan'}
              </h1>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Action plan saved successfully!
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Define the action plan details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={actionPlan.title}
                onChange={(e) => setActionPlan(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Implement conversion tracking"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={actionPlan.description}
                onChange={(e) => setActionPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what needs to be done and why..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={actionPlan.category}
                  onValueChange={(value) => setActionPlan(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seo">SEO</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="conversion">Conversion</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={actionPlan.priority.toString()}
                  onValueChange={(value) => setActionPlan(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Highest</SelectItem>
                    <SelectItem value="2">2 - High</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - Low</SelectItem>
                    <SelectItem value="5">5 - Lowest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="impact">Impact</Label>
                <Select
                  value={actionPlan.impact}
                  onValueChange={(value) => setActionPlan(prev => ({ ...prev, impact: value }))}
                >
                  <SelectTrigger id="impact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="effort">Effort</Label>
                <Select
                  value={actionPlan.effort}
                  onValueChange={(value) => setActionPlan(prev => ({ ...prev, effort: value }))}
                >
                  <SelectTrigger id="effort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Timeline</CardTitle>
            <CardDescription>Track progress and set deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={actionPlan.status}
                onValueChange={(value) => setActionPlan(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('not_started')}
                      Not Started
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('in_progress')}
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('completed')}
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="blocked">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('blocked')}
                      Blocked
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={actionPlan.deadline}
                  onChange={(e) => setActionPlan(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="timeframe">Estimated Timeframe</Label>
                <Input
                  id="timeframe"
                  value={actionPlan.timeframe}
                  onChange={(e) => setActionPlan(prev => ({ ...prev, timeframe: e.target.value }))}
                  placeholder="e.g., 1-2 weeks"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimatedValue">Estimated Value</Label>
              <Input
                id="estimatedValue"
                value={actionPlan.estimatedValue}
                onChange={(e) => setActionPlan(prev => ({ ...prev, estimatedValue: e.target.value }))}
                placeholder="e.g., $2,500/month or +15% CTR"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tasks Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Task Checklist</CardTitle>
            <CardDescription>Break down the action plan into specific tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a new task..."
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />
              <Button onClick={addTask} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {actionPlan.tasks.map((task, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={(checked) => 
                      updateTask(index, { isCompleted: checked as boolean })
                    }
                  />
                  <div className="flex-1">
                    <Input
                      value={task.title}
                      onChange={(e) => updateTask(index, { title: e.target.value })}
                      className={task.isCompleted ? 'line-through text-gray-400' : ''}
                    />
                    <Textarea
                      value={task.description || ''}
                      onChange={(e) => updateTask(index, { description: e.target.value })}
                      placeholder="Add description (optional)"
                      className="mt-1 text-sm"
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes & Blockers */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Blockers</CardTitle>
            <CardDescription>Additional information and potential obstacles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={actionPlan.notes}
                onChange={(e) => setActionPlan(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any relevant notes, links, or resources..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="blockers">Blockers</Label>
              <Textarea
                id="blockers"
                value={actionPlan.blockers}
                onChange={(e) => setActionPlan(prev => ({ ...prev, blockers: e.target.value }))}
                placeholder="List any blockers or dependencies..."
                rows={3}
                className={actionPlan.status === 'blocked' ? 'border-red-300' : ''}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}