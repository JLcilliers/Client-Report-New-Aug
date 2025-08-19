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

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/seo/technical-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, includePageSpeed: true })
      });

      if (!response.ok) {
        throw new Error('Failed to run audit');
      }

      const data = await response.json();
      setAuditData(data);
      
      if (onDataUpdate) {
        onDataUpdate(data);
      }

      // Save to database if reportId exists
      if (reportId) {
        await saveAuditData(reportId, data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(auditData.score)}`}>
                    {auditData.score}
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {auditData.summary.critical}
                  </div>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {auditData.summary.warnings}
                  </div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {auditData.summary.passed}
                  </div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {auditData.summary.totalChecks}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Checks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Scores */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(auditData.categories).map(([key, category]: [string, any]) => (
              <Card key={key} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    {getCategoryIcon(key)}
                    <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                      {category.score}
                    </span>
                  </div>
                  <p className="text-sm font-medium capitalize">{key}</p>
                  <Progress value={category.score} className="mt-2" />
                </CardContent>
              </Card>
            ))}
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

                <TabsContent value="recommendations" className="space-y-4">
                  {auditData.recommendations.map((rec: any, index: number) => (
                    <Alert key={index}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            rec.priority === 'high' ? 'destructive' :
                            rec.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                        <div className="font-medium">{rec.issue}</div>
                        <div className="text-sm text-muted-foreground">{rec.recommendation}</div>
                        <div className="text-sm text-muted-foreground italic">{rec.impact}</div>
                      </div>
                    </Alert>
                  ))}
                </TabsContent>

                <TabsContent value="checks" className="space-y-4">
                  {Object.entries(auditData.categories).map(([category, data]: [string, any]) => (
                    <div key={category}>
                      <h3 className="font-semibold capitalize mb-2">{category}</h3>
                      <div className="space-y-2">
                        {data.checks.map((check: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(check.status)}
                              <span className="text-sm">{check.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{check.message}</span>
                          </div>
                        ))}
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