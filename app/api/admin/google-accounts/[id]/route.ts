import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if the account exists and is a Google account
    const account = await prisma.account.findFirst({
      where: { 
        id,
        provider: 'google'
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Google account not found' },
        { status: 404 }
      );
    }

    // Delete the Google account from Account table
    await prisma.account.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Google Account Delete] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete Google account',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}