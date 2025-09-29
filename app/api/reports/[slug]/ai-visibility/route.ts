// API endpoint for AI visibility data
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { aiVisibilityService } from '@/lib/ai-visibility/ai-visibility-service';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Get the report
    const report = await prisma.clientReport.findFirst({
      where: {
        OR: [
          { shareableId: slug },
          { shareableLink: slug },
        ],
      },
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

    // Get formatted AI visibility metrics
    const metrics = await aiVisibilityService.getFormattedMetrics(report.id);

    return NextResponse.json({
      success: true,
      data: metrics,
      reportId: report.id,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Visibility GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI visibility data' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await req.json();
    const { domain, keywords, competitors, forceRefresh } = body;

    // Get the report
    const report = await prisma.clientReport.findFirst({
      where: {
        OR: [
          { shareableId: slug },
          { shareableLink: slug },
        ],
      },
      include: {
        competitors: true,
        keywords: {
          take: keywords ? 0 : 10,
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
      // Use provided data or fetch from report
      const targetDomain = domain || extractDomain(report.searchConsolePropertyId);
      const targetKeywords = keywords || report.keywords.map(k => k.keyword);
      const targetCompetitors = competitors || report.competitors.map(c => c.domain);

      // Update AI visibility data
      await aiVisibilityService.updateVisibilityData(
        report.id,
        targetDomain,
        targetKeywords,
        targetCompetitors
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
    console.error('AI Visibility POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI visibility data' },
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