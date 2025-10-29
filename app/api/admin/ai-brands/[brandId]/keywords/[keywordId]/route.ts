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

// PATCH /api/admin/ai-brands/[brandId]/keywords/[keywordId] - Update keyword
export async function PATCH(
  request: NextRequest,
  { params }: { params: { brandId: string; keywordId: string } }
) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { brandId, keywordId } = params
    const body = await request.json()

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

    // Verify keyword belongs to brand
    const keyword = await prisma.aIBrandKeyword.findFirst({
      where: {
        id: keywordId,
        brandId: brandId
      }
    })

    if (!keyword) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 })
    }

    // Update keyword
    const updatedKeyword = await prisma.aIBrandKeyword.update({
      where: {
        id: keywordId
      },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : keyword.isActive,
        prompt: body.prompt !== undefined ? body.prompt : keyword.prompt,
        category: body.category !== undefined ? body.category : keyword.category
      }
    })

    return NextResponse.json({
      keyword: updatedKeyword,
      success: true,
      message: "Keyword updated successfully"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update keyword", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/ai-brands/[brandId]/keywords/[keywordId] - Delete keyword
export async function DELETE(
  request: NextRequest,
  { params }: { params: { brandId: string; keywordId: string } }
) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { brandId, keywordId } = params

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

    // Verify keyword belongs to brand
    const keyword = await prisma.aIBrandKeyword.findFirst({
      where: {
        id: keywordId,
        brandId: brandId
      }
    })

    if (!keyword) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 })
    }

    // Delete keyword
    await prisma.aIBrandKeyword.delete({
      where: {
        id: keywordId
      }
    })

    return NextResponse.json({
      success: true,
      message: "Keyword deleted successfully"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete keyword", details: error.message },
      { status: 500 }
    )
  }
}
