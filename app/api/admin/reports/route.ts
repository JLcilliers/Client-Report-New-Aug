import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {

    // Fetch all reports from Prisma database (using ClientReport model)
    const reports = await prisma.clientReport.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Transform the data to match expected format
    const transformedReports = reports.map(report => ({
      id: report.id,
      slug: report.shareableId,
      name: report.reportName,
      report_name: report.reportName,
      client_name: report.clientName,
      domain: report.searchConsolePropertyId || '',
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
      is_public: report.isActive,
      google_account_id: report.googleAccountId,
      search_console_properties: [report.searchConsolePropertyId],
      analytics_properties: [report.ga4PropertyId],
      audit_summary: null,
      last_data_fetch: null,
      shareableLink: report.shareableLink,
      user_email: report.user?.email
    }));

    return NextResponse.json(transformedReports);
  } catch (error) {
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}