'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Globe, 
  Lock, 
  FileText, 
  Search,
  Zap,
  Smartphone,
  BarChart3,
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';

interface SEODashboardProps {
  reportId?: string;
  domain: string;
  onDataUpdate?: (data: any) => void;
}

export default function TechnicalSEODashboard({ reportId, domain, onDataUpdate }: SEODashboardProps) {
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  // Load existing audit data on component mount and run audit automatically
  useEffect(() => {
    if (reportId) {
      loadExistingAuditData();
    }
    // Automatically run audit when component mounts if no audit data exists
    if (!auditData && domain) {
      runAudit();
    }
  }, [reportId]);

  const loadExistingAuditData = async () => {
    if (!reportId) return;
    
    console.log('🔍 Loading existing audit data for report:', reportId);
    try {
      const response = await fetch(`/api/reports/get-seo-data?reportId=${reportId}&dataType=technical_seo`);
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          console.log('📊 Found existing audit data:', result.data);
          setAuditData(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading existing audit data:', error);
    }
  };

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    console.log('🚀 Starting SEO audit for domain:', domain);
    
    try {
      console.log('📡 Calling technical audit API...');
      const response = await fetch('/api/seo/technical-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          includePageSpeed: true,
          reportId: reportId || undefined
        })
      });

      console.log('📡 Audit response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Audit failed:', errorText);
        throw new Error(`Failed to run audit: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Audit completed successfully:', data);
      setAuditData(data);
      
      if (onDataUpdate) {
        onDataUpdate(data);
      }

      // Save to database if reportId exists
      if (reportId) {
        console.log('💾 Saving audit data to database...');
        await saveAuditData(reportId, data);
      }
    } catch (err: any) {
      console.error('💥 Audit error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('🏁 Audit process completed');
    }
  };

  const saveAuditData = async (reportId: string, data: any) => {
    try {
      await fetch('/api/reports/save-seo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          dataType: 'technical_seo',
          data
        })
      });
    } catch (err) {
      console.error('Failed to save audit data:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <Zap className="w-5 h-5" />;
      case 'security':
        return <Lock className="w-5 h-5" />;
      case 'seo':
        return <Search className="w-5 h-5" />;
      case 'accessibility':
        return <Globe className="w-5 h-5" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Technical SEO Audit</CardTitle>
              <CardDescription>
                Comprehensive analysis of {domain}
              </CardDescription>
            </div>
            <Button 
              onClick={runAudit} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Audit...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Run Full Audit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {auditData && (
        <>
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Overview</CardTitle>
              <CardDescription>Comprehensive technical SEO analysis results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <div className="text-center p-4 border rounded-lg">
                    <div className={`text-5xl font-bold ${getScoreColor(auditData.overallScore || auditData.score)}`}>
                      {auditData.overallScore || auditData.score}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Overall Score</p>
                    <Progress value={auditData.overallScore || auditData.score} className="mt-3" />
                  </div>
                </div>

                <div className="text-center p-4 border rounded-lg border-red-200 bg-red-50">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-red-600">
                    {auditData.summary.critical}
                  </div>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                </div>

                <div className="text-center p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-yellow-600">
                    {auditData.summary.warnings}
                  </div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>

                <div className="text-center p-4 border rounded-lg border-green-200 bg-green-50">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-600">
                    {auditData.summary.passed}
                  </div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold">
                    {auditData.summary.totalChecks}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Checks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Scores */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Category</CardTitle>
                <CardDescription>Detailed breakdown of SEO performance areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(auditData.categories).map(([key, category]: [string, any]) => {
                    const criticalIssues = category.checks?.filter((c: any) => c.status === 'fail').length || 0;
                    const warnings = category.checks?.filter((c: any) => c.status === 'warning').length || 0;
                    const passed = category.checks?.filter((c: any) => c.status === 'pass').length || 0;

                    return (
                      <div key={key} className="border rounded-lg p-4 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(key)}
                            <span className="font-semibold capitalize text-lg">{key.replace(/_/g, ' ')}</span>
                          </div>
                          <span className={`text-3xl font-bold ${getScoreColor(category.score)}`}>
                            {category.score}
                          </span>
                        </div>
                        <Progress value={category.score} className="mb-3 h-2" />
                        <div className="flex gap-4 text-xs">
                          {criticalIssues > 0 && (
                            <div className="flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-red-500" />
                              <span className="text-red-600">{criticalIssues} issues</span>
                            </div>
                          )}
                          {warnings > 0 && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-yellow-500" />
                              <span className="text-yellow-600">{warnings} warnings</span>
                            </div>
                          )}
                          {passed > 0 && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              <span className="text-green-600">{passed} passed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="recommendations">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="checks">All Checks</TabsTrigger>
                  <TabsTrigger value="tools">Individual Tools</TabsTrigger>
                </TabsList>

                <TabsContent value="recommendations" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    {auditData.recommendations && auditData.recommendations.length > 0 ? (
                      auditData.recommendations.map((rec: any, index: number) => (
                        <div key={index} className={
                          `border rounded-lg p-4 ${
                            rec.priority === 'high' ? 'border-red-300 bg-red-50' :
                            rec.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                            'border-gray-200 bg-gray-50'
                          }`
                        }>
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {rec.priority === 'high' ? (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                ) : rec.priority === 'medium' ? (
                                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-gray-600" />
                                )}
                                <Badge variant={
                                  rec.priority === 'high' ? 'destructive' :
                                  rec.priority === 'medium' ? 'default' : 'secondary'
                                }>
                                  {rec.priority} Priority
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {rec.category?.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg">{rec.issue}</h4>
                              <p className="text-sm text-gray-700">{rec.recommendation}</p>
                              {rec.impact && (
                                <div className="flex items-start gap-2 mt-2 p-2 bg-white rounded border">
                                  <Zap className="w-4 h-4 text-orange-500 mt-0.5" />
                                  <p className="text-sm text-gray-600 italic">
                                    <strong>Impact:</strong> {rec.impact}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                        <p>No recommendations at this time</p>
                        <p className="text-sm mt-2">Your site is performing well!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="checks" className="space-y-6 mt-6">
                  {Object.entries(auditData.categories).map(([category, data]: [string, any]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-3 mb-3">
                        {getCategoryIcon(category)}
                        <h3 className="font-semibold text-lg capitalize">{category.replace(/_/g, ' ')}</h3>
                        <Badge variant="outline">
                          {data.checks?.length || 0} checks
                        </Badge>
                      </div>
                      <div className="grid gap-2">
                        {data.checks && data.checks.length > 0 ? (
                          data.checks.map((check: any, index: number) => (
                            <div
                              key={index}
                              className={`flex items-start justify-between p-3 border rounded-lg transition-colors ${
                                check.status === 'pass' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                                check.status === 'warning' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                                'bg-red-50 border-red-200 hover:bg-red-100'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                {getStatusIcon(check.status)}
                                <div className="space-y-1 flex-1">
                                  <p className="font-medium text-sm">{check.name}</p>
                                  <p className="text-sm text-gray-600">{check.message}</p>
                                  {check.details && (
                                    <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                                  )}
                                </div>
                              </div>
                              {check.value && (
                                <Badge variant="outline" className="ml-2">
                                  {check.value}
                                </Badge>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No checks available for this category</p>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="tools" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <ToolCard 
                      title="Robots.txt" 
                      endpoint="/api/seo/robots"
                      domain={domain}
                      icon={<FileText className="w-5 h-5" />}
                    />
                    <ToolCard 
                      title="Sitemap" 
                      endpoint="/api/seo/sitemap"
                      domain={domain}
                      icon={<Globe className="w-5 h-5" />}
                    />
                    <ToolCard 
                      title="Meta Tags" 
                      endpoint="/api/seo/meta-tags"
                      domain={domain}
                      icon={<Search className="w-5 h-5" />}
                    />
                    <ToolCard 
                      title="SSL Check" 
                      endpoint="/api/seo/ssl"
                      domain={domain}
                      icon={<Lock className="w-5 h-5" />}
                    />
                    <ToolCard 
                      title="Structured Data" 
                      endpoint="/api/seo/structured-data"
                      domain={domain}
                      icon={<FileText className="w-5 h-5" />}
                    />
                    <ToolCard 
                      title="Content Analysis" 
                      endpoint="/api/seo/content-analysis"
                      domain={domain}
                      icon={<FileText className="w-5 h-5" />}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ToolCard({ title, endpoint, domain, icon }: any) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const runTool = async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: domain,
          url: domain // Some endpoints expect 'url' instead of 'domain'
        })
      });
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(`Failed to run ${title}:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={runTool}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          {icon}
          {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
        </div>
        <p className="text-sm font-medium">{title}</p>
        {data && (
          <Badge variant="outline" className="mt-2">
            Analyzed
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}