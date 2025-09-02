import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    console.log("Looking for report with slug:", slug)
    
    // Get report by shareableId (which is used as the slug)
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!report) {
      console.log("Report not found for slug:", slug)
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }
    
    console.log("Found report:", report.id)
    
    // Get cached data if available
    let cachedData = null
    try {
      const cache = await prisma.reportCache.findFirst({
        where: {
          reportId: report.id,
          dataType: 'combined',
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          cachedAt: 'desc'
        }
      })
      if (cache) {
        cachedData = JSON.parse(cache.data)
      }
    } catch (cacheError) {
      console.log("Cache retrieval error:", cacheError)
    }
    
    // Return public data only (no sensitive info)
    return NextResponse.json({
      id: report.id,
      name: report.reportName,
      clientName: report.clientName,
      slug: report.shareableId,
      shareableLink: report.shareableLink,
      search_console_properties: [report.searchConsolePropertyId],
      analytics_properties: [report.ga4PropertyId],
      isActive: report.isActive,
      refreshInterval: report.refreshInterval,
      created_at: report.createdAt,
      updated_at: report.updatedAt,
      cachedData: cachedData
    })
    
  } catch (error: any) {
    
    return NextResponse.json(
      { error: "Failed to fetch report", details: error.message },
      { status: 500 }
    )
  }
}