import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/db/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const prisma = getPrisma()

    console.log("Looking for report with slug:", slug)

    // Get report by shareableId (which is used as the slug)
    let report = await prisma.clientReport.findUnique({
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
    
    // Fallback: try to find by id if shareableId lookup failed
    if (!report) {
      console.log("Report not found by shareableId, trying by id:", slug)
      report = await prisma.clientReport.findUnique({
        where: { id: slug },
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
    }
    
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

    // Get keyword performance data
    let keywordPerformance = null
    try {
      const keywords = await prisma.keyword.findMany({
        where: {
          clientReportId: report.id,
          trackingStatus: 'active'
        },
        include: {
          performanceHistory: {
            orderBy: { weekStartDate: 'desc' },
            take: 2 // Get last 2 to calculate change
          }
        }
      })

      if (keywords.length > 0) {
        const processedKeywords = keywords.map(kw => {
          const latest = kw.performanceHistory[0]
          const previous = kw.performanceHistory[1]

          return {
            query: kw.keyword,
            clicks: latest?.clicks || 0,
            impressions: latest?.impressions || 0,
            ctr: latest?.ctr || 0,
            position: latest?.avgPosition || 999,
            previousPosition: previous?.avgPosition,
            positionChange: latest?.positionChange || null,
            rankingPage: latest?.rankingUrl || null
          }
        })

        const all = processedKeywords
        const improved = all.filter(k => k.positionChange && k.positionChange > 0)
        const declined = all.filter(k => k.positionChange && k.positionChange < 0)
        const newKeywords = all.filter(k => !k.previousPosition)

        keywordPerformance = {
          keywords: all,
          improved,
          declined,
          new: newKeywords,
          stats: {
            total: all.length,
            improved: improved.length,
            declined: declined.length,
            new: newKeywords.length
          }
        }
      }
    } catch (keywordError) {
      console.log("Error fetching keyword performance:", keywordError)
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
      cachedData: cachedData,
      keywordPerformance: keywordPerformance
    })
    
  } catch (error: any) {
    
    return NextResponse.json(
      { error: "Failed to fetch report", details: error.message },
      { status: 500 }
    )
  }
}