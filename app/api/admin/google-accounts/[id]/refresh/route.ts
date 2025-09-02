import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OAuth2Client } from 'google-auth-library';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the Google account
    const account = await prisma.googleAccount.findUnique({
      where: { id }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Google account not found' },
        { status: 404 }
      );
    }

    if (!account.refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 400 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/auth/google/admin-callback`
    );

    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: account.refreshToken
    });

    try {
      // Get new access token
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update the account with new tokens
      await prisma.googleAccount.update({
        where: { id },
        data: {
          accessToken: credentials.access_token!,
          expiresAt: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ 
        success: true,
        message: 'Tokens refreshed successfully'
      });
    } catch (refreshError: any) {
      console.error('[Token Refresh] Error:', refreshError);
      return NextResponse.json(
        { 
          error: 'Failed to refresh tokens',
          details: refreshError.message 
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[Google Account Refresh] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh Google account',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}