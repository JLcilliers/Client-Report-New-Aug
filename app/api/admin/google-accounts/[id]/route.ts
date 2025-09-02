import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete the Google account
    await prisma.googleAccount.delete({
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