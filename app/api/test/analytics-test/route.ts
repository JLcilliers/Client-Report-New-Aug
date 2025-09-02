import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { prisma } from '@/lib/db/prisma'
import { getValidGoogleToken } from '@/lib/google/refresh-token'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('\n========== Analytics Test Endpoint START ==========')
  
  try {
    // Step 1: Get a Google account with valid token
    console.log('[Analytics Test] Step 1: Finding Google account...')
    const accounts = await prisma.account.findMany({
      where: { 
        provider: 'google',
        refresh_token: { not: null }
      },
      orderBy: { expires_at: 'desc' }
    })
    
    if (accounts.length === 0) {
      console.error('[Analytics Test] No Google accounts found')
      return NextResponse.json({ 
        error: "No Google accounts found",
        step: "account_fetch"
      }, { status: 404 })
    }
    
    console.log(`[Analytics Test] Found ${accounts.length} Google account(s)`)
    const account = accounts[0]
    console.log('[Analytics Test] Using account:', {
      id: account.id,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      hasRefreshToken: !!account.refresh_token,
      expiresAt: account.expires_at
    })
    
    // Step 2: Get valid access token
    console.log('[Analytics Test] Step 2: Getting valid access token...')
    const accessToken = await getValidGoogleToken(account.id)
    
    if (!accessToken) {
      console.error('[Analytics Test] Failed to get valid access token')
      return NextResponse.json({ 
        error: "Failed to get valid access token",
        step: "token_refresh",
        accountId: account.id
      }, { status: 401 })
    }
    
    console.log('[Analytics Test] Got access token, length:', accessToken.length)
    
    // Step 3: Create OAuth2 client
    console.log('[Analytics Test] Step 3: Creating OAuth2 client...')
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials({
      access_token: accessToken
    })
    
    // Step 4: Get Analytics properties first
    console.log('[Analytics Test] Step 4: Fetching Analytics properties...')
    const analyticsAdmin = google.analyticsadmin('v1beta')
    
    let properties: any[] = []
    try {
      const accountsResponse = await analyticsAdmin.accounts.list({
        auth: oauth2Client
      })
      
      console.log('[Analytics Test] Found Analytics accounts:', accountsResponse.data.accounts?.length || 0)
      
      if (accountsResponse.data.accounts && accountsResponse.data.accounts.length > 0) {
        for (const analyticsAccount of accountsResponse.data.accounts) {
          console.log(`[Analytics Test] Fetching properties for account: ${analyticsAccount.displayName}`)
          
          const propertiesResponse = await analyticsAdmin.properties.list({
            auth: oauth2Client,
            filter: `parent:${analyticsAccount.name}`
          })
          
          if (propertiesResponse.data.properties) {
            properties.push(...propertiesResponse.data.properties)
            console.log(`[Analytics Test] Found ${propertiesResponse.data.properties.length} properties`)
          }
        }
      }
    } catch (error: any) {
      console.error('[Analytics Test] Error fetching Analytics properties:', error.message)
      return NextResponse.json({ 
        error: "Failed to fetch Analytics properties",
        details: error.message,
        step: "properties_fetch"
      }, { status: 500 })
    }
    
    if (properties.length === 0) {
      console.warn('[Analytics Test] No Analytics properties found for this account')
      return NextResponse.json({ 
        error: "No Analytics properties found",
        step: "properties_check",
        accountId: account.id,
        providerAccountId: account.providerAccountId
      }, { status: 404 })
    }
    
    console.log(`[Analytics Test] Total properties found: ${properties.length}`)
    const property = properties[0]
    console.log('[Analytics Test] Using property:', {
      name: property.name,
      displayName: property.displayName,
      propertyId: property.name?.split('/').pop()
    })
    
    // Step 5: Make Analytics Data API call
    console.log('[Analytics Test] Step 5: Making Analytics Data API call...')
    const analyticsData = google.analyticsdata('v1beta')
    
    // Calculate date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    console.log('[Analytics Test] Date range:', {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    })
    
    // Format property name for API call
    let propertyName = property.name
    if (!propertyName.startsWith('properties/')) {
      propertyName = `properties/${property.name.split('/').pop()}`
    }
    
    console.log('[Analytics Test] Formatted property name:', propertyName)
    
    try {
      console.log('[Analytics Test] Making API request...')
      const response = await analyticsData.properties.runReport({
        property: propertyName,
        requestBody: {
          dateRanges: [{
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
          }],
          dimensions: [
            { name: "date" }
          ],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "screenPageViews" }
          ]
        },
        auth: oauth2Client
      })
      
      console.log('[Analytics Test] API call successful!')
      console.log('[Analytics Test] Response data:', {
        hasData: !!response.data,
        rowCount: response.data.rows?.length || 0,
        dimensionHeaders: response.data.dimensionHeaders,
        metricHeaders: response.data.metricHeaders,
        propertyQuota: response.data.propertyQuota,
        metadata: response.data.metadata
      })
      
      // Process the data for summary
      let summary = {
        totalSessions: 0,
        totalUsers: 0,
        totalPageViews: 0,
        dailyData: [] as any[]
      }
      
      if (response.data.rows) {
        response.data.rows.forEach(row => {
          const date = row.dimensionValues?.[0]?.value || ""
          const sessions = parseInt(row.metricValues?.[0]?.value || "0")
          const users = parseInt(row.metricValues?.[1]?.value || "0")
          const pageViews = parseInt(row.metricValues?.[2]?.value || "0")
          
          summary.totalSessions += sessions
          summary.totalUsers += users
          summary.totalPageViews += pageViews
          
          summary.dailyData.push({
            date,
            sessions,
            users,
            pageViews
          })
        })
      }
      
      console.log('[Analytics Test] Summary:', summary)
      console.log('========== Analytics Test Endpoint END (SUCCESS) ==========\n')
      
      return NextResponse.json({
        success: true,
        step: "complete",
        account: {
          id: account.id,
          providerAccountId: account.providerAccountId
        },
        property: {
          name: property.name,
          displayName: property.displayName,
          propertyId: property.name?.split('/').pop()
        },
        dateRange: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        },
        rawResponse: response.data,
        summary,
        debug: {
          accessTokenLength: accessToken.length,
          propertyNameUsed: propertyName,
          totalProperties: properties.length
        }
      })
      
    } catch (error: any) {
      console.error('[Analytics Test] API call failed:', error)
      console.error('[Analytics Test] Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        errors: error.errors
      })
      console.error('========== Analytics Test Endpoint END (API ERROR) ==========\n')
      
      return NextResponse.json({
        error: "Analytics API call failed",
        step: "api_call",
        details: error.message,
        code: error.code,
        status: error.status,
        errors: error.errors,
        property: {
          name: property.name,
          displayName: property.displayName,
          propertyId: property.name?.split('/').pop()
        },
        debug: {
          propertyNameUsed: propertyName,
          accessTokenLength: accessToken.length
        }
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('[Analytics Test] Unexpected error:', error)
    console.error('========== Analytics Test Endpoint END (UNEXPECTED ERROR) ==========\n')
    
    return NextResponse.json({
      error: "Unexpected error",
      step: "unknown",
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}