import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/db/prisma"

const prisma = getPrisma()

export async function GET() {
  try {
    // Fetch all ClientReports which act as our clients
    const reports = await prisma.clientReport.findMany({
      include: {
        keywords: {
          where: { trackingStatus: 'active' },
          select: { id: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to client structure
    const clients = reports.map(report => ({
      id: report.id,
      name: report.clientName,
      domain: report.searchConsolePropertyId?.replace('sc-domain:', '').replace('https://', ''),
      report_token: report.shareableId,
      slug: report.shareableId,
      created_at: report.createdAt,
      updated_at: report.updatedAt,
      keyword_count: report.keywords.length,
      google_account_id: report.googleAccountId,
      search_console_properties: report.searchConsolePropertyId ? [report.searchConsolePropertyId] : [],
      analytics_properties: report.ga4PropertyId ? [report.ga4PropertyId] : []
    }))

    return NextResponse.json(clients)
  } catch (error: any) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({
      error: "Failed to fetch clients",
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, domain } = await request.json()

    if (!name || !domain) {
      return NextResponse.json({ error: "Name and domain are required" }, { status: 400 })
    }

    // Create a new ClientReport
    const newReport = await prisma.clientReport.create({
      data: {
        clientName: name.trim(),
        reportName: `${name.trim()} SEO Report`,
        searchConsolePropertyId: `sc-domain:${domain.replace('https://', '').replace('http://', '')}`,
        isActive: true,
        refreshInterval: 'weekly'
      }
    })

    return NextResponse.json({
      client: {
        id: newReport.id,
        name: newReport.clientName,
        domain: domain.trim(),
        report_token: newReport.shareableId,
        slug: newReport.shareableId,
        created_at: newReport.createdAt,
        updated_at: newReport.updatedAt
      },
      message: "Client created successfully",
      existing: false
    })
  } catch (error: any) {
    console.error('Error creating client:', error)
    return NextResponse.json({
      error: "Failed to create client",
      details: error.message
    }, { status: 500 })
  }
}