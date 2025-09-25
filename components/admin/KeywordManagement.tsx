'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Search, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KeywordManagementProps {
  clientId: string;
  clientName?: string;
}

export default function KeywordManagement({
  clientId,
  clientName
}: KeywordManagementProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeywordText, setNewKeywordText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Load existing keywords
  useEffect(() => {
    fetchKeywords();
  }, [clientId]);

  const fetchKeywords = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/keywords`);
      if (response.ok) {
        const data = await response.json();
        setKeywords(data.keywords.map((k: any) => k.keyword));
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
      toast({
        title: 'Error',
        description: 'Failed to load keywords',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeywords = () => {
    const newKeywords = newKeywordText
      .split('\n')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0 && !keywords.includes(k))
      .slice(0, 30 - keywords.length);

    if (newKeywords.length === 0) {
      toast({
        title: 'No keywords added',
        description: 'Keywords are empty or already exist',
        variant: 'destructive'
      });
      return;
    }

    setKeywords([...keywords, ...newKeywords]);
    setNewKeywordText('');
    toast({
      title: 'Keywords added',
      description: `Added ${newKeywords.length} keyword${newKeywords.length > 1 ? 's' : ''}`,
    });
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (keywords.length === 0) {
      toast({
        title: 'No keywords',
        description: 'Please add at least one keyword',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords })
      });

      if (!response.ok) {
        throw new Error('Failed to save keywords');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: `${data.count} keywords saved and initial data fetched`,
      });
    } catch (error) {
      console.error('Error saving keywords:', error);
      toast({
        title: 'Error',
        description: 'Failed to save keywords',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Keyword Tracking
            </CardTitle>
            <CardDescription>
              {clientName ? `Track up to 30 keywords for ${clientName}` : 'Track up to 30 keywords for this client'}
            </CardDescription>
          </div>
          <Badge variant={keywords.length >= 30 ? "destructive" : keywords.length >= 20 ? "secondary" : "default"}>
            {keywords.length}/30 Keywords
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Add Keywords
            </label>
            <Textarea
              value={newKeywordText}
              onChange={(e) => setNewKeywordText(e.target.value)}
              placeholder="Enter keywords, one per line..."
              className="min-h-[100px]"
              disabled={keywords.length >= 30}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {30 - keywords.length} slots remaining
              </span>
              <Button
                onClick={handleAddKeywords}
                disabled={newKeywordText.trim().length === 0 || keywords.length >= 30}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Keywords
              </Button>
            </div>
          </div>

          {keywords.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Current Keywords ({keywords.length})
              </label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(index)}
                      className="ml-1 hover:text-destructive transition-colors"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || keywords.length === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving & Fetching Data...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Tracked Keywords
                </>
              )}
            </Button>
          </div>

          {keywords.length > 0 && (
            <div className="text-xs text-muted-foreground border-t pt-4">
              <p>• Keywords will be tracked weekly via automated updates</p>
              <p>• Initial data fetch will retrieve the last 7 days of performance</p>
              <p>• Manual refresh available in client reports (5-minute cooldown)</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}