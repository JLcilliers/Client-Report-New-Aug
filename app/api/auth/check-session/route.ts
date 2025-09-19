import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db/prisma"
import { OAuth2Client } from "google-auth-library"
import { isProductionEnvironment } from "@/lib/utils/oauth-config"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('\n========== Session Check START ==========');
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session_token')
    const accessToken = cookieStore.get('google_access_token')
    const refreshToken = cookieStore.get('google_refresh_token')
    const tokenExpiry = cookieStore.get('google_token_expiry')
    const userEmail = cookieStore.get('google_user_email')

    console.log('[Session Check] Cookies found:');
    console.log('  - session_token:', sessionToken ? 'SET' : 'NOT SET');
    console.log('  - google_access_token:', accessToken ? 'SET' : 'NOT SET');
    console.log('  - google_refresh_token:', refreshToken ? 'SET' : 'NOT SET');
    console.log('  - google_token_expiry:', tokenExpiry?.value || 'NOT SET');
    console.log('  - google_user_email:', userEmail?.value || 'NOT SET');
    
    // First check for session token in database
    let session = null
    if (sessionToken) {
      console.log('[Session Check] Looking up session token in database...');
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
        console.log('[Session Check] Valid session found in database');
        console.log('  - User email:', session.user.email);
        console.log('  - Session expires:', session.expires);

        return NextResponse.json({
          authenticated: true,
          email: session.user.email
        })
      } else {
        console.log('[Session Check] No valid session found in database');
      }
    }
    
    // Fallback to token-based authentication
    if (!accessToken) {
      console.log('[Session Check] No access token found, returning not authenticated');
      console.log('========== Session Check END (NO AUTH) ==========\n');
      return NextResponse.json({ authenticated: false })
    }

    console.log('[Session Check] Falling back to token-based authentication');
    
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
            console.error('Token refresh failed:', refreshError)
            return NextResponse.json({ authenticated: false, expired: true })
          }
        }
        
        return NextResponse.json({ authenticated: false, expired: true })
      }
    }
    
    // Token exists and is not expired
    console.log('[Session Check] Access token is valid, returning authenticated');
    console.log('========== Session Check END (TOKEN AUTH) ==========\n');
    return NextResponse.json({
      authenticated: true,
      email: userEmail?.value || "johanlcilliers@gmail.com"
    })
  } catch (error) {
    console.error('\n========== Session Check ERROR ==========');
    console.error('[Session Check] Error:', error);
    console.error('========== Session Check END (ERROR) ==========\n');
    return NextResponse.json({ authenticated: false, error: "Failed to check session" })
  }
}