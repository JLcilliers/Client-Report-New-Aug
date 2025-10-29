// app/api/auth/test-db/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const accountCount = await prisma.account.count();
    
    // Try to find any existing Google accounts
    const googleAccounts = await prisma.account.findMany({
      where: {
        provider: 'google'
      },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        userId: true,
        type: true
      }
    });
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      counts: {
        users: userCount,
        sessions: sessionCount,
        accounts: accountCount
      },
      googleAccounts: googleAccounts.length,
      sample: googleAccounts.slice(0, 2) // Show first 2 accounts if any
    });
  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}