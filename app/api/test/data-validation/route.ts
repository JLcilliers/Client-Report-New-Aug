import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/db/prisma"
import { 
  validateSearchConsoleData,
  getOptimalDateRange,
  formatDateForGoogleAPI,
  debugLogSearchConsoleResponse
} from "@/lib/google/data-validator"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reportId = searchParams.get('reportId')
  
  try {
    const prisma = getPrisma()
    
    // Test 1: Check optimal date range calculation
    const optimalRange = getOptimalDateRange()
    console.log('[Test] Optimal date range:', {
      start: formatDateForGoogleAPI(optimalRange.startDate),
      end: formatDateForGoogleAPI(optimalRange.endDate),
      note: 'Adjusted for Search Console 2-3 day delay'
    })
    
    // Test 2: Check cached data if reportId provided
    let cachedData = null
    let validation = null
    
    if (reportId) {
      const cache = await prisma.reportCache.findFirst({
        where: {
          reportId: reportId,
          dataType: 'combined'
        },
        orderBy: {
          cachedAt: 'desc'
        }
      })
      
      if (cache && cache.data) {
        cachedData = JSON.parse(cache.data as string)
        
        // Validate Search Console data
        if (cachedData.search_console) {
          validation = validateSearchConsoleData(cachedData.search_console)
        }
      }
    }
    
    // Test 3: Direct API test (if we have a report)
    let directApiTest = null
    if (reportId) {
      const report = await prisma.clientReport.findUnique({
        where: { id: reportId }
      })
      
      if (report?.googleAccountId && report?.searchConsolePropertyId) {
        // Get valid token
        const { getValidGoogleToken } = await import('@/lib/google/refresh-token')
        const accessToken = await getValidGoogleToken(report.googleAccountId)
        
        if (accessToken) {
          // Test direct API call with adjusted dates
          const endDate = new Date()
          endDate.setDate(endDate.getDate() - 3) // Account for delay
          const startDate = new Date(endDate)
          startDate.setDate(startDate.getDate() - 7) // Last 7 days
          
          const siteUrl = report.searchConsolePropertyId.replace('sc-domain:', 'domain:')
          
          try {
            const response = await fetch(
              `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  startDate: formatDateForGoogleAPI(startDate),
                  endDate: formatDateForGoogleAPI(endDate),
                  dimensions: [],
                  rowLimit: 1,
                }),
              }
            )
            
            if (response.ok) {
              const data = await response.json()
              debugLogSearchConsoleResponse(data, 'Direct API Test')
              
              directApiTest = {
                success: true,
                dateRange: {
                  start: formatDateForGoogleAPI(startDate),
                  end: formatDateForGoogleAPI(endDate)
                },
                data: data.rows?.[0] || {},
                hasData: !!(data.rows?.[0]?.clicks || data.rows?.[0]?.impressions)
              }
            } else {
              directApiTest = {
                success: false,
                error: `API returned ${response.status}: ${response.statusText}`
              }
            }
          } catch (error: any) {
            directApiTest = {
              success: false,
              error: error.message
            }
          }
        }
      }
    }
    
    // Test 4: Check all reports for data freshness
    const allReports = await prisma.clientReport.findMany({
      select: {
        id: true,
        reportName: true,
        searchConsolePropertyId: true
      }
    })
    
    const reportFreshness = []
    for (const report of allReports) {
      const cache = await prisma.reportCache.findFirst({
        where: {
          reportId: report.id,
          dataType: 'combined'
        },
        orderBy: {
          cachedAt: 'desc'
        }
      })
      
      if (cache && cache.data) {
        const data = JSON.parse(cache.data as string)
        let latestDataDate = null
        
        if (data.search_console?.byDate && Array.isArray(data.search_console.byDate)) {
          const dates = data.search_console.byDate
            .map((item: any) => {
              const dateStr = item.keys?.[0] || item.date
              return dateStr ? new Date(dateStr) : null
            })
            .filter(Boolean)
            .sort((a: Date, b: Date) => b.getTime() - a.getTime())
          
          if (dates.length > 0) {
            latestDataDate = dates[0]
          }
        }
        
        const daysBehind = latestDataDate 
          ? Math.floor((new Date().getTime() - latestDataDate.getTime()) / (1000 * 60 * 60 * 24))
          : null
        
        reportFreshness.push({
          reportId: report.id,
          reportName: report.reportName,
          property: report.searchConsolePropertyId,
          cachedAt: cache.cachedAt,
          latestDataDate: latestDataDate?.toISOString().split('T')[0],
          daysBehind,
          isStale: daysBehind ? daysBehind > 4 : true
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        optimalDateRange: {
          start: formatDateForGoogleAPI(optimalRange.startDate),
          end: formatDateForGoogleAPI(optimalRange.endDate),
          description: 'Adjusted for Search Console 2-3 day delay'
        },
        cachedDataValidation: validation || 'No cached data found',
        directApiTest: directApiTest || 'No direct API test performed',
        reportFreshness: reportFreshness,
        summary: {
          totalReports: allReports.length,
          reportsWithData: reportFreshness.length,
          staleReports: reportFreshness.filter(r => r.isStale).length,
          averageDaysBehind: reportFreshness.length > 0 
            ? Math.round(reportFreshness.reduce((sum, r) => sum + (r.daysBehind || 0), 0) / reportFreshness.length)
            : null
        }
      },
      recommendations: [
        'Search Console data typically has a 2-3 day delay - this is normal',
        'End dates are automatically adjusted 3 days back to ensure data availability',
        'CTR is stored as a decimal (0-1) and converted to percentage for display',
        'Data freshness indicators show when data needs refresh (>4 days old)'
      ]
    })
    
  } catch (error: any) {
    console.error('[Data Validation Test] Error:', error)
    return NextResponse.json({ 
      error: "Data validation test failed",
      details: error.message 
    }, { status: 500 })
  }
}