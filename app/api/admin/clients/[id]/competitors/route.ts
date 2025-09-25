import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db/prisma'

const prisma = getPrisma()

// GET - Fetch competitors for a client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const competitors = await prisma.competitor.findMany({
      where: {
        clientReportId: params.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(competitors)
  } catch (error) {
    console.error('Error fetching competitors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    )
  }
}

// POST - Add a new competitor
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, domain } = body

    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      )
    }

    // Check if competitor already exists
    const existingCompetitor = await prisma.competitor.findFirst({
      where: {
        clientReportId: params.id,
        domain: domain.toLowerCase().trim()
      }
    })

    if (existingCompetitor) {
      return NextResponse.json(
        { error: 'This competitor already exists' },
        { status: 400 }
      )
    }

    // Create new competitor
    const competitor = await prisma.competitor.create({
      data: {
        name: name.trim(),
        domain: domain.toLowerCase().trim(),
        clientReportId: params.id
      }
    })

    return NextResponse.json(competitor)
  } catch (error) {
    console.error('Error creating competitor:', error)
    return NextResponse.json(
      { error: 'Failed to create competitor' },
      { status: 500 }
    )
  }
}

