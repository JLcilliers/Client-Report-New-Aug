import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPrisma } from "@/lib/db/prisma"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { withRetry, fetchWithTimeout } from "@/lib/utils/retry"
import { tokenManager } from "@/lib/google/token-manager"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const searchconsole = google.searchconsole("v1")
const analyticsData = google.analyticsdata("v1beta")

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
  const startTime = Date.now();
  
  try {
    const { slug } = await params
    const prisma = getPrisma()
    
    // Get optional date range from request body with timeout
    let body: any = {}
    try {
      const requestTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request body parsing timeout')), 5000)
      );
      
      body = await Promise.race([
        request.json(),
        requestTimeout
      ]);
    } catch (e) {
      // Body is optional, continue without it
      console.log('Request body parsing failed or empty:', e);
    }
    
    const { dateRange } = body // 'week', 'month', 'year', or custom days number
    
    // Add request timeout check
    if (Date.now() - startTime > 25000) {
      throw new Error('Request processing timeout');
    }
    
    // Get report by slug
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // For public reports, we should return cached data
    // Only authenticated users (admins) can refresh
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')
    const refreshToken = cookieStore.get('google_refresh_token')
    
    if (!accessToken || !refreshToken) {
      console.log('[Report Refresh] No Google tokens - returning cached data for public view');
      
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
        details: "Authentication required to refresh data"
      }, { status: 401 })
    }

    

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'}/api/auth/simple-admin`
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
          
          
          // Check timeout before API calls
          if (Date.now() - startTime > 20000) {
            throw new Error('Request timeout before Search Console API calls');
          }
          
          // Overall metrics with retry and timeout
          const overallResponse = await withRetry(
            () => {
              if (Date.now() - startTime > 20000) {
                throw new Error('Request timeout during Search Console API call');
              }
              return searchconsole.searchanalytics.query({
                auth: oauth2Client,
                siteUrl: property,
                requestBody: {
                  startDate: formatDate(startDate),
                  endDate: formatDate(endDate),
                  dimensions: [],
                  rowLimit: 1,
                },
              });
            },
            { maxAttempts: 2, onRetry: (attempt) => console.log(`Retrying Search Console API (attempt ${attempt})`) }
          )

          if (overallResponse && overallResponse.data.rows && overallResponse.data.rows[0]) {
            const row = overallResponse.data.rows[0]
            aggregatedMetrics.clicks += row.clicks || 0
            aggregatedMetrics.impressions += row.impressions || 0
          }

          // Check timeout before continuing
          if (Date.now() - startTime > 18000) {
            console.warn('Skipping additional Search Console queries due to timeout risk');
            continue;
          }

          // Get top queries with timeout check
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

          // Check timeout again
          if (Date.now() - startTime > 19000) {
            console.warn('Stopping Search Console queries due to timeout risk');
            break;
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

          // Get data by date (skip if running out of time)
          if (Date.now() - startTime < 19500) {
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
          }
          
          // Get data by country
          const countryResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ['country'],
              rowLimit: 20,
            },
          })

          if (countryResponse.data.rows) {
            searchConsoleData.byCountry = countryResponse.data.rows.map((row: any) => ({
              country: row.keys?.[0] || '',
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: row.ctr || 0,
              position: row.position || 0
            }))
          }
          
          // Get data by device
          const deviceResponse = await searchconsole.searchanalytics.query({
            auth: oauth2Client,
            siteUrl: property,
            requestBody: {
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              dimensions: ['device'],
              rowLimit: 3,
            },
          })

          if (deviceResponse.data.rows) {
            searchConsoleData.byDevice = deviceResponse.data.rows.map((row: any) => ({
              device: row.keys?.[0] || '',
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: row.ctr || 0,
              position: row.position || 0
            }))
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

    // Fetch Analytics data with timeout checks
    if (report.ga4PropertyId) {
      console.log('\n========== Analytics Data Fetch in Report Refresh ==========')
      console.log('[Report Refresh] GA4 Property ID from report:', report.ga4PropertyId)
      
      // Check if we have enough time for Analytics
      if (Date.now() - startTime > 15000) {
        console.warn('Skipping Analytics data fetch due to timeout risk');
      } else {
        const propertyIds = [report.ga4PropertyId]
        for (const propertyId of propertyIds) {
          try {
            // Check timeout before processing each property
            if (Date.now() - startTime > 18000) {
              console.warn('Timeout risk - stopping Analytics processing');
              break;
            }
            
            console.log('[Report Refresh] Processing property:', propertyId)
            
            // Format property ID - ensure it has the correct format
            let formattedPropertyId = propertyId;
            if (!propertyId.startsWith('properties/')) {
              formattedPropertyId = `properties/${propertyId}`;
            }
            
            console.log('[Report Refresh] Formatted property ID:', formattedPropertyId)
            console.log('[Report Refresh] Access token length:', accessToken.value?.length || 0)
            console.log('[Report Refresh] Date range:', formatDate(startDate), 'to', formatDate(endDate))
            
            // Overall metrics with channel grouping
            console.log('[Report Refresh] Making Analytics API request...')
            const response = await analyticsData.properties.runReport({
              property: formattedPropertyId,
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
          
          // Only fetch additional data if we have time
          let deviceResponse, geoResponse, pagesResponse;
          
          if (Date.now() - startTime < 18000) {
            // Fetch device category data
            deviceResponse = await analyticsData.properties.runReport({
              property: formattedPropertyId,
              requestBody: {
                dateRanges: [{
                  startDate: formatDate(startDate),
                  endDate: formatDate(endDate)
                }],
                dimensions: [
                  { name: "deviceCategory" }
                ],
                metrics: [
                  { name: "sessions" },
                  { name: "activeUsers" },
                  { name: "bounceRate" },
                  { name: "averageSessionDuration" }
                ]
              },
              auth: oauth2Client
            })
          } else {
            console.warn('Skipping device data due to timeout risk');
          }
          
          if (Date.now() - startTime < 19000) {
            // Fetch geographic data
            geoResponse = await analyticsData.properties.runReport({
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
            })
          } else {
            console.warn('Skipping geo data due to timeout risk');
          }

          console.log('[Report Refresh] Analytics API response received')
          console.log('[Report Refresh] Response status:', response.status)
          console.log('[Report Refresh] Response has data:', !!response.data)
          console.log('[Report Refresh] Row count:', response.data.rows?.length || 0)
          console.log('[Report Refresh] Dimension headers:', JSON.stringify(response.data.dimensionHeaders))
          console.log('[Report Refresh] Metric headers:', JSON.stringify(response.data.metricHeaders))
          
          if (response.data.rows && response.data.rows.length > 0) {
            console.log('[Report Refresh] First row data:', JSON.stringify(response.data.rows[0]))
          } else {
            console.log('[Report Refresh] WARNING: No rows returned from Analytics API')
            console.log('[Report Refresh] Full response:', JSON.stringify(response.data))
          }

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

          // Process device category data
          if (deviceResponse && deviceResponse.data && deviceResponse.data.rows) {
            analyticsResult.deviceCategories = deviceResponse.data.rows.map(row => ({
              device: row.dimensionValues?.[0]?.value || "",
              sessions: parseInt(row.metricValues?.[0]?.value || "0"),
              users: parseInt(row.metricValues?.[1]?.value || "0"),
              bounceRate: parseFloat(row.metricValues?.[2]?.value || "0"),
              avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0")
            }))
          }
          
          // Process geographic data
          if (geoResponse && geoResponse.data && geoResponse.data.rows) {
            analyticsResult.geoLocations = geoResponse.data.rows.slice(0, 10).map(row => ({
              country: row.dimensionValues?.[0]?.value || "",
              city: row.dimensionValues?.[1]?.value || "",
              sessions: parseInt(row.metricValues?.[0]?.value || "0"),
              users: parseInt(row.metricValues?.[1]?.value || "0")
            }))
          }

          // Get top pages
          if (Date.now() - startTime < 19500) {
            pagesResponse = await analyticsData.properties.runReport({
              property: formattedPropertyId,
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
  
            if (pagesResponse && pagesResponse.data.rows) {
              analyticsResult.topPages = pagesResponse.data.rows.map(row => ({
                page: row.dimensionValues?.[0]?.value || "",
                sessions: parseInt(row.metricValues?.[0]?.value || "0"),
                users: parseInt(row.metricValues?.[1]?.value || "0"),
                bounceRate: parseFloat(row.metricValues?.[2]?.value || "0"),
                avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0")
              }))
            }
          } else {
            console.warn('Skipping pages data due to timeout risk');
          }

        } catch (error: any) {
          console.error('[Report Refresh] Analytics API error:', error.message)
          console.error('[Report Refresh] Error code:', error.code)
          console.error('[Report Refresh] Error status:', error.status)
          console.error('[Report Refresh] Error details:', JSON.stringify(error.errors))
          console.error('[Report Refresh] Full error:', error)
          
          // Don't throw here - continue with partial data
          console.warn('Continuing with partial Analytics data due to error');
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
    }

    // Fetch PageSpeed data if we have a domain to test and time remaining
    if (Date.now() - startTime < 20000) {
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
      
      if (domainUrl && Date.now() - startTime < 21000) {
        console.log('Fetching PageSpeed data for:', domainUrl)
        
        try {
          // Only fetch mobile PageSpeed data to save time
          const mobileResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/data/pagespeed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: domainUrl,
              strategy: 'mobile'
            })
          })
          
          if (mobileResponse.ok) {
            pageSpeedData.mobile = await mobileResponse.json()
          }
          
          // Only fetch desktop if we still have time
          if (Date.now() - startTime < 22000) {
            const desktopResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/data/pagespeed`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: domainUrl,
                strategy: 'desktop'
              })
            })
            
            if (desktopResponse.ok) {
              pageSpeedData.desktop = await desktopResponse.json()
            }
          } else {
            console.warn('Skipping desktop PageSpeed due to timeout risk');
          }
          
          pageSpeedData.fetchTime = new Date().toISOString()
          
        } catch (pageSpeedError: any) {
          console.error('PageSpeed fetch error:', pageSpeedError)
          // Continue with partial data
        }
      } else {
        console.log('Skipping PageSpeed data due to timeout risk or missing domain');
      }
    } else {
      console.log('Skipping PageSpeed data due to timeout risk');
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

    

    // Final timeout check
    if (Date.now() - startTime > 24000) {
      console.warn('Request approaching timeout limit - returning partial data');
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`Total processing time: ${processingTime}ms`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Data refreshed successfully",
      data: combinedData,
      processingTime: `${processingTime}ms`
    })
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('Refresh error after', processingTime, 'ms:', error.message);
    
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