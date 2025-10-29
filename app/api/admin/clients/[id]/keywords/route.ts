import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

const prisma = getPrisma();

// GET - Fetch keywords for a client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const keywords = await prisma.keyword.findMany({
      where: {
        clientReportId: params.id
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
        priority: kw.priority,
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
    
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

// POST - Add new keywords
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if client exists
    const client = await prisma.clientReport.findUnique({
      where: { id: params.id }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get existing keywords to avoid duplicates
    const existingKeywords = await prisma.keyword.findMany({
      where: {
        clientReportId: params.id,
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
          clientReportId: params.id,
          trackingStatus: 'active',
          priority: 2 // Medium priority
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
    
    return NextResponse.json(
      { error: 'Failed to add keywords' },
      { status: 500 }
    );
  }
}