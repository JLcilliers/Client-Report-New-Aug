import { cookies } from "next/headers"
import { getPrisma } from "@/lib/db/prisma"
import { OAuth2Client } from "google-auth-library"

interface TokenResult {
  accessToken: string | null
  refreshToken: string | null
  error?: string
}

/**
 * Centralized token management for Google OAuth
 * Handles token retrieval, refresh, and fallback mechanisms
 */
export class GoogleTokenManager {
  private oauth2Client: OAuth2Client
  
  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/auth/google/admin-callback`
    )
  }
  
  /**
   * Get valid Google tokens with automatic refresh
   * Priority: 1. Account tokens, 2. Cookie tokens, 3. User's stored tokens
   */
  async getValidTokens(accountId?: string, userId?: string): Promise<TokenResult> {
    const prisma = getPrisma()
    
    // Try account-specific tokens first
    if (accountId) {
      try {
        const account = await prisma.googleAccount.findUnique({
          where: { id: accountId }
        })
        
        if (account?.accessToken) {
          // Check if token needs refresh
          if (account.expiresAt && account.expiresAt < Date.now() / 1000) {
            if (account.refreshToken) {
              const refreshed = await this.refreshAccessToken(account.refreshToken)
              if (refreshed.accessToken) {
                // Update stored tokens
                await prisma.googleAccount.update({
                  where: { id: accountId },
                  data: {
                    accessToken: refreshed.accessToken,
                    expiresAt: Math.floor(Date.now() / 1000) + 3600
                  }
                })
                return refreshed
              }
            }
          } else {
            return {
              accessToken: account.accessToken,
              refreshToken: account.refreshToken
            }
          }
        }
      } catch (error) {
        console.error('Error fetching account tokens:', error)
      }
    }
    
    // Try cookie tokens
    try {
      const cookieStore = cookies()
      const accessTokenCookie = cookieStore.get('google_access_token')
      const refreshTokenCookie = cookieStore.get('google_refresh_token')
      
      if (accessTokenCookie?.value) {
        // Try to refresh if we have refresh token
        if (refreshTokenCookie?.value) {
          const refreshed = await this.refreshAccessToken(refreshTokenCookie.value)
          if (refreshed.accessToken) {
            return refreshed
          }
        }
        
        // Return existing tokens
        return {
          accessToken: accessTokenCookie.value,
          refreshToken: refreshTokenCookie?.value || null
        }
      }
    } catch (error) {
      console.error('Error reading cookie tokens:', error)
    }
    
    // Try user's stored tokens as last resort
    if (userId) {
      try {
        const userTokens = await prisma.googleTokens.findFirst({
          where: { userId },
          orderBy: { updated_at: 'desc' }
        })
        
        if (userTokens?.access_token) {
          // Check if token needs refresh
          if (userTokens.expires_at && userTokens.expires_at < BigInt(Date.now())) {
            if (userTokens.refresh_token) {
              const refreshed = await this.refreshAccessToken(userTokens.refresh_token)
              if (refreshed.accessToken) {
                // Update stored tokens
                await prisma.googleTokens.update({
                  where: { id: userTokens.id },
                  data: {
                    access_token: refreshed.accessToken,
                    expires_at: BigInt(Date.now() + 3600000)
                  }
                })
                return refreshed
              }
            }
          } else {
            return {
              accessToken: userTokens.access_token,
              refreshToken: userTokens.refresh_token
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user tokens:', error)
      }
    }
    
    return {
      accessToken: null,
      refreshToken: null,
      error: 'No valid Google tokens found'
    }
  }
  
  /**
   * Refresh an access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: "refresh_token",
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || refreshToken // Keep existing if not provided
        }
      }
      
      const errorData = await response.json()
      console.error('Token refresh failed:', errorData)
      return {
        accessToken: null,
        refreshToken: null,
        error: errorData.error_description || 'Token refresh failed'
      }
    } catch (error: any) {
      console.error('Token refresh error:', error)
      return {
        accessToken: null,
        refreshToken: null,
        error: error.message
      }
    }
  }
  
  /**
   * Get configured OAuth2Client with tokens
   */
  async getAuthenticatedClient(accountId?: string, userId?: string): Promise<OAuth2Client | null> {
    const tokens = await this.getValidTokens(accountId, userId)
    
    if (!tokens.accessToken) {
      console.error('No valid access token available')
      return null
    }
    
    this.oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken
    })
    
    return this.oauth2Client
  }
}

// Export singleton instance
export const tokenManager = new GoogleTokenManager()