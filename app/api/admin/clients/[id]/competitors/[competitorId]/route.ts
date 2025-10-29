import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db/prisma'

const prisma = getPrisma()

// DELETE - Remove a specific competitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; competitorId: string } }
) {
  try {
    // Verify the competitor belongs to this client
    const competitor = await prisma.competitor.findFirst({
      where: {
        id: params.competitorId,
        clientReportId: params.id
      }
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    // Delete the competitor
    await prisma.competitor.delete({
      where: {
        id: params.competitorId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Competitor removed successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    )
  }
}