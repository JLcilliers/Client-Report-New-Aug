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
      industry: null, // Add industry field to schema if needed
      contactEmail: null, // Add email field to schema if needed
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
    console.error('Error fetching client:', error);
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
        // Add these fields to schema if needed:
        // industry,
        // contactEmail
      }
    });

    return NextResponse.json({
      success: true,
      client: updated
    });
  } catch (error) {
    console.error('Error updating client:', error);
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

    try {
      // 1. Delete keyword performance history (depends on keywords)
      await prisma.keywordPerformance.deleteMany({
        where: {
          keyword: {
            clientReportId: params.id
          }
        }
      });
    } catch (e) {
      console.log('No keyword performance to delete or already deleted');
    }

    try {
      // 2. Delete keyword variations (depends on keywords)
      await prisma.keywordVariation.deleteMany({
        where: {
          keyword: {
            clientReportId: params.id
          }
        }
      });
    } catch (e) {
      console.log('No keyword variations to delete or already deleted');
    }

    try {
      // 3. Delete keyword alerts (depends on keywords)
      await prisma.keywordAlert.deleteMany({
        where: {
          keyword: {
            clientReportId: params.id
          }
        }
      });
    } catch (e) {
      console.log('No keyword alerts to delete or already deleted');
    }

    try {
      // 4. Delete keywords
      await prisma.keyword.deleteMany({
        where: {
          clientReportId: params.id
        }
      });
    } catch (e) {
      console.log('No keywords to delete or already deleted');
    }

    try {
      // 5. Delete competitors
      await prisma.competitor.deleteMany({
        where: {
          clientReportId: params.id
        }
      });
    } catch (e) {
      console.log('No competitors to delete or already deleted');
    }

    try {
      // 6. Delete SEO audits
      await prisma.sEOAudit.deleteMany({
        where: {
          clientReportId: params.id
        }
      });
    } catch (e) {
      console.log('No SEO audits to delete or already deleted');
    }

    try {
      // 7. Delete report cache
      await prisma.reportCache.deleteMany({
        where: {
          reportId: params.id
        }
      });
    } catch (e) {
      console.log('No cache to delete or already deleted');
    }

    try {
      // 8. Delete access logs
      await prisma.reportAccessLog.deleteMany({
        where: {
          reportId: params.id
        }
      });
    } catch (e) {
      console.log('No access logs to delete or already deleted');
    }

    try {
      // 9. Delete keyword groups
      await prisma.keywordGroup.deleteMany({
        where: {
          clientReportId: params.id
        }
      });
    } catch (e) {
      console.log('No keyword groups to delete or already deleted');
    }

    try {
      // 10. Delete keyword cannibalization
      await prisma.keywordCannibalization.deleteMany({
        where: {
          clientReportId: params.id
        }
      });
    } catch (e) {
      console.log('No cannibalization data to delete or already deleted');
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
    console.error('Error deleting client:', error);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);

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