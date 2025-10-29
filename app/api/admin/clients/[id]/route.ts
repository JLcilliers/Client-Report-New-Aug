import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

const prisma = getPrisma();

// GET - Fetch client details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await prisma.clientReport.findUnique({
      where: { id: params.id },
      include: {
        keywords: {
          include: {
            performanceHistory: {
              orderBy: { weekStartDate: 'desc' },
              take: 1
            }
          }
        },
        competitors: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Transform to client structure with all details
    const clientData = {
      id: report.id,
      clientName: report.clientName,
      domain: report.searchConsolePropertyId?.replace('sc-domain:', '').replace('https://', ''),
      industry: report.industry,
      contactEmail: report.contactEmail,
      reports: [{
        id: report.id,
        reportName: report.reportName,
        shareableId: report.shareableId,
        createdAt: report.createdAt
      }],
      competitors: report.competitors || [],
      keywords: report.keywords.map(kw => {
        const latestPerf = kw.performanceHistory[0];
        return {
          id: kw.id,
          keyword: kw.keyword,
          trackingStatus: kw.trackingStatus,
          priority: kw.priority,
          lastPosition: latestPerf?.avgPosition,
          positionChange: latestPerf?.positionChange
        };
      })
    };

    return NextResponse.json(clientData);
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}

// PATCH - Update client information
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { clientName, domain, industry, contactEmail } = body;

    // Update the ClientReport
    const updated = await prisma.clientReport.update({
      where: { id: params.id },
      data: {
        clientName: clientName,
        searchConsolePropertyId: domain ? `sc-domain:${domain.replace('https://', '').replace('http://', '')}` : undefined,
        industry: industry,
        contactEmail: contactEmail
      }
    });

    return NextResponse.json({
      success: true,
      client: updated
    });
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First check if the client exists
    const client = await prisma.clientReport.findUnique({
      where: { id: params.id }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Manually delete all related data in the correct order to avoid foreign key constraints
    // This is a workaround for production database cascade issues

    // Step 1: Delete AI Visibility data (deepest nested first)
    try {
      const aiProfile = await prisma.aIVisibilityProfile.findUnique({
        where: { clientReportId: params.id }
      });

      if (aiProfile) {
        // Delete AI-related nested data
        await prisma.aICompetitorAnalysis.deleteMany({
          where: { profileId: aiProfile.id }
        });
        await prisma.aIVisibilityTrend.deleteMany({
          where: { profileId: aiProfile.id }
        });
        await prisma.aIRecommendation.deleteMany({
          where: { profileId: aiProfile.id }
        });
        await prisma.aIQueryInsight.deleteMany({
          where: { profileId: aiProfile.id }
        });
        await prisma.aICitation.deleteMany({
          where: { profileId: aiProfile.id }
        });
        await prisma.aIPlatformMetric.deleteMany({
          where: { profileId: aiProfile.id }
        });
        // Finally delete the profile itself
        await prisma.aIVisibilityProfile.delete({
          where: { id: aiProfile.id }
        });
      }
    } catch (e) {
      
    }

    // Step 2: Delete keyword-related data (deepest nested first)
    try {
      // Get all keywords for this client
      const keywords = await prisma.keyword.findMany({
        where: { clientReportId: params.id },
        include: {
          alerts: true
        }
      });

      // Delete keyword alert history
      for (const kw of keywords) {
        for (const alert of kw.alerts) {
          await prisma.keywordAlertHistory.deleteMany({
            where: { alertId: alert.id }
          });
        }
      }

      // Delete keyword alerts
      await prisma.keywordAlert.deleteMany({
        where: {
          keyword: {
            clientReportId: params.id
          }
        }
      });

      // Delete competitor keyword rankings
      await prisma.competitorKeywordRank.deleteMany({
        where: {
          keyword: {
            clientReportId: params.id
          }
        }
      });

      // Delete keyword variations
      await prisma.keywordVariation.deleteMany({
        where: {
          keyword: {
            clientReportId: params.id
          }
        }
      });

      // Delete keyword performance history
      await prisma.keywordPerformance.deleteMany({
        where: {
          keyword: {
            clientReportId: params.id
          }
        }
      });

      // Finally delete keywords
      await prisma.keyword.deleteMany({
        where: {
          clientReportId: params.id
        }
      });
    } catch (e) {
      
    }

    // Step 3: Delete keyword groups and their performance data
    try {
      const keywordGroups = await prisma.keywordGroup.findMany({
        where: { clientReportId: params.id }
      });

      for (const group of keywordGroups) {
        await prisma.keywordGroupPerformance.deleteMany({
          where: { groupId: group.id }
        });
      }

      await prisma.keywordGroup.deleteMany({
        where: { clientReportId: params.id }
      });
    } catch (e) {
      
    }

    // Step 4: Delete other client data
    try {
      await prisma.keywordCannibalization.deleteMany({
        where: { clientReportId: params.id }
      });
    } catch (e) {
      
    }

    try {
      await prisma.competitor.deleteMany({
        where: { clientReportId: params.id }
      });
    } catch (e) {
      
    }

    try {
      await prisma.sEOAudit.deleteMany({
        where: { clientReportId: params.id }
      });
    } catch (e) {
      
    }

    try {
      await prisma.reportCache.deleteMany({
        where: { reportId: params.id }
      });
    } catch (e) {
      
    }

    try {
      await prisma.reportAccessLog.deleteMany({
        where: { reportId: params.id }
      });
    } catch (e) {
      
    }

    // Finally, delete the client report itself
    await prisma.clientReport.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error: any) {
    
    
    

    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Client not found', code: error.code },
        { status: 404 }
      );
    }

    if (error.code === 'P2003') {
      // Get more details about what's blocking deletion
      const field = error.meta?.field_name || 'unknown';
      const model = error.meta?.model_name || 'unknown';

      return NextResponse.json(
        {
          error: `Cannot delete client due to existing dependencies in ${model}`,
          details: `Foreign key constraint failed on field: ${field}`,
          code: error.code,
          meta: error.meta
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to delete client',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}