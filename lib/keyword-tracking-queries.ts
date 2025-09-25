/**
 * Optimized Query Patterns for Keyword Tracking System
 *
 * This file demonstrates efficient query patterns for the keyword tracking schema
 * with a focus on performance optimization and scalability.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// OPTIMIZED QUERY PATTERNS
// ============================================

/**
 * 1. GET CURRENT KEYWORD RANKINGS (with caching)
 * Uses the latest performance data with efficient joins
 */
export async function getCurrentKeywordRankings(clientReportId: string) {
  return await prisma.keyword.findMany({
    where: {
      clientReportId,
      trackingStatus: 'active'
    },
    include: {
      performanceHistory: {
        orderBy: { weekStartDate: 'desc' },
        take: 1, // Only get latest week
        select: {
          avgPosition: true,
          positionChange: true,
          impressions: true,
          clicks: true,
          ctr: true,
          rankingUrl: true,
          featuredSnippet: true,
          weekStartDate: true
        }
      }
    },
    orderBy: { priority: 'asc' }
  });
}

/**
 * 2. GET WEEKLY TREND DATA (optimized for charts)
 * Efficiently fetches 12 weeks of data for trend analysis
 */
export async function getKeywordTrends(
  keywordId: string,
  weeks: number = 12
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));

  return await prisma.keywordPerformance.findMany({
    where: {
      keywordId,
      weekStartDate: { gte: startDate }
    },
    select: {
      weekStartDate: true,
      avgPosition: true,
      impressions: true,
      clicks: true,
      ctr: true,
      positionChange: true
    },
    orderBy: { weekStartDate: 'asc' }
  });
}

/**
 * 3. BATCH INSERT WEEKLY PERFORMANCE DATA
 * Optimized for bulk inserts during weekly updates
 */
export async function batchInsertPerformanceData(
  performanceData: Array<{
    keywordId: string;
    weekStartDate: Date;
    avgPosition: number;
    impressions: number;
    clicks: number;
    // ... other fields
  }>
) {
  // Use transaction for consistency
  return await prisma.$transaction(async (tx) => {
    // First, check for existing records to avoid duplicates
    const existingRecords = await tx.keywordPerformance.findMany({
      where: {
        OR: performanceData.map(d => ({
          keywordId: d.keywordId,
          weekStartDate: d.weekStartDate
        }))
      },
      select: { keywordId: true, weekStartDate: true }
    });

    const existingSet = new Set(
      existingRecords.map(r => `${r.keywordId}-${r.weekStartDate.toISOString()}`)
    );

    // Filter out existing records
    const newData = performanceData.filter(
      d => !existingSet.has(`${d.keywordId}-${d.weekStartDate.toISOString()}`)
    );

    // Batch insert new records
    if (newData.length > 0) {
      await tx.keywordPerformance.createMany({
        data: newData,
        skipDuplicates: true
      });
    }

    // Calculate position changes
    await updatePositionChanges(tx, newData.map(d => d.keywordId));

    return newData.length;
  });
}

/**
 * 4. DETECT KEYWORD CANNIBALIZATION
 * Identifies keywords with multiple ranking URLs
 */
export async function detectCannibalization(clientReportId: string) {
  const recentPerformance = await prisma.$queryRaw<Array<{
    keyword: string;
    urls: string[];
    url_count: number;
  }>>`
    SELECT
      k.keyword,
      ARRAY_AGG(DISTINCT kp."rankingUrl") as urls,
      COUNT(DISTINCT kp."rankingUrl") as url_count
    FROM "Keyword" k
    JOIN "KeywordPerformance" kp ON k.id = kp."keywordId"
    WHERE
      k."clientReportId" = ${clientReportId}
      AND kp."weekStartDate" >= CURRENT_DATE - INTERVAL '28 days'
      AND kp."rankingUrl" IS NOT NULL
    GROUP BY k.id, k.keyword
    HAVING COUNT(DISTINCT kp."rankingUrl") > 1
  `;

  // Create cannibalization records
  for (const issue of recentPerformance) {
    await prisma.keywordCannibalization.upsert({
      where: {
        clientReportId_keyword: {
          clientReportId,
          keyword: issue.keyword
        }
      },
      update: {
        affectedUrls: JSON.stringify(issue.urls),
        severity: issue.url_count > 3 ? 'high' : issue.url_count > 2 ? 'medium' : 'low',
        status: 'active'
      },
      create: {
        clientReportId,
        keyword: issue.keyword,
        affectedUrls: JSON.stringify(issue.urls),
        severity: issue.url_count > 3 ? 'high' : issue.url_count > 2 ? 'medium' : 'low'
      }
    });
  }

  return recentPerformance;
}

/**
 * 5. GET COMPETITOR COMPARISON
 * Efficiently compares keyword rankings with competitors
 */
