import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { getValidGoogleToken } from '@/lib/google/refresh-token';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrisma();

    // Get all clients with tracked keywords
    const clientReports = await prisma.clientReport.findMany({
      where: {
        isActive: true,
        keywords: {
          some: {
            trackingStatus: 'active'
          }
        }
      },
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

    if (clientReports.length === 0) {
      return NextResponse.json({ message: 'No clients with tracked keywords found' });
    }

    let totalUpdated = 0;
    let totalFailed = 0;
    const errors = [];

    for (const report of clientReports) {
      if (report.keywords.length === 0) continue;

      try {
        await updateClientKeywords(
          prisma,
          report.id,
          report.searchConsolePropertyId,
          report.googleAccountId,
          report.keywords
        );
        totalUpdated++;
      } catch (clientError: any) {
        console.error(`Error updating client ${report.id}:`, clientError);
        totalFailed++;
        errors.push({
          reportId: report.id,
          error: clientError.message
        });
      }

      // Rate limiting between clients
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Log the cron job execution
    await prisma.log.create({
      data: {
        level: 'info',
        source: 'cron/update-keywords',
        message: `Weekly keyword update completed`,
        meta: {
          totalClients: clientReports.length,
          updated: totalUpdated,
          failed: totalFailed,
          errors: errors.length > 0 ? errors : undefined
        }
      }
    });

    return NextResponse.json({
      message: `Updated keywords for ${totalUpdated} clients`,
      totalClients: clientReports.length,
      updated: totalUpdated,
      failed: totalFailed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}

async function updateClientKeywords(
  prisma: any,
  reportId: string,
  propertyId: string,
  googleAccountId: string,
  keywords: Array<{ id: string; keyword: string }>
) {
  // Get valid Google token
  const accessToken = await getValidGoogleToken(googleAccountId);
  if (!accessToken) {
    throw new Error('Failed to get valid Google token');
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2); // Account for GSC delay
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  const performanceInserts = [];

  for (const keywordRecord of keywords) {
    try {
      // Get previous performance for comparison
      const previousPerformance = await prisma.keywordPerformance.findFirst({
        where: { keywordId: keywordRecord.id },
        orderBy: { weekStartDate: 'desc' },
        select: { avgPosition: true }
      });

      // Fetch current keyword data from Google Search Console
      const [keywordResponse, pageResponse] = await Promise.all([
        fetch(
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
              dimensions: ['query'],
              dimensionFilterGroups: [{
                filters: [{
                  dimension: 'query',
                  operator: 'equals',
                  expression: keywordRecord.keyword
                }]
              }],
              rowLimit: 1
            })
          }
        ),
        // Get ranking page
        fetch(
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
              dimensions: ['page'],
              dimensionFilterGroups: [{
                filters: [{
                  dimension: 'query',
                  operator: 'equals',
                  expression: keywordRecord.keyword
                }]
              }],
              rowLimit: 1
            })
          }
        )
      ]);

      if (keywordResponse.ok && pageResponse.ok) {
        const keywordData = await keywordResponse.json();
        const pageData = await pageResponse.json();

        const keywordRow = keywordData.rows?.[0];
        const rankingPage = pageData.rows?.[0]?.keys?.[0];
        const currentPosition = keywordRow?.position || 999;

        // Calculate position change
        let positionChange = null;
        if (previousPerformance?.avgPosition) {
          positionChange = previousPerformance.avgPosition - currentPosition; // Positive = improvement
        }

        performanceInserts.push({
          keywordId: keywordRecord.id,
          weekStartDate: startDate,
          weekEndDate: endDate,
          avgPosition: currentPosition,
          bestPosition: Math.floor(currentPosition),
          impressions: keywordRow?.impressions || 0,
          clicks: keywordRow?.clicks || 0,
          ctr: keywordRow?.ctr || 0,
          rankingUrl: rankingPage || null,
          positionChange: positionChange,
          dataSource: 'search_console'
        });
      }

      // Rate limiting between keyword fetches
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (keywordError) {
      console.error(`Error updating keyword ${keywordRecord.keyword}:`, keywordError);
    }
  }

  // Bulk insert all performance data
  if (performanceInserts.length > 0) {
    await prisma.keywordPerformance.createMany({
      data: performanceInserts,
      skipDuplicates: true
    });

    // Check for keyword alerts
    await checkKeywordAlerts(prisma, performanceInserts);
  }
}

async function checkKeywordAlerts(prisma: any, performances: any[]) {
  // Check for significant position changes
  for (const perf of performances) {
    if (perf.positionChange) {
      // Check for significant improvement (moved up 5+ positions)
      if (perf.positionChange > 5) {
        await prisma.keywordAlert.create({
          data: {
            keywordId: perf.keywordId,
            alertType: 'position_improved',
            threshold: 5,
            isActive: true,
            lastTriggered: new Date()
          }
        }).catch(() => {}); // Ignore if alert already exists
      }

      // Check for significant decline (moved down 5+ positions)
      if (perf.positionChange < -5) {
        await prisma.keywordAlert.create({
          data: {
            keywordId: perf.keywordId,
            alertType: 'position_declined',
            threshold: -5,
            isActive: true,
            lastTriggered: new Date()
          }
        }).catch(() => {}); // Ignore if alert already exists
      }
    }

    // Check for first page achievement
    if (perf.avgPosition <= 10 && perf.positionChange && perf.positionChange > 0) {
      await prisma.keywordAlert.create({
        data: {
          keywordId: perf.keywordId,
          alertType: 'first_page_achieved',
          isActive: true,
          lastTriggered: new Date()
        }
      }).catch(() => {});
    }
  }
}

// GET endpoint for manual trigger (development only)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  // Allow manual trigger in development without auth
  return POST(request);
}