import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

type GscSite = { siteUrl: string; permissionLevel?: string };
type Ga4AccountSummary = {
  account: string;
  displayName?: string;
  propertySummaries?: { property: string; displayName?: string }[];
};
type Ga4Property = { propertyId: string; displayName: string; account: string };

export async function GET() {
  const session = await getServerSession(authOptions);
  const g = (session as any)?.google;

  if (!g?.access_token) {
    return new Response(JSON.stringify({ error: 'no_google_token' }), { status: 401 });
  }

  let searchConsoleProperties: GscSite[] = [];
  let analyticsProperties: Ga4Property[] = [];

  // ---- Search Console sites
  try {
    const gscResp = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${g.access_token}` },
      // next: { revalidate: 0 } // optional
    });
    if (gscResp.ok) {
      const gscJson = (await gscResp.json()) as { siteEntry?: GscSite[] };
      searchConsoleProperties = gscJson.siteEntry ?? [];
    } else if (gscResp.status === 401) {
      return new Response(JSON.stringify({ error: 'google_unauthorised_gsc' }), { status: 401 });
    }
  } catch {
    // keep empty
  }

  // ---- GA4 properties via Admin API
  try {
    const gaResp = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { Authorization: `Bearer ${g.access_token}` },
      // next: { revalidate: 0 } // optional
    });
    if (gaResp.ok) {
      const gaJson = (await gaResp.json()) as { accountSummaries?: Ga4AccountSummary[] };
      analyticsProperties =
        gaJson.accountSummaries?.flatMap(as =>
          (as.propertySummaries ?? []).map(ps => ({
            propertyId: ps.property,
            displayName: ps.displayName ?? '',
            account: as.account
          }))
        ) ?? [];
    } else if (gaResp.status === 401) {
      return new Response(JSON.stringify({ error: 'google_unauthorised_ga4' }), { status: 401 });
    }
  } catch {
    // keep empty
  }

  return new Response(
    JSON.stringify({ ok: true, gsc: searchConsoleProperties, ga4: analyticsProperties }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}