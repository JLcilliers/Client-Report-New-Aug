import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PrismaClient } from "@prisma/client"
import { OAuth2Client } from "google-auth-library"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?error=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin?error=missing_code", request.url)
    )
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase configuration")
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Auto-detect URL if NEXT_PUBLIC_URL is not set
    const host = request.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NEXT_PUBLIC_URL || 
      `${protocol}://${host}` ||
      'http://localhost:3000'
    
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${baseUrl}/api/auth/admin-google/callback`,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || "Failed to exchange code for tokens")
    }

    const { access_token, refresh_token, expires_in } = tokenData

    // Calculate token expiry
    const tokenExpiry = new Date()
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in)

    // Get user info from Google
    let userEmail = 'user@example.com'
    let userName = 'Google User'
    let userPicture = null
    
    console.log('🔐 Fetching user info from Google...')
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      })
      
      console.log('📡 User info response status:', response.status)
      
      if (response.ok) {
        const userInfo = await response.json()
        console.log('👤 User info:', userInfo)
        
        userEmail = userInfo.email || userEmail
        userName = userInfo.name || userName
        userPicture = userInfo.picture || null
        
        console.log('✅ Got user email:', userEmail)
      } else {
        const error = await response.text()
        console.error('❌ Failed to get user info:', response.status, error)
      }
    } catch (err) {
      console.error('💥 Error fetching user info:', err)
    }

    // Save or update account in database
    console.log('💾 Saving account to database...')
    try {
      // First, create or get a user
      let user = await prisma.user.findUnique({
        where: { email: userEmail }
      })
      
      if (!user) {
        console.log('📝 Creating new user:', userEmail)
        user = await prisma.user.create({
          data: {
            email: userEmail,
            name: userName,
            image: userPicture
          }
        })
      } else {
        console.log('👤 Found existing user:', userEmail)
        // Update user info if changed
        if (user.name !== userName || user.image !== userPicture) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: userName,
              image: userPicture
            }
          })
        }
      }
      
      // Now create or update the account
      const account = await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: userEmail
          }
        },
        update: {
          access_token: access_token,
          refresh_token: refresh_token || undefined,
          expires_at: Math.floor(tokenExpiry.getTime() / 1000)
        },
        create: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: userEmail,
          access_token: access_token,
          refresh_token: refresh_token || null,
          expires_at: Math.floor(tokenExpiry.getTime() / 1000)
        }
      })
      console.log('✅ Account saved successfully:', account.id)
    } catch (dbError) {
      console.error('❌ Failed to save account to database:', dbError)
    }

    // Store tokens in cookies for now (since we're not using a real database)
    const response = NextResponse.redirect(
      new URL("/admin?auth=success", request.url)
    )
    
    // Set secure HTTP-only cookies with the tokens
    response.cookies.set('google_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    response.cookies.set('google_refresh_token', refresh_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    
    response.cookies.set('google_token_expiry', tokenExpiry.toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in
    })
    
    response.cookies.set('user_email', userEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response
  } catch (error: any) {
    
    return NextResponse.redirect(
      new URL(`/admin?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}