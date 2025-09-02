import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('google_access_token')
    const tokenExpiry = cookieStore.get('google_token_expiry')
    
    if (!accessToken) {
      return NextResponse.json({ authenticated: false })
    }
    
    // Check if token is expired
    if (tokenExpiry) {
      const expiryDate = new Date(tokenExpiry.value)
      if (expiryDate < new Date()) {
        return NextResponse.json({ authenticated: false, expired: true })
      }
    }
    
    // Token exists and is not expired
    return NextResponse.json({ 
      authenticated: true,
      email: "johanlcilliers@gmail.com" // You can decode this from the token if needed
    })
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: "Failed to check session" })
  }
}