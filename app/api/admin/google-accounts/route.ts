import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all Google accounts from the GoogleTokens table
    const accounts = await prisma.googleTokens.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    // Transform the data to match the expected format for the frontend
    const transformedAccounts = accounts.map(account => ({
      id: account.id,
      account_email: account.email || 'Unknown', // Use the email from GoogleTokens
      account_name: account.user?.name || account.email || 'Unknown',
      is_active: account.expires_at ? Number(account.expires_at) > Math.floor(Date.now() / 1000) : true,
      created_at: account.created_at.toISOString(),
      updated_at: account.updated_at.toISOString(),
      token_expiry: account.expires_at ? new Date(Number(account.expires_at) * 1000).toISOString() : null,
      refresh_token: account.refresh_token,
      access_token: account.access_token,
      // Add placeholder data for properties (these can be fetched separately)
      search_console_properties: [],
      analytics_properties: []
    }));

    return NextResponse.json(
      { 
        success: true,
        accounts: transformedAccounts 
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Google accounts',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

export async function POST() {
  // This endpoint can be used to manually add a Google account
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}