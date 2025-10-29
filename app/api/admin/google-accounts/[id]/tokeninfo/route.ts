// app/api/admin/google-accounts/[id]/tokeninfo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
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
    const row = await prisma.googleTokens.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        google_sub: true,
        email: true,
        scope: true,
        expires_at: true,
        userId: true,
        created_at: true,  // <-- snake_case
        updated_at: true,  // <-- snake_case
        // (no access_token / refresh_token selected)
      },
    });

    if (!row) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Convert BigInt to number for calculations
    const expSec = row?.expires_at != null ? Number(row.expires_at) : null;
    
    const serialized = {
      ...row,
      expires_at: row.expires_at ? row.expires_at.toString() : null,
      expires_at_date: expSec 
        ? new Date(expSec * 1000).toISOString()
        : null,
      is_expired: expSec 
        ? expSec * 1000 < Date.now()
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
    
    Sentry.captureException(error);
    
    return NextResponse.json(
      { error: 'Failed to fetch token info' },
      { status: 500 }
    );
  }
}