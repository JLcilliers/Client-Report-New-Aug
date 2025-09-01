import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getOAuthRedirectUri } from "@/lib/utils/oauth-config"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const state = searchParams.get("state")
    
    console.log('[OAuth Callback] Params:', { code: !!code, error, state })
    
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
    
    console.log('[OAuth Callback] Using redirect URI:', redirectUri)
    
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    // Exchange code for tokens
    console.log('[OAuth Callback] Exchanging code for tokens...')
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)
    
    console.log('[OAuth Callback] Tokens received:', {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      expiry: tokens.expiry_date
    })

    // Get user info
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    )
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.error('[OAuth Callback] Failed to get user info:', errorText)
      throw new Error('Failed to get user info')
    }
    
    const userInfo = await userInfoResponse.json()
    console.log('[OAuth Callback] User info:', userInfo.email)

    // First, we need a userId - for now, use a default admin user or create one
    // In production, this should be tied to the authenticated user
    let user = await prisma.user.findFirst({
      where: { email: userInfo.email }
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name || userInfo.email
        }
      })
    }
    
    // Save to database with correct field names
    const googleAccount = await prisma.googleAccount.upsert({
      where: { email: userInfo.email },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        scope: "analytics.readonly webmasters.readonly",
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        email: userInfo.email,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        scope: "analytics.readonly webmasters.readonly"
      }
    })
    
    console.log('[OAuth Callback] Google account saved:', googleAccount.id)

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

    console.log('[OAuth Callback] Success! Redirecting to admin panel...')
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    return NextResponse.redirect(`${baseUrl}/admin/google-accounts?success=true`)
  } catch (error: any) {
    console.error('[OAuth Callback] Error:', error)
    const errorMessage = error.message || 'callback_failed'
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    return NextResponse.redirect(`${baseUrl}/admin/google-accounts?error=${encodeURIComponent(errorMessage)}`)
  }
}