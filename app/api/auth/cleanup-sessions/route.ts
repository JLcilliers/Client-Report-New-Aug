import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    
    // Delete all expired sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: now
        }
      }
    })
    
    // Also cleanup old GoogleTokens that might be orphaned
    // Find users who have no active sessions and tokens expired > 7 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const orphanedTokens = await prisma.googleTokens.deleteMany({
      where: {
        AND: [
          {
            expires_at: {
              lt: BigInt(sevenDaysAgo.getTime())
            }
          },
          {
            user: {
              sessions: {
                none: {
                  expires: {
                    gte: now
                  }
                }
              }
            }
          }
        ]
      }
    })
    
    return NextResponse.json({
      success: true,
      deletedSessions: deletedSessions.count,
      deletedTokens: orphanedTokens.count,
      cleanupTime: now.toISOString()
    })
    
  } catch (error: any) {
    console.error('Session cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to cleanup sessions",
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    
    // Count expired sessions
    const expiredSessions = await prisma.session.count({
      where: {
        expires: {
          lt: now
        }
      }
    })
    
    // Count active sessions
    const activeSessions = await prisma.session.count({
      where: {
        expires: {
          gte: now
        }
      }
    })
    
    // Count sessions expiring soon (within 24 hours)
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const expiringSoon = await prisma.session.count({
      where: {
        expires: {
          gte: now,
          lt: twentyFourHoursFromNow
        }
      }
    })
    
    // Get session statistics
    const sessionStats = await prisma.session.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      where: {
        expires: {
          gte: now
        }
      }
    })
    
    const totalUsers = sessionStats.length
    const averageSessionsPerUser = totalUsers > 0 
      ? sessionStats.reduce((sum, stat) => sum + stat._count.id, 0) / totalUsers 
      : 0
    
    return NextResponse.json({
      activeSessions,
      expiredSessions,
      expiringSoon,
      totalUsers,
      averageSessionsPerUser: Math.round(averageSessionsPerUser * 100) / 100,
      needsCleanup: expiredSessions > 0
    })
    
  } catch (error: any) {
    console.error('Session stats error:', error)
    return NextResponse.json({
      error: "Failed to get session statistics",
      details: error.message
    }, { status: 500 })
  }
}