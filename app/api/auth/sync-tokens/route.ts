// app/api/auth/sync-tokens/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find Google accounts in the Account table
    const googleAccounts = await prisma.account.findMany({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });

    if (googleAccounts.length === 0) {
      return NextResponse.json({ message: 'No Google accounts found' });
    }

    // Sync each account to GoogleTokens table
    for (const account of googleAccounts) {
      await prisma.googleTokens.upsert({
        where: {
          userId_google_sub: {
            userId: session.user.id,
            google_sub: account.providerAccountId
          }
        },
        update: {
          email: session.user.email || undefined,
          access_token: account.access_token || undefined,
          refresh_token: account.refresh_token || undefined,
          expires_at: account.expires_at ? BigInt(account.expires_at) : undefined,
          scope: account.scope || undefined
        },
        create: {
          userId: session.user.id,
          google_sub: account.providerAccountId,
          email: session.user.email || undefined,
          access_token: account.access_token || undefined,
          refresh_token: account.refresh_token || undefined,
          expires_at: account.expires_at ? BigInt(account.expires_at) : undefined,
          scope: account.scope || undefined
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${googleAccounts.length} Google account(s) to GoogleTokens table` 
    });
  } catch (error) {
    console.error('Token sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}