import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { PrismaClient } from "@prisma/client"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

const searchconsole = google.searchconsole("v1")
const analyticsData = google.analyticsdata("v1beta")
const prisma = new PrismaClient()

interface SearchConsoleMetrics {
  clicks: number
  impressions: number
  ctr: number
  position: number
  date?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Get optional date range from request body
    let body: any = {}
    try {
      body = await request.json()
    } catch (e) {
      // Body is optional, continue without it
    }
    
    const { dateRange } = body // 'week', 'month', 'year', or custom days number
    
    // Get report by slug
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Get tokens from cookies (this endpoint should work with authenticated users)
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')
    const refreshToken = cookieStore.get('google_refresh_token')
    
    if (!accessToken || !refreshToken) {
      return NextResponse.json({ 
        error: "Google authentication required",
        details: "No valid Google tokens found"
      }, { status: 401 })
    }

    

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/auth/admin-google/callback`
    )

    oauth2Client.setCredentials({
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
    })

    // Refresh the access token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)
    } catch (refreshError) {
      console.log('Token refresh failed, using existing token:', refreshError)
    }

    // Initialize data structures
    const searchConsoleData: any = {
      summary: {},
      byDate: [],
      topQueries: [],
      topPages: [],
    }

    const analyticsResult: any = {
      summary: {},
      trafficSources: [],
      topPages: [],
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

    // Fetch Search Console data
    if (report.searchConsolePropertyId) {
      
      
      let aggregatedMetrics: SearchConsoleMetrics = {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0
      }

      const properties = [report.searchConsolePropertyId]
      for (const property of properties) {
        try {
          
          
          // Overall metrics
          const overallResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: [],
              rowLimit: 1,
            },
          })

          if (overallResponse.data.rows && overallResponse.data.rows[0]) {
            const row = overallResponse.data.rows[0]
            aggregatedMetrics.clicks += row.clicks || 0
            aggregatedMetrics.impressions += row.impressions || 0
          }

          // Get top queries
          const queriesResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ['query'],
              rowLimit: 10,
            },
          })

          if (queriesResponse.data.rows) {
            searchConsoleData.topQueries.push(...queriesResponse.data.rows)
          }

          // Get top pages
          const pagesResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ['page'],
              rowLimit: 10,
            },
          })

          if (pagesResponse.data.rows) {
            searchConsoleData.topPages.push(...pagesResponse.data.rows)
          }

          // Get data by date
          const dateResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ['date'],
              rowLimit: 30,
            },
          })

          if (dateResponse.data.rows) {
            searchConsoleData.byDate.push(...dateResponse.data.rows)
          }

        } catch (error: any) {
          
        }
      }

      // Calculate aggregated metrics
      if (aggregatedMetrics.impressions > 0) {
        aggregatedMetrics.ctr = (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100
      }

      // Calculate average position
      if (searchConsoleData.topQueries.length > 0) {
        const totalPosition = searchConsoleData.topQueries.reduce((sum: number, q: any) => 
          sum + (q.position || 0), 0)
        aggregatedMetrics.position = totalPosition / searchConsoleData.topQueries.length
      }

      searchConsoleData.summary = aggregatedMetrics

      // Sort and limit results
      searchConsoleData.topQueries = searchConsoleData.topQueries
        .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10)
      
      searchConsoleData.topPages = searchConsoleData.topPages
        .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 10)
    }

    // Fetch Analytics data
    if (report.ga4PropertyId) {
      
      
      const propertyIds = [report.ga4PropertyId]
      for (const propertyId of propertyIds) {
        try {
          
          
          // Overall metrics
          const response = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            requestBody: {
              dateRanges: [{
                startDate: formatDate(startDate),
                endDate: formatDate(endDate)
              }],
              dimensions: [
                { name: "sessionDefaultChannelGroup" }
              ],
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
          })

          // Process Analytics data
          if (response.data.rows) {
            response.data.rows.forEach(row => {
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

          // Get top pages
          const pagesResponse = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            requestBody: {
              dateRanges: [{
                startDate: formatDate(startDate),
                endDate: formatDate(endDate)
              }],
              dimensions: [
                { name: "pagePath" }
              ],
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
          })

          if (pagesResponse.data.rows) {
            analyticsResult.topPages = pagesResponse.data.rows.map(row => ({
              page: row.dimensionValues?.[0]?.value || "",
              sessions: parseInt(row.metricValues?.[0]?.value || "0"),
              users: parseInt(row.metricValues?.[1]?.value || "0"),
              bounceRate: parseFloat(row.metricValues?.[2]?.value || "0"),
              avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0")
            }))
          }

        } catch (error: any) {
          
        }
      }

      // Calculate averages
      if (analyticsResult.summary.sessions > 0) {
        const totalSessions = analyticsResult.summary.sessions
        analyticsResult.trafficSources.forEach((source: any) => {
          source.percentage = (source.sessions / totalSessions) * 100
        })
      }
    }

    // Combine all data
    const combinedData = {
      search_console: searchConsoleData,
      analytics: analyticsResult,
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

    

    // Store combined data using ReportCache model
    try {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1) // Cache for 1 hour
      
      // Delete existing cache entries for this report and dataType
      await prisma.reportCache.deleteMany({
        where: { 
          reportId: report.id,
          dataType: 'combined'
        }
      })
      
      // Create new cache entry
      await prisma.reportCache.create({
        data: {
          reportId: report.id,
          dataType: 'combined',
          data: JSON.stringify(combinedData),
          cachedAt: new Date(),
          expiresAt: expiresAt,
        }
      })
    } catch (dbError) {
      console.log('Database caching failed:', dbError)
    }

    

    return NextResponse.json({ 
      success: true, 
      message: "Data refreshed successfully",
      data: combinedData
    })
  } catch (error: any) {
    
    return NextResponse.json(
      { error: "Failed to refresh data", details: error.message },
      { status: 500 }
    )
  }
}