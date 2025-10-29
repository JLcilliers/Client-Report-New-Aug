import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db/prisma"
import { OAuth2Client } from "google-auth-library"
import { isProductionEnvironment } from "@/lib/utils/oauth-config"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session_token')
    const accessToken = cookieStore.get('google_access_token')
    const refreshToken = cookieStore.get('google_refresh_token')
    const tokenExpiry = cookieStore.get('google_token_expiry')
    const userEmail = cookieStore.get('google_user_email')

    
    
    
    
    
    
    
    // First check for session token in database
    let session = null
    if (sessionToken) {
      
      session = await prisma.session.findFirst({
        where: {
          sessionToken: sessionToken.value,
          expires: { gte: new Date() }
        },
        include: {
          user: true
        }
      })

      // If session exists and is valid, return authenticated
      if (session) {
        
        
        

        return NextResponse.json({
          authenticated: true,
          email: session.user.email
        })
      } else {
        
      }
    }
    
    // Fallback to token-based authentication
    if (!accessToken) {
    return NextResponse.json({ authenticated: false })
    }

    
    
    // Check if access token is expired and try to refresh
    if (tokenExpiry) {
      const expiryDate = new Date(tokenExpiry.value)
      const now = new Date()
      
      // If token expires within 5 minutes, try to refresh
      if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
        if (refreshToken) {
          try {
            const oauth2Client = new OAuth2Client(
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_CLIENT_SECRET
            )
            
            oauth2Client.setCredentials({
              refresh_token: refreshToken.value
            })
            
            const { credentials } = await oauth2Client.refreshAccessToken()
            
            // Update cookies with new tokens
            const response = NextResponse.json({
              authenticated: true,
              email: userEmail?.value || "johanlcilliers@gmail.com",
              tokenRefreshed: true
            })

            const isProduction = isProductionEnvironment(request);

            if (credentials.access_token) {
              response.cookies.set('google_access_token', credentials.access_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
              })
            }

            if (credentials.expiry_date) {
              response.cookies.set('google_token_expiry', new Date(credentials.expiry_date).toISOString(), {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
              })
            }
            
            return response
            
          } catch (refreshError) {
            return NextResponse.json({ authenticated: false, expired: true })
          }
        }
        
        return NextResponse.json({ authenticated: false, expired: true })
      }
    }
    
    // Token exists and is not expired
    return NextResponse.json({
      authenticated: true,
      email: userEmail?.value || "johanlcilliers@gmail.com"
    })
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: "Failed to check session" })
  }
}