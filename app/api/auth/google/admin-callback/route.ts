import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { prisma } from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { getOAuthRedirectUri } from "@/lib/utils/oauth-config"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('\n========== OAuth Callback START ==========');
  console.log('[OAuth Callback] Request URL:', request.url);
  console.log('[OAuth Callback] Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const state = searchParams.get("state")
    
    console.log('[OAuth Callback] Query params received:');
    console.log('  - code:', code ? `${code.substring(0, 20)}...` : 'NOT PROVIDED');
    console.log('  - error:', error || 'none');
    console.log('  - state:', state || 'none');
    
    if (error) {
      console.error('[OAuth Callback] Error from Google:', error)
      const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
      return NextResponse.redirect(`${baseUrl}/admin/google-accounts?error=${error}`)
    }
    
    if (!code) {
      console.error('[OAuth Callback] No authorization code received')
      const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
      return NextResponse.redirect(`${baseUrl}/admin/google-accounts?error=no_code`)
    }

    // Use consistent base URL detection
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    
    const redirectUri = getOAuthRedirectUri(request)
    
    console.log('[OAuth Callback] OAuth Configuration:');
    console.log('  - Redirect URI:', redirectUri);
    console.log('  - Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('  - Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
    
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    // Exchange code for tokens
    console.log('[OAuth Callback] Starting token exchange...');
    console.log('[OAuth Callback] Code being exchanged:', code?.substring(0, 30) + '...');
    
    let tokens;
    try {
      const tokenResponse = await oauth2Client.getToken(code);
      tokens = tokenResponse.tokens;
      console.log('[OAuth Callback] Token exchange successful!');
    } catch (tokenError: any) {
      console.error('[OAuth Callback] Token exchange failed!');
      console.error('  - Error:', tokenError.message);
      console.error('  - Stack:', tokenError.stack);
      throw tokenError;
    }
    
    oauth2Client.setCredentials(tokens)
    
    console.log('[OAuth Callback] Tokens received:');
    console.log('  - Access token:', tokens.access_token ? `${tokens.access_token.substring(0, 20)}...` : 'NOT PROVIDED');
    console.log('  - Refresh token:', tokens.refresh_token ? `${tokens.refresh_token.substring(0, 20)}...` : 'NOT PROVIDED');
    console.log('  - Expiry:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'NOT PROVIDED');
    console.log('  - Scope:', tokens.scope || 'NOT PROVIDED');

    // Get user info
    console.log('[OAuth Callback] Fetching user info from Google...');
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    )
    
    console.log('[OAuth Callback] User info response status:', userInfoResponse.status);
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.error('[OAuth Callback] Failed to get user info!');
      console.error('  - Status:', userInfoResponse.status);
      console.error('  - Response:', errorText);
      throw new Error('Failed to get user info')
    }
    
    const userInfo = await userInfoResponse.json()
    console.log('[OAuth Callback] User info retrieved:');
    console.log('  - Email:', userInfo.email);
    console.log('  - Name:', userInfo.name);
    console.log('  - ID:', userInfo.id);

    // First, we need a userId - for now, use a default admin user or create one
    // In production, this should be tied to the authenticated user
    console.log('[OAuth Callback] Looking up or creating user...');
    let user = await prisma.user.findFirst({
      where: { email: userInfo.email }
    })
    
    if (!user) {
      console.log('[OAuth Callback] User not found, creating new user...');
      const userData = {
        email: userInfo.email,
        name: userInfo.name || userInfo.email
      };
      console.log('[OAuth Callback] Creating user with data:', userData);
      
      try {
        user = await prisma.user.create({
          data: userData
        })
        console.log('[OAuth Callback] User created successfully:', user.id);
      } catch (createError: any) {
        console.error('[OAuth Callback] Failed to create user!');
        console.error('  - Error:', createError.message);
        console.error('  - Stack:', createError.stack);
        throw createError;
      }
    } else {
      console.log('[OAuth Callback] Existing user found:', user.id);
    }
    
    // Save to Account table (which stores OAuth credentials)
    console.log('[OAuth Callback] Preparing to save/update Account record...');
    
    const accountData = {
      update: {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        scope: tokens.scope || "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: userInfo.email,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        scope: tokens.scope || "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
        token_type: tokens.token_type || 'Bearer'
      }
    };
    
    console.log('[OAuth Callback] Account data to save:');
    console.log('  - UserId:', user.id);
    console.log('  - Provider:', 'google');
    console.log('  - ProviderAccountId:', userInfo.email);
    console.log('  - Has refresh token:', !!tokens.refresh_token);
    console.log('  - Expires at:', accountData.create.expires_at);
    
    let googleAccount;
    try {
      console.log('[OAuth Callback] Executing Prisma upsert...');
      googleAccount = await prisma.account.upsert({
        where: { 
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: userInfo.email
          }
        },
        ...accountData
      })
      console.log('[OAuth Callback] Account saved successfully!');
      console.log('  - Account ID:', googleAccount.id);
      console.log('  - Account provider:', googleAccount.provider);
    } catch (saveError: any) {
      console.error('[OAuth Callback] Failed to save account!');
      console.error('  - Error:', saveError.message);
      console.error('  - Stack:', saveError.stack);
      console.error('  - Full error:', JSON.stringify(saveError, null, 2));
      throw saveError;
    }

    // Set cookies for session
    const cookieStore = cookies()
    cookieStore.set('google_access_token', tokens.access_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    if (tokens.refresh_token) {
      cookieStore.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }

    console.log('[OAuth Callback] All operations successful!');
    console.log('========== OAuth Callback END (SUCCESS) ==========\n');
    
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    const redirectUrl = `${baseUrl}/admin/google-accounts?success=true`;
    console.log('[OAuth Callback] Redirecting to:', redirectUrl);
    return NextResponse.redirect(redirectUrl)
  } catch (error: any) {
    console.error('\n========== OAuth Callback ERROR ==========');
    console.error('[OAuth Callback] Caught error!');
    console.error('  - Message:', error.message);
    console.error('  - Name:', error.name);
    console.error('  - Stack:', error.stack);
    console.error('  - Full error object:', JSON.stringify(error, null, 2));
    console.error('========== OAuth Callback END (ERROR) ==========\n');
    
    const errorMessage = error.message || 'callback_failed'
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    return NextResponse.redirect(`${baseUrl}/admin?error=${encodeURIComponent(errorMessage)}`)
  }
}