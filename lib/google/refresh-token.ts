import { prisma } from '@/lib/prisma';

export async function refreshGoogleToken(accountId: string): Promise<{
  access_token: string;
  expires_at: number;
} | null> {
  try {
    // Get the account with refresh token
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account || !account.refresh_token) {
      console.error('No refresh token found for account:', accountId);
      return null;
    }

    // Refresh the token using Google OAuth2 endpoint
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to refresh token:', error);
      return null;
    }

    const data = await response.json();
    
    // Calculate expiration timestamp (current time + expires_in seconds)
    const expires_at = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);

    // Update the account with new access token and expiry
    await prisma.account.update({
      where: { id: accountId },
      data: {
        access_token: data.access_token,
        expires_at: expires_at,
      },
    });

    return {
      access_token: data.access_token,
      expires_at: expires_at,
    };
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return null;
  }
}

export async function getValidGoogleToken(accountId: string): Promise<string | null> {
  try {
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account || !account.access_token) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    const isExpired = account.expires_at ? account.expires_at < (now + 300) : true;

    if (isExpired) {
      console.log('Token expired for account:', accountId, 'Refreshing...');
      const refreshed = await refreshGoogleToken(accountId);
      return refreshed ? refreshed.access_token : null;
    }

    return account.access_token;
  } catch (error) {
    console.error('Error getting valid token:', error);
    return null;
  }
}