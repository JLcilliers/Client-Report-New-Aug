import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const prisma = getPrisma();
    const { keywords } = await request.json();

    // Validate keywords array (max 30)
    if (!Array.isArray(keywords) || keywords.length === 0 || keywords.length > 30) {
      return NextResponse.json(
        { error: 'Keywords must be an array of 1-30 items' },
        { status: 400 }
      );
    }

    // Get client and verify it exists
    const client = await prisma.clientReport.findUnique({
      where: { id: params.clientId },
      select: {
        id: true,
        searchConsolePropertyId: true,
        googleAccountId: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Clear existing keywords and add new ones
    await prisma.$transaction(async (tx) => {
      // Delete existing keywords for this client
      await tx.keyword.deleteMany({
        where: { clientReportId: params.clientId }
      });

      // Insert new keywords
      const keywordInserts = keywords.map((keyword: string, index: number) => ({
        clientReportId: params.clientId,
        keyword: keyword.trim().toLowerCase(),
        priority: index + 1,
        trackingStatus: 'active'
      }));

      await tx.keyword.createMany({
        data: keywordInserts
      });
    });

    // Initial fetch for all keywords
    await fetchInitialKeywordData(params.clientId, keywords, client.searchConsolePropertyId, client.googleAccountId);

    return NextResponse.json({
      message: 'Keywords added successfully',
      count: keywords.length
    });
  } catch (error) {
    console.error('Error adding keywords:', error);
    return NextResponse.json(
      { error: 'Failed to add keywords' },
      { status: 500 }
    );
  }
}

async function fetchInitialKeywordData(
  clientId: string,
  keywords: string[],
  propertyId: string,
  googleAccountId: string
) {
  try {
    const prisma = getPrisma();

    // Get valid Google token
    const { getValidGoogleToken } = await import('@/lib/google/refresh-token');
    const accessToken = await getValidGoogleToken(googleAccountId);

    if (!accessToken) {
      console.error('Failed to get valid Google token for initial keyword fetch');
      return;
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3); // Account for GSC delay
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const historyInserts = [];

    for (const keywordText of keywords) {
      try {
        // Find the keyword record we just created
        const keywordRecord = await prisma.keyword.findFirst({
          where: {
            clientReportId: clientId,
            keyword: keywordText.trim().toLowerCase()
          }
        });

        if (!keywordRecord) continue;

        // Fetch keyword performance from Google Search Console
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
              dimensions: ['query'],
              dimensionFilterGroups: [{
                filters: [{
                  dimension: 'query',
                  operator: 'equals',
                  expression: keywordText
                }]
              }],
              rowLimit: 1
            })
          }
        );

        // Fetch ranking page
        const pageResponse = await fetch(
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
                  expression: keywordText
                }]
              }],
              rowLimit: 1
            })
          }
        );

        if (response.ok && pageResponse.ok) {
          const keywordData = await response.json();
          const pageData = await pageResponse.json();

          const keywordRow = keywordData.rows?.[0];
          const rankingPage = pageData.rows?.[0]?.keys?.[0];

          historyInserts.push({
            keywordId: keywordRecord.id,
            weekStartDate: startDate,
            weekEndDate: endDate,
            avgPosition: keywordRow?.position || 999,
            bestPosition: Math.floor(keywordRow?.position || 999),
            impressions: keywordRow?.impressions || 0,
            clicks: keywordRow?.clicks || 0,
            ctr: keywordRow?.ctr || 0,
            rankingUrl: rankingPage || null,
            dataSource: 'search_console'
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (keywordError) {
        console.error(`Error fetching data for keyword ${keywordText}:`, keywordError);
        // Continue with other keywords
      }
    }

    if (historyInserts.length > 0) {
      await prisma.keywordPerformance.createMany({
        data: historyInserts
      });
    }
  } catch (error) {
    console.error('Error in initial keyword fetch:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const prisma = getPrisma();

    const keywords = await prisma.keyword.findMany({
      where: {
        clientReportId: params.clientId,
        trackingStatus: 'active'
      },
      orderBy: { priority: 'asc' }
    });

    return NextResponse.json({ keywords: keywords || [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const prisma = getPrisma();

    await prisma.keyword.deleteMany({
      where: { clientReportId: params.clientId }
    });

    return NextResponse.json({ message: 'Keywords deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete keywords' },
      { status: 500 }
    );
  }
}