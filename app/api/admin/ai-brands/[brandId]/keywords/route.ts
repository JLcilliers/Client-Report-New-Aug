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

// GET /api/admin/ai-brands/[brandId]/keywords - Get all keywords for a brand
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

    // Fetch keywords
    const keywords = await prisma.aIBrandKeyword.findMany({
      where: {
        brandId: brandId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      keywords,
      success: true
    })
  } catch (error: any) {
    console.error('[Keywords API GET] Error:', error)
    return NextResponse.json(
      { error: "Failed to fetch keywords", details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/admin/ai-brands/[brandId]/keywords - Add a new keyword
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
    const { prompt, category } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Keyword prompt is required" },
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

    // Check if keyword already exists
    const existingKeyword = await prisma.aIBrandKeyword.findFirst({
      where: {
        brandId: brandId,
        prompt: prompt.trim()
      }
    })

    if (existingKeyword) {
      return NextResponse.json(
        { error: "This keyword already exists for this brand" },
        { status: 400 }
      )
    }

    // Create keyword
    const keyword = await prisma.aIBrandKeyword.create({
      data: {
        brandId: brandId,
        prompt: prompt.trim(),
        category: category || 'general',
        isActive: true
      }
    })

    return NextResponse.json({
      keyword,
      success: true,
      message: "Keyword added successfully"
    })
  } catch (error: any) {
    console.error('[Keywords API POST] Error:', error)
    return NextResponse.json(
      { error: "Failed to add keyword", details: error.message },
      { status: 500 }
    )
  }
}
