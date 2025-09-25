'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Globe,
  Search,
  Target,
  TrendingUp,
  TrendingDown,
  Loader2,
  ExternalLink,
  Copy,
  Settings,
  Users,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface ClientData {
  id: string;
  clientName: string;
  domain: string;
  industry?: string;
  contactEmail?: string;
  reports?: any[];
  competitors?: Array<{
    id: string;
    name: string;
    domain: string;
    addedAt: string;
  }>;
  keywords?: Array<{
    id: string;
    keyword: string;
    trackingStatus: string;
    priority: number;
    lastPosition?: number;
    positionChange?: number;
  }>;
}

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [clientInfo, setClientInfo] = useState({
    clientName: '',
    domain: '',
    industry: '',
    contactEmail: ''
  });
  const [newCompetitor, setNewCompetitor] = useState({ name: '', domain: '' });
  const [newKeywords, setNewKeywords] = useState('');

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  const fetchClientDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
        setClientInfo({
          clientName: data.clientName || '',
          domain: data.domain || '',
          industry: data.industry || '',
          contactEmail: data.contactEmail || ''
        });
      } else {
        throw new Error('Failed to fetch client details');
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client details',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientInfo)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Client information updated'
        });
        fetchClientDetails();
      } else {
        throw new Error('Failed to update client');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update client',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name || !newCompetitor.domain) return;

    try {
      const response = await fetch(`/api/admin/clients/${clientId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompetitor)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Competitor added'
        });
        setNewCompetitor({ name: '', domain: '' });
        fetchClientDetails();
      } else {
        throw new Error('Failed to add competitor');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add competitor',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveCompetitor = async (competitorId: string) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/competitors/${competitorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Competitor removed'
        });
        fetchClientDetails();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove competitor',
        variant: 'destructive'
      });
    }
  };

  const handleAddKeywords = async () => {
    if (!newKeywords.trim()) return;

    const keywordsList = newKeywords
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    try {
      const response = await fetch(`/api/admin/clients/${clientId}/keywords`, {
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
        fetchClientDetails();
      } else {
        throw new Error('Failed to add keywords');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add keywords',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveKeyword = async (keywordId: string) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/keywords/${keywordId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Keyword removed'
        });
        fetchClientDetails();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove keyword',
        variant: 'destructive'
      });
    }
  };

  const handleCreateReport = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/create-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const { reportId } = await response.json();
        toast({
          title: 'Success',
          description: 'Report created successfully'
        });
        router.push(`/admin/reports/${reportId}`);
      } else {
        throw new Error('Failed to create report');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create report',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p>Client not found</p>
        <Link href="/admin/clients">
          <Button className="mt-4">Back to Clients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Clients
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{client.clientName}</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {client.domain}
          </p>
        </div>
        <div className="flex gap-2">
          {client.reports && client.reports.length > 0 ? (
            <Link href={`/report/${client.reports[0].shareableId}`} target="_blank">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Report
              </Button>
            </Link>
          ) : (
            <Button onClick={handleCreateReport}>
              <Plus className="w-4 h-4 mr-2" />
              Create Report
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Basic information about the client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={clientInfo.clientName}
                  onChange={(e) => setClientInfo({ ...clientInfo, clientName: e.target.value })}
                  placeholder="Client company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Website Domain</label>
                <Input
                  value={clientInfo.domain}
                  onChange={(e) => setClientInfo({ ...clientInfo, domain: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Industry</label>
                <Input
                  value={clientInfo.industry}
                  onChange={(e) => setClientInfo({ ...clientInfo, industry: e.target.value })}
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Email</label>
                <Input
                  value={clientInfo.contactEmail}
                  onChange={(e) => setClientInfo({ ...clientInfo, contactEmail: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
              <Button onClick={handleUpdateClient} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{client.keywords?.length || 0}</div>
                <p className="text-sm text-gray-600">Tracked keywords</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Competitors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{client.competitors?.length || 0}</div>
                <p className="text-sm text-gray-600">Monitored competitors</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{client.reports?.length || 0}</div>
                <p className="text-sm text-gray-600">Active reports</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Add Keywords</CardTitle>
                  <CardDescription>Enter keywords to track (one per line)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter keywords...&#10;seo services&#10;local seo&#10;website optimization"
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    rows={8}
                    className="mb-4"
                  />
                  <Button onClick={handleAddKeywords} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Keywords
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tracked Keywords</CardTitle>
                  <CardDescription>{client.keywords?.length || 0} keywords being tracked</CardDescription>
                </CardHeader>
                <CardContent>
                  {client.keywords && client.keywords.length > 0 ? (
                    <div className="space-y-2">
                      {client.keywords.map((keyword) => (
                        <div key={keyword.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{keyword.keyword}</span>
                            {keyword.lastPosition && (
                              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                <span>Position: {keyword.lastPosition}</span>
                                {keyword.positionChange !== undefined && keyword.positionChange !== 0 && (
                                  <span className={`flex items-center ${
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveKeyword(keyword.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No keywords tracked yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Competitor</CardTitle>
              <CardDescription>Track your client's competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Competitor name"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                />
                <Input
                  placeholder="Competitor domain (e.g., competitor.com)"
                  value={newCompetitor.domain}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
                />
              </div>
              <Button onClick={handleAddCompetitor} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Competitor
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitored Competitors</CardTitle>
              <CardDescription>{client.competitors?.length || 0} competitors being tracked</CardDescription>
            </CardHeader>
            <CardContent>
              {client.competitors && client.competitors.length > 0 ? (
                <div className="space-y-2">
                  {client.competitors.map((competitor) => (
                    <div key={competitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{competitor.name}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Globe className="w-3 h-3" />
                          {competitor.domain}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCompetitor(competitor.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No competitors added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Reports</CardTitle>
              <CardDescription>All reports for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {client.reports && client.reports.length > 0 ? (
                <div className="space-y-3">
                  {client.reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{report.reportName}</h4>
                        <p className="text-sm text-gray-600">Created: {new Date(report.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/report/${report.shareableId}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/reports/${report.id}/keywords`}>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No reports created yet</p>
                  <Button onClick={handleCreateReport}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}