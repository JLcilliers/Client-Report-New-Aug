// Admin API endpoint for AI visibility data (by report ID)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { aiVisibilityService } from '@/lib/ai-visibility/ai-visibility-service';

const prisma = new PrismaClient();


// Transform metrics from service format to dashboard format
function transformMetricsForDashboard(metrics: any) {
  // Platform name mapping from display names to keys
  const platformKeyMap: Record<string, string> = {
    "ChatGPT": "chatgpt",
    "Claude": "claude",
    "Google Gemini": "gemini",
    "Perplexity AI": "perplexity",
    "Google AI Overviews": "google_ai"
  };

  // Sentiment string to number conversion
  const sentimentToNumber = (sentiment: string): number => {
    const sentimentMap: Record<string, number> = {
      "positive": 80,
      "neutral": 50,
      "negative": 20
    };
    return sentimentMap[sentiment.toLowerCase()] || 50;
  };

  // Transform platformBreakdown array to platforms nested object
  const platforms: Record<string, any> = {};
  
  if (metrics.platformBreakdown && Array.isArray(metrics.platformBreakdown)) {
    metrics.platformBreakdown.forEach((platform: any) => {
      const platformKey = platformKeyMap[platform.platform];
      if (platformKey) {
        platforms[platformKey] = {
          score: platform.score || 0,
          citations: platform.citations || 0,
          sentiment: typeof platform.sentiment === 'string' 
            ? sentimentToNumber(platform.sentiment)
            : platform.sentiment || 0
        };
      }
    });
  }

  // Return transformed data with platforms object instead of platformBreakdown array
  const { platformBreakdown, ...rest } = metrics;
  
  return {
    ...rest,
    platforms
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;

    // Get the report by ID (admin endpoint uses ID directly)
    const report = await prisma.clientReport.findUnique({
      where: { id: reportId },
      include: {
        competitors: true,
        keywords: {
          take: 10,
          orderBy: { searchVolume: 'desc' },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Get formatted AI visibility metrics (uses cached data if available)
    const metrics = await aiVisibilityService.getFormattedMetrics(report.id);

    // Transform data to match dashboard expectations
    const transformedData = transformMetricsForDashboard(metrics);

    return NextResponse.json({
      success: true,
      ...transformedData,
      reportId: report.id,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin AI Visibility GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI visibility data' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await req.json();
    const { forceRefresh } = body;

    // Get the report by ID
    const report = await prisma.clientReport.findUnique({
      where: { id: reportId },
      include: {
        competitors: true,
        keywords: {
          take: 10,
          orderBy: { searchVolume: 'desc' },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if we should update (if last update was > 24 hours ago or forced)
    const profile = await prisma.aIVisibilityProfile.findUnique({
      where: { clientReportId: report.id },
    });

    const shouldUpdate = forceRefresh ||
      !profile ||
      !profile.lastUpdated ||
      (new Date().getTime() - profile.lastUpdated.getTime()) > 24 * 60 * 60 * 1000;

    if (shouldUpdate) {
      // Extract domain from Search Console property
      const domain = extractDomain(report.searchConsolePropertyId);

      // Get keywords and competitors for AI visibility tracking
      const keywords = report.keywords.map(k => k.keyword);
      const competitors = report.competitors.map(c => c.domain);

      // Update AI visibility data across all platforms
      await aiVisibilityService.updateVisibilityData(
        report.id,
        domain,
        keywords,
        competitors
      );
    }

    // Get updated metrics
    const metrics = await aiVisibilityService.getFormattedMetrics(report.id);

    return NextResponse.json({
      success: true,
      data: metrics,
      updated: shouldUpdate,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin AI Visibility POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI visibility data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Extract domain from Search Console property
function extractDomain(property: string): string {
  // Remove sc-domain: prefix if present
  if (property.startsWith('sc-domain:')) {
    return property.replace('sc-domain:', '');
  }

  // Extract domain from URL
  try {
    const url = new URL(property);
    return url.hostname;
  } catch {
    // If not a valid URL, assume it's already a domain
    return property;
  }
}
