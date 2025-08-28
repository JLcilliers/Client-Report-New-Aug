import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect('/api/auth/signin');

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/admin/google-accounts/callback`,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent select_account',
    include_granted_scopes: 'true',
    scope: [
      'openid','email','profile',
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly'
    ].join(' '),
    state,
  });

  // Optionally persist state in a cookie if you want CSRF protection here
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}