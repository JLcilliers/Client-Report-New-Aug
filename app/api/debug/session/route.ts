import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        user: {
          id: session.user?.id || 'N/A',
          email: session.user?.email || 'N/A',
          name: session.user?.name || 'N/A'
        },
        expires: session.expires
      } : null,
      message: session ? 'User is authenticated with NextAuth' : 'No NextAuth session found'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to check session',
      details: error.message
    }, { status: 500 });
  }
}