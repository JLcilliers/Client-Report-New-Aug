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

  // Fallback: try to find user by email from cookie
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

// GET /api/admin/ai-brands/[brandId] - Fetch individual brand with metrics
export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { brandId } = params

    // Fetch brand with related data
    const brand = await prisma.aIBrand.findFirst({
      where: {
        id: brandId,
        userId: user.id // Ensure user owns this brand
      },
      include: {
        keywords: {
          where: {
            isActive: true
          },
          select: {
            id: true
          }
        },
        competitors: {
          select: {
            id: true
          }
        },
        scores: {
          where: {
            platform: 'overall',
            period: 'daily'
          },
          orderBy: {
            date: 'desc'
          },
          take: 2 // Get last 2 to calculate trends
        }
      }
    })

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    // Get platform-specific scores (latest for each platform)
    const platformScores = await prisma.aIBrandScore.findMany({
      where: {
        brandId: brandId,
        platform: { not: 'overall' },
        period: 'daily'
      },
      orderBy: {
        date: 'desc'
      },
      distinct: ['platform'],
      take: 10 // Limit to reasonable number of platforms
    })

    // Transform brand data
    const transformedBrand = {
      id: brand.id,
      brandName: brand.brandName,
      alternateName: brand.alternateName,
      domain: brand.domain,
      industry: brand.industry,
      trackingStatus: brand.trackingStatus,
      isActive: brand.isActive,
      description: brand.description,
      keywordCount: brand.keywords.length,
      competitorCount: brand.competitors.length,
      createdAt: brand.createdAt.toISOString()
    }

    // Transform score data
    let scoreData = null
    if (brand.scores.length > 0) {
      const latestScore = brand.scores[0]
      const previousScore = brand.scores[1]

      scoreData = {
        overallScore: latestScore.overallScore,
        visibilityRate: latestScore.visibilityRate,
        avgPosition: latestScore.avgPosition,
        citationRate: latestScore.citationRate,
        shareOfVoice: latestScore.shareOfVoice,
        sentimentScore: latestScore.sentimentScore,
        totalTests: latestScore.totalTests,
        totalMentions: latestScore.totalMentions,
        citedMentions: latestScore.citedMentions,
        scoreChange: previousScore
          ? latestScore.overallScore - previousScore.overallScore
          : undefined,
        visibilityChange: previousScore
          ? latestScore.visibilityRate - previousScore.visibilityRate
          : undefined,
        positionChange: previousScore
          ? previousScore.avgPosition - latestScore.avgPosition // Inverted because lower position is better
          : undefined
      }
    }

    // Transform platform scores
    const platforms = platformScores.map(ps => {
      // Map platform names to display names and colors
      const platformConfig: Record<string, { displayName: string; color: string }> = {
        'chatgpt': { displayName: 'ChatGPT', color: '#10a37f' },
        'claude': { displayName: 'Claude', color: '#cc785c' },
        'gemini': { displayName: 'Gemini', color: '#4285f4' },
        'perplexity': { displayName: 'Perplexity', color: '#20808d' },
        'google_ai': { displayName: 'Google AI', color: '#ea4335' }
      }

      const config = platformConfig[ps.platform] || {
        displayName: ps.platform,
        color: '#6b7280'
      }

      return {
        platform: ps.platform,
        displayName: config.displayName,
        score: ps.overallScore,
        mentions: ps.totalMentions,
        citations: ps.citedMentions,
        sentiment: ps.sentimentScore,
        avgPosition: ps.avgPosition,
        color: config.color
      }
    })

    return NextResponse.json({
      brand: transformedBrand,
      score: scoreData,
      platforms: platforms,
      success: true
    })
  } catch (error: any) {
    console.error('[AI Brand Detail API] Error:', error)
    return NextResponse.json(
      { error: "Failed to fetch brand data", details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/ai-brands/[brandId] - Update brand settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { brandId } = params
    const body = await request.json()

    // Verify brand belongs to user
    const existingBrand = await prisma.aIBrand.findFirst({
      where: {
        id: brandId,
        userId: user.id
      }
    })

    if (!existingBrand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    // Update brand
    const updatedBrand = await prisma.aIBrand.update({
      where: { id: brandId },
      data: {
        brandName: body.brandName,
        alternateName: body.alternateName,
        domain: body.domain,
        industry: body.industry,
        description: body.description,
        logoUrl: body.logoUrl,
        isActive: body.isActive,
        trackingStatus: body.trackingStatus
      }
    })

    return NextResponse.json({
      success: true,
      brand: {
        id: updatedBrand.id,
        brandName: updatedBrand.brandName,
        domain: updatedBrand.domain,
        industry: updatedBrand.industry,
        updatedAt: updatedBrand.updatedAt.toISOString()
      }
    })
  } catch (error: any) {
    console.error('[AI Brand Update API] Error:', error)
    return NextResponse.json(
      { error: "Failed to update brand", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/ai-brands/[brandId] - Delete brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { brandId } = params

    // Verify brand belongs to user
    const existingBrand = await prisma.aIBrand.findFirst({
      where: {
        id: brandId,
        userId: user.id
      }
    })

    if (!existingBrand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    // Delete brand (cascading deletes will handle related records)
    await prisma.aIBrand.delete({
      where: { id: brandId }
    })

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully"
    })
  } catch (error: any) {
    console.error('[AI Brand Delete API] Error:', error)
    return NextResponse.json(
      { error: "Failed to delete brand", details: error.message },
      { status: 500 }
    )
  }
}