export async function getCompetitorComparison(
  keywordId: string,
  limit: number = 5
) {
  const latestDate = await prisma.competitorKeywordRank.findFirst({
    where: { keywordId },
    orderBy: { measuredAt: 'desc' },
    select: { measuredAt: true }
  });

  if (!latestDate) return [];

  return await prisma.competitorKeywordRank.findMany({
    where: {
      keywordId,
      measuredAt: latestDate.measuredAt,
      position: { lte: 20 } // Only top 20 positions
    },
    orderBy: { position: 'asc' },
    take: limit,
    select: {
      competitorDomain: true,
      position: true,
      url: true,
      title: true
    }
  });
}

/**
 * 6. AGGREGATE KEYWORD GROUP PERFORMANCE
 * Calculates group-level metrics efficiently
 */
export async function calculateGroupPerformance(groupId: string) {
  const group = await prisma.keywordGroup.findUnique({
    where: { id: groupId },
    select: { keywordIds: true }
  });

  if (!group) return null;

  const keywordIds = JSON.parse(group.keywordIds) as string[];
  const weekStart = getWeekStart(new Date());

  const performance = await prisma.$queryRaw<{
    avgPosition: number;
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    improved: number;
    declined: number;
    stable: number;
  }>`
    SELECT
      AVG(kp."avgPosition") as "avgPosition",
      SUM(kp."impressions") as "totalImpressions",
      SUM(kp."clicks") as "totalClicks",
      AVG(kp."ctr") as "avgCtr",
      COUNT(CASE WHEN kp."positionChange" > 0 THEN 1 END) as improved,
      COUNT(CASE WHEN kp."positionChange" < 0 THEN 1 END) as declined,
      COUNT(CASE WHEN kp."positionChange" = 0 THEN 1 END) as stable
    FROM "KeywordPerformance" kp
    WHERE
      kp."keywordId" = ANY(${keywordIds}::text[])
      AND kp."weekStartDate" = ${weekStart}
  `;

  return performance;
}

/**
 * 7. FIND STRIKING DISTANCE KEYWORDS
 * Keywords ranking between positions 11-20 (page 2)
 */
export async function getStrikingDistanceKeywords(clientReportId: string) {
  return await prisma.$queryRaw`
    SELECT
      k.id,
      k.keyword,
      k."searchVolume",
      lkp."avgPosition",
      lkp."impressions",
      lkp."clicks",
      lkp."rankingUrl",
      ROUND(((11 - lkp."avgPosition") / 11 * 100)::numeric, 2) as "distanceToPage1"
    FROM "Keyword" k
    JOIN LATERAL (
      SELECT *
      FROM "KeywordPerformance" kp
      WHERE kp."keywordId" = k.id
      ORDER BY kp."weekStartDate" DESC
      LIMIT 1
    ) lkp ON true
    WHERE
      k."clientReportId" = ${clientReportId}
      AND k."trackingStatus" = 'active'
      AND lkp."avgPosition" BETWEEN 11 AND 20
    ORDER BY lkp."avgPosition" ASC
  `;
}

/**
 * 8. CHECK AND TRIGGER ALERTS
 * Efficiently checks for alert conditions
 */
export async function checkKeywordAlerts(keywordId: string) {
  const alerts = await prisma.keywordAlert.findMany({
    where: {
      keywordId,
      isActive: true
    }
  });

  const latestPerformance = await prisma.keywordPerformance.findFirst({
    where: { keywordId },
    orderBy: { weekStartDate: 'desc' }
  });

  const previousPerformance = await prisma.keywordPerformance.findFirst({
    where: {
      keywordId,
      weekStartDate: { lt: latestPerformance?.weekStartDate }
    },
    orderBy: { weekStartDate: 'desc' }
  });

  const triggeredAlerts = [];

  for (const alert of alerts) {
    let shouldTrigger = false;
    let changeDescription = '';

    if (!latestPerformance || !previousPerformance) continue;

    switch (alert.alertType) {
      case 'position_drop':
        if (alert.threshold &&
            latestPerformance.avgPosition - previousPerformance.avgPosition > alert.threshold) {
          shouldTrigger = true;
          changeDescription = `Position dropped from ${previousPerformance.avgPosition} to ${latestPerformance.avgPosition}`;
        }
        break;

      case 'position_gain':
        if (alert.threshold &&
            previousPerformance.avgPosition - latestPerformance.avgPosition > alert.threshold) {
          shouldTrigger = true;
          changeDescription = `Position improved from ${previousPerformance.avgPosition} to ${latestPerformance.avgPosition}`;
        }
        break;

      case 'serp_feature':
        if (latestPerformance.featuredSnippet && !previousPerformance.featuredSnippet) {
          shouldTrigger = true;
          changeDescription = 'Gained featured snippet';
        }
        break;
    }

    if (shouldTrigger) {
      await prisma.keywordAlertHistory.create({
        data: {
          alertId: alert.id,
          previousValue: String(previousPerformance.avgPosition),
          currentValue: String(latestPerformance.avgPosition),
          changeDescription,
          severity: Math.abs(latestPerformance.avgPosition - previousPerformance.avgPosition) > 10
            ? 'critical'
            : 'warning'
        }
      });

      await prisma.keywordAlert.update({
        where: { id: alert.id },
        data: {
          lastTriggered: new Date(),
          notificationsSent: { increment: 1 }
        }
      });

      triggeredAlerts.push({ alert, changeDescription });
    }
  }

  return triggeredAlerts;
}

