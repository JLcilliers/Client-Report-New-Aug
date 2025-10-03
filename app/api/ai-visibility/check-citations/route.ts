import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db/prisma'
import { perplexityService } from '@/lib/services/perplexity'

const prisma = getPrisma()

/**
 * POST /api/ai-visibility/check-citations
 * Check AI citations for a client's keywords
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientReportId } = body

    if (!clientReportId) {
      return NextResponse.json(
        { error: 'clientReportId is required' },
        { status: 400 }
      )
    }

    // Get the client report
    const report = await prisma.clientReport.findUnique({
      where: { id: clientReportId },
      include: {
        keywords: {
          where: { trackingStatus: 'active' },
          take: 10 // Limit to 10 keywords to avoid excessive API calls
        }
      }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Client report not found' },
        { status: 404 }
      )
    }

    if (report.keywords.length === 0) {
      return NextResponse.json(
        { error: 'No active keywords found for this client' },
        { status: 400 }
      )
    }

    // Extract brand name and domain from report
    const brandName = report.clientName
    const domain = report.searchConsolePropertyId
      ?.replace('sc-domain:', '')
      ?.replace('https://', '')
      ?.replace('http://', '') || ''

    if (!domain) {
      return NextResponse.json(
        { error: 'No domain found for this client' },
        { status: 400 }
      )
    }

    // Get or create AI Visibility Profile
    let aiProfile = await prisma.aIVisibilityProfile.findUnique({
      where: { clientReportId }
    })

    if (!aiProfile) {
      aiProfile = await prisma.aIVisibilityProfile.create({
        data: {
          clientReportId,
          overallScore: 0,
          sentimentScore: 0,
          shareOfVoice: 0,
          citationCount: 0,
          accuracyScore: 0
        }
      })
    }

    // Check citations for each keyword
    const keywords = report.keywords.map(k => k.keyword)
    console.log(`Checking citations for ${keywords.length} keywords...`)

    const citationResults = await perplexityService.checkMultipleCitations(
      keywords,
      brandName,
      domain
    )

    // Store citations in database
    let totalCitations = 0
    let totalMentions = 0
    let sentimentScores = { positive: 0, neutral: 0, negative: 0 }

    for (const result of citationResults) {
      // Create citation record
      await prisma.aICitation.create({
        data: {
          profileId: aiProfile.id,
          platform: 'perplexity',
          query: result.query,
          responseText: result.responseText,
          citationPosition: result.citationPosition || 0,
          citationContext: result.context || '',
          url: result.citedUrl,
          sentiment: result.sentiment,
          accuracy: 'unknown' // Would need manual review or additional logic
        }
      })

      if (result.citedUrl) totalCitations++
      if (result.brandMentioned) totalMentions++

      // Count sentiment
      sentimentScores[result.sentiment]++
    }

    // Calculate overall sentiment score (0-100)
    const totalChecks = citationResults.length
    const sentimentScore = totalChecks > 0
      ? Math.round(
          ((sentimentScores.positive * 100) + (sentimentScores.neutral * 50)) / totalChecks
        )
      : 50

    // Calculate share of voice (percentage of queries where brand appears)
    const shareOfVoice = totalChecks > 0
      ? Math.round(((totalMentions + totalCitations) / totalChecks) * 100)
      : 0

    // Update AI Visibility Profile
    await prisma.aIVisibilityProfile.update({
      where: { id: aiProfile.id },
      data: {
        citationCount: totalCitations,
        sentimentScore,
        shareOfVoice,
        overallScore: Math.round((shareOfVoice + sentimentScore) / 2),
        lastUpdated: new Date()
      }
    })

    // Update platform metrics for Perplexity
    await prisma.aIPlatformMetric.upsert({
      where: {
        profileId_platform: {
          profileId: aiProfile.id,
          platform: 'perplexity'
        }
      },
      create: {
        profileId: aiProfile.id,
        platform: 'perplexity',
        visibilityScore: shareOfVoice,
        citationCount: totalCitations,
        sentimentScore,
        prominenceScore: totalCitations > 0 ? 100 / (totalCitations * 10) : 0
      },
      update: {
        visibilityScore: shareOfVoice,
        citationCount: totalCitations,
        sentimentScore,
        prominenceScore: totalCitations > 0 ? 100 / (totalCitations * 10) : 0,
        lastChecked: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Citations checked successfully',
      summary: {
        keywordsChecked: totalChecks,
        citationsFound: totalCitations,
        mentionsFound: totalMentions,
        shareOfVoice,
        sentimentScore,
        overallScore: Math.round((shareOfVoice + sentimentScore) / 2),
        sentiment: sentimentScores
      },
      details: citationResults
    })

  } catch (error: any) {
    console.error('Error checking citations:', error)
    return NextResponse.json(
      {
        error: 'Failed to check citations',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai-visibility/check-citations?clientReportId=xxx
 * Get AI citation data for a client
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientReportId = searchParams.get('clientReportId')

    if (!clientReportId) {
      return NextResponse.json(
        { error: 'clientReportId is required' },
        { status: 400 }
      )
    }

    // Get AI Visibility Profile with all related data
    const aiProfile = await prisma.aIVisibilityProfile.findUnique({
      where: { clientReportId },
      include: {
        platformMetrics: {
          orderBy: { lastChecked: 'desc' }
        },
        citations: {
          orderBy: { timestamp: 'desc' },
          take: 50 // Latest 50 citations
        },
        queries: {
          orderBy: { updatedAt: 'desc' }
        },
        recommendations: {
          where: { status: { not: 'completed' } },
          orderBy: { priority: 'asc' }
        }
      }
    })

    if (!aiProfile) {
      return NextResponse.json(
        { error: 'No AI visibility data found for this client' },
        { status: 404 }
      )
    }

    return NextResponse.json(aiProfile)

  } catch (error: any) {
    console.error('Error fetching AI visibility data:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch AI visibility data',
        details: error.message
      },
      { status: 500 }
    )
  }
}
