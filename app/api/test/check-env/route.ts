import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextPublicUrl: !!process.env.NEXT_PUBLIC_URL,
    nextPublicUrl: process.env.NEXT_PUBLIC_URL || "Not set",
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Show partial client ID for debugging (first 10 chars)
    clientIdPreview: process.env.GOOGLE_CLIENT_ID ? 
      process.env.GOOGLE_CLIENT_ID.substring(0, 10) + "..." : 
      "Not configured",
    redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/auth/google/admin-callback`,
  })
}