// app/api/admin/google-accounts/[id]/tokeninfo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    Sentry.addBreadcrumb({
      message: 'tokeninfo_request',
      data: { id },
    });

    // Fetch the Google token record
    const token = await prisma.googleTokens.findUnique({
      where: { id },
      select: {
        id: true,
        google_sub: true,
        email: true,
        scope: true,
        expires_at: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude tokens for security
        access_token: false,
        refresh_token: false,
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const serialized = {
      ...token,
      expires_at: token.expires_at ? token.expires_at.toString() : null,
      expires_at_date: token.expires_at 
        ? new Date(Number(token.expires_at) * 1000).toISOString()
        : null,
      is_expired: token.expires_at 
        ? Number(token.expires_at) * 1000 < Date.now()
        : null,
    };

    return NextResponse.json({
      token: serialized,
      debug: {
        has_access_token: !!(await prisma.googleTokens.findUnique({
          where: { id },
          select: { access_token: true }
        }))?.access_token,
        has_refresh_token: !!(await prisma.googleTokens.findUnique({
          where: { id },
          select: { refresh_token: true }
        }))?.refresh_token,
      }
    });

  } catch (error) {
    console.error('Token info error:', error);
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'Failed to fetch token info' },
      { status: 500 }
    );
  }
}