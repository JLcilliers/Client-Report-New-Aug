import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

const prisma = getPrisma();

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const report = await prisma.clientReport.findUnique({
      where: { id: params.reportId },
      include: {
        keywords: {
          where: { trackingStatus: 'active' },
          select: { id: true }
        }
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...report,
      keywordCount: report.keywords.length
    });
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}