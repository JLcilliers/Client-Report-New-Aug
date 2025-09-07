/**
 * Calculate period-over-period comparisons for metrics
 */

export interface ComparisonMetrics {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'neutral'
}

export interface PeriodComparison {
  clicks?: ComparisonMetrics
  impressions?: ComparisonMetrics
  ctr?: ComparisonMetrics
  position?: ComparisonMetrics
  users?: ComparisonMetrics
  sessions?: ComparisonMetrics
  pageviews?: ComparisonMetrics
  bounceRate?: ComparisonMetrics
  avgSessionDuration?: ComparisonMetrics
  newUsers?: ComparisonMetrics
}

/**
 * Calculate comparison between two values
 */
export function calculateComparison(current: number, previous: number): ComparisonMetrics {
  const change = current - previous
  const changePercent = previous !== 0 ? (change / previous) * 100 : current > 0 ? 100 : 0
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  
  return {
    current,
    previous,
    change,
    changePercent: parseFloat(changePercent.toFixed(2)), // FIXED: Round to 2 decimals without double * 100
    trend
  }
}

/**
 * Calculate comparisons for Search Console metrics
 */
export function calculateSearchConsoleComparisons(
  currentData: any,
  previousData: any
): PeriodComparison {
  return {
    clicks: calculateComparison(
      currentData?.clicks || 0,
      previousData?.clicks || 0
    ),
    impressions: calculateComparison(
      currentData?.impressions || 0,
      previousData?.impressions || 0
    ),
    ctr: calculateComparison(
      currentData?.ctr || 0,
      previousData?.ctr || 0
    ),
    position: calculateComparison(
      currentData?.position || 0,
      previousData?.position || 0
    )
  }
}

/**
 * Calculate comparisons for Analytics metrics
 */
export function calculateAnalyticsComparisons(
  currentData: any,
  previousData: any
): PeriodComparison {
  return {
    users: calculateComparison(
      currentData?.users || 0,
      previousData?.users || 0
    ),
    sessions: calculateComparison(
      currentData?.sessions || 0,
      previousData?.sessions || 0
    ),
    pageviews: calculateComparison(
      currentData?.pageviews || 0,
      previousData?.pageviews || 0
    ),
    bounceRate: calculateComparison(
      currentData?.bounceRate || 0,
      previousData?.bounceRate || 0
    ),
    avgSessionDuration: calculateComparison(
      currentData?.avgSessionDuration || 0,
      previousData?.avgSessionDuration || 0
    ),
    newUsers: calculateComparison(
      currentData?.newUsers || 0,
      previousData?.newUsers || 0
    )
  }
}

/**
 * Aggregate metrics from daily data for a specific period
 */
export function aggregateMetricsForPeriod(
  dailyData: any[],
  startDate: Date,
  endDate: Date,
  metricsType: 'searchConsole' | 'analytics'
): any {
  const filtered = dailyData.filter(item => {
    const itemDate = new Date(item.date || item.keys?.[0])
    return itemDate >= startDate && itemDate <= endDate
  })
  
  if (metricsType === 'searchConsole') {
    return {
      clicks: filtered.reduce((sum, item) => sum + (item.clicks || 0), 0),
      impressions: filtered.reduce((sum, item) => sum + (item.impressions || 0), 0),
      ctr: filtered.length > 0 
        ? filtered.reduce((sum, item) => sum + (item.ctr || 0), 0) / filtered.length 
        : 0,
      position: filtered.length > 0
        ? filtered.reduce((sum, item) => sum + (item.position || 0), 0) / filtered.length
        : 0
    }
  } else {
    return {
      users: filtered.reduce((sum, item) => sum + (item.users || 0), 0),
      sessions: filtered.reduce((sum, item) => sum + (item.sessions || 0), 0),
      pageviews: filtered.reduce((sum, item) => sum + (item.pageviews || 0), 0),
      bounceRate: filtered.length > 0
        ? filtered.reduce((sum, item) => sum + (item.bounceRate || 0), 0) / filtered.length
        : 0,
      avgSessionDuration: filtered.length > 0
        ? filtered.reduce((sum, item) => sum + (item.avgSessionDuration || 0), 0) / filtered.length
        : 0,
      newUsers: filtered.reduce((sum, item) => sum + (item.newUsers || 0), 0)
    }
  }
}

/**
 * Format comparison for display
 */
export function formatComparisonDisplay(comparison: ComparisonMetrics): string {
  const sign = comparison.trend === 'up' ? '+' : comparison.trend === 'down' ? '-' : ''
  return `${sign}${Math.abs(comparison.changePercent)}%`
}

/**
 * Get trend icon/color based on metric type and trend
 */
export function getTrendIndicator(
  metricName: string,
  trend: 'up' | 'down' | 'neutral'
): { icon: string; color: string } {
  // For some metrics, down is good (e.g., bounce rate, position)
  const inverseMetrics = ['bounceRate', 'position', 'exitRate']
  const isInverse = inverseMetrics.includes(metricName)
  
  if (trend === 'neutral') {
    return { icon: '→', color: 'gray' }
  }
  
  if (trend === 'up') {
    return {
      icon: '↑',
      color: isInverse ? 'red' : 'green'
    }
  } else {
    return {
      icon: '↓',
      color: isInverse ? 'green' : 'red'
    }
  }
}