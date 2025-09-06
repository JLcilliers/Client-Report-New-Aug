import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPrisma } from "@/lib/db/prisma"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30 // Set max duration to 30 seconds

const searchconsole = google.searchconsole("v1")
const analyticsData = google.analyticsdata("v1beta")

interface SearchConsoleMetrics {
  clicks: number
  impressions: number
  ctr: number
  position: number
  date?: string
}

// Helper function to execute with timeout
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ])
    return result
  } catch (error) {
    console.warn(`Operation timed out or failed: ${error}`)
    return fallbackValue
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { slug } = await params
    const prisma = getPrisma()
    
    // Get optional date range from request body (non-blocking)
    let dateRange = 'week' // default value
    try {
      const body = await request.json().catch(() => ({}))
      dateRange = body.dateRange || 'week'
    } catch (e) {
      // Body is optional, use default
    }
    
    // Get report by slug
    let report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    })

    // Fallback: try to find by id if shareableId lookup failed
    if (!report) {
      report = await prisma.clientReport.findUnique({
        where: { id: slug }
      })
    }

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Get the Google account tokens from the database
    console.log('[Report Refresh] Getting tokens for Google account:', report.googleAccountId);
    
    // Import the refresh token helper
    const { getValidGoogleToken } = await import('@/lib/google/refresh-token');
    
    // Get valid access token using the account ID from the report
    const accessToken = await getValidGoogleToken(report.googleAccountId);
    
    if (!accessToken) {
      console.log('[Report Refresh] No valid Google tokens - returning cached data');
      
      // Try to return cached data for public viewers
      const cachedData = await prisma.reportCache.findFirst({
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
      });
      
      if (cachedData && cachedData.data) {
        const data = JSON.parse(cachedData.data as string);
        return NextResponse.json({ 
          success: true,
          message: "Returning cached data (authentication required for refresh)",
          data: data,
          cached: true,
          cachedAt: cachedData.cachedAt
        });
      }
      
      return NextResponse.json({ 
        error: "No data available",
        details: "Google account authentication expired or missing"
      }, { status: 401 })
    }

    console.log('[Report Refresh] Got valid access token');

    // Get the GoogleTokens record to get the refresh token
    const googleAccount = await prisma.googleTokens.findUnique({
      where: { id: report.googleAccountId }
    });

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'}/api/auth/google/admin-callback`
    )

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: googleAccount?.refresh_token || undefined,
    })

    // Initialize data structures
    const searchConsoleData: any = {
      summary: {},
      byDate: [],
      topQueries: [],
      topPages: [],
      byCountry: [],
      byDevice: [],
    }

    const analyticsResult: any = {
      summary: {},
      trafficSources: [],
      topPages: [],
      deviceCategories: [],
      geoLocations: [],
      userFlow: [],
    }

    const pageSpeedData: any = {
      mobile: null,
      desktop: null,
      fetchTime: null,
    }

    // Date range for data fetching
    let endDate = new Date()
    let startDate = new Date()
    let previousStartDate = new Date()
    let previousEndDate = new Date()
    
    // Calculate start date based on dateRange parameter
    switch(dateRange) {
      case 'week':
        // Last 7 days
        startDate.setDate(startDate.getDate() - 7)
        // Previous 7 days for comparison
        previousEndDate.setDate(previousEndDate.getDate() - 7)
        previousStartDate.setDate(previousStartDate.getDate() - 14)
        break
        
      case 'month': {
        // Last completed month (e.g., if today is Aug 26, we want July 1-31)
        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth()
        
        // Start date is first day of last month
        startDate = new Date(year, month - 1, 1)
        
        // End date is last day of last month
        endDate = new Date(year, month, 0)
        
        // Previous period: month before last  
        previousStartDate = new Date(year, month - 2, 1)
        previousEndDate = new Date(year, month - 1, 0)
        
        break
      }
        
      case 'year':
        // Year to date (from Jan 1 to today)
        startDate.setMonth(0)
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        
        // Keep endDate as today
        endDate.setHours(23, 59, 59, 999)
        
        // Same period last year
        previousStartDate.setFullYear(startDate.getFullYear() - 1)
        previousStartDate.setMonth(0)
        previousStartDate.setDate(1)
        previousStartDate.setHours(0, 0, 0, 0)
        
        previousEndDate.setFullYear(endDate.getFullYear() - 1)
        previousEndDate.setMonth(endDate.getMonth())
        previousEndDate.setDate(endDate.getDate())
        previousEndDate.setHours(23, 59, 59, 999)
        break
        
      case 'last30':
        // Last 30 days
        startDate.setDate(startDate.getDate() - 30)
        // Previous 30 days
        previousEndDate.setDate(previousEndDate.getDate() - 30)
        previousStartDate.setDate(previousStartDate.getDate() - 60)
        break
        
      case 'last90':
        // Last 90 days
        startDate.setDate(startDate.getDate() - 90)
        // Previous 90 days
        previousEndDate.setDate(previousEndDate.getDate() - 90)
        previousStartDate.setDate(previousStartDate.getDate() - 180)
        break
        
      case 'monthToDate':
        // This month so far
        startDate.setDate(1)
        // Last month same period
        previousStartDate.setMonth(previousStartDate.getMonth() - 1)
        previousStartDate.setDate(1)
        previousEndDate.setMonth(previousEndDate.getMonth() - 1)
        previousEndDate.setDate(Math.min(endDate.getDate(), new Date(previousEndDate.getFullYear(), previousEndDate.getMonth() + 1, 0).getDate()))
        break
        
      case 'yearOverYear':
        // Last 30 days vs same period last year
        startDate.setDate(startDate.getDate() - 30)
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1)
        previousStartDate.setDate(previousStartDate.getDate() - 30)
        previousEndDate.setFullYear(previousEndDate.getFullYear() - 1)
        break
        
      default:
        // Default to last 7 days
        startDate.setDate(startDate.getDate() - 7)
        previousEndDate.setDate(previousEndDate.getDate() - 7)
        previousStartDate.setDate(previousStartDate.getDate() - 14)
    }
    
    console.log(`Fetching data for ${dateRange || 'month'}: ${startDate.toISOString()} to ${endDate.toISOString()}`)
    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    // Parallel fetch of Search Console and Analytics data
    const [searchConsoleResult, analyticsDataResult] = await Promise.allSettled([
      // Search Console data fetch
      report.searchConsolePropertyId ? (async () => {
        const property = report.searchConsolePropertyId
        console.log('[Search Console] Starting parallel fetch for:', property)
        
        // Execute all Search Console queries in parallel with individual timeouts
        const [
          overallMetrics,
          topQueries,
          topPages,
          byDate,
          byCountry,
          byDevice
        ] = await Promise.allSettled([
          // Overall metrics
          withTimeout(
            searchconsole.searchanalytics.query({
              auth: oauth2Client,
              siteUrl: property,
              requestBody: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                dimensions: [],
                rowLimit: 1,
              },
            }),
            5000
          ),
          // Top queries
          withTimeout(
            searchconsole.searchanalytics.query({
              auth: oauth2Client,
              siteUrl: property,
              requestBody: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                dimensions: ['query'],
                rowLimit: 10,
              },
            }),
            5000
          ),
          // Top pages
          withTimeout(
            searchconsole.searchanalytics.query({
              auth: oauth2Client,
              siteUrl: property,
              requestBody: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                dimensions: ['page'],
                rowLimit: 10,
              },
            }),
            5000
          ),
          // By date
          withTimeout(
            searchconsole.searchanalytics.query({
              auth: oauth2Client,
              siteUrl: property,
              requestBody: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                dimensions: ['date'],
                rowLimit: 30,
              },
            }),
            5000
          ),
          // By country
          withTimeout(
            searchconsole.searchanalytics.query({
              auth: oauth2Client,
              siteUrl: property,
              requestBody: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                dimensions: ['country'],
                rowLimit: 20,
              },
            }),
            5000
          ),
          // By device
          withTimeout(
            searchconsole.searchanalytics.query({
              auth: oauth2Client,
              siteUrl: property,
              requestBody: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                dimensions: ['device'],
                rowLimit: 3,
              },
            }),
            5000
          )
        ])
        
        // Process overall metrics
        let aggregatedMetrics: SearchConsoleMetrics = {
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0
        }
        
        if (overallMetrics.status === 'fulfilled' && overallMetrics.value?.data?.rows?.[0]) {
          const row = overallMetrics.value.data.rows[0]
          aggregatedMetrics.clicks = row.clicks || 0
          aggregatedMetrics.impressions = row.impressions || 0
          aggregatedMetrics.ctr = row.ctr || 0
          aggregatedMetrics.position = row.position || 0
        }
        
        // Process top queries
        if (topQueries.status === 'fulfilled' && topQueries.value?.data?.rows) {
          searchConsoleData.topQueries = topQueries.value.data.rows
            .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
            .slice(0, 10)
            
          // Calculate average position from queries
          if (searchConsoleData.topQueries.length > 0) {
            const totalPosition = searchConsoleData.topQueries.reduce((sum: number, q: any) => 
              sum + (q.position || 0), 0)
            aggregatedMetrics.position = totalPosition / searchConsoleData.topQueries.length
          }
        }
        
        // Process top pages
        if (topPages.status === 'fulfilled' && topPages.value?.data?.rows) {
          searchConsoleData.topPages = topPages.value.data.rows
            .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
            .slice(0, 10)
        }
        
        // Process date data
        if (byDate.status === 'fulfilled' && byDate.value?.data?.rows) {
          searchConsoleData.byDate = byDate.value.data.rows
        }
        
        // Process country data
        if (byCountry.status === 'fulfilled' && byCountry.value?.data?.rows) {
          searchConsoleData.byCountry = byCountry.value.data.rows.map((row: any) => ({
            country: row.keys?.[0] || '',
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: row.position || 0
          }))
        }
        
        // Process device data
        if (byDevice.status === 'fulfilled' && byDevice.value?.data?.rows) {
          searchConsoleData.byDevice = byDevice.value.data.rows.map((row: any) => ({
            device: row.keys?.[0] || '',
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: row.position || 0
          }))
        }
        
        searchConsoleData.summary = aggregatedMetrics
        console.log('[Search Console] Completed with metrics:', aggregatedMetrics)
        
        return searchConsoleData
      })() : Promise.resolve(null),
      
      // Analytics data fetch
      report.ga4PropertyId ? (async () => {
        console.log('[Analytics] Starting parallel fetch for:', report.ga4PropertyId)
        const formattedPropertyId = report.ga4PropertyId.startsWith('properties/') 
          ? report.ga4PropertyId 
          : `properties/${report.ga4PropertyId}`
        
        // Execute all Analytics queries in parallel with individual timeouts
        const [
          channelData,
          deviceData,
          geoData,
          pagesData
        ] = await Promise.allSettled([
          // Channel grouping data
          withTimeout(
            analyticsData.properties.runReport({
              property: formattedPropertyId,
              requestBody: {
                dateRanges: [{
                  startDate: formatDate(startDate),
                  endDate: formatDate(endDate)
                }],
                dimensions: [{ name: "sessionDefaultChannelGroup" }],
                metrics: [
                  { name: "sessions" },
                  { name: "activeUsers" },
                  { name: "newUsers" },
                  { name: "bounceRate" },
                  { name: "averageSessionDuration" },
                  { name: "screenPageViews" },
                  { name: "eventCount" }
                ]
              },
              auth: oauth2Client
            }),
            5000
          ),
          // Device category data
          withTimeout(
            analyticsData.properties.runReport({
              property: formattedPropertyId,
              requestBody: {
                dateRanges: [{
                  startDate: formatDate(startDate),
                  endDate: formatDate(endDate)
                }],
                dimensions: [{ name: "deviceCategory" }],
                metrics: [
                  { name: "sessions" },
                  { name: "activeUsers" },
                  { name: "bounceRate" },
                  { name: "averageSessionDuration" }
                ]
              },
              auth: oauth2Client
            }),
            5000
          ),
          // Geographic data
          withTimeout(
            analyticsData.properties.runReport({
              property: formattedPropertyId,
              requestBody: {
                dateRanges: [{
                  startDate: formatDate(startDate),
                  endDate: formatDate(endDate)
                }],
                dimensions: [
                  { name: "country" },
                  { name: "city" }
                ],
                metrics: [
                  { name: "sessions" },
                  { name: "activeUsers" }
                ],
                orderBys: [{
                  metric: { metricName: "sessions" },
                  desc: true
                }],
                limit: "20"
              },
              auth: oauth2Client
            }),
            5000
          ),
          // Top pages data
          withTimeout(
            analyticsData.properties.runReport({
              property: formattedPropertyId,
              requestBody: {
                dateRanges: [{
                  startDate: formatDate(startDate),
                  endDate: formatDate(endDate)
                }],
                dimensions: [{ name: "pagePath" }],
                metrics: [
                  { name: "sessions" },
                  { name: "activeUsers" },
                  { name: "bounceRate" },
                  { name: "averageSessionDuration" }
                ],
                orderBys: [{
                  metric: { metricName: "sessions" },
                  desc: true
                }],
                limit: "10"
              },
              auth: oauth2Client
            }),
            5000
          )
        ])
        
        // Process channel data
        if (channelData.status === 'fulfilled' && channelData.value?.data?.rows) {
          channelData.value.data.rows.forEach(row => {
            const channel = row.dimensionValues?.[0]?.value || "Unknown"
            const sessions = parseInt(row.metricValues?.[0]?.value || "0")
            const users = parseInt(row.metricValues?.[1]?.value || "0")
            const newUsers = parseInt(row.metricValues?.[2]?.value || "0")
            const bounceRate = parseFloat(row.metricValues?.[3]?.value || "0")
            const avgDuration = parseFloat(row.metricValues?.[4]?.value || "0")
            const pageviews = parseInt(row.metricValues?.[5]?.value || "0")
            const eventCount = parseInt(row.metricValues?.[6]?.value || "0")
            
            // Add to summary
            analyticsResult.summary.sessions = (analyticsResult.summary.sessions || 0) + sessions
            analyticsResult.summary.users = (analyticsResult.summary.users || 0) + users
            analyticsResult.summary.newUsers = (analyticsResult.summary.newUsers || 0) + newUsers
            analyticsResult.summary.pageviews = (analyticsResult.summary.pageviews || 0) + pageviews
            analyticsResult.summary.events = (analyticsResult.summary.events || 0) + eventCount
            
            // Add to traffic sources
            analyticsResult.trafficSources.push({
              source: channel,
              users,
              sessions,
              bounceRate,
              avgDuration
            })
          })
        }
        
        // Process device data
        if (deviceData.status === 'fulfilled' && deviceData.value?.data?.rows) {
          analyticsResult.deviceCategories = deviceData.value.data.rows.map(row => ({
            device: row.dimensionValues?.[0]?.value || "",
            sessions: parseInt(row.metricValues?.[0]?.value || "0"),
            users: parseInt(row.metricValues?.[1]?.value || "0"),
            bounceRate: parseFloat(row.metricValues?.[2]?.value || "0"),
            avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0")
          }))
        }
        
        // Process geo data
        if (geoData.status === 'fulfilled' && geoData.value?.data?.rows) {
          analyticsResult.geoLocations = geoData.value.data.rows.slice(0, 10).map(row => ({
            country: row.dimensionValues?.[0]?.value || "",
            city: row.dimensionValues?.[1]?.value || "",
            sessions: parseInt(row.metricValues?.[0]?.value || "0"),
            users: parseInt(row.metricValues?.[1]?.value || "0")
          }))
        }
        
        // Process pages data
        if (pagesData.status === 'fulfilled' && pagesData.value?.data?.rows) {
          analyticsResult.topPages = pagesData.value.data.rows.map(row => ({
            page: row.dimensionValues?.[0]?.value || "",
            sessions: parseInt(row.metricValues?.[0]?.value || "0"),
            users: parseInt(row.metricValues?.[1]?.value || "0"),
            bounceRate: parseFloat(row.metricValues?.[2]?.value || "0"),
            avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0")
          }))
        }
        
        // Calculate percentages
        if (analyticsResult.summary.sessions > 0) {
          const totalSessions = analyticsResult.summary.sessions
          analyticsResult.trafficSources.forEach((source: any) => {
            source.percentage = (source.sessions / totalSessions) * 100
          })
        }
        
        console.log('[Analytics] Completed with summary:', analyticsResult.summary)
        return analyticsResult
      })() : Promise.resolve(null)
    ])
    
    // Process results from parallel execution
    if (searchConsoleResult.status === 'rejected') {
      console.error('[Search Console] Failed:', searchConsoleResult.reason)
    }
    if (analyticsDataResult.status === 'rejected') {
      console.error('[Analytics] Failed:', analyticsDataResult.reason)
    }


    // Parallel fetch PageSpeed data
    let domainUrl: string | null = null
    
    // Try to extract domain from Search Console property
    if (report.searchConsolePropertyId) {
      const property = report.searchConsolePropertyId
      if (property.startsWith('https://') || property.startsWith('http://')) {
        domainUrl = property
      } else if (property.startsWith('domain:')) {
        domainUrl = `https://${property.replace('domain:', '')}`
      } else if (property.startsWith('sc-domain:')) {
        domainUrl = `https://${property.replace('sc-domain:', '')}`
      }
    }
    
    if (domainUrl) {
      console.log('[PageSpeed] Starting parallel fetch for:', domainUrl)
      
      // Fetch both mobile and desktop PageSpeed data in parallel with timeouts
      const [mobileResult, desktopResult] = await Promise.allSettled([
        withTimeout(
          fetch(`${process.env.NEXT_PUBLIC_URL}/api/data/pagespeed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: domainUrl,
              strategy: 'mobile'
            })
          }).then(res => res.ok ? res.json() : null),
          5000 // 5 second timeout
        ),
        withTimeout(
          fetch(`${process.env.NEXT_PUBLIC_URL}/api/data/pagespeed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: domainUrl,
              strategy: 'desktop'
            })
          }).then(res => res.ok ? res.json() : null),
          5000 // 5 second timeout
        )
      ])
      
      // Process results
      if (mobileResult.status === 'fulfilled' && mobileResult.value) {
        pageSpeedData.mobile = mobileResult.value
        console.log('[PageSpeed] Mobile data fetched successfully')
      } else {
        console.warn('[PageSpeed] Mobile data fetch failed or timed out')
      }
      
      if (desktopResult.status === 'fulfilled' && desktopResult.value) {
        pageSpeedData.desktop = desktopResult.value
        console.log('[PageSpeed] Desktop data fetched successfully')
      } else {
        console.warn('[PageSpeed] Desktop data fetch failed or timed out')
      }
      
      if (pageSpeedData.mobile || pageSpeedData.desktop) {
        pageSpeedData.fetchTime = new Date().toISOString()
      }
    } else {
      console.log('[PageSpeed] No domain URL available to test')
    }

    // Combine all data
    const combinedData = {
      search_console: searchConsoleData,
      analytics: analyticsResult,
      pagespeed: pageSpeedData,
      fetched_at: new Date().toISOString(),
      date_range: {
        type: dateRange,
        current: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        previous: {
          start: previousStartDate.toISOString(),
          end: previousEndDate.toISOString()
        }
      }
    }

    

    // Store combined data using ReportCache model with partial save support
    const hasData = (
      (searchConsoleData.summary && Object.keys(searchConsoleData.summary).length > 0) ||
      (analyticsResult.summary && Object.keys(analyticsResult.summary).length > 0) ||
      (pageSpeedData.mobile || pageSpeedData.desktop)
    )
    
    if (hasData) {
      try {
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // Cache for 24 hours
        
        // Delete existing cache entries for this report and dataType
        await prisma.reportCache.deleteMany({
          where: { 
            reportId: report.id,
            dataType: 'combined'
          }
        })
        
        // Create new cache entry with whatever data we managed to collect
        await prisma.reportCache.create({
          data: {
            reportId: report.id,
            dataType: 'combined',
            data: JSON.stringify(combinedData),
            cachedAt: new Date(),
            expiresAt: expiresAt,
          }
        })
        
        console.log('Successfully cached report data:')
        console.log('- Search Console data:', !!searchConsoleData.summary?.clicks)
        console.log('- Analytics data:', !!analyticsResult.summary?.users)
        console.log('- PageSpeed data:', !!(pageSpeedData.mobile || pageSpeedData.desktop))
        
      } catch (dbError) {
        console.error('Database caching failed:', dbError)
        // Still return the data even if caching failed
      }
    } else {
      console.warn('No data collected from any source')
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Performance] Total processing time: ${processingTime}ms`);
    
    // Log what data was successfully collected
    const dataStatus = {
      searchConsole: !!(searchConsoleData.summary?.clicks || searchConsoleData.summary?.impressions),
      analytics: !!(analyticsResult.summary?.users || analyticsResult.summary?.sessions),
      pageSpeed: !!(pageSpeedData.mobile || pageSpeedData.desktop),
      processingTime: processingTime
    }
    
    console.log('[Performance] Data collection status:', dataStatus)
    
    return NextResponse.json({ 
      success: true, 
      message: `Data refreshed in ${processingTime}ms`,
      data: combinedData,
      processingTime: `${processingTime}ms`,
      dataStatus
    })
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[Error] Refresh failed after', processingTime, 'ms:', error.message);
    
    // Try to return cached data on error
    try {
      const prisma = getPrisma()
      const { slug } = await params
      
      let report = await prisma.clientReport.findUnique({
        where: { shareableId: slug }
      })
      
      if (!report) {
        report = await prisma.clientReport.findUnique({
          where: { id: slug }
        })
      }
      
      if (report) {
        const cachedData = await prisma.reportCache.findFirst({
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
        
        if (cachedData && cachedData.data) {
          const data = JSON.parse(cachedData.data as string)
          return NextResponse.json({ 
            success: false,
            message: "Error occurred, returning cached data",
            data: data,
            cached: true,
            cachedAt: cachedData.cachedAt,
            error: error.message,
            processingTime: `${processingTime}ms`
          })
        }
      }
    } catch (cacheError) {
      console.error('[Error] Failed to retrieve cached data:', cacheError)
    }
    
    return NextResponse.json(
      { 
        error: "Failed to refresh data", 
        details: error.message,
        processingTime: `${processingTime}ms`
      },
      { status: 500 }
    )
  }
}