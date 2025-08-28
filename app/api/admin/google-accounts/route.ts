import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPrisma } from "@/lib/db/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    const prisma = getPrisma()
    
    // Get user first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })
    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }
    
    // Get google_tokens for this user
    const googleTokens = await prisma.googleTokens.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
    
    // Also get legacy accounts for backwards compatibility
    const accounts = await prisma.account.findMany({
      where: { userId: user.id, provider: 'google' },
      include: {
        user: true
      }
    })
    
    // If no accounts in DB but we have a token, create one
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')
    const userEmail = cookieStore.get('user_email')
    
    if (accounts.length === 0 && accessToken) {
      // First, create or get a user
      const email = userEmail?.value || 'user@example.com';
      let user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: 'Google User'
          }
        });
      }
      
      // Create account from current session
      const newAccount = await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: email,
          access_token: accessToken.value,
          refresh_token: cookieStore.get('google_refresh_token')?.value || null,
          expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        },
        include: {
          user: true
        }
      });
      accounts.push(newAccount);
    }
    
    // Format google_tokens for the frontend (prioritize these)
    const formattedTokens = googleTokens.map(token => ({
      id: token.id,
      account_email: token.account_email || token.sub,
      account_name: token.account_name || token.account_email || 'Google Account',
      picture: token.picture || null,
      is_active: token.expires_at ? Number(token.expires_at) > Math.floor(Date.now() / 1000) : true,
      created_at: token.createdAt.toISOString(),
      updated_at: token.updatedAt.toISOString(),
      token_expiry: token.expires_at ? new Date(Number(token.expires_at) * 1000).toISOString() : null,
      search_console_properties: [],
      analytics_properties: [],
      is_new_flow: true // Flag to identify new flow accounts
    }))
    
    // Format legacy accounts for backwards compatibility
    const formattedAccounts = accounts
      .filter(account => !googleTokens.some(t => t.account_email === account.providerAccountId))
      .map((account, index) => ({
        id: account.id,
        account_email: account.user?.email || account.providerAccountId,
        account_name: account.user?.name || `Google Account ${index + 1}`,
        picture: account.user?.image || null,
        is_active: account.expires_at ? Number(account.expires_at) > Math.floor(Date.now() / 1000) : true,
        created_at: account.id,
        updated_at: account.id,
        token_expiry: account.expires_at ? new Date(Number(account.expires_at) * 1000).toISOString() : null,
        search_console_properties: [],
        analytics_properties: [],
        is_new_flow: false // Flag to identify legacy accounts
      }))
    
    // Combine both, with google_tokens first
    const allAccounts = [...formattedTokens, ...formattedAccounts]
    
    return NextResponse.json({ accounts: allAccounts }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    console.error("Error in google-accounts:", error)
    return NextResponse.json({ 
      error: "Failed to fetch Google accounts",
      details: error.message 
    }, { status: 500 })
  }
}