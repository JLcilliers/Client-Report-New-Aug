import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const g = (session as any)?.google;
    
    if (!g?.access_token) {
      return NextResponse.json({ 
        error: "Not authenticated - no Google token",
        properties: { searchConsole: [], analytics: [] }
      }, { status: 401 })
    }
    
    // Create OAuth2 client with session tokens
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials({
      access_token: g.access_token,
      refresh_token: g.refresh_token
    })
    
    const analytics = google.analytics({ version: 'v3', auth: oauth2Client })
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client })
    const searchConsole = google.webmasters({ version: 'v3', auth: oauth2Client })
    
    console.log('Fetching properties with session token...')
    
    let searchConsoleProperties = []
    let analyticsProperties = []
    
    try {
      // Fetch Search Console properties
      const searchConsoleResponse = await searchConsole.sites.list()
      searchConsoleProperties = searchConsoleResponse.data.siteEntry?.map((site: any) => ({
        siteUrl: site.siteUrl,
        permissionLevel: site.permissionLevel
      })) || []
      console.log('Search Console properties:', searchConsoleProperties.length)
    } catch (error) {
      console.error('Search Console error:', error)
    }
    
    try {
      // Fetch GA4 properties using Analytics Admin API
      const accountSummariesResponse = await analyticsAdmin.accountSummaries.list()
      const accountSummaries = accountSummariesResponse.data.accountSummaries || []
      
      analyticsProperties = accountSummaries.flatMap((account: any) =>
        (account.propertySummaries || []).map((property: any) => ({
          propertyId: property.property?.replace('properties/', ''),
          displayName: property.displayName,
          propertyType: property.propertyType,
          parent: property.parent
        }))
      )
      console.log('Analytics properties:', analyticsProperties.length)
    } catch (error) {
      console.error('Analytics error:', error)
    }
    
    return NextResponse.json({
      success: true,
      properties: {
        searchConsole: searchConsoleProperties,
        analytics: analyticsProperties
      },
      counts: {
        searchConsole: searchConsoleProperties.length,
        analytics: analyticsProperties.length
      }
    })
    
  } catch (error) {
    console.error('Fetch properties error:', error)
    return NextResponse.json({ 
      error: "Failed to fetch properties",
      details: error instanceof Error ? error.message : 'Unknown error',
      properties: { searchConsole: [], analytics: [] }
    }, { status: 500 })
  }
}