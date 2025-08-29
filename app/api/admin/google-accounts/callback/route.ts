import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

async function exchange(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/admin/google-accounts/callback`,
    grant_type: 'authorization_code',
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? 'token_exchange_failed');
  return j as { access_token: string; refresh_token?: string; expires_in: number; id_token?: string };
}

async function userInfo(accessToken: string) {
  const r = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const j = await r.json();
  if (!r.ok) throw new Error('userinfo_failed');
  // { sub, email, name, picture, ... }
  return j as { sub: string; email?: string; name?: string; picture?: string };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) return NextResponse.redirect('/admin/google-accounts?error=no_code');

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect('/api/auth/signin');

  // Resolve current app user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.redirect('/admin/google-accounts?error=user_not_found');

  try {
    const tok = await exchange(code);
    const ui = await userInfo(tok.access_token);

    const expiresAt = Math.floor(Date.now() / 1000) + (tok.expires_in ?? 0);

    // Upsert by (userId, google_sub) so the same Google account cannot duplicate
    await prisma.googleTokens.upsert({
      where: {
        userId_google_sub: { userId: user.id, google_sub: ui.sub } // ✅ the Prisma compound unique key
      },
      update: {
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? undefined,
        expires_at: BigInt(expiresAt),
        scope: 'openid email profile analytics.readonly webmasters.readonly',
        email: ui.email ?? null,
      },
      create: {
        userId: user.id,
        google_sub: ui.sub,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at: BigInt(expiresAt),
        scope: 'openid email profile analytics.readonly webmasters.readonly',
        email: ui.email ?? null,
      }
    });

    return NextResponse.redirect('/admin/google-accounts?connected=1');
  } catch (e: any) {
    return NextResponse.redirect(`/admin/google-accounts?error=${encodeURIComponent(String(e?.message ?? e))}`);
  }
}