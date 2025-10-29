import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getValidGoogleToken } from '@/lib/google/refresh-token';

export const dynamic = 'force-dynamic';
type GscSite = { siteUrl: string; permissionLevel?: string };
type Ga4AccountSummary = { account: string; propertySummaries?: { property: string; displayName?: string }[] };
type Ga4Property = { propertyId: string; displayName: string; account: string };

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const accountId = params.id;
    
    // Get a valid access token (will refresh if needed)
    const accessToken = await getValidGoogleToken(accountId);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No valid access token available' },
        { status: 401 }
      );
    }

    // GSC - Search Console
    let gsc: GscSite[] = [];
    const gscResp = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
    });
    if (gscResp.ok) {
      const gscData = await gscResp.json();
      gsc = gscData.siteEntry ?? [];
      
    } else {
      
    }

    // GA4 - Analytics
    let ga4: Ga4Property[] = [];
    const gaResp = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
    });
    if (gaResp.ok) {
      const j = (await gaResp.json()) as { accountSummaries?: Ga4AccountSummary[] };
      ga4 = j.accountSummaries?.flatMap(as =>
        (as.propertySummaries ?? []).map(ps => ({
          propertyId: ps.property, 
          displayName: ps.displayName ?? '', 
          account: as.account
        }))
      ) ?? [];
      
    } else {
      
    }

    return NextResponse.json({ 
      ok: true, 
      gsc, 
      ga4,
      properties: {
        searchConsole: gsc,
        analytics: ga4
      }
    });
  } catch (e: any) {
    
    const msg = String(e?.message ?? e);
    const status = msg.includes('not found') ? 404
                : msg.includes('no_refresh_token') ? 409
                : msg.includes('refresh_failed') ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}