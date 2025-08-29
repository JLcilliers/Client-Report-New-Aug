import { NextRequest, NextResponse } from 'next/server';

const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export async function POST(request: NextRequest) {
  try {
    const { url, strategy = 'mobile' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const apiKey = process.env.PAGESPEED_API_KEY;
    
    const params = new URLSearchParams({
      url,
      strategy,
      category: 'performance',
      ...(apiKey && { key: apiKey })
    });

    const response = await fetch(`${PAGESPEED_API_URL}?${params}`);
    
    if (!response.ok) {
      const error = await response.text();
      
      return NextResponse.json(
        { error: 'Failed to fetch PageSpeed data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract key metrics
    const metrics = {
      url: data.id,
      fetchTime: new Date().toISOString(),
      strategy,
      lighthouse: {
        performance: data.lighthouseResult?.categories?.performance?.score * 100 || 0,
        accessibility: data.lighthouseResult?.categories?.accessibility?.score * 100 || 0,
        bestPractices: data.lighthouseResult?.categories?.['best-practices']?.score * 100 || 0,
        seo: data.lighthouseResult?.categories?.seo?.score * 100 || 0,
      },
      coreWebVitals: {
        LCP: data.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue || 'N/A',
        FID: data.lighthouseResult?.audits?.['max-potential-fid']?.displayValue || 'N/A',
        CLS: data.lighthouseResult?.audits?.['cumulative-layout-shift']?.displayValue || 'N/A',
        FCP: data.lighthouseResult?.audits?.['first-contentful-paint']?.displayValue || 'N/A',
        INP: data.lighthouseResult?.audits?.['interaction-to-next-paint']?.displayValue || 'N/A',
        TTFB: data.lighthouseResult?.audits?.['server-response-time']?.displayValue || 'N/A',
      },
      opportunities: data.lighthouseResult?.audits
        ? Object.entries(data.lighthouseResult.audits)
            .filter(([_, audit]: [string, any]) => 
              audit.score !== null && 
              audit.score < 1 && 
              audit.details?.type === 'opportunity'
            )
            .map(([key, audit]: [string, any]) => ({
              id: key,
              title: audit.title,
              description: audit.description,
              savings: audit.details?.overallSavingsMs || 0,
              displayValue: audit.displayValue || '',
            }))
            .sort((a, b) => b.savings - a.savings)
            .slice(0, 5)
        : [],
      diagnostics: data.lighthouseResult?.audits
        ? Object.entries(data.lighthouseResult.audits)
            .filter(([_, audit]: [string, any]) => 
              audit.score !== null && 
              audit.score < 1 && 
              audit.details?.type === 'table'
            )
            .map(([key, audit]: [string, any]) => ({
              id: key,
              title: audit.title,
              description: audit.description,
              displayValue: audit.displayValue || '',
            }))
            .slice(0, 5)
        : [],
    };

    return NextResponse.json(metrics);
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reportId = searchParams.get('reportId');

  if (!reportId) {
    return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
  }

  try {
    // This would fetch cached PageSpeed data from database
    // For now, return empty data structure
    return NextResponse.json({
      reportId,
      lastFetched: null,
      data: null,
      message: 'PageSpeed data not yet collected for this report'
    });
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to fetch PageSpeed data' },
      { status: 500 }
    );
  }
}