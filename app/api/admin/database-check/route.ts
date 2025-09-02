import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Simple auth check - in production, use proper authentication
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Database Check] Checking database tables...')

    // Check which tables exist
    const tables: any = {}
    
    // Check User table
    try {
      const userCount = await prisma.user.count()
      tables.User = { exists: true, count: userCount }
    } catch (e) {
      tables.User = { exists: false, error: (e as Error).message }
    }

    // Check GoogleAccount table
    try {
      const googleAccountCount = await prisma.googleAccount.count()
      tables.GoogleAccount = { exists: true, count: googleAccountCount }
    } catch (e) {
      tables.GoogleAccount = { exists: false, error: (e as Error).message }
    }

    // Check GoogleTokens table
    try {
      const googleTokensCount = await prisma.googleTokens.count()
      tables.GoogleTokens = { exists: true, count: googleTokensCount }
    } catch (e) {
      tables.GoogleTokens = { exists: false, error: (e as Error).message }
    }

    // Check ClientReport table
    try {
      const clientReportCount = await prisma.clientReport.count()
      tables.ClientReport = { exists: true, count: clientReportCount }
    } catch (e) {
      tables.ClientReport = { exists: false, error: (e as Error).message }
    }

    // Get database provider info
    const databaseUrl = process.env.DATABASE_URL || ''
    const isPostgres = databaseUrl.includes('postgresql') || databaseUrl.includes('postgres')
    const isSQLite = databaseUrl.includes('sqlite') || databaseUrl.includes('file:')

    return NextResponse.json({
      success: true,
      database: {
        provider: isPostgres ? 'PostgreSQL' : isSQLite ? 'SQLite' : 'Unknown',
        connectionString: databaseUrl.substring(0, 20) + '...',
      },
      tables,
      recommendations: {
        GoogleAccount: !tables.GoogleAccount.exists ? 
          'Run migration: curl -X GET https://searchsignal.online/api/admin/migrate -H "Authorization: Bearer YOUR_SECRET"' : 
          'Table exists and ready',
      }
    })
  } catch (error: any) {
    console.error('[Database Check] Error:', error)
    return NextResponse.json({ 
      error: 'Database check failed',
      details: error.message 
    }, { status: 500 })
  }
}