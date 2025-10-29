import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { aiReportGenerator } from '@/lib/ai/report-summary';

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();

    // Get report details - slug is actually the shareableId
    let report = await prisma.clientReport.findUnique({
      where: { shareableId: slug },
    });

    // Fallback to ID if not found by shareableId
    if (!report) {
      report = await prisma.clientReport.findUnique({
        where: { id: slug },
      });
    }

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Extract metrics from request body
    const { analytics, searchConsole, keywords } = body;

    // Calculate previous month data if available
    const metrics = {
      analytics: {
        sessions: analytics?.totalSessions || 0,
        users: analytics?.totalUsers || 0,
        pageviews: analytics?.totalPageviews || 0,
        bounceRate: analytics?.bounceRate || 0,
        avgSessionDuration: analytics?.avgSessionDuration || 0,
        previousMonth: analytics?.previousMonth,
      },
      searchConsole: {
        clicks: searchConsole?.totalClicks || 0,
        impressions: searchConsole?.totalImpressions || 0,
        ctr: searchConsole?.avgCtr || 0,
        position: searchConsole?.avgPosition || 0,
        previousMonth: searchConsole?.previousMonth,
      },
      topKeywords: keywords?.slice(0, 10) || [],
    };

    // Generate insights
    const insights = await aiReportGenerator.generateMonthlyInsights(metrics);

    // Generate executive summary
    const executiveSummary = await aiReportGenerator.generateExecutiveSummary(
      report.clientName,
      report.shareableLink || '',
      {
        ...metrics,
        achievements: insights.achievements,
        challenges: insights.challenges,
      }
    );

    return NextResponse.json({
      executiveSummary,
      insights,
    });
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to generate executive summary' },
      { status: 500 }
    );
  }
}