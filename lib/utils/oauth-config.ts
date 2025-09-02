import { NextRequest } from "next/server"

/**
 * Get the base URL for OAuth redirects
 * Handles localhost vs production environments correctly
 */
export function getOAuthBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host')
  
  // For localhost development, always use http
  const isLocalhost = host?.includes('localhost')
  
  if (isLocalhost) {
    return `http://${host}`
  }
  
  // For production, ALWAYS use the production URL
  // This ensures consistency regardless of how the app is accessed
  return 'https://searchsignal.online'
}

/**
 * Get the OAuth redirect URI
 */
export function getOAuthRedirectUri(request: NextRequest): string {
  const baseUrl = getOAuthBaseUrl(request)
  return `${baseUrl}/api/auth/google/admin-callback`
}

/**
 * OAuth redirect URIs that need to be configured in Google Cloud Console
 */
export const REQUIRED_REDIRECT_URIS = [
  'http://localhost:3000/api/auth/google/admin-callback',
  'https://searchsignal.online/api/auth/google/admin-callback',
  // Add any other deployment URLs here
]