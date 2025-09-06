import { NextRequest, NextResponse } from 'next/server';
import { refreshGoogleToken } from '@/lib/google/refresh-token';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('[Refresh Token] Refreshing token for account:', id);

    // First, check if the account exists and has a refresh token
    // Using GoogleTokens table instead of Account table
    const { prisma } = await import('@/lib/db/prisma');
    const account = await prisma.googleTokens.findUnique({
      where: { id },
      select: { 
        id: true, 
        refresh_token: true,
        access_token: true,
        expires_at: true,
        email: true
      }
    });

    if (!account) {
      console.error('[Refresh Token] Account not found:', id);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (!account.refresh_token) {
      console.error('[Refresh Token] No refresh token for account:', id);
      console.log('[Refresh Token] Account needs re-authentication');
      
      // Mark account as needing re-authentication
      await prisma.googleTokens.update({
        where: { id },
        data: { 
          expires_at: BigInt(Math.floor(Date.now() / 1000) - 1) // Mark as expired
        }
      });
      
      return NextResponse.json(
        { 
          error: 'No refresh token available',
          requiresReauth: true,
          message: 'This account needs to be re-authenticated. Please remove and re-add the account.'
        },
        { status: 400 }
      );
    }

    // Use the refresh token utility we created
    const result = await refreshGoogleToken(id);

    if (!result) {
      console.error('[Refresh Token] Token refresh failed for account:', id);
      return NextResponse.json(
        { 
          error: 'Failed to refresh token',
          requiresReauth: true,
          message: 'Token refresh failed. The account may need to be re-authenticated.'
        },
        { status: 400 }
      );
    }

    console.log('[Refresh Token] Token refreshed successfully');
    console.log('[Refresh Token] New expiry:', new Date(result.expires_at * 1000).toISOString());

    return NextResponse.json({ 
      success: true,
      message: 'Token refreshed successfully',
      expires_at: result.expires_at
    });

  } catch (error: any) {
    console.error('[Refresh Token] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh Google account token',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}