import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { getValidGoogleToken } from '@/lib/google/refresh-token';

// Rate limiting map to prevent abuse
const refreshCooldowns = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const prisma = getPrisma();

    // Check rate limiting
    const lastRefresh = refreshCooldowns.get(params.slug);
    if (lastRefresh && Date.now() - lastRefresh < COOLDOWN_MS) {
      const remainingTime = Math.ceil((COOLDOWN_MS - (Date.now() - lastRefresh)) / 1000);
      return NextResponse.json(
        {
          error: 'Please wait before refreshing again',
          retryAfter: remainingTime
        },
        { status: 429 }
      );
    }

    // Get client by report token (shareableId)
    const clientReport = await prisma.clientReport.findUnique({
      where: { shareableId: params.slug },
      select: {
        id: true,
        searchConsolePropertyId: true,
        googleAccountId: true,
        keywords: {
          where: { trackingStatus: 'active' },
          select: {
            id: true,
            keyword: true
          }
        }
      }
    });

    if (!clientReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!clientReport.keywords || clientReport.keywords.length === 0) {
      return NextResponse.json({ message: 'No tracked keywords found' });
    }

    // Set rate limit
    refreshCooldowns.set(params.slug, Date.now());

    // Get valid Google token
    const accessToken = await getValidGoogleToken(clientReport.googleAccountId);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Google' },
        { status: 500 }
      );
    }

    // Fetch fresh keyword data
    const updatedData = await refreshKeywordData(
      prisma,
      clientReport.id,
      clientReport.searchConsolePropertyId,
      accessToken,
      clientReport.keywords
    );

    // Get processed keyword performance data
    const keywordPerformance = await getKeywordPerformanceData(prisma, clientReport.id);

    return NextResponse.json({
      message: 'Keywords refreshed successfully',
      data: keywordPerformance,
      updatedCount: updatedData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh keywords' },
      { status: 500 }
    );
  }
}

async function refreshKeywordData(
  prisma: any,
  reportId: string,
  propertyId: string,
  accessToken: string,
  keywords: Array<{ id: string; keyword: string }>
) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2); // Account for GSC delay
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  const performanceUpdates = [];

  for (const keywordRecord of keywords) {
    try {
      // Get previous performance
      const previousPerformance = await prisma.keywordPerformance.findFirst({
        where: { keywordId: keywordRecord.id },
        orderBy: { weekStartDate: 'desc' },
        select: { avgPosition: true }
      });

      // Fetch from Google Search Console
      const response = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyId)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            dimensions: ['query', 'page'],
            dimensionFilterGroups: [{
              filters: [{
                dimension: 'query',
                operator: 'equals',
                expression: keywordRecord.keyword
              }]
            }],
            rowLimit: 5
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const keywordRow = data.rows?.[0];

        if (keywordRow) {
          const currentPosition = keywordRow.position || 999;
          const positionChange = previousPerformance?.avgPosition
            ? previousPerformance.avgPosition - currentPosition
            : null;

          performanceUpdates.push({
            keywordId: keywordRecord.id,
            weekStartDate: startDate,
            weekEndDate: endDate,
            avgPosition: currentPosition,
            bestPosition: Math.floor(currentPosition),
            impressions: keywordRow.impressions || 0,
            clicks: keywordRow.clicks || 0,
            ctr: keywordRow.ctr || 0,
            rankingUrl: keywordRow.keys?.[1] || null, // page is second dimension
            positionChange: positionChange,
            dataSource: 'search_console'
          });
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error refreshing keyword ${keywordRecord.keyword}:`, error);
    }
  }

  // Save performance data
  if (performanceUpdates.length > 0) {
    await prisma.keywordPerformance.createMany({
      data: performanceUpdates,
      skipDuplicates: true
    });
  }

  return performanceUpdates;
}

async function getKeywordPerformanceData(prisma: any, reportId: string) {
  // Get latest performance for each keyword
  const keywords = await prisma.keyword.findMany({
    where: {
      clientReportId: reportId,
      trackingStatus: 'active'
    },
    include: {
      performanceHistory: {
        orderBy: { weekStartDate: 'desc' },
        take: 2 // Get last 2 to calculate change
      }
    }
  });

  const processedKeywords = keywords.map(kw => {
    const latest = kw.performanceHistory[0];
    const previous = kw.performanceHistory[1];

    return {
      query: kw.keyword,
      clicks: latest?.clicks || 0,
      impressions: latest?.impressions || 0,
      ctr: latest?.ctr || 0,
      position: latest?.avgPosition || 999,
      previousPosition: previous?.avgPosition,
      positionChange: latest?.positionChange || null,
      rankingPage: latest?.rankingUrl || null
    };
  });

  const all = processedKeywords;
  const improved = all.filter(k => k.positionChange && k.positionChange > 0);
  const declined = all.filter(k => k.positionChange && k.positionChange < 0);
  const newKeywords = all.filter(k => !k.previousPosition);

  return {
    keywords: all,
    improved,
    declined,
    new: newKeywords,
    stats: {
      total: all.length,
      improved: improved.length,
      declined: declined.length,
      new: newKeywords.length
    }
  };
}