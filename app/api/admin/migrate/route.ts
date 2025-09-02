import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if this is an admin request (you should add proper authentication here)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Migration] Starting database migration...')

    // Run Prisma migration to ensure all tables exist
    // This will create tables based on the Prisma schema
    const result = await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GoogleAccount" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "accessToken" TEXT NOT NULL,
        "refreshToken" TEXT,
        "expiresAt" INTEGER,
        "scope" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GoogleAccount_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "GoogleAccount_email_key" ON "GoogleAccount"("email");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "GoogleAccount_userId_idx" ON "GoogleAccount"("userId");
    `)

    // Check if the table was created successfully
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'GoogleAccount'
      );
    `

    console.log('[Migration] Migration completed successfully')

    return NextResponse.json({ 
      success: true,
      message: 'Migration completed successfully',
      tableExists: tableCheck
    })
  } catch (error: any) {
    console.error('[Migration] Error:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error.message 
    }, { status: 500 })
  }
}