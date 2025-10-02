import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      clientName,
      clientEmail,
      clientUrl,
      name,
      reportName,
      description,
      googleAccountId,
      searchConsoleProperties,
      analyticsProperties,
      settings,
    } = body

    // Support both ways of passing the data
    const actualReportName = reportName || name
    const actualClientId = clientId
    
    if (!actualClientId && !clientName) {
      return NextResponse.json(
        { error: "Client ID or client name is required" },
        { status: 400 }
      )
    }
    
    if (!actualReportName) {
      return NextResponse.json(
        { error: "Report name is required" },
        { status: 400 }
      )
    }

    // First, create or get the client
    let finalClientId: string
    
    if (actualClientId) {
      // Use the provided client ID
      finalClientId = actualClientId
    } else {
      // For now, we'll use the clientName as the finalClientId
      // In a more robust implementation, we'd have a separate Client model
      finalClientId = clientName
    }
    
    // Create the report
    const reportId = crypto.randomUUID()
    const reportSlug = crypto.randomUUID()
    
    // First, ensure we have a system user
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@search-insights-hub.com' }
    })
    
    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: 'system@search-insights-hub.com',
          name: 'System User',
        }
      })
    }
    
    // Store report in database using Prisma (matching current schema)
    const newReport = await prisma.clientReport.create({
      data: {
        id: reportId,
        clientName: clientName || finalClientId,
        reportName: actualReportName,
        googleAccountId: googleAccountId || 'default',
        ga4PropertyId: analyticsProperties?.[0] || '',
        searchConsolePropertyId: searchConsoleProperties?.[0] || '',
        shareableLink: `${process.env.NEXT_PUBLIC_URL}/report/${reportSlug}`,
        shareableId: reportSlug,
        userId: systemUser.id,
      }
    })
    
    return NextResponse.json({
      success: true,
      reportId,
      clientId: finalClientId,
      slug: reportSlug,
      report: newReport,
      message: "Report created successfully",
    })
    
  } catch (error: any) {
    
    return NextResponse.json(
      { error: "Failed to create report", details: error.message },
      { status: 500 }
    )
  }
}