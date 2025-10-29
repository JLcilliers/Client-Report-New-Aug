import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { prisma } from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { getOAuthRedirectUri, isProductionEnvironment } from "@/lib/utils/oauth-config"
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  
  
  
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const state = searchParams.get("state")
    
    
    
    
    
    if (error) {
      const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
      return NextResponse.redirect(`${baseUrl}/admin/google-accounts?error=${error}`)
    }
    
    if (!code) {
      const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
      return NextResponse.redirect(`${baseUrl}/admin/google-accounts?error=no_code`)
    }

    // Use consistent base URL detection
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    
    const redirectUri = getOAuthRedirectUri(request)
    
    
    
    
    
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    // Exchange code for tokens
    
    
    let tokens;
    try {
      const tokenResponse = await oauth2Client.getToken(code);
      tokens = tokenResponse.tokens;
      
    } catch (tokenError: any) {
      
      
      

      // Check for specific error types
      if (tokenError.message?.includes('invalid_client')) {
        
        
        
        const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
        return NextResponse.redirect(`${baseUrl}/login?error=invalid_client_credentials`)
      }

      throw tokenError;
    }
    
    oauth2Client.setCredentials(tokens)
    
    
    

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
      
      
      
      throw new Error('Failed to get user info')
    }
    
    const userInfo = await userInfoResponse.json()
    
    
    
    

    // First, we need a userId - for now, use a default admin user or create one
    // In production, this should be tied to the authenticated user
    
    let user = await prisma.user.findFirst({
      where: { email: userInfo.email }
    })
    
    if (!user) {
      
      const userData = {
        email: userInfo.email,
        name: userInfo.name || userInfo.email
      };
      
      
      try {
        user = await prisma.user.create({
          data: userData
        })
        
      } catch (createError: any) {
        
        
        
        throw createError;
      }
    } else {
      
    }
    
    // Save to GoogleTokens table (which is what the frontend reads from)
    
    
    const googleTokensData = {
      google_sub: userInfo.id, // Google's unique user ID
      email: userInfo.email,
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token || undefined,
      expires_at: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
      scope: tokens.scope || "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
      userId: user.id
    };
    
    
    
    
    
    
    
    
    let googleAccount;
    try {
      
      googleAccount = await prisma.googleTokens.upsert({
        where: { 
          userId_google_sub: {
            userId: user.id,
            google_sub: userInfo.id
          }
        },
        update: {
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token || undefined,
          expires_at: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
          scope: tokens.scope || "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
          email: userInfo.email
        },
        create: googleTokensData
      })
      
      
      
    } catch (saveError: any) {
      
      
      
      throw saveError;
    }

    
    
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    // Redirect to a page that can establish the session properly
    const redirectUrl = `${baseUrl}/auth/success?email=${encodeURIComponent(userInfo.email)}`;
    
    
    // Create persistent session in database
    const sessionToken = require('crypto').randomBytes(32).toString('hex')
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    
    
    try {
      await prisma.session.create({
        data: {
          sessionToken,
          userId: user.id,
          expires: sessionExpires
        }
      })
      
    } catch (sessionError: any) {
      
      throw sessionError;
    }
    
    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl)
    
    // Set persistent cookies with production-safe settings
    // Simplified cookie setting to avoid production issues
    response.cookies.set('google_access_token', tokens.access_token!, {
      httpOnly: true,
      secure: true, // Always use secure in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: true, // Always secure in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 90, // 90 days for refresh token
        path: '/',
        // Don't set domain - let browser handle it for better compatibility
      })
    }

    // Set session token cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: true, // Always secure in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      // Don't set domain - let browser handle it for better compatibility
    })

    // Set token expiry cookie for client-side validation
    if (tokens.expiry_date) {
      response.cookies.set('google_token_expiry', new Date(tokens.expiry_date).toISOString(), {
        httpOnly: true,
        secure: true, // Always secure in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        // Don't set domain - let browser handle it for better compatibility
      })
    }

    // Also set a user cookie for the middleware
    response.cookies.set('google_user_email', userInfo.email, {
      httpOnly: true,
      secure: true, // Always secure in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      // Don't set domain - let browser handle it for better compatibility
    })
    
    return response
  } catch (error: any) {
    
    
    
    
    
    
    const errorMessage = error.message || 'callback_failed'
    const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_URL || 'https://searchsignal.online'
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorMessage)}`)
  }
}