/**
 * 9. DATA RETENTION AND ARCHIVAL
 * Archives old data to maintain performance
 */
export async function archiveOldPerformanceData(retentionWeeks: number = 52) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (retentionWeeks * 7));

  // Archive to a separate table or cold storage
  const oldData = await prisma.keywordPerformance.findMany({
    where: { weekStartDate: { lt: cutoffDate } },
    take: 1000 // Process in batches
  });

  if (oldData.length > 0) {
    // Here you would typically:
    // 1. Write to archive storage (S3, cold database, etc.)
    // 2. Create monthly aggregates
    // 3. Delete from main table

    // For this example, we'll just show the delete
    await prisma.keywordPerformance.deleteMany({
      where: {
        id: { in: oldData.map(d => d.id) }
      }
    });
  }

  return oldData.length;
}

/**
 * 10. PERFORMANCE DASHBOARD QUERY
 * Single optimized query for dashboard metrics
 */
export async function getDashboardMetrics(clientReportId: string) {
  const currentWeek = getWeekStart(new Date());
  const lastWeek = getWeekStart(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  return await prisma.$queryRaw`
    WITH current_week AS (
      SELECT
        COUNT(DISTINCT k.id) as total_keywords,
        AVG(kp."avgPosition") as avg_position,
        SUM(kp."impressions") as total_impressions,
        SUM(kp."clicks") as total_clicks,
        COUNT(CASE WHEN kp."avgPosition" <= 10 THEN 1 END) as top10_count,
        COUNT(CASE WHEN kp."featuredSnippet" THEN 1 END) as featured_snippets
      FROM "Keyword" k
      LEFT JOIN "KeywordPerformance" kp ON k.id = kp."keywordId"
        AND kp."weekStartDate" = ${currentWeek}
      WHERE k."clientReportId" = ${clientReportId}
        AND k."trackingStatus" = 'active'
    ),
    last_week AS (
      SELECT
        AVG(kp."avgPosition") as avg_position,
        SUM(kp."impressions") as total_impressions,
        SUM(kp."clicks") as total_clicks,
        COUNT(CASE WHEN kp."avgPosition" <= 10 THEN 1 END) as top10_count
      FROM "Keyword" k
      LEFT JOIN "KeywordPerformance" kp ON k.id = kp."keywordId"
        AND kp."weekStartDate" = ${lastWeek}
      WHERE k."clientReportId" = ${clientReportId}
        AND k."trackingStatus" = 'active'
    ),
    cannibalization AS (
      SELECT COUNT(*) as issues
      FROM "KeywordCannibalization"
      WHERE "clientReportId" = ${clientReportId}
        AND status = 'active'
    )
    SELECT
      cw.*,
      lw.avg_position as last_week_avg_position,
      lw.total_impressions as last_week_impressions,
      lw.total_clicks as last_week_clicks,
      lw.top10_count as last_week_top10,
      c.issues as cannibalization_issues
    FROM current_week cw, last_week lw, cannibalization c
  `;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function updatePositionChanges(
  tx: any,
  keywordIds: string[]
) {
  for (const keywordId of keywordIds) {
    const performances = await tx.keywordPerformance.findMany({
      where: { keywordId },
      orderBy: { weekStartDate: 'desc' },
      take: 2
    });

    if (performances.length === 2) {
      const change = performances[1].avgPosition - performances[0].avgPosition;
      await tx.keywordPerformance.update({
        where: { id: performances[0].id },
        data: { positionChange: change }
      });
    }
  }
}

// ============================================
// CACHING LAYER EXAMPLES
// ============================================

import { Redis } from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

/**
 * Cached query wrapper for expensive operations
 */
export async function getCachedKeywordData(
  clientReportId: string,
  cacheKey: string,
  ttl: number = 3600 // 1 hour default
) {
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const data = await getCurrentKeywordRankings(clientReportId);
  await redis.setex(cacheKey, ttl, JSON.stringify(data));
  return data;
}

/**
 * Cache invalidation for real-time updates
 */
export async function invalidateKeywordCache(clientReportId: string) {
  const pattern = `keywords:${clientReportId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}