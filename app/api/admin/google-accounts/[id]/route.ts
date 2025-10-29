import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if the account exists in GoogleTokens table
    const account = await prisma.googleTokens.findFirst({
      where: { id }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Google account not found' },
        { status: 404 }
      );
    }

    // Delete the Google account from GoogleTokens table
    await prisma.googleTokens.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    
    return NextResponse.json(
      { 
        error: 'Failed to delete Google account',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}