'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TechnicalSEODashboard from '@/components/seo/TechnicalSEODashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SEODashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [slug]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/public/report/${slug}`);
      if (!response.ok) throw new Error('Report not found');
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Report not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/report/${slug}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Report
            </Button>
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{report.report_name}</CardTitle>
              <CardDescription>
                Technical SEO Analysis for {report.client?.domain || report.client_name}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* SEO Dashboard */}
        <TechnicalSEODashboard 
          reportId={report.id}
          domain={report.client?.domain || report.client_name}
          onDataUpdate={(data) => {
            
          }}
        />
      </div>
    </div>
  );
}