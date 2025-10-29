import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    // Create or find demo user
    let user = await prisma.user.findFirst({
      where: { email: 'demo@searchsignal.online' }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'demo@searchsignal.online',
          name: 'Demo Admin'
        }
      })
    }

    // Create session
    const sessionToken = require('crypto').randomBytes(32).toString('hex')
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: sessionExpires
      }
    })

    // Create response
    const baseUrl = request.nextUrl.origin || 'https://searchsignal.online'
    const response = NextResponse.json({
      success: true,
      redirectUrl: `${baseUrl}/admin`
    })

    // Set cookies
    const isProduction = !request.nextUrl.hostname.includes('localhost')

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    response.cookies.set('demo_auth', 'true', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    response.cookies.set('google_user_email', 'demo@searchsignal.online', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return response
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}