import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db/prisma"
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rememberMe, userId } = body
    
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session_token')
    
    if (!sessionToken) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }
    
    // Find existing session
    const session = await prisma.session.findFirst({
      where: {
        sessionToken: sessionToken.value,
        expires: { gte: new Date() }
      }
    })
    
    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 401 })
    }
    
    let newExpiry: Date
    let maxAge: number
    
    if (rememberMe) {
      // Extended session: 90 days
      newExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      maxAge = 60 * 60 * 24 * 90
    } else {
      // Standard session: 30 days
      newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      maxAge = 60 * 60 * 24 * 30
    }
    
    // Update session expiry
    await prisma.session.update({
      where: { id: session.id },
      data: { expires: newExpiry }
    })
    
    // Create response with updated cookies
    const response = NextResponse.json({ 
      success: true,
      rememberMe,
      expiresAt: newExpiry.toISOString(),
      message: rememberMe ? "Session extended to 90 days" : "Session set to 30 days"
    })
    
    // Update all authentication cookies with new expiry
    const accessToken = cookieStore.get('google_access_token')
    const refreshToken = cookieStore.get('google_refresh_token')
    const userEmail = cookieStore.get('google_user_email')
    const tokenExpiry = cookieStore.get('google_token_expiry')
    
    // Set session token with new expiry
    response.cookies.set('session_token', sessionToken.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge,
      path: '/'
    })
    
    // Update other cookies to match session duration
    if (accessToken) {
      response.cookies.set('google_access_token', accessToken.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/'
      })
    }
    
    if (refreshToken) {
      response.cookies.set('google_refresh_token', refreshToken.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: rememberMe ? 60 * 60 * 24 * 120 : 60 * 60 * 24 * 90, // Longer for refresh token
        path: '/'
      })
    }
    
    if (userEmail) {
      response.cookies.set('google_user_email', userEmail.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/'
      })
    }
    
    if (tokenExpiry) {
      response.cookies.set('google_token_expiry', tokenExpiry.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAge,
        path: '/'
      })
    }
    
    return response
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to update session", 
      details: error.message 
    }, { status: 500 })
  }
}

// GET endpoint to check current session status
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session_token')
    
    if (!sessionToken) {
      return NextResponse.json({ hasSession: false })
    }
    
    const session = await prisma.session.findFirst({
      where: {
        sessionToken: sessionToken.value,
        expires: { gte: new Date() }
      },
      include: {
        user: true
      }
    })
    
    if (!session) {
      return NextResponse.json({ hasSession: false })
    }
    
    const now = new Date()
    const expiresIn = session.expires.getTime() - now.getTime()
    const daysRemaining = Math.floor(expiresIn / (1000 * 60 * 60 * 24))
    
    return NextResponse.json({
      hasSession: true,
      expiresAt: session.expires.toISOString(),
      daysRemaining,
      isExtendedSession: daysRemaining > 60, // More than 60 days = extended session
      userEmail: session.user.email
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to check session status",
      details: error.message
    }, { status: 500 })
  }
}