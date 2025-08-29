import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

async function getBearer(tokenRowId: string, userId: string) {
  const row = await prisma.googleTokens.findFirst({
    where: { 
      OR: [
        { id: tokenRowId, userId },
        { id: tokenRowId, userId: null } // Support rows without userId for flexibility
      ]
    },
    select: { access_token: true, refresh_token: true, expires_at: true, scope: true, id: true }
  });
  if (!row) throw new Error('connector_not_found');

  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = row.expires_at != null ? Number(row.expires_at) : 0;
  
  if (row.access_token && expSec > nowSec + 60) {
    return row.access_token; // still valid
  }

  if (!row.refresh_token) throw new Error('no_refresh_token');

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: 'refresh_token',
    refresh_token: row.refresh_token,
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: body.toString()
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error(`refresh_failed:${j.error ?? r.status}`);

  const expiresAt = (j.expires_in ? Math.floor(Date.now() / 1000) + j.expires_in : null);
  await prisma.googleTokens.update({
    where: { id: tokenRowId },
    data: { access_token: j.access_token as string, expires_at: expiresAt ?? undefined, scope: j.scope ?? row.scope },
  });

  return j.access_token as string;
}

export const dynamic = 'force-dynamic';
type GscSite = { siteUrl: string; permissionLevel?: string };
type Ga4AccountSummary = { account: string; propertySummaries?: { property: string; displayName?: string }[] };
type Ga4Property = { propertyId: string; displayName: string; account: string };

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  try {
    const accessToken = await getBearer(params.id, user.id);

    // GSC
    let gsc: GscSite[] = [];
    const gscResp = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (gscResp.ok) gsc = (await gscResp.json()).siteEntry ?? [];

    // GA4
    let ga4: Ga4Property[] = [];
    const gaResp = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (gaResp.ok) {
      const j = (await gaResp.json()) as { accountSummaries?: Ga4AccountSummary[] };
      ga4 = j.accountSummaries?.flatMap(as =>
        (as.propertySummaries ?? []).map(ps => ({
          propertyId: ps.property, displayName: ps.displayName ?? '', account: as.account
        }))
      ) ?? [];
    }

    return NextResponse.json({ ok: true, gsc, ga4 });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    const status = msg.startsWith('connector_not_found') ? 404
                : msg.startsWith('no_refresh_token')     ? 409
                : msg.startsWith('refresh_failed')       ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}