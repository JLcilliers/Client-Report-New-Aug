import { NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/db/supabase"
import { ReportData } from "@/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const searchParams = request.nextUrl.searchParams
  const range = searchParams.get("range") || "30d"

  try {
    // Fetch client data (public access allowed)
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Check cache first
    const { data: cachedData } = await supabase
      .from("metrics_cache")
      .select("*")
      .eq("client_id", clientId)
      .eq("date_range", range)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    // If we have valid cached data, return it
    if (cachedData && cachedData.length > 0) {
      const aggregatedData = aggregateCachedData(cachedData, client, range)
      return NextResponse.json(aggregatedData)
    }

    // Otherwise, return mock data for now
    // In production, this would trigger a fetch from Google APIs
    const mockData: ReportData = {
      client,
      dateRange: range as any,
      overview: {
        totalClicks: 12543,
        totalImpressions: 234567,
        avgCTR: 5.35,
        avgPosition: 12.4,
        clicksChange: 15.2,
        impressionsChange: 8.7,
        ctrChange: 0.5,
        positionChange: -2.1,
        insights: [
          "Organic traffic increased by 15.2% compared to the previous period",
          "Average position improved by 2.1 positions",
          "Mobile traffic accounts for 68% of total visits"
        ]
      },
      traffic: {
        organicTraffic: generateTrafficData(range),
        trafficSources: [
          { source: "organic", medium: "search", users: 8234, sessions: 10234, percentage: 68 },
          { source: "direct", medium: "none", users: 2345, sessions: 2890, percentage: 19 },
          { source: "referral", medium: "website", users: 1234, sessions: 1567, percentage: 10 },
          { source: "social", medium: "social", users: 456, sessions: 512, percentage: 3 },
        ],
        clicksVsImpressions: [],
        metrics: {
          users: 12543,
          sessions: 15234,
          pageviews: 45678,
          bounceRate: 42.3,
          avgSessionDuration: 234,
          newUsers: 8234,
          engagementRate: 67.8,
          conversions: 234
        }
      },
      keywords: {
        keywords: [
          { query: "best seo tools", clicks: 234, impressions: 5678, ctr: 4.12, position: 8.2, positionChange: -1.2 },
          { query: "seo reporting", clicks: 189, impressions: 4234, ctr: 4.46, position: 6.7, positionChange: 0.5 },
          { query: "google analytics", clicks: 156, impressions: 3890, ctr: 4.01, position: 12.3, positionChange: -2.1 },
          { query: "website optimization", clicks: 145, impressions: 3456, ctr: 4.19, position: 9.8, positionChange: -0.8 },
          { query: "search console api", clicks: 134, impressions: 3123, ctr: 4.29, position: 7.4, positionChange: 1.2 },
        ],
        improved: [
          { query: "best seo tools", clicks: 234, impressions: 5678, ctr: 4.12, position: 8.2, positionChange: -1.2 },
          { query: "google analytics", clicks: 156, impressions: 3890, ctr: 4.01, position: 12.3, positionChange: -2.1 },
        ],
        declined: [
          { query: "seo reporting", clicks: 189, impressions: 4234, ctr: 4.46, position: 6.7, positionChange: 0.5 },
          { query: "search console api", clicks: 134, impressions: 3123, ctr: 4.29, position: 7.4, positionChange: 1.2 },
        ],
        new: [
          { query: "ai seo tools", clicks: 78, impressions: 1234, ctr: 6.32, position: 15.2 },
          { query: "automated reporting", clicks: 56, impressions: 987, ctr: 5.67, position: 18.7 },
        ]
      },
      technical: {
        coreWebVitals: {
          LCP: 2.3,
          FID: 89,
          CLS: 0.08,
          INP: 123,
          TTFB: 890,
          FCP: 1.8
        },
        mobileScore: 87,
        desktopScore: 92,
        issues: [
          {
            id: "large-images",
            title: "Properly size images",
            description: "Images are larger than necessary. Consider optimizing image sizes to improve load times.",
            details: {}
          },
          {
            id: "unused-css",
            title: "Remove unused CSS",
            description: "2.3KB of CSS is not used. Consider removing unused rules to reduce file size.",
            details: {}
          }
        ],
        crawlErrors: []
      },
      content: {
        topPerforming: [
          { page: "/blog/seo-guide", clicks: 1234, impressions: 23456, ctr: 5.26, position: 4.2 },
          { page: "/products", clicks: 987, impressions: 18234, ctr: 5.41, position: 6.8 },
          { page: "/about", clicks: 765, impressions: 14567, ctr: 5.25, position: 8.1 },
        ],
        highEngagement: [
          { 
            page: "/blog/complete-guide", 
            users: 3456, 
            sessions: 4123, 
            bounceRate: 23.4, 
            avgSessionDuration: 342,
            pageviews: 8234 
          },
          { 
            page: "/case-studies", 
            users: 2345, 
            sessions: 2890, 
            bounceRate: 31.2, 
            avgSessionDuration: 298,
            pageviews: 5678 
          },
        ],
        declining: [
          { page: "/old-post", clicks: 123, impressions: 3456, ctr: 3.56, position: 24.5 },
          { page: "/outdated-guide", clicks: 89, impressions: 2345, ctr: 3.79, position: 28.3 },
        ]
      },
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(mockData)
  } catch (error: any) {
    console.error("Error fetching report data:", error)
    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    )
  }
}

function aggregateCachedData(cachedData: any[], client: any, range: string): ReportData {
  // This would aggregate the cached data into the ReportData format
  // For now, returning mock data
  return {} as ReportData
}

function generateTrafficData(range: string) {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
  const data = []
  const baseValue = 400
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    data.push({
      date: date.toISOString().split("T")[0],
      value: baseValue + Math.floor(Math.random() * 200)
    })
  }
  
  return data
}