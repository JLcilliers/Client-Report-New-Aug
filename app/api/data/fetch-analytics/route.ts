import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { cookies } from "next/headers"
import { prisma } from '@/lib/db/prisma'
import { getValidGoogleToken } from '@/lib/google/refresh-token'

export const dynamic = 'force-dynamic'

const analyticsData = google.analyticsdata("v1beta")

export async function POST(request: NextRequest) {
  console.log('\n========== Analytics Data Fetch START ==========')
  
  try {
    const { propertyId, startDate, endDate, accountId, reportId } = await request.json()
    
    console.log('[Analytics] Request params:')
    console.log('  - Property ID:', propertyId)
    console.log('  - Start Date:', startDate)
    console.log('  - End Date:', endDate)
    console.log('  - Account ID:', accountId)
    console.log('  - Report ID:', reportId)
    
    if (!propertyId) {
      console.error('[Analytics] No property ID provided')
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 })
    }
    
    // Get access token from account, report, or cookies
    let accessToken: string | null = null;
    let effectiveAccountId = accountId;
    
    // If no accountId but we have reportId, get accountId from report
    if (!effectiveAccountId && reportId) {
      console.log('[Analytics] Getting account ID from report:', reportId)
      const report = await prisma.clientReport.findUnique({
        where: { id: reportId },
        select: { googleAccountId: true }
      })
      if (report?.googleAccountId) {
        effectiveAccountId = report.googleAccountId
        console.log('[Analytics] Found account ID from report:', effectiveAccountId)
      }
    }
    
    if (effectiveAccountId) {
      console.log('[Analytics] Using account ID to get token:', effectiveAccountId)
      accessToken = await getValidGoogleToken(effectiveAccountId)
    } else {
      console.log('[Analytics] No account ID, trying cookies')
      const cookieStore = cookies()
      const tokenCookie = cookieStore.get('google_access_token')
      if (tokenCookie) {
        accessToken = tokenCookie.value
      }
    }
    
    if (!accessToken) {
      console.error('[Analytics] No valid access token found')
      return NextResponse.json({ 
        error: "Google authentication required",
        details: "No valid Google tokens found"
      }, { status: 401 })
    }
    
    console.log('[Analytics] Got access token, length:', accessToken.length)
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/auth/google/admin-callback`
    )
    
    oauth2Client.setCredentials({
      access_token: accessToken
    })
    
    // Format dates
    const endDateObj = endDate ? new Date(endDate) : new Date()
    const startDateObj = startDate ? new Date(startDate) : (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d
    })()
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    // Format property ID - ensure it has the correct format
    let formattedPropertyId = propertyId;
    if (!propertyId.startsWith('properties/')) {
      formattedPropertyId = `properties/${propertyId}`;
    }
    
    console.log('[Analytics] Formatted property ID:', formattedPropertyId)
    console.log('[Analytics] Date range:', formatDate(startDateObj), 'to', formatDate(endDateObj))
    console.log('[Analytics] Making Analytics API call...')
    
    // Fetch Analytics data
    const response = await analyticsData.properties.runReport({
      property: formattedPropertyId,
      requestBody: {
        dateRanges: [{
          startDate: formatDate(startDateObj),
          endDate: formatDate(endDateObj)
        }],
        dimensions: [
          { name: "date" },
          { name: "sessionDefaultChannelGroup" }
        ],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "screenPageViews" }
        ]
      },
      auth: oauth2Client
    })
    
    console.log('[Analytics] First API call successful, rows:', response.data.rows?.length || 0)
    
    // Get top pages data
    console.log('[Analytics] Fetching top pages...')
    const pagesResponse = await analyticsData.properties.runReport({
      property: formattedPropertyId,
      requestBody: {
        dateRanges: [{
          startDate: formatDate(startDateObj),
          endDate: formatDate(endDateObj)
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
    
    // Process the data
    const analyticsResult = {
      summary: {
        users: 0,
        sessions: 0,
        pageviews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        newUsers: 0
      },
      trafficSources: [] as any[],
      topPages: [] as any[],
      dailyData: [] as any[]
    }
    
    // Process summary data
    if (response.data.rows) {
      response.data.rows.forEach(row => {
        const sessions = parseInt(row.metricValues?.[0]?.value || "0")
        const users = parseInt(row.metricValues?.[1]?.value || "0")
        const newUsers = parseInt(row.metricValues?.[2]?.value || "0")
        // Google Analytics API returns bounceRate as decimal (0-1), convert to percentage (0-100)
        const bounceRate = parseFloat(row.metricValues?.[3]?.value || "0") * 100
        // avgDuration is already in seconds from Google API
        const avgDuration = parseFloat(row.metricValues?.[4]?.value || "0")
        const pageviews = parseInt(row.metricValues?.[5]?.value || "0")
        
        analyticsResult.summary.sessions += sessions
        analyticsResult.summary.users += users
        analyticsResult.summary.newUsers += newUsers
        analyticsResult.summary.pageviews += pageviews
        
        // Calculate weighted averages
        if (sessions > 0) {
          analyticsResult.summary.bounceRate += bounceRate * sessions
          analyticsResult.summary.avgSessionDuration += avgDuration * sessions
        }
        
        // Group by channel
        const channel = row.dimensionValues?.[1]?.value || "Unknown"
        const existingChannel = analyticsResult.trafficSources.find(s => s.source === channel)
        if (existingChannel) {
          existingChannel.users += users
          existingChannel.sessions += sessions
        } else {
          analyticsResult.trafficSources.push({
            source: channel,
            users,
            sessions,
            percentage: 0
          })
        }
      })
      
      // Calculate final averages
      if (analyticsResult.summary.sessions > 0) {
        analyticsResult.summary.bounceRate /= analyticsResult.summary.sessions
        analyticsResult.summary.avgSessionDuration /= analyticsResult.summary.sessions
      }
      
      // Calculate percentages for traffic sources
      const totalSessions = analyticsResult.summary.sessions
      analyticsResult.trafficSources.forEach(source => {
        source.percentage = totalSessions > 0 ? (source.sessions / totalSessions) * 100 : 0
      })
    }
    
    // Process top pages data
    if (pagesResponse.data.rows) {
      analyticsResult.topPages = pagesResponse.data.rows.slice(0, 30).map(row => ({
        page: row.dimensionValues?.[0]?.value || "",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
        bounceRate: parseFloat(row.metricValues?.[2]?.value || "0") * 100, // Convert decimal to percentage
        avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0")
      }))
    }
    
    console.log('[Analytics] Data processing complete:')
    console.log('  - Total users:', analyticsResult.summary.users)
    console.log('  - Total sessions:', analyticsResult.summary.sessions)
    console.log('  - Total pageviews:', analyticsResult.summary.pageviews)
    console.log('  - Traffic sources:', analyticsResult.trafficSources.length)
    console.log('  - Top pages:', analyticsResult.topPages.length)
    console.log('========== Analytics Data Fetch END ==========\n')
    
    return NextResponse.json({
      success: true,
      analytics: analyticsResult,
      propertyId: formattedPropertyId,
      dateRange: {
        startDate: formatDate(startDateObj),
        endDate: formatDate(endDateObj)
      }
    })
    
  } catch (error: any) {
    console.error('[Analytics] ERROR:', error)
    console.error('[Analytics] Error details:')
    console.error('  - Message:', error.message)
    console.error('  - Code:', error.code)
    console.error('  - Status:', error.status)
    console.error('  - Stack:', error.stack)
    console.error('========== Analytics Data Fetch END (ERROR) ==========\n')
    
    return NextResponse.json({
      error: "Failed to fetch Analytics data",
      details: error.message,
      code: error.code,
      status: error.status
    }, { status: 500 })
  }
}