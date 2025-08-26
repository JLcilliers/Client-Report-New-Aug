import { NextResponse } from "next/server"

export async function GET() {
  try {
    
    
    // Test 1: Check Search Console endpoint
    let searchConsoleResult
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'https://online-client-reporting.vercel.app'}/api/test/verify-search-console`)
      searchConsoleResult = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      }
    } catch (error: any) {
      searchConsoleResult = { error: error.message }
    }
    
    // Test 2: Check client creation endpoint
    let clientTestResult
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'https://online-client-reporting.vercel.app'}/api/admin/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Client',
          domain: 'https://test.com'
        })
      })
      clientTestResult = {
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text()
      }
    } catch (error: any) {
      clientTestResult = { error: error.message }
    }
    
    // Test 3: Check environment variables
    const envCheck = {
      NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || 'NOT_SET',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envCheck,
      searchConsoleTest: searchConsoleResult,
      clientCreationTest: clientTestResult,
      directUrls: {
        searchConsole: '/api/test/verify-search-console',
        clientApi: '/api/admin/clients',
        reportCreate: '/admin/reports/create'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}