import { NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"

export async function GET() {
  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL || 'https://online-client-reporting.vercel.app'}/api/auth/google/callback`
    )

    const scopes = [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
      include_granted_scopes: true
    })

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    
    return NextResponse.redirect('/admin/google-accounts?error=oauth_init_failed')
  }
}