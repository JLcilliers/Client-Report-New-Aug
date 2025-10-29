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

// DELETE /api/admin/ai-brands/[brandId]/competitors/[competitorId] - Delete competitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { brandId: string; competitorId: string } }
) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { brandId, competitorId } = params

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

    // Verify competitor belongs to brand
    const competitor = await prisma.aIBrandCompetitor.findFirst({
      where: {
        id: competitorId,
        brandId: brandId
      }
    })

    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 })
    }

    // Delete competitor
    await prisma.aIBrandCompetitor.delete({
      where: {
        id: competitorId
      }
    })

    return NextResponse.json({
      success: true,
      message: "Competitor deleted successfully"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete competitor", details: error.message },
      { status: 500 }
    )
  }
}
