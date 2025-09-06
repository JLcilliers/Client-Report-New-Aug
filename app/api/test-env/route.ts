// app/api/test-env/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || 'NOT ON VERCEL',
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET'
    },
    dbUrl: process.env.DATABASE_URL ? {
      hasPostgres: process.env.DATABASE_URL.includes('postgresql'),
      hasPrisma: process.env.DATABASE_URL.includes('prisma'),
      hasFile: process.env.DATABASE_URL.includes('file:')
    } : null
  });
}