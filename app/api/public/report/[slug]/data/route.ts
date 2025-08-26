import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Get report by shareableId (slug)
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    })
    
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }
    
    // Get cached data for this report
    const reportCache = await prisma.reportCache.findMany({
      where: { 
        reportId: report.id,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        cachedAt: 'desc'
      }
    })
    
    // Transform data by type
    const result: any = {
      search_console: null,
      analytics: null,
      last_updated: null,
    }
    
    if (reportCache && reportCache.length > 0) {
      for (const item of reportCache) {
        const parsedData = JSON.parse(item.data)
        
        // Handle combined data format
        if (item.dataType === 'combined' && parsedData) {
          result.search_console = parsedData.search_console || null
          result.analytics = parsedData.analytics || null
          result.last_updated = parsedData.fetched_at || item.cachedAt.toISOString()
        } 
        // Handle legacy separate format
        else if (item.dataType === 'search_console') {
          result.search_console = parsedData
        } else if (item.dataType === 'analytics') {
          result.analytics = parsedData
        }
        
        // Track most recent update
        if (item.cachedAt && (!result.last_updated || item.cachedAt > new Date(result.last_updated))) {
          result.last_updated = item.cachedAt.toISOString()
        }
      }
    }
    
    // If no stored data, return empty metrics
    if (!result.search_console) {
      result.search_console = {
        summary: {
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        },
        byDate: [],
        topPages: [],
        topQueries: [],
      }
    }
    
    if (!result.analytics) {
      result.analytics = {
        summary: {
          users: 0,
          sessions: 0,
          pageviews: 0,
          bounceRate: 0,
          avgSessionDuration: 0,
        },
        byDate: [],
        topPages: [],
        trafficSources: [],
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    
    return NextResponse.json(
      { error: "Failed to fetch report data", details: error.message },
      { status: 500 }
    )
  }
}