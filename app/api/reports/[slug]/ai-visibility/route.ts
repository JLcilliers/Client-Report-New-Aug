// API endpoint for AI visibility data
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { aiReadinessService } from '@/lib/ai-visibility/ai-readiness-service';
import { cookies } from 'next/headers';

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

    // Get formatted AI readiness metrics (uses cached data if available)
    const metrics = await aiReadinessService.getFormattedMetrics(report.id);

    return NextResponse.json({
      success: true,
      data: metrics,
      reportId: report.id,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Readiness GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI readiness data' },
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
    const { forceRefresh } = body;

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

    // Check if we should update (if last update was > 24 hours ago or forced)
    const profile = await prisma.aIVisibilityProfile.findUnique({
      where: { clientReportId: report.id },
    });

    const shouldUpdate = forceRefresh ||
      !profile ||
      !profile.lastUpdated ||
      (new Date().getTime() - profile.lastUpdated.getTime()) > 24 * 60 * 60 * 1000;

    if (shouldUpdate) {
      // Get Google OAuth tokens from cookies
      const cookieStore = cookies();
      const accessToken = cookieStore.get('google_access_token')?.value;
      const refreshToken = cookieStore.get('google_refresh_token')?.value;

      const tokens = (accessToken && refreshToken) ? {
        accessToken,
        refreshToken,
      } : undefined;

      // Extract domain from Search Console property
      const domain = extractDomain(report.searchConsolePropertyId);

      // Calculate AI readiness using real Google API data
      await aiReadinessService.calculateAIReadiness(
        report.id,
        report.searchConsolePropertyId,
        report.ga4PropertyId,
        domain,
        tokens
      );
    }

    // Get updated metrics
    const metrics = await aiReadinessService.getFormattedMetrics(report.id);

    return NextResponse.json({
      success: true,
      data: metrics,
      updated: shouldUpdate,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Readiness POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI readiness data',  details: error instanceof Error ? error.message : 'Unknown error' },
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