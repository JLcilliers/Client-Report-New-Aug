import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db/prisma"
import { runVisibilityTests, calculatePlatformScores } from "@/lib/services/ai-testing"

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

// POST /api/admin/ai-brands/[brandId]/test - Trigger REAL visibility test
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

    // Verify brand belongs to user and fetch all necessary data
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
        },
        competitors: true
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

    // Determine which platforms to test
    // For now, test all available platforms
    const platforms = ['chatgpt', 'claude', 'perplexity', 'gemini']

    // Run REAL AI visibility tests
    const testResults = await runVisibilityTests({
      brandId: brand.id,
      brandName: brand.brandName,
      alternateNames: brand.alternateName,
      domain: brand.domain,
      keywords: brand.keywords.map(k => ({
        id: k.id,
        prompt: k.prompt,
        category: k.category
      })),
      competitors: brand.competitors.map(c => ({
        id: c.id,
        competitorName: c.competitorName,
        domain: c.domain
      })),
      platforms
    })

    const currentDate = new Date()

    // Store mention records in database
    for (const result of testResults.results) {
      await prisma.aIBrandMention.create({
        data: {
          brandId: brand.id,
          keywordId: brand.keywords.find(k => k.prompt === result.prompt)?.id,
          platform: result.platform,
          prompt: result.prompt,
          response: result.response,
          brandMentioned: result.brandMentioned,
          position: result.position,
          isCited: result.cited,
          citationUrl: result.citationUrls.length > 0 ? result.citationUrls[0] : null,
          sentiment: result.sentiment,
          sentimentScore: result.sentimentScore,
          context: result.snippet,
          competitorsFound: result.competitorsMentioned,
          testDuration: result.testDuration,
          modelVersion: result.modelVersion,
          testedAt: currentDate
        }
      })
    }

    // Calculate and store overall score
    const overallScore = testResults.summary.averageVisibilityScore
    const visibilityRate = testResults.summary.totalTests > 0
      ? (testResults.summary.totalMentions / testResults.summary.totalTests) * 100
      : 0
    const avgPosition = testResults.summary.averagePosition
    const citationRate = testResults.summary.citationRate
    const avgSentiment = testResults.summary.averageSentiment

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
        totalTests: testResults.summary.totalTests,
        totalMentions: testResults.summary.totalMentions,
        citedMentions: Math.round((citationRate / 100) * testResults.summary.totalMentions),
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
        totalTests: testResults.summary.totalTests,
        totalMentions: testResults.summary.totalMentions,
        citedMentions: Math.round((citationRate / 100) * testResults.summary.totalMentions)
      }
    })

    // Calculate and store platform-specific scores
    const platformScores = calculatePlatformScores(testResults.results)

    for (const platformScore of platformScores) {
      await prisma.aIBrandScore.upsert({
        where: {
          brandId_platform_period_date: {
            brandId: brand.id,
            platform: platformScore.platform,
            period: 'daily',
            date: new Date(currentDate.toISOString().split('T')[0])
          }
        },
        update: {
          overallScore: platformScore.overallScore,
          visibilityRate: platformScore.visibilityRate,
          avgPosition: platformScore.avgPosition,
          citationRate: platformScore.citationRate,
          shareOfVoice: 0,
          sentimentScore: platformScore.sentimentScore,
          totalTests: platformScore.totalTests,
          totalMentions: platformScore.totalMentions,
          citedMentions: platformScore.citedMentions,
          updatedAt: currentDate
        },
        create: {
          brandId: brand.id,
          platform: platformScore.platform,
          period: 'daily',
          date: new Date(currentDate.toISOString().split('T')[0]),
          overallScore: platformScore.overallScore,
          visibilityRate: platformScore.visibilityRate,
          avgPosition: platformScore.avgPosition,
          citationRate: platformScore.citationRate,
          shareOfVoice: 0,
          sentimentScore: platformScore.sentimentScore,
          totalTests: platformScore.totalTests,
          totalMentions: platformScore.totalMentions,
          citedMentions: platformScore.citedMentions
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Visibility test completed",
      results: {
        totalTests: testResults.summary.totalTests,
        totalMentions: testResults.summary.totalMentions,
        visibilityRate: visibilityRate,
        overallScore: overallScore,
        platformResults: platformScores.map(ps => ({
          platform: ps.platform,
          score: ps.overallScore,
          mentions: ps.totalMentions
        }))
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to run visibility test", details: error.message },
      { status: 500 }
    )
  }
}
