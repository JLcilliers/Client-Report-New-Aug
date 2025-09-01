import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPrisma } from "@/lib/db/prisma"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SearchConsoleMetrics {
  clicks: number
  impressions: number
  ctr: number
  position: number
  date?: string
}

export async function POST(request: NextRequest) {
  try {
    const { reportId, properties, dateRange = 'last30days' } = await request.json()
    
    if (!reportId && !properties) {
      return NextResponse.json({ error: "Report ID or properties required" }, { status: 400 })
    }
    
    // Get tokens from cookies
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')
    const refreshToken = cookieStore.get('google_refresh_token')
    
    if (!accessToken || !refreshToken) {
      return NextResponse.json({ 
        error: "Google authentication required",
        details: "No valid Google tokens found"
      }, { status: 401 })
    }
    
    let currentAccessToken = accessToken.value
    
    // Try to refresh token if needed
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: refreshToken.value,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: "refresh_token",
        }),
      })
      
      if (tokenResponse.ok) {
        const newTokens = await tokenResponse.json()
        currentAccessToken = newTokens.access_token
      }
    } catch (refreshError) {
      console.log('Token refresh failed, using existing token:', refreshError)
    }
    
    // Get report details from database if reportId provided
    let searchConsoleProperties = properties || []
    if (reportId && !properties) {
      try {
        const prisma = getPrisma()
        const report = await prisma.clientReport.findUnique({
          where: { id: reportId }
        })
        searchConsoleProperties = report?.searchConsolePropertyId ? [report.searchConsolePropertyId] : []
      } catch (dbError) {
        console.log('Database error, using provided properties:', dbError)
      }
    }
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    if (dateRange === 'last7days') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (dateRange === 'last30days') {
      startDate.setDate(startDate.getDate() - 30)
    } else if (dateRange === 'last90days') {
      startDate.setDate(startDate.getDate() - 90)
    } else {
      startDate.setDate(startDate.getDate() - 30) // Default to 30 days
    }
    
    const allData: any = {
      summary: {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      },
      byProperty: [],
      byDate: [],
      topPages: [],
      topQueries: [],
    }
    
    // Fetch data for each Search Console property
    for (const property of searchConsoleProperties) {
      try {
        // Clean up property URL (remove sc-domain: prefix if present)
        const siteUrl = property.replace('sc-domain:', 'domain:')
        
        
        
        // Fetch overall metrics
        const metricsResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${currentAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: [],
              rowLimit: 1,
            }),
          }
        )
        
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json()
          const metrics = metricsData.rows?.[0] || {}
          
          allData.summary.clicks += metrics.clicks || 0
          allData.summary.impressions += metrics.impressions || 0
          
          allData.byProperty.push({
            property: property,
            metrics: {
              clicks: metrics.clicks || 0,
              impressions: metrics.impressions || 0,
              ctr: metrics.ctr || 0,
              position: metrics.position || 0,
            }
          })
        }
        
        // Fetch data by date
        const dateResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${currentAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: ["date"],
              rowLimit: 1000,
            }),
          }
        )
        
        if (dateResponse.ok) {
          const dateData = await dateResponse.json()
          allData.byDate = dateData.rows || []
        }
        
        // Fetch top pages
        const pagesResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${currentAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: ["page"],
              rowLimit: 10,
            }),
          }
        )
        
        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json()
          allData.topPages = pagesData.rows || []
        }
        
        // Fetch top queries
        const queriesResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${currentAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: ["query"],
              rowLimit: 20,
            }),
          }
        )
        
        if (queriesResponse.ok) {
          const queriesData = await queriesResponse.json()
          allData.topQueries = queriesData.rows || []
        }
        
      } catch (error: any) {
        
      }
    }
    
    // Calculate summary CTR and position
    if (allData.summary.impressions > 0) {
      allData.summary.ctr = allData.summary.clicks / allData.summary.impressions
    }
    
    // Calculate average position from all properties
    if (allData.byProperty.length > 0) {
      const totalPosition = allData.byProperty.reduce((sum: number, p: any) => 
        sum + (p.metrics.position || 0), 0
      )
      allData.summary.position = totalPosition / allData.byProperty.length
    }
    
    // Store data in ReportCache if reportId provided
    if (reportId) {
      try {
        const prisma = getPrisma()
        // Delete existing cache for this report and dataType
        await prisma.reportCache.deleteMany({
          where: {
            reportId: reportId,
            dataType: 'searchConsole'
          }
        })
        
        // Create new cache entry
        await prisma.reportCache.create({
          data: {
            reportId: reportId,
            dataType: 'searchConsole',
            data: JSON.stringify(allData),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        })
      } catch (dbError) {
        console.log('Database storage failed, returning data anyway:', dbError)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: allData,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      }
    })
    
  } catch (error: any) {
    
    return NextResponse.json({ 
      error: "Failed to fetch Search Console data",
      details: error.message 
    }, { status: 500 })
  }
}