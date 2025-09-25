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
        }
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get competitors (stored as JSON or in a separate table if available)
    // For now, we'll use a placeholder
    const competitors: any[] = [];

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
      competitors: competitors,
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

    // Delete the client report and all related data (cascade)
    // The cascade delete will automatically remove:
    // - Keywords and their performance history
    // - Competitors
    // - SEO audits
    // - Report cache
    // - Access logs
    await prisma.clientReport.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting client:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete client due to existing dependencies' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete client', details: error.message },
      { status: 500 }
    );
  }
}