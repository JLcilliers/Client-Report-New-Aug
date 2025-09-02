import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/db/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
    const prisma = getPrisma()
    
    // Get report with all related data
    const report = await prisma.clientReport.findUnique({
      where: { id: reportId },
      include: {
        cache: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            cachedAt: 'desc'
          },
          take: 1
        }
      }
    })
    
    if (!report) {
      return NextResponse.json(
        { error: "Report not found", reportId },
        { status: 404 }
      )
    }
    
    // Transform report data to include client info and properties
    const transformedReport = {
      id: report.id,
      name: report.reportName,
      slug: report.shareableId,
      client: {
        id: report.id,
        name: report.clientName,
        domain: null // Add domain if stored
      },
      search_console_properties: report.searchConsolePropertyId ? [report.searchConsolePropertyId] : [],
      analytics_properties: report.ga4PropertyId ? [report.ga4PropertyId] : [],
      google_account_id: report.googleAccountId,
      is_active: report.isActive,
      refresh_interval: report.refreshInterval,
      created_at: report.createdAt,
      updated_at: report.updatedAt,
      last_data_fetch: report.cache?.[0]?.cachedAt || null
    }
    
    return NextResponse.json(transformedReport)
    
  } catch (error: any) {
    
    return NextResponse.json(
      { error: "Failed to fetch report", details: error.message },
      { status: 500 }
    )
  }
}