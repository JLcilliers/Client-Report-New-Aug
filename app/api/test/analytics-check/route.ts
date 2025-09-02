import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { prisma } from '@/lib/db/prisma'
import { getValidGoogleToken } from '@/lib/google/refresh-token'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('\n========== Analytics API Check START ==========')
  
  try {
    // Step 1: Get a Google account token
    console.log('[Analytics Check] Step 1: Getting Google account with token...')
    const accounts = await prisma.account.findMany({
      where: { 
        provider: 'google',
        refresh_token: { not: null }
      },
      orderBy: { expires_at: 'desc' }
    })
    
    if (accounts.length === 0) {
      console.error('[Analytics Check] No Google accounts found')
      return NextResponse.json({ 
        error: "No Google accounts found",
        step: 1,
        details: "No accounts with refresh tokens available"
      }, { status: 404 })
    }
    
    const account = accounts[0]
    console.log('[Analytics Check] Using account:', {
      id: account.id,
      providerAccountId: account.providerAccountId,
      hasRefreshToken: !!account.refresh_token
    })
    
    // Get valid access token
    const accessToken = await getValidGoogleToken(account.id)
    if (!accessToken) {
      console.error('[Analytics Check] Failed to get valid access token')
      return NextResponse.json({ 
        error: "Failed to refresh token",
        step: 1,
        accountId: account.id
      }, { status: 401 })
    }
    
    console.log('[Analytics Check] Got access token, length:', accessToken.length)
    
    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials({
      access_token: accessToken
    })
    
    // Step 2: List all GA4 properties using Analytics Admin API
    console.log('\n[Analytics Check] Step 2: Listing GA4 properties...')
    const analyticsAdmin = google.analyticsadmin('v1beta')
    
    let allProperties: any[] = []
    let accountsList: any[] = []
    
    try {
      // First get all accounts
      console.log('[Analytics Check] Fetching Analytics accounts...')
      const accountsResponse = await analyticsAdmin.accounts.list({
        auth: oauth2Client,
        pageSize: 200
      })
      
      if (!accountsResponse.data.accounts || accountsResponse.data.accounts.length === 0) {
        console.warn('[Analytics Check] No Analytics accounts found')
        return NextResponse.json({
          warning: "No Analytics accounts found",
          step: 2,
          details: "User may not have access to any Analytics accounts",
          accountId: account.providerAccountId
        })
      }
      
      accountsList = accountsResponse.data.accounts
      console.log(`[Analytics Check] Found ${accountsList.length} Analytics account(s)`)
      
      // For each account, get properties
      for (const analyticsAccount of accountsList) {
        console.log(`[Analytics Check] Getting properties for account: ${analyticsAccount.displayName} (${analyticsAccount.name})`)
        
        try {
          const propertiesResponse = await analyticsAdmin.properties.list({
            auth: oauth2Client,
            filter: `parent:${analyticsAccount.name}`,
            pageSize: 200
          })
          
          if (propertiesResponse.data.properties) {
            const propertiesWithAccount = propertiesResponse.data.properties.map((prop: any) => ({
              ...prop,
              accountName: analyticsAccount.displayName,
              accountId: analyticsAccount.name
            }))
            allProperties.push(...propertiesWithAccount)
            console.log(`[Analytics Check] Found ${propertiesResponse.data.properties.length} properties in this account`)
          }
        } catch (propError: any) {
          console.error(`[Analytics Check] Error fetching properties for account ${analyticsAccount.displayName}:`, propError.message)
        }
      }
      
      console.log(`[Analytics Check] Total properties found: ${allProperties.length}`)
      
    } catch (error: any) {
      console.error('[Analytics Check] Error listing Analytics accounts/properties:', error.message)
      return NextResponse.json({
        error: "Failed to list Analytics properties",
        step: 2,
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    if (allProperties.length === 0) {
      console.warn('[Analytics Check] No properties found across all accounts')
      return NextResponse.json({
        warning: "No Analytics properties found",
        step: 2,
        accounts: accountsList.map((acc: any) => ({
          name: acc.displayName,
          id: acc.name
        })),
        details: "User has Analytics accounts but no properties"
      })
    }
    
    // Step 3: Try to get basic data for the first property
    console.log('\n[Analytics Check] Step 3: Testing data retrieval for first property...')
    const testProperty = allProperties[0]
    console.log('[Analytics Check] Testing with property:', {
      name: testProperty.name,
      displayName: testProperty.displayName,
      accountName: testProperty.accountName
    })
    
    const analyticsData = google.analyticsdata('v1beta')
    
    // Calculate date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    let dataResponse: any = null
    let dataError: any = null
    
    try {
      console.log('[Analytics Check] Making test API call...')
      console.log('[Analytics Check] Property name:', testProperty.name)
      console.log('[Analytics Check] Date range:', formatDate(startDate), 'to', formatDate(endDate))
      
      const response = await analyticsData.properties.runReport({
        property: testProperty.name,
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
      
      dataResponse = {
        success: true,
        rowCount: response.data.rows?.length || 0,
        dimensionHeaders: response.data.dimensionHeaders,
        metricHeaders: response.data.metricHeaders,
        firstRow: response.data.rows?.[0] || null,
        propertyQuota: response.data.propertyQuota
      }
      
      console.log('[Analytics Check] Data retrieval successful!')
      console.log('[Analytics Check] Rows returned:', dataResponse.rowCount)
      
    } catch (error: any) {
      dataError = {
        message: error.message,
        code: error.code,
        status: error.status,
        errors: error.errors
      }
      console.error('[Analytics Check] Data retrieval failed:', error.message)
    }
    
    // Compile final result
    const result = {
      success: true,
      account: {
        id: account.id,
        providerAccountId: account.providerAccountId
      },
      analyticsAccounts: accountsList.map((acc: any) => ({
        name: acc.displayName,
        id: acc.name,
        createTime: acc.createTime,
        updateTime: acc.updateTime
      })),
      properties: allProperties.map((prop: any) => ({
        propertyId: prop.name?.split('/').pop(),
        fullName: prop.name,
        displayName: prop.displayName,
        accountName: prop.accountName,
        accountId: prop.accountId,
        createTime: prop.createTime,
        timeZone: prop.timeZone,
        currencyCode: prop.currencyCode,
        industryCategory: prop.industryCategory
      })),
      dataTest: {
        testedProperty: {
          name: testProperty.name,
          displayName: testProperty.displayName,
          propertyId: testProperty.name?.split('/').pop()
        },
        dateRange: {
          start: formatDate(startDate),
          end: formatDate(endDate)
        },
        result: dataResponse,
        error: dataError
      }
    }
    
    console.log('========== Analytics API Check END (SUCCESS) ==========\n')
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('[Analytics Check] Unexpected error:', error)
    console.error('========== Analytics API Check END (ERROR) ==========\n')
    
    return NextResponse.json({
      error: "Unexpected error during Analytics check",
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}