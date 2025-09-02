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

    // Use the refresh token utility we created
    const result = await refreshGoogleToken(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to refresh token - no valid refresh token or refresh failed' },
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