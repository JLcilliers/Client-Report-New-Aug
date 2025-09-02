import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all Google accounts from the Account table where provider is 'google'
    const accounts = await prisma.account.findMany({
      where: {
        provider: 'google'
      },
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
        expires_at: 'desc'
      }
    });

    // Transform the data to match the expected format for the frontend
    const transformedAccounts = accounts.map(account => ({
      id: account.id,
      account_email: account.providerAccountId, // This is the actual Google email
      account_name: account.user?.name || account.providerAccountId,
      is_active: account.expires_at ? account.expires_at > Math.floor(Date.now() / 1000) : true,
      created_at: new Date().toISOString(), // Account table doesn't have createdAt
      updated_at: new Date().toISOString(), // Account table doesn't have updatedAt
      token_expiry: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
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
    console.error('[Google Accounts API] Error:', error);
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