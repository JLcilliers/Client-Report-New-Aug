import { NextRequest, NextResponse } from "next/server"
import { getOAuthRedirectUri } from "@/lib/utils/oauth-config"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const redirectUri = getOAuthRedirectUri(request)
    
    console.log('\n========== OAuth Add Account START ==========')
    console.log('[OAuth Add Account] Request details:');
    console.log('  - Full URL:', request.url);
    console.log('  - Origin:', request.nextUrl.origin);
    console.log('  - Host header:', request.headers.get('host'));
    console.log('  - Protocol:', request.headers.get('x-forwarded-proto') || 'http');
    
    console.log('[OAuth Add Account] Configuration:');
    console.log('  - REDIRECT URI BEING SENT TO GOOGLE:', redirectUri);
    console.log('  - Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('  - NEXT_PUBLIC_URL:', process.env.NEXT_PUBLIC_URL || 'NOT SET');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    
    console.log('[OAuth Add Account] IMPORTANT:');
    console.log('  This EXACT redirect URI must be in Google Cloud Console:');
    console.log('  >>>', redirectUri, '<<<');
    console.log('  Including the protocol (http/https) and exact path!');
    
    // Construct OAuth URL manually for better control
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state: "admin_connection"
    })
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    
    console.log('[OAuth Add Account] OAuth URL construction:');
    console.log('  - Full URL:', authUrl);
    console.log('[OAuth Add Account] URL parameters:');
    Object.entries(Object.fromEntries(params.entries())).forEach(([key, value]) => {
      if (key === 'redirect_uri') {
        console.log(`  - ${key}: "${value}" <-- MUST BE IN GOOGLE CONSOLE`);
      } else if (key === 'client_id') {
        console.log(`  - ${key}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`  - ${key}: ${value}`);
      }
    });
    console.log('[OAuth Add Account] Redirecting to Google...');
    console.log('========== OAuth Add Account END ==========\n');
    
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('\n========== OAuth Add Account ERROR ==========')
    console.error('[OAuth Add Account] Initialization failed!');
    console.error('  - Error:', error.message);
    console.error('  - Stack:', error.stack);
    console.error('========== OAuth Add Account END (ERROR) ==========\n');
    
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    return NextResponse.redirect(`${baseUrl}/admin?error=oauth_init_failed`)
  }
}