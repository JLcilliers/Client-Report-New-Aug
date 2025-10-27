import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// GET /api/admin/ai-brands - Fetch all AI brands with latest scores
export async function GET(request: NextRequest) {
  try {
    const brands = await prisma.aIBrand.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
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
          take: 1
        },
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
        }
      }
    })

    // Transform data to include latest score and counts
    const transformedBrands = brands.map(brand => ({
      id: brand.id,
      brandName: brand.brandName,
      domain: brand.domain,
      industry: brand.industry,
      trackingStatus: brand.trackingStatus,
      isActive: brand.isActive,
      createdAt: brand.createdAt.toISOString(),
      updatedAt: brand.updatedAt.toISOString(),
      keywordCount: brand.keywords.length,
      competitorCount: brand.competitors.length,
      latestScore: brand.scores[0] ? {
        overallScore: brand.scores[0].overallScore,
        visibilityRate: brand.scores[0].visibilityRate,
        shareOfVoice: brand.scores[0].shareOfVoice,
        sentimentScore: brand.scores[0].sentimentScore,
        scoreChange: brand.scores[0].scoreChange,
        totalMentions: brand.scores[0].totalMentions,
        citedMentions: brand.scores[0].citedMentions
      } : null
    }))

    return NextResponse.json({
      brands: transformedBrands,
      success: true
    })
  } catch (error: any) {
    console.error('[AI Brands API] Error:', error)
    return NextResponse.json(
      { error: "Failed to fetch AI brands" },
      { status: 500 }
    )
  }
}

// POST /api/admin/ai-brands - Create new AI brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      brandName,
      alternateNames = [],
      domain,
      industry,
      description,
      logoUrl,
      userId
    } = body

    // Validate required fields
    if (!brandName || !industry || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: brandName, industry, userId" },
        { status: 400 }
      )
    }

    // Create new AI brand
    const brand = await prisma.aIBrand.create({
      data: {
        brandName,
        alternateName: alternateNames,
        domain,
        industry,
        description,
        logoUrl,
        userId,
        trackingStatus: 'active',
        isActive: true
      },
      include: {
        keywords: true,
        competitors: true
      }
    })

    return NextResponse.json({
      success: true,
      brand: {
        id: brand.id,
        brandName: brand.brandName,
        domain: brand.domain,
        industry: brand.industry,
        createdAt: brand.createdAt.toISOString()
      }
    })
  } catch (error: any) {
    console.error('[AI Brands API] Create Error:', error)
    return NextResponse.json(
      { error: "Failed to create AI brand" },
      { status: 500 }
    )
  }
}
