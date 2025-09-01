import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
      return NextResponse.redirect(
        `${baseUrl}/admin/google-accounts?error=${error}`
      );
    }

    if (!code) {
      const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
      return NextResponse.redirect(
        `${baseUrl}/admin/google-accounts?error=no_code`
      );
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userResponse.json();

    const { data: existingAccount } = await supabase
      .from('google_accounts')
      .select('*')
      .eq('email', userInfo.email)
      .single();

    const accountData = {
      email: userInfo.email,
      google_id: userInfo.id,
      name: userInfo.name || '',
      image: userInfo.picture || '',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || existingAccount?.refresh_token || '',
      expires_at: Date.now() + (tokens.expires_in * 1000),
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingAccount) {
      result = await supabase
        .from('google_accounts')
        .update(accountData)
        .eq('id', existingAccount.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('google_accounts')
        .insert({
          ...accountData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Database error:', result.error);
      throw result.error;
    }

    console.log('Successfully saved Google account:', result.data.email);

    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    return NextResponse.redirect(
      `${baseUrl}/admin/google-accounts?success=true`
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    return NextResponse.redirect(
      `${baseUrl}/admin/google-accounts?error=callback_failed`
    );
  }
}
