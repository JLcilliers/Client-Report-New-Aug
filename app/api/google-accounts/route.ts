import { NextResponse } from 'next/server';

export async function GET() {
  // For now, just return a test response
  return NextResponse.json({
    accounts: [],
    message: "Google accounts endpoint working"
  });
}