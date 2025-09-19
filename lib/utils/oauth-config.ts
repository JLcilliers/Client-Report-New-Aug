import { NextRequest } from "next/server"

/**
 * Get the base URL for OAuth redirects
 * Handles localhost vs production environments correctly
 */
export function getOAuthBaseUrl(request: NextRequest): string {
  // In production on Vercel, always use the production URL
  // This avoids any issues with Vercel preview deployments or subdomain variations
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) {
    return 'https://searchsignal.online'
  }

  // For local development
  const host = request.headers.get('host')
  const isLocalhost = host?.includes('localhost')

  if (isLocalhost) {
    return `http://localhost:3000`
  }

  // Fallback to production URL
  return 'https://searchsignal.online'
}

/**
 * Get the OAuth redirect URI
 */
export function getOAuthRedirectUri(request: NextRequest): string {
  const baseUrl = getOAuthBaseUrl(request)
  // Use the callback URI that matches what's in Google Cloud Console
  return `${baseUrl}/api/auth/google/callback`
}

/**
 * OAuth redirect URIs that need to be configured in Google Cloud Console
 */
export const REQUIRED_REDIRECT_URIS = [
  'http://localhost:3000/api/auth/google/admin-callback',
  'https://searchsignal.online/api/auth/google/admin-callback',
  // Add any other deployment URLs here
]