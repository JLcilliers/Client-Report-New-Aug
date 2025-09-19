import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// This is the main callback that Google redirects to
// We'll handle the OAuth flow here by importing the admin-callback logic
export async function GET(request: NextRequest) {
  // Use the admin-callback handler directly
  const adminCallbackModule = await import('../admin-callback/route')
  return adminCallbackModule.GET(request)
}