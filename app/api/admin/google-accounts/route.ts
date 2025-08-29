import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  google_sub: string;
  email: string | null;
  scope: string | null;
  expires_at: bigint | number | null; // BIGINT in DB → BigInt in JS
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    // Resolve current app user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

    // Get all Google providerAccountIds for THIS app user from NextAuth Account table
    const accounts = await prisma.account.findMany({
      where: { provider: 'google', userId: user.id },
      select: { providerAccountId: true },
    });
    const subs = accounts.map(a => a.providerAccountId);

    // If no Google accounts linked via NextAuth yet, short-circuit
    if (subs.length === 0) {
      return NextResponse.json({ ok: true, items: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Fetch rows directly from google_tokens via a raw query
    // (works even if you haven't declared a Prisma model for google_tokens yet)
    const items: Row[] = await prisma.$queryRawUnsafe(
      `SELECT id, google_sub, email, scope, expires_at
         FROM google_tokens
        WHERE google_sub = ANY($1::text[])
        ORDER BY email NULLS LAST, google_sub`,
      subs
    );

    // Normalise expires for the client (number in seconds + readable)
    const now = Math.floor(Date.now() / 1000);
    const serialised = items.map(r => {
      const expSec = r.expires_at == null ? null : Number(r.expires_at);
      return {
        id: r.id,
        googleSub: r.google_sub,
        email: r.email,
        scope: r.scope,
        expiresAt: expSec,                    // epoch seconds (or null)
        expiresInSec: expSec ? Math.max(0, expSec - now) : null,
      };
    });

    return NextResponse.json(
      { ok: true, items: serialised },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    // Surface the precise reason to the frontend so we can see what's wrong
    const message = e?.message ?? String(e);
    const code = e?.code ?? null;
    return NextResponse.json({ error: 'internal', code, message }, { status: 500 });
  }
}