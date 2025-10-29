import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

const prisma = getPrisma();

// DELETE - Remove a keyword
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; keywordId: string } }
) {
  try {
    // Delete the keyword and its performance history (cascade)
    await prisma.keyword.delete({
      where: {
        id: params.keywordId,
        clientReportId: params.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Keyword deleted successfully'
    });
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}

// PATCH - Update keyword status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; keywordId: string } }
) {
  try {
    const body = await request.json();
    const { trackingStatus } = body;

    if (!trackingStatus || !['active', 'paused'].includes(trackingStatus)) {
      return NextResponse.json(
        { error: 'Invalid tracking status' },
        { status: 400 }
      );
    }

    const updatedKeyword = await prisma.keyword.update({
      where: {
        id: params.keywordId,
        clientReportId: params.id
      },
      data: {
        trackingStatus
      }
    });

    return NextResponse.json({
      success: true,
      keyword: updatedKeyword
    });
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to update keyword' },
      { status: 500 }
    );
  }
}