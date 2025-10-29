// app/api/test-oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json({ 
        error: 'OAuth error',
        details: error
      }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ 
        error: 'No authorization code received'
      }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://searchsignal.online/api/test-oauth/callback'
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Success! OAuth is working
    return NextResponse.json({
      success: true,
      message: 'OAuth test successful!',
      user: {
        email: userInfo.email,
        name: userInfo.name,
        id: userInfo.id
      },
      tokens: {
        access_token: tokens.access_token ? 'RECEIVED' : 'MISSING',
        refresh_token: tokens.refresh_token ? 'RECEIVED' : 'MISSING',
        scope: tokens.scope,
        expiry_date: tokens.expiry_date
      }
    });
  } catch (error) {
    
    return NextResponse.json({ 
      error: 'Failed to process OAuth callback',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}