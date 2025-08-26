import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')
    const refreshToken = cookieStore.get('google_refresh_token')
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: "Not authenticated",
        properties: { searchConsole: [], analytics: [] }
      }, { status: 401 })
    }
    
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/admin-google/callback`
    )
    
    oauth2Client.setCredentials({
      access_token: accessToken.value,
      refresh_token: refreshToken?.value
    })
    
    const properties = {
      searchConsole: [] as any[],
      analytics: [] as any[]
    }
    
    try {
      // Fetch Search Console properties
      const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client })
      const sitesResponse = await searchConsole.sites.list()
      
      if (sitesResponse.data.siteEntry) {
        properties.searchConsole = sitesResponse.data.siteEntry.map(site => ({
          siteUrl: site.siteUrl,
          permissionLevel: site.permissionLevel
        }))
      }
    } catch (error) {
      console.error("Error fetching Search Console properties:", error)
    }
    
    try {
      // Fetch Google Analytics properties
      const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client })
      const accountsResponse = await analyticsAdmin.accounts.list()
      
      if (accountsResponse.data.accounts) {
        for (const account of accountsResponse.data.accounts) {
          const propertiesResponse = await analyticsAdmin.properties.list({
            filter: `parent:${account.name}`
          })
          
          if (propertiesResponse.data.properties) {
            properties.analytics.push(...propertiesResponse.data.properties.map(prop => ({
              name: prop.displayName,
              propertyId: prop.name?.split('/').pop(),
              account: account.displayName
            })))
          }
        }
      }
    } catch (error) {
      console.error("Error fetching Analytics properties:", error)
    }
    
    return NextResponse.json({ properties })
  } catch (error: any) {
    console.error("Error fetching properties:", error)
    return NextResponse.json({ 
      error: "Failed to fetch properties",
      details: error.message,
      properties: { searchConsole: [], analytics: [] }
    }, { status: 500 })
  }
}