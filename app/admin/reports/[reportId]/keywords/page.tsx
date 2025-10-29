'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, X, Search, Save, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface Keyword {
  id: string;
  keyword: string;
  trackingStatus: 'active' | 'paused';
  addedAt: string;
  lastPosition?: number;
  positionChange?: number;
}

export default function ReportKeywordsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const reportId = params.reportId as string;

  const [report, setReport] = useState<any>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeywords, setNewKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchReport();
    fetchKeywords();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      
    }
  };

  const fetchKeywords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/keywords`);
      if (response.ok) {
        const data = await response.json();
        setKeywords(data.keywords || []);
      }
    } catch (error) {
      
      toast({
        title: 'Error',
        description: 'Failed to load keywords',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeywords = async () => {
    if (!newKeywords.trim()) return;

    setIsSaving(true);
    const keywordsList = newKeywords
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywordsList })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: `Added ${data.added} keywords`
        });
        setNewKeywords('');
        fetchKeywords();
      } else {
        throw new Error('Failed to add keywords');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add keywords',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKeyword = async (keywordId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/keywords/${keywordId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setKeywords(keywords.filter(k => k.id !== keywordId));
        toast({
          title: 'Success',
          description: 'Keyword removed'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove keyword',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (keywordId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/keywords/${keywordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingStatus: newStatus })
      });

      if (response.ok) {
        setKeywords(keywords.map(k =>
          k.id === keywordId ? { ...k, trackingStatus: newStatus } : k
        ));
        toast({
          title: 'Success',
          description: `Keyword ${newStatus === 'active' ? 'activated' : 'paused'}`
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update keyword status',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/reports">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Reports
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Keyword Tracking</h1>
          <p className="text-gray-600 mt-1">
            {report?.reportName || report?.clientName || 'Report'} - Manage tracked keywords
          </p>
        </div>
        <Link href={`/report/${report?.shareableId}`} target="_blank">
          <Button variant="outline">
            View Report
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Keywords Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Keywords</CardTitle>
              <CardDescription>
                Enter keywords to track (one per line)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter keywords...&#10;seo services&#10;local seo&#10;website optimization"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                rows={8}
                className="mb-4"
              />
              <Button
                onClick={handleAddKeywords}
                disabled={isSaving || !newKeywords.trim()}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Keywords
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Keywords List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tracked Keywords</CardTitle>
              <CardDescription>
                {keywords.length} keywords being tracked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : keywords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No keywords tracked yet</p>
                  <p className="text-sm mt-2">Add keywords to start tracking their rankings</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{keyword.keyword}</div>
                          {keyword.lastPosition && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">
                                Position: {keyword.lastPosition}
                              </span>
                              {keyword.positionChange !== undefined && keyword.positionChange !== 0 && (
                                <span className={`flex items-center text-sm ${
                                  keyword.positionChange > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {keyword.positionChange > 0 ? (
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                  )}
                                  {Math.abs(keyword.positionChange)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={keyword.trackingStatus === 'active' ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => handleToggleStatus(keyword.id, keyword.trackingStatus)}
                        >
                          {keyword.trackingStatus}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveKeyword(keyword.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}