import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/db/prisma"
import { cookies } from "next/headers"

const prisma = getPrisma()

// Helper function to get current user
async function getCurrentUser() {
  try {
    const cookieStore = cookies()
    const userEmail = cookieStore.get('google_user_email')?.value

    if (!userEmail) {
      return null
    }

    // Find or create user based on email
    const user = await prisma.user.findFirst({
      where: { email: decodeURIComponent(userEmail) }
    })

    if (!user) {
      // Create user if doesn't exist
      return await prisma.user.create({
        data: {
          email: decodeURIComponent(userEmail),
          name: decodeURIComponent(userEmail).split('@')[0]
        }
      })
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

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
    const { name, domain, googleAccountId, ga4PropertyId, searchConsolePropertyId } = await request.json()

    if (!name || !domain) {
      return NextResponse.json({ error: "Name and domain are required" }, { status: 400 })
    }

    // Get current authenticated user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // If googleAccountId not provided, try to get the first available Google account
    let actualGoogleAccountId = googleAccountId
    let actualGa4PropertyId = ga4PropertyId || ''
    let actualSearchConsolePropertyId = searchConsolePropertyId || `sc-domain:${domain.replace('https://', '').replace('http://', '')}`

    if (!actualGoogleAccountId) {
      // Try to find a Google account for this user
      const googleAccount = await prisma.googleAccount.findFirst({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'desc' }
      })

      if (googleAccount) {
        actualGoogleAccountId = googleAccount.id
      } else {
        // If no Google account exists, we'll need to create one later or use a default
        actualGoogleAccountId = `pending-${Date.now()}`
      }
    }

    // Generate unique IDs for shareable links
    const shareableId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://searchsignal.online'}/report/${shareableId}`;

    // Create a new ClientReport with real user and Google account data
    const newReport = await prisma.clientReport.create({
      data: {
        clientName: name.trim(),
        reportName: `${name.trim()} SEO Report`,
        googleAccountId: actualGoogleAccountId,
        ga4PropertyId: actualGa4PropertyId,
        searchConsolePropertyId: actualSearchConsolePropertyId,
        shareableLink,
        shareableId,
        isActive: true,
        refreshInterval: 'weekly',
        userId: currentUser.id
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