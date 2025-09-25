import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

const prisma = getPrisma();

// GET - Fetch keywords for a report
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const keywords = await prisma.keyword.findMany({
      where: {
        clientReportId: params.reportId
      },
      include: {
        performanceHistory: {
          orderBy: { weekStartDate: 'desc' },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for frontend
    const transformedKeywords = keywords.map(kw => {
      const latestPerformance = kw.performanceHistory[0];
      return {
        id: kw.id,
        keyword: kw.keyword,
        trackingStatus: kw.trackingStatus,
        addedAt: kw.createdAt,
        lastPosition: latestPerformance?.avgPosition,
        positionChange: latestPerformance?.positionChange
      };
    });

    return NextResponse.json({
      keywords: transformedKeywords,
      total: transformedKeywords.length
    });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

// POST - Add new keywords
export async function POST(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const body = await request.json();
    const { keywords } = body;

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Invalid keywords data' },
        { status: 400 }
      );
    }

    // Check if report exists
    const report = await prisma.clientReport.findUnique({
      where: { id: params.reportId }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Get existing keywords to avoid duplicates
    const existingKeywords = await prisma.keyword.findMany({
      where: {
        clientReportId: params.reportId,
        keyword: { in: keywords }
      },
      select: { keyword: true }
    });

    const existingKeywordSet = new Set(existingKeywords.map(k => k.keyword.toLowerCase()));
    const newKeywords = keywords.filter(k => !existingKeywordSet.has(k.toLowerCase()));

    // Add new keywords
    if (newKeywords.length > 0) {
      await prisma.keyword.createMany({
        data: newKeywords.map(keyword => ({
          keyword,
          clientReportId: params.reportId,
          trackingStatus: 'active',
          priority: 2 // Medium priority (1=high, 2=medium, 3=low)
        })),
        skipDuplicates: true
      });
    }

    return NextResponse.json({
      added: newKeywords.length,
      skipped: keywords.length - newKeywords.length,
      message: `Added ${newKeywords.length} keywords`
    });
  } catch (error) {
    console.error('Error adding keywords:', error);
    return NextResponse.json(
      { error: 'Failed to add keywords' },
      { status: 500 }
    );
  }
}