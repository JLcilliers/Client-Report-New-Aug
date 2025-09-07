'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Globe, 
  Calendar,
  Building,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Competitor {
  id: string;
  name: string;
  domain: string;
  notes?: string;
  addedAt: string;
  lastAnalyzed?: string;
  createdAt: string;
  updatedAt: string;
}

interface CompetitorManagementProps {
  reportSlug: string;
}

export default function CompetitorManagement({ reportSlug }: CompetitorManagementProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [brandName, setBrandName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    notes: ''
  });

  // Fetch competitors
  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/${reportSlug}/competitors`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch competitors');
      }
      
      const data = await response.json();
      setCompetitors(data.competitors || []);
      setBrandName(data.brandName || 'Brand');
    } catch (error) {
      console.error('Error fetching competitors:', error);
      toast.error('Failed to load competitors');
    } finally {
      setLoading(false);
    }
  };

  // Add competitor
  const handleAddCompetitor = async () => {
    if (!formData.name.trim() || !formData.domain.trim()) {
      toast.error('Name and domain are required');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`/api/reports/${reportSlug}/competitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add competitor');
      }

      const newCompetitor = await response.json();
      setCompetitors(prev => [newCompetitor, ...prev]);
      setFormData({ name: '', domain: '', notes: '' });
      setShowAddDialog(false);
      toast.success('Competitor added successfully');
    } catch (error: any) {
      console.error('Error adding competitor:', error);
      toast.error(error.message || 'Failed to add competitor');
    } finally {
      setAdding(false);
    }
  };

  // Update competitor
  const handleUpdateCompetitor = async () => {
    if (!selectedCompetitor || !formData.name.trim() || !formData.domain.trim()) {
      toast.error('Name and domain are required');
      return;
    }

    setEditing(selectedCompetitor.id);
    try {
      const response = await fetch(`/api/reports/${reportSlug}/competitors/${selectedCompetitor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update competitor');
      }

      const updatedCompetitor = await response.json();
      setCompetitors(prev => 
        prev.map(comp => comp.id === selectedCompetitor.id ? updatedCompetitor : comp)
      );
      setFormData({ name: '', domain: '', notes: '' });
      setSelectedCompetitor(null);
      setShowEditDialog(false);
      toast.success('Competitor updated successfully');
    } catch (error: any) {
      console.error('Error updating competitor:', error);
      toast.error(error.message || 'Failed to update competitor');
    } finally {
      setEditing(null);
    }
  };

  // Delete competitor
  const handleDeleteCompetitor = async () => {
    if (!selectedCompetitor) return;

    setDeleting(selectedCompetitor.id);
    try {
      const response = await fetch(`/api/reports/${reportSlug}/competitors/${selectedCompetitor.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete competitor');
      }

      setCompetitors(prev => prev.filter(comp => comp.id !== selectedCompetitor.id));
      setSelectedCompetitor(null);
      setShowDeleteDialog(false);
      toast.success('Competitor removed successfully');
    } catch (error: any) {
      console.error('Error deleting competitor:', error);
      toast.error(error.message || 'Failed to delete competitor');
    } finally {
      setDeleting(null);
    }
  };

  // Open edit dialog
  const openEditDialog = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setFormData({
      name: competitor.name,
      domain: competitor.domain,
      notes: competitor.notes || ''
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setShowDeleteDialog(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchCompetitors();
  }, [reportSlug]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Competitor Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Competitor Management
          </CardTitle>
          <CardDescription>
            Track and manage competitors for <strong>{brandName}</strong>. 
            This helps you monitor competitive landscape and benchmark performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {competitors.length} {competitors.length === 1 ? 'Competitor' : 'Competitors'}
              </Badge>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Competitor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Competitor</DialogTitle>
                  <DialogDescription>
                    Add a competitor to track against {brandName}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., Competitor Company"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="domain" className="text-right">
                      Domain
                    </Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., competitor.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="col-span-3"
                      placeholder="Optional notes about this competitor..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddCompetitor}
                    disabled={adding}
                  >
                    {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Competitor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {competitors.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No competitors added yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your competition by adding competitor domains.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Competitor
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {competitors.map((competitor) => (
                <Card key={competitor.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{competitor.name}</h4>
                          {competitor.lastAnalyzed && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Analyzed
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Globe className="h-4 w-4" />
                          <a 
                            href={`https://${competitor.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                          >
                            {competitor.domain}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Added on {formatDate(competitor.addedAt)}
                        </div>
                        {competitor.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {competitor.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(competitor)}
                          disabled={editing === competitor.id}
                        >
                          {editing === competitor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(competitor)}
                          disabled={deleting === competitor.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleting === competitor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Competitor</DialogTitle>
            <DialogDescription>
              Update competitor information for {brandName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-domain" className="text-right">
                Domain
              </Label>
              <Input
                id="edit-domain"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateCompetitor}
              disabled={editing === selectedCompetitor?.id}
            >
              {editing === selectedCompetitor?.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Competitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{selectedCompetitor?.name}</strong> from your competitor list for {brandName}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompetitor}
              disabled={deleting === selectedCompetitor?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting === selectedCompetitor?.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Competitor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}