import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getAccessTokenForAccount } from '@/lib/google-tokens';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

type GscSite = { siteUrl: string; permissionLevel?: string };
type Ga4AccountSummary = { account: string; propertySummaries?: { property: string; displayName?: string }[] };
type Ga4Property = { propertyId: string; displayName: string; account: string };

export async function GET(_req: Request, { params }: { params: { accountId: string } }) {
  const requestId = crypto.randomUUID();
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  log.info({ source: 'api/google/properties/[accountId]#GET', requestId,
             userId: user.id, accountId: params.accountId, message: 'Properties requested' });

  try {
    const token = await getAccessTokenForAccount(params.accountId, user.id);

    // GSC
    let gsc: GscSite[] = [];
    const r1 = await fetch('https://www.googleapis.com/webmasters/v3/sites', { headers: { Authorization: `Bearer ${token}` } });
    if (r1.ok) gsc = (await r1.json()).siteEntry ?? [];

    // GA4
    let ga4: Ga4Property[] = [];
    const r2 = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', { headers: { Authorization: `Bearer ${token}` } });
    if (r2.ok) {
      const j = (await r2.json()) as { accountSummaries?: Ga4AccountSummary[] };
      ga4 = j.accountSummaries?.flatMap(as => (as.propertySummaries ?? []).map(ps => ({
        propertyId: ps.property, displayName: ps.displayName ?? '', account: as.account,
      }))) ?? [];
    }

    log.info({ source: 'api/google/properties/[accountId]#GET', requestId,
               userId: user.id, accountId: params.accountId, message: 'Properties fetched', 
               meta: { gscCount: gsc.length, ga4Count: ga4.length } });

    return NextResponse.json({ ok: true, gsc, ga4 });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    const status = msg.startsWith('account_not_found') ? 404 :
                   msg.startsWith('no_refresh_token')   ? 409 :
                   msg.startsWith('refresh_failed')     ? 401 : 500;
    
    log.error({ source: 'api/google/properties/[accountId]#GET', requestId,
                userId: user.id, accountId: params.accountId, message: msg, meta: { stack: e.stack } });

    return NextResponse.json({ error: msg }, { status });
  }
}