export interface DataValidationResult {
  isValid: boolean
  issues: string[]
  warnings: string[]
  dataFreshness: {
    latestDataDate: Date | null
    daysBehind: number
    isStale: boolean
  }
  metrics: {
    hasData: boolean
    ctrValid: boolean
    clicksValid: boolean
    impressionsValid: boolean
  }
}

export function validateSearchConsoleData(data: any): DataValidationResult {
  const result: DataValidationResult = {
    isValid: true,
    issues: [],
    warnings: [],
    dataFreshness: {
      latestDataDate: null,
      daysBehind: 0,
      isStale: false
    },
    metrics: {
      hasData: false,
      ctrValid: true,
      clicksValid: true,
      impressionsValid: true
    }
  }

  // Check if we have any data
  if (!data || typeof data !== 'object') {
    result.isValid = false
    result.issues.push('No data received from Search Console API')
    return result
  }

  // Check summary metrics
  if (data.summary) {
    const { clicks, impressions, ctr, position } = data.summary
    
    // Validate clicks
    if (typeof clicks === 'number' && clicks >= 0) {
      result.metrics.clicksValid = true
      result.metrics.hasData = true
    } else if (clicks !== undefined) {
      result.issues.push(`Invalid clicks value: ${clicks}`)
      result.metrics.clicksValid = false
    }
    
    // Validate impressions
    if (typeof impressions === 'number' && impressions >= 0) {
      result.metrics.impressionsValid = true
      result.metrics.hasData = true
    } else if (impressions !== undefined) {
      result.issues.push(`Invalid impressions value: ${impressions}`)
      result.metrics.impressionsValid = false
    }
    
    // Validate CTR
    if (typeof ctr === 'number') {
      // CTR should be between 0 and 1 (0-100%)
      if (ctr < 0 || ctr > 1) {
        result.warnings.push(`CTR value out of expected range (0-1): ${ctr}`)
      }
      
      // Check CTR calculation
      if (impressions > 0) {
        const calculatedCtr = clicks / impressions
        const ctrDifference = Math.abs(ctr - calculatedCtr)
        
        if (ctrDifference > 0.01) { // Allow 1% tolerance
          result.issues.push(`CTR mismatch: reported ${ctr}, calculated ${calculatedCtr}`)
          result.metrics.ctrValid = false
        }
      } else if (clicks > 0) {
        result.issues.push('Clicks exist but no impressions - data inconsistency')
        result.metrics.ctrValid = false
      }
    }
    
    // Check for impossible zero CTR
    if (ctr === 0 && clicks > 0) {
      result.issues.push('CTR is 0 but clicks exist - calculation error')
      result.metrics.ctrValid = false
    }
  }

  // Check data freshness from byDate array
  if (data.byDate && Array.isArray(data.byDate) && data.byDate.length > 0) {
    // Find the latest date in the data
    let latestDate: Date | null = null
    
    for (const item of data.byDate) {
      const dateStr = item.keys?.[0] || item.date
      if (dateStr) {
        const itemDate = new Date(dateStr)
        if (!latestDate || itemDate > latestDate) {
          latestDate = itemDate
        }
      }
    }
    
    if (latestDate) {
      result.dataFreshness.latestDataDate = latestDate
      
      // Calculate days behind
      const today = new Date()
      const daysDiff = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24))
      result.dataFreshness.daysBehind = daysDiff
      
      // Google Search Console typically has 2-3 day delay
      if (daysDiff > 4) {
        result.warnings.push(`Data is ${daysDiff} days old (latest: ${latestDate.toISOString().split('T')[0]})`)
        result.dataFreshness.isStale = true
      } else if (daysDiff > 2) {
        // This is normal for Search Console
        console.log(`Search Console data is ${daysDiff} days behind - this is normal`)
      }
    }
  } else {
    result.warnings.push('No date-based data available')
  }

  // Set overall validity
  result.isValid = result.issues.length === 0

  return result
}

export function getOptimalDateRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  
  // Google Search Console typically has 2-3 day data delay
  // Set end date to 3 days ago to ensure we get data
  endDate.setDate(endDate.getDate() - 3)
  
  // Set start date to 30 days before the adjusted end date
  startDate.setDate(endDate.getDate() - 30)
  
  return { startDate, endDate }
}

export function formatDateForGoogleAPI(date: Date): string {
  // Google APIs expect YYYY-MM-DD format
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return clicks / impressions
}

export function formatCTRForDisplay(ctr: number, isPercentage: boolean = false): string {
  // If CTR is already a percentage (0-100), use as is
  // If CTR is a decimal (0-1), multiply by 100
  const percentage = isPercentage ? ctr : ctr * 100
  return `${percentage.toFixed(2)}%`
}

export function debugLogSearchConsoleResponse(response: any, source: string = 'Unknown') {
  console.group(`[Search Console Debug - ${source}]`)
  console.log('Timestamp:', new Date().toISOString())
  
  if (response?.rows && Array.isArray(response.rows)) {
    console.log('Total rows:', response.rows.length)
    
    // Log first 3 rows as sample
    console.log('Sample data (first 3 rows):')
    response.rows.slice(0, 3).forEach((row: any, index: number) => {
      console.log(`Row ${index + 1}:`, {
        keys: row.keys,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        calculatedCTR: row.impressions > 0 ? (row.clicks / row.impressions) : 0
      })
    })
    
    // Calculate aggregate metrics
    const totals = response.rows.reduce((acc: any, row: any) => ({
      clicks: acc.clicks + (row.clicks || 0),
      impressions: acc.impressions + (row.impressions || 0)
    }), { clicks: 0, impressions: 0 })
    
    console.log('Aggregate totals:', {
      totalClicks: totals.clicks,
      totalImpressions: totals.impressions,
      calculatedCTR: totals.impressions > 0 ? (totals.clicks / totals.impressions) : 0,
      calculatedCTRPercentage: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + '%' : '0%'
    })
  } else {
    console.log('No rows data in response')
    console.log('Raw response:', response)
  }
  
  console.groupEnd()
}