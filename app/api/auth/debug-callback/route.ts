import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Capture everything about the request
  const debug: any = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + "..." })),
    origin: request.nextUrl.origin,
    pathname: request.nextUrl.pathname,
  }
  
  // If there's a code, try to exchange it
  const code = request.nextUrl.searchParams.get("code")
  if (code) {
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: `${request.nextUrl.origin}/api/auth/debug-callback`,
          grant_type: "authorization_code",
        }),
      })
      
      const responseText = await tokenResponse.text()
      debug.tokenExchange = {
        status: tokenResponse.status,
        ok: tokenResponse.ok,
        response: responseText.substring(0, 500), // First 500 chars
      }
    } catch (error: any) {
      debug.tokenExchangeError = error.message
    }
  }
  
  return NextResponse.json(debug, { 
    status: 200,
    headers: {
      "Content-Type": "application/json",
    }
  })
}