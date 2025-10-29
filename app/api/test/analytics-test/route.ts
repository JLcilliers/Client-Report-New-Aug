import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { prisma } from '@/lib/db/prisma'
import { getValidGoogleToken } from '@/lib/google/refresh-token'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Step 1: Get a Google account with valid token
    const accounts = await prisma.account.findMany({
      where: { 
        provider: 'google',
        refresh_token: { not: null }
      },
      orderBy: { expires_at: 'desc' }
    })
    
    if (accounts.length === 0) {
      return NextResponse.json({ 
        error: "No Google accounts found",
        step: "account_fetch"
      }, { status: 404 })
    }
    
    const account = accounts[0]
    // Step 2: Get valid access token
    const accessToken = await getValidGoogleToken(account.id)
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: "Failed to get valid access token",
        step: "token_refresh",
        accountId: account.id
      }, { status: 401 })
    }
    
    // Step 3: Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials({
      access_token: accessToken
    })
    
    // Step 4: Get Analytics properties first
    const analyticsAdmin = google.analyticsadmin('v1beta')
    
    let properties: any[] = []
    try {
      const accountsResponse = await analyticsAdmin.accounts.list({
        auth: oauth2Client
      })
      
      if (accountsResponse.data.accounts && accountsResponse.data.accounts.length > 0) {
        for (const analyticsAccount of accountsResponse.data.accounts) {
          const propertiesResponse = await analyticsAdmin.properties.list({
            auth: oauth2Client,
            filter: `parent:${analyticsAccount.name}`
          })
          
          if (propertiesResponse.data.properties) {
            properties.push(...propertiesResponse.data.properties)
            }
        }
      }
    } catch (error: any) {
      return NextResponse.json({ 
        error: "Failed to fetch Analytics properties",
        details: error.message,
        step: "properties_fetch"
      }, { status: 500 })
    }
    
    if (properties.length === 0) {
      return NextResponse.json({ 
        error: "No Analytics properties found",
        step: "properties_check",
        accountId: account.id,
        providerAccountId: account.providerAccountId
      }, { status: 404 })
    }
    
    const property = properties[0]
    
    // Step 5: Make Analytics Data API call
    const analyticsData = google.analyticsdata('v1beta')
    
    // Calculate date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    
    // Format property name for API call
    let propertyName = property.name
    if (!propertyName.startsWith('properties/')) {
      propertyName = `properties/${property.name.split('/').pop()}`
    }
    
    try {
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
    
    return NextResponse.json({
      error: "Unexpected error",
      step: "unknown",
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}