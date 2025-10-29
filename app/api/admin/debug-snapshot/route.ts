import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new Response('unauth', { status: 401 });

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email }, 
    select: { id: true, email: true, name: true, emailVerified: true } 
  });
  if (!user) return new Response('no user', { status: 404 });

  // Pull just what we need; NO secrets
  const accounts = await prisma.account.findMany({
    where: { userId: user.id, provider: 'google' },
    select: { 
      id: true, 
      providerAccountId: true, 
      scope: true, 
      expires_at: true,
      type: true,
      provider: true
    },
  });

  // If using google_tokens table (with raw query for safety)
  let tokens: any[] = [];
  try {
    tokens = await prisma.$queryRawUnsafe(
      `SELECT id, google_sub, email, scope, expires_at, created_at, updated_at
       FROM google_tokens 
       WHERE "userId" = $1 
       ORDER BY google_sub`,
      user.id
    );
  } catch (e) {
    // Table might not exist yet
    
  }

  // Get recent logs if Log table exists
  let recentLogs: any[] = [];
  try {
    recentLogs = await prisma.log.findMany({
      where: { 
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60) // Last hour
        }
      },
      select: {
        id: true,
        createdAt: true,
        level: true,
        source: true,
        message: true,
        requestId: true,
        accountId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  } catch (e) {
    
  }

  // Get NextAuth sessions
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      sessionToken: false, // Don't expose token
      expires: true
    }
  });

  // System info
  const systemInfo = {
    nodeVersion: process.version,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  };

  const payload = { 
    timestamp: new Date().toISOString(),
    user,
    accounts,
    googleTokens: tokens,
    recentLogs,
    sessions,
    systemInfo,
    counts: {
      accounts: accounts.length,
      googleTokens: tokens.length,
      logs: recentLogs.length,
      sessions: sessions.length
    }
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { 
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'content-disposition': `attachment; filename="debug-snapshot-${Date.now()}.json"`
    }
  });
}