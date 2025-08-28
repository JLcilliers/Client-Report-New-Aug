import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getAccessTokenForAccount } from '@/lib/google-tokens';

type GscSite = { siteUrl: string; permissionLevel?: string };
type Ga4AccountSummary = {
  account: string;
  displayName?: string;
  propertySummaries?: { property: string; displayName?: string }[];
};
type Ga4Property = { propertyId: string; displayName: string; account: string };

export async function GET(
  _req: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

    // Get a fresh bearer for THIS connection
    const accessToken = await getAccessTokenForAccount(params.accountId, user.id);

    // GSC
    let gsc: GscSite[] = [];
    try {
      const r = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (r.ok) {
        const j = (await r.json()) as { siteEntry?: GscSite[] };
        gsc = j.siteEntry ?? [];
      } else if (r.status === 401) {
        return NextResponse.json({ error: 'google_unauthorised_gsc' }, { status: 401 });
      }
    } catch {}

    // GA4 Admin
    let ga4: Ga4Property[] = [];
    try {
      const r = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (r.ok) {
        const j = (await r.json()) as { accountSummaries?: Ga4AccountSummary[] };
        ga4 =
          j.accountSummaries?.flatMap((as) =>
            (as.propertySummaries ?? []).map((ps) => ({
              propertyId: ps.property,
              displayName: ps.displayName ?? '',
              account: as.account,
            })),
          ) ?? [];
      } else if (r.status === 401) {
        return NextResponse.json({ error: 'google_unauthorised_ga4' }, { status: 401 });
      }
    } catch {}

    return NextResponse.json({ ok: true, gsc, ga4 });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    // Bubble specific linking errors so the UI can guide the user
    if (msg.startsWith('account_not_found')) return NextResponse.json({ error: 'account_not_found' }, { status: 404 });
    if (msg.startsWith('no_refresh_token')) return NextResponse.json({ error: 'no_refresh_token' }, { status: 409 });
    if (msg.startsWith('refresh_failed')) return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: 'unknown', details: msg }, { status: 500 });
  }
}