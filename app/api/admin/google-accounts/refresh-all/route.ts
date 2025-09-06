import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  console.log('[Refresh All] Starting bulk token refresh...');
  
  try {
    // Get all Google accounts with refresh tokens
    const accounts = await prisma.account.findMany({
      where: {
        provider: 'google',
        refresh_token: {
          not: null
        }
      }
    });
    
    console.log(`[Refresh All] Found ${accounts.length} accounts to refresh`);
    
    const results = [];
    
    for (const account of accounts) {
      console.log(`[Refresh All] Processing account: ${account.providerAccountId}`);
      
      try {
        const oauth2Client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        
        oauth2Client.setCredentials({
          refresh_token: account.refresh_token
        });
        
        // Refresh the token
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log(`[Refresh All] Token refreshed for ${account.providerAccountId}`);
        
        // Update the account
        await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token: credentials.access_token!,
            expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : undefined
          }
        });
        
        results.push({
          accountId: account.id,
          email: account.providerAccountId,
          status: 'success',
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null
        });
        
      } catch (refreshError: any) {
        console.error(`[Refresh All] Failed to refresh ${account.providerAccountId}:`, refreshError.message);
        
        results.push({
          accountId: account.id,
          email: account.providerAccountId,
          status: 'error',
          error: refreshError.message
        });
      }
    }
    
    console.log('[Refresh All] Bulk refresh completed');
    
    return NextResponse.json({
      success: true,
      message: `Processed ${accounts.length} accounts`,
      results
    });
    
  } catch (error: any) {
    console.error('[Refresh All] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to refresh tokens',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}