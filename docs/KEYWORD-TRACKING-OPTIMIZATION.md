# Keyword Tracking Database Optimization Guide

## Overview

This document outlines the optimal database schema design for a comprehensive keyword tracking system that supports up to 30 keywords per client with weekly performance history, trend analysis, and efficient querying capabilities.

## Schema Design Highlights

### 1. Core Tables

#### Keyword Table
- **Purpose**: Stores keyword configuration and metadata
- **Key Features**:
  - Enforces 30-keyword limit per client via application logic
  - Priority-based ranking (1-30)
  - Status tracking (active/paused/archived)
  - Tag-based categorization for flexible grouping

#### KeywordPerformance Table
- **Purpose**: Weekly performance snapshots
- **Key Features**:
  - Stores comprehensive SERP data
  - Tracks position changes week-over-week
  - Records SERP features (featured snippets, PAA, etc.)
  - Maintains data source and confidence scoring

### 2. Indexing Strategy

#### Primary Indexes
```sql
-- Critical for performance queries
CREATE INDEX idx_keyword_client_status ON Keyword(clientReportId, trackingStatus);
CREATE INDEX idx_performance_keyword_week ON KeywordPerformance(keywordId, weekStartDate);
CREATE INDEX idx_performance_position ON KeywordPerformance(avgPosition);
```

#### Composite Indexes for Common Queries
```sql
-- Trend analysis
CREATE INDEX idx_trend_analysis ON KeywordPerformance(keywordId, weekStartDate, avgPosition);

-- Competitor comparison
CREATE INDEX idx_competitor ON CompetitorKeywordRank(competitorDomain, position, measuredAt);

-- Alert monitoring
CREATE INDEX idx_alerts ON KeywordAlert(alertType, isActive, lastTriggered);
```

### 3. Query Optimization Patterns

#### Pattern 1: Current Rankings Dashboard
```typescript
// Optimized single query for dashboard metrics
const dashboardData = await prisma.$queryRaw`
  WITH latest_performance AS (
    SELECT DISTINCT ON (keywordId)
      keywordId, avgPosition, impressions, clicks
    FROM KeywordPerformance
    ORDER BY keywordId, weekStartDate DESC
  )
  SELECT ... // aggregated metrics
`;
```

#### Pattern 2: Batch Updates
```typescript
// Efficient bulk insert with duplicate prevention
await prisma.$transaction(async (tx) => {
  await tx.keywordPerformance.createMany({
    data: performanceData,
    skipDuplicates: true
  });
});
```

### 4. Performance Optimizations

#### Data Retention Strategy
- **Detailed Data**: Keep 52 weeks (1 year)
- **Aggregated Monthly**: Years 2-3
- **Archive**: Data older than 3 years

#### Caching Layers
1. **Application Cache (Redis)**
   - Current week: No cache (real-time)
   - Previous 4 weeks: 1-hour TTL
   - Older data: 24-hour TTL

2. **Database Views**
   - `LatestKeywordPerformance`: Current rankings
   - `KeywordTrends`: 12-week trend analysis

#### Partitioning Strategy
- Partition `KeywordPerformance` by `weekStartDate`
- Monthly partitions for datasets > 1M records

### 5. Scalability Considerations

#### Expected Data Volume
- **Per Client**: 30 keywords × 52 weeks = 1,560 records/year
- **1,000 Clients**: 1.56M records/year
- **5-Year Projection**: ~8M records

#### Performance Targets
- Dashboard load: < 200ms
- Keyword update: < 100ms per keyword
- Trend analysis: < 500ms for 12-week data
- Batch update: < 30s for 1,000 keywords

### 6. Advanced Features

#### Keyword Cannibalization Detection
```sql
-- Identify multiple URLs ranking for same keyword
SELECT keyword, COUNT(DISTINCT rankingUrl) as url_count
FROM KeywordPerformance
WHERE weekStartDate >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY keyword
HAVING COUNT(DISTINCT rankingUrl) > 1;
```

#### Striking Distance Keywords
```sql
-- Keywords on page 2 (positions 11-20)
SELECT * FROM KeywordPerformance
WHERE avgPosition BETWEEN 11 AND 20
ORDER BY avgPosition ASC;
```

#### Alert System
- Position drop/gain alerts
- SERP feature changes
- Competitor movement tracking
- Customizable thresholds

### 7. Implementation Checklist

#### Initial Setup
- [ ] Run Prisma migration to create tables
- [ ] Generate Prisma client
- [ ] Set up Redis for caching
- [ ] Configure monitoring alerts

#### Data Import
- [ ] Import existing keyword data
- [ ] Backfill historical performance
- [ ] Validate data integrity
- [ ] Set up weekly update jobs

#### Performance Testing
- [ ] Load test with 10,000+ keywords
- [ ] Verify query response times
- [ ] Test concurrent updates
- [ ] Monitor database connections

#### Monitoring Setup
- [ ] Query performance monitoring
- [ ] Alert configuration
- [ ] Dashboard metrics
- [ ] Error tracking

### 8. Migration Commands

```bash
# Generate Prisma client with new models
npm run prisma:generate

# Create and apply migration
npx prisma migrate dev --name add-keyword-tracking

# For production
npx prisma migrate deploy
```

### 9. API Endpoints to Implement

```typescript
// Keyword Management
POST   /api/keywords                  // Add keyword
PUT    /api/keywords/:id              // Update keyword
DELETE /api/keywords/:id              // Remove keyword
GET    /api/keywords/client/:id       // Get client keywords

// Performance Data
GET    /api/keywords/:id/performance  // Get performance history
POST   /api/keywords/batch-update     // Batch update performance
GET    /api/keywords/:id/trends       // Get trend analysis

// Analytics
GET    /api/keywords/dashboard/:clientId  // Dashboard metrics
GET    /api/keywords/striking-distance    // Page 2 keywords
GET    /api/keywords/cannibalization      // Cannibalization issues

// Alerts
POST   /api/keywords/:id/alerts          // Create alert
GET    /api/keywords/alerts/triggered    // Get triggered alerts
```

### 10. Best Practices

#### Query Optimization
1. Always use indexes for WHERE clauses
2. Limit SELECT fields to required columns
3. Use pagination for large result sets
4. Implement query result caching
5. Monitor slow query logs

#### Data Integrity
1. Use transactions for related updates
2. Implement retry logic for failed updates
3. Validate data before insertion
4. Maintain audit logs for changes
5. Regular database backups

#### Performance Monitoring
1. Track query execution times
2. Monitor connection pool usage
3. Set up alerting for slow queries
4. Regular index maintenance
5. Analyze query plans

## Conclusion

This keyword tracking schema provides a robust, scalable foundation for comprehensive SEO keyword monitoring. The design emphasizes query performance through strategic indexing, efficient data structures, and intelligent caching strategies while maintaining flexibility for future enhancements.