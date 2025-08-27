import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPrisma } from "@/lib/db/prisma"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const prisma = getPrisma()
    // Get all accounts from database
    const accounts = await prisma.account.findMany({
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
    
    // Format accounts for the frontend
    const formattedAccounts = accounts.map((account, index) => ({
      id: account.id,
      account_email: account.user?.email || account.providerAccountId,
      account_name: account.user?.name || `Google Account ${index + 1}`,
      picture: account.user?.image || null,
      is_active: account.expires_at ? account.expires_at > Math.floor(Date.now() / 1000) : true,
      created_at: account.id,
      updated_at: account.id,
      token_expiry: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
      search_console_properties: [],
      analytics_properties: []
    }))
    
    return NextResponse.json({ accounts: formattedAccounts })
  } catch (error: any) {
    console.error("Error in google-accounts:", error)
    return NextResponse.json({ 
      error: "Failed to fetch Google accounts",
      details: error.message 
    }, { status: 500 })
  }
}