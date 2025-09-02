import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getValidGoogleToken } from '@/lib/google/refresh-token';

export const dynamic = 'force-dynamic';

type GscSite = { 
  siteUrl: string; 
  permissionLevel?: string 
};

type Ga4AccountSummary = {
  account: string;
  displayName?: string;
  propertySummaries?: { 
    property: string; 
    displayName?: string;
    parent?: string;
  }[];
};

type Ga4Property = { 
  propertyId: string; 
  displayName: string; 
  account: string 
};

export async function GET(request: NextRequest) {
  try {
    // Get accountId from query params or headers
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    
    if (!accountId) {
      // If no accountId provided, get all accounts and fetch properties for each
      const accounts = await prisma.account.findMany({
        where: { provider: 'google' },
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      });

      const allProperties = await Promise.all(
        accounts.map(async (account) => {
          const accessToken = await getValidGoogleToken(account.id);
          if (!accessToken) {
            return {
              accountId: account.id,
              accountEmail: account.providerAccountId,
              error: 'No valid token',
              searchConsole: [],
              analytics: []
            };
          }

          const { searchConsole, analytics } = await fetchPropertiesForToken(accessToken);
          return {
            accountId: account.id,
            accountEmail: account.providerAccountId,
            searchConsole,
            analytics
          };
        })
      );

      return NextResponse.json({
        success: true,
        accounts: allProperties
      });
    }

    // Fetch for specific account
    const accessToken = await getValidGoogleToken(accountId);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No valid access token available' },
        { status: 401 }
      );
    }

    const { searchConsole, analytics } = await fetchPropertiesForToken(accessToken);

    return NextResponse.json({
      success: true,
      properties: {
        searchConsole,
        analytics
      }
    });
    
  } catch (error: any) {
    console.error('[Fetch Properties] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch properties',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

async function fetchPropertiesForToken(accessToken: string) {
  let searchConsoleProperties: GscSite[] = [];
  let analyticsProperties: Ga4Property[] = [];

  // Fetch Search Console sites
  try {
    console.log('[Properties] Fetching Search Console sites...');
    const gscResp = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
    });
    
    if (gscResp.ok) {
      const gscJson = await gscResp.json();
      searchConsoleProperties = gscJson.siteEntry ?? [];
      console.log(`[Properties] Found ${searchConsoleProperties.length} Search Console properties`);
    } else if (gscResp.status === 401) {
      console.error('[Properties] Unauthorized for Search Console API');
    } else {
      const errorText = await gscResp.text();
      console.error('[Properties] Search Console error:', gscResp.status, errorText);
    }
  } catch (error) {
    console.error('[Properties] Search Console fetch error:', error);
  }

  // Fetch GA4 properties via Admin API
  try {
    console.log('[Properties] Fetching Analytics properties...');
    const gaResp = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
    });
    
    if (gaResp.ok) {
      const gaJson = await gaResp.json() as { accountSummaries?: Ga4AccountSummary[] };
      analyticsProperties = gaJson.accountSummaries?.flatMap(as =>
        (as.propertySummaries ?? []).map(ps => ({
          propertyId: ps.property || '',
          displayName: ps.displayName ?? '',
          account: as.account
        }))
      ) ?? [];
      console.log(`[Properties] Found ${analyticsProperties.length} Analytics properties`);
    } else if (gaResp.status === 401) {
      console.error('[Properties] Unauthorized for Analytics API');
    } else {
      const errorText = await gaResp.text();
      console.error('[Properties] Analytics error:', gaResp.status, errorText);
    }
  } catch (error) {
    console.error('[Properties] Analytics fetch error:', error);
  }

  return {
    searchConsole: searchConsoleProperties,
    analytics: analyticsProperties
  };
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be used to refresh properties for a specific account
    const { accountId } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const accessToken = await getValidGoogleToken(accountId);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No valid access token available' },
        { status: 401 }
      );
    }

    const { searchConsole, analytics } = await fetchPropertiesForToken(accessToken);

    // Optionally store properties in database for caching
    // This would require adding a Properties model to your schema

    return NextResponse.json({
      success: true,
      properties: {
        searchConsole,
        analytics
      }
    });
    
  } catch (error: any) {
    console.error('[Refresh Properties] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh properties',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}