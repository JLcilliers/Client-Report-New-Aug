import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db/prisma"

// Helper function to get user from session
async function getUserFromSession() {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get('session_token')
  const userEmail = cookieStore.get('google_user_email')

  if (sessionToken) {
    const session = await prisma.session.findFirst({
      where: {
        sessionToken: sessionToken.value,
        expires: { gte: new Date() }
      },
      include: {
        user: true
      }
    })

    if (session) {
      return session.user
    }
  }

  if (userEmail) {
    const user = await prisma.user.findUnique({
      where: { email: userEmail.value }
    })
    if (user) {
      return user
    }
  }

  return null
}

// GET /api/admin/ai-brands/[brandId]/competitors - Get all competitors for a brand
export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { brandId } = params

    // Verify brand belongs to user
    const brand = await prisma.aIBrand.findFirst({
      where: {
        id: brandId,
        userId: user.id
      }
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Fetch competitors
    const competitors = await prisma.aIBrandCompetitor.findMany({
      where: {
        brandId: brandId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      competitors,
      success: true
    })
  } catch (error: any) {
    console.error('[Competitors API GET] Error:', error)
    return NextResponse.json(
      { error: "Failed to fetch competitors", details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/admin/ai-brands/[brandId]/competitors - Add a new competitor
export async function POST(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { brandId } = params
    const body = await request.json()
    const { competitorName, domain } = body

    if (!competitorName || !competitorName.trim()) {
      return NextResponse.json(
        { error: "Competitor name is required" },
        { status: 400 }
      )
    }

    // Verify brand belongs to user
    const brand = await prisma.aIBrand.findFirst({
      where: {
        id: brandId,
        userId: user.id
      }
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    // Check if competitor already exists
    const existingCompetitor = await prisma.aIBrandCompetitor.findFirst({
      where: {
        brandId: brandId,
        competitorName: competitorName.trim()
      }
    })

    if (existingCompetitor) {
      return NextResponse.json(
        { error: "This competitor already exists for this brand" },
        { status: 400 }
      )
    }

    // Create competitor
    const competitor = await prisma.aIBrandCompetitor.create({
      data: {
        brandId: brandId,
        competitorName: competitorName.trim(),
        domain: domain && domain.trim() ? domain.trim() : null
      }
    })

    return NextResponse.json({
      competitor,
      success: true,
      message: "Competitor added successfully"
    })
  } catch (error: any) {
    console.error('[Competitors API POST] Error:', error)
    return NextResponse.json(
      { error: "Failed to add competitor", details: error.message },
      { status: 500 }
    )
  }
}
