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

// POST /api/admin/ai-brands/[brandId]/test - Trigger visibility test
export async function POST(
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
    const brand = await prisma.aIBrand.findFirst({
      where: {
        id: brandId,
        userId: user.id
      },
      include: {
        keywords: {
          where: {
            isActive: true
          }
        }
      }
    })

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    // Check if brand has keywords
    if (brand.keywords.length === 0) {
      return NextResponse.json(
        { error: "No active keywords found. Please add keywords first." },
        { status: 400 }
      )
    }

    // TODO: Implement actual visibility testing engine
    // For now, create mock data to demonstrate the dashboard functionality

    // Create mock mentions for demonstration
    const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity', 'google_ai']
    const currentDate = new Date()

    // Create a few mock mentions for each platform
    for (const platform of platforms) {
      const mentionCount = Math.floor(Math.random() * 3) + 1 // 1-3 mentions per platform

      for (let i = 0; i < mentionCount; i++) {
        const keyword = brand.keywords[Math.floor(Math.random() * brand.keywords.length)]
        const isMentioned = Math.random() > 0.3 // 70% chance of being mentioned
        const sentiment = Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative'
        const sentimentScore = sentiment === 'positive' ? Math.floor(Math.random() * 30) + 70 :
                               sentiment === 'neutral' ? Math.floor(Math.random() * 40) + 40 :
                               Math.floor(Math.random() * 40) + 10

        await prisma.aIBrandMention.create({
          data: {
            brandId: brand.id,
            keywordId: keyword.id,
            platform: platform,
            prompt: keyword.prompt,
            response: `Mock AI response mentioning ${brand.brandName}...`,
            brandMentioned: isMentioned,
            position: isMentioned ? Math.floor(Math.random() * 5) + 1 : null,
            isCited: isMentioned && Math.random() > 0.5,
            citationUrl: isMentioned && Math.random() > 0.5 ? brand.domain : null,
            sentiment: sentiment,
            sentimentScore: sentimentScore,
            testedAt: currentDate
          }
        })
      }
    }

    // Calculate and store scores
    const mentions = await prisma.aIBrandMention.findMany({
      where: {
        brandId: brand.id,
        testedAt: {
          gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    // Calculate overall metrics
    const totalTests = mentions.length
    const totalMentions = mentions.filter(m => m.brandMentioned).length
    const citedMentions = mentions.filter(m => m.isCited).length
    const visibilityRate = totalTests > 0 ? (totalMentions / totalTests) * 100 : 0
    const citationRate = totalMentions > 0 ? (citedMentions / totalMentions) * 100 : 0

    const mentionedWithPosition = mentions.filter(m => m.brandMentioned && m.position !== null)
    const avgPosition = mentionedWithPosition.length > 0
      ? mentionedWithPosition.reduce((sum, m) => sum + (m.position || 0), 0) / mentionedWithPosition.length
      : 0

    const avgSentiment = mentions.length > 0
      ? mentions.reduce((sum, m) => sum + m.sentimentScore, 0) / mentions.length
      : 50

    // Calculate overall score (weighted average)
    const overallScore = (
      visibilityRate * 0.35 +
      (avgPosition > 0 ? (6 - avgPosition) * 20 : 0) * 0.25 +
      citationRate * 0.20 +
      avgSentiment * 0.20
    )

    // Create overall score record
    await prisma.aIBrandScore.upsert({
      where: {
        brandId_platform_period_date: {
          brandId: brand.id,
          platform: 'overall',
          period: 'daily',
          date: new Date(currentDate.toISOString().split('T')[0])
        }
      },
      update: {
        overallScore: overallScore,
        visibilityRate: visibilityRate,
        avgPosition: avgPosition,
        citationRate: citationRate,
        shareOfVoice: 0, // TODO: Calculate when we have competitor data
        sentimentScore: avgSentiment,
        totalTests: totalTests,
        totalMentions: totalMentions,
        citedMentions: citedMentions,
        updatedAt: currentDate
      },
      create: {
        brandId: brand.id,
        platform: 'overall',
        period: 'daily',
        date: new Date(currentDate.toISOString().split('T')[0]),
        overallScore: overallScore,
        visibilityRate: visibilityRate,
        avgPosition: avgPosition,
        citationRate: citationRate,
        shareOfVoice: 0,
        sentimentScore: avgSentiment,
        totalTests: totalTests,
        totalMentions: totalMentions,
        citedMentions: citedMentions
      }
    })

    // Create platform-specific scores
    for (const platform of platforms) {
      const platformMentions = mentions.filter(m => m.platform === platform)
      const platformTests = platformMentions.length
      const platformMentionCount = platformMentions.filter(m => m.brandMentioned).length
      const platformCitations = platformMentions.filter(m => m.isCited).length

      const platformVisibility = platformTests > 0 ? (platformMentionCount / platformTests) * 100 : 0
      const platformCitationRate = platformMentionCount > 0 ? (platformCitations / platformMentionCount) * 100 : 0

      const platformMentionedWithPos = platformMentions.filter(m => m.brandMentioned && m.position !== null)
      const platformAvgPos = platformMentionedWithPos.length > 0
        ? platformMentionedWithPos.reduce((sum, m) => sum + (m.position || 0), 0) / platformMentionedWithPos.length
        : 0

      const platformSentiment = platformMentions.length > 0
        ? platformMentions.reduce((sum, m) => sum + m.sentimentScore, 0) / platformMentions.length
        : 50

      const platformScore = (
        platformVisibility * 0.35 +
        (platformAvgPos > 0 ? (6 - platformAvgPos) * 20 : 0) * 0.25 +
        platformCitationRate * 0.20 +
        platformSentiment * 0.20
      )

      if (platformTests > 0) {
        await prisma.aIBrandScore.upsert({
          where: {
            brandId_platform_period_date: {
              brandId: brand.id,
              platform: platform,
              period: 'daily',
              date: new Date(currentDate.toISOString().split('T')[0])
            }
          },
          update: {
            overallScore: platformScore,
            visibilityRate: platformVisibility,
            avgPosition: platformAvgPos,
            citationRate: platformCitationRate,
            shareOfVoice: 0,
            sentimentScore: platformSentiment,
            totalTests: platformTests,
            totalMentions: platformMentionCount,
            citedMentions: platformCitations,
            updatedAt: currentDate
          },
          create: {
            brandId: brand.id,
            platform: platform,
            period: 'daily',
            date: new Date(currentDate.toISOString().split('T')[0]),
            overallScore: platformScore,
            visibilityRate: platformVisibility,
            avgPosition: platformAvgPos,
            citationRate: platformCitationRate,
            shareOfVoice: 0,
            sentimentScore: platformSentiment,
            totalTests: platformTests,
            totalMentions: platformMentionCount,
            citedMentions: platformCitations
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Visibility test completed",
      results: {
        totalTests: totalTests,
        totalMentions: totalMentions,
        visibilityRate: visibilityRate,
        overallScore: overallScore
      }
    })
  } catch (error: any) {
    console.error('[AI Brand Test API] Error:', error)
    return NextResponse.json(
      { error: "Failed to run visibility test", details: error.message },
      { status: 500 }
    )
  }
}
