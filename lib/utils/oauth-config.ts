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
    // Always use port 3000 for OAuth redirect URIs since that's what's registered
    // Even if the app is running on port 3001
    return `http://localhost:3000`
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