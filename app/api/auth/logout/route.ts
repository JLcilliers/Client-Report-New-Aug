import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db/prisma"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session_token')
    
    // Remove session from database if it exists
    if (sessionToken?.value) {
      try {
        await prisma.session.delete({
          where: {
            sessionToken: sessionToken.value
          }
        })
      } catch (dbError) {
        // Session might not exist in DB, continue with cookie cleanup
        }
    }
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    })
    
    // Clear all authentication cookies
    const cookiesToClear = [
      'session_token',
      'google_access_token',
      'google_refresh_token',
      'google_user_email',
      'google_token_expiry',
      'demo_auth'
    ]
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0), // Expire immediately
        path: '/'
      })
    })
    
    return response
    
  } catch (error: any) {
    // Even if there's an error, try to clear cookies
    const response = NextResponse.json({
      success: false,
      error: "Logout completed with warnings",
      details: error.message
    }, { status: 200 }) // Still return 200 since we want to clear cookies
    
    // Clear cookies anyway
    const cookiesToClear = [
      'session_token',
      'google_access_token',
      'google_refresh_token',
      'google_user_email',
      'google_token_expiry',
      'demo_auth'
    ]
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/'
      })
    })
    
    return response
  }
}

export async function GET(request: NextRequest) {
  // GET method for logout (redirect-based logout)
  return POST(request)
}