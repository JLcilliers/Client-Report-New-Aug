/**
 * API Response Validation Utilities
 * Provides consistent validation and error handling for Google API responses
 */

/**
 * Validates Google Analytics API response structure
 */
export function validateAnalyticsResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    console.error('Invalid Analytics API response: not an object');
    return false;
  }

  // Check for error response
  if (response.error) {
    console.error('Analytics API error:', response.error);
    return false;
  }

  // Validate expected structure
  if (response.rows && !Array.isArray(response.rows)) {
    console.error('Invalid Analytics API response: rows is not an array');
    return false;
  }

  return true;
}

/**
 * Validates Search Console API response structure
 */
export function validateSearchConsoleResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    console.error('Invalid Search Console API response: not an object');
    return false;
  }

  // Check for error response
  if (response.error) {
    console.error('Search Console API error:', response.error);
    return false;
  }

  // Validate expected structure
  if (response.rows && !Array.isArray(response.rows)) {
    console.error('Invalid Search Console API response: rows is not an array');
    return false;
  }

  return true;
}

/**
 * Safely extracts metric value from Analytics API row
 */
export function extractAnalyticsMetric(
  row: any,
  metricIndex: number,
  defaultValue: number = 0
): number {
  try {
    if (!row || !row.metricValues || !Array.isArray(row.metricValues)) {
      return defaultValue;
    }

    const metric = row.metricValues[metricIndex];
    if (!metric || !metric.value) {
      return defaultValue;
    }

    const value = parseFloat(metric.value);
    return isFinite(value) ? value : defaultValue;
  } catch (error) {
    console.error(`Error extracting metric at index ${metricIndex}:`, error);
    return defaultValue;
  }
}

/**
 * Safely extracts dimension value from Analytics API row
 */
export function extractAnalyticsDimension(
  row: any,
  dimensionIndex: number,
  defaultValue: string = ''
): string {
  try {
    if (!row || !row.dimensionValues || !Array.isArray(row.dimensionValues)) {
      return defaultValue;
    }

    const dimension = row.dimensionValues[dimensionIndex];
    if (!dimension || !dimension.value) {
      return defaultValue;
    }

    return String(dimension.value);
  } catch (error) {
    console.error(`Error extracting dimension at index ${dimensionIndex}:`, error);
    return defaultValue;
  }
}

/**
 * Validates and normalizes Search Console metrics
 */
export function normalizeSearchConsoleMetrics(row: any): {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
} {
  const defaultMetrics = {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0
  };

  if (!row || typeof row !== 'object') {
    return defaultMetrics;
  }

  return {
    clicks: typeof row.clicks === 'number' ? row.clicks : 0,
    impressions: typeof row.impressions === 'number' ? row.impressions : 0,
    ctr: typeof row.ctr === 'number' ? row.ctr : 0,
    position: typeof row.position === 'number' && row.position > 0 ? row.position : 0
  };
}

/**
 * Validates date string format (YYYY-MM-DD)
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Safely calculates percentage change with bounds checking
 */
export function calculateSafePercentageChange(
  current: number,
  previous: number,
  maxChange: number = 999
): number {
  // Validate inputs
  if (typeof current !== 'number' || typeof previous !== 'number') {
    return 0;
  }

  if (!isFinite(current) || !isFinite(previous)) {
    return 0;
  }

  // Handle zero baseline
  if (previous === 0) {
    return current > 0 ? Math.min(100, maxChange) : 0;
  }

  // Calculate change
  const change = ((current - previous) / previous) * 100;

  // Validate result
  if (!isFinite(change)) {
    return 0;
  }

  // Apply bounds
  return Math.max(-100, Math.min(maxChange, change));
}

/**
 * Validates PageSpeed Insights response
 */
export function validatePageSpeedResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    console.error('Invalid PageSpeed API response: not an object');
    return false;
  }

  if (response.error) {
    console.error('PageSpeed API error:', response.error);
    return false;
  }

  if (!response.lighthouseResult) {
    console.error('Invalid PageSpeed API response: missing lighthouseResult');
    return false;
  }

  return true;
}

/**
 * Safely extracts PageSpeed score
 */
export function extractPageSpeedScore(
  response: any,
  category: string,
  defaultScore: number = 0
): number {
  try {
    if (!validatePageSpeedResponse(response)) {
      return defaultScore;
    }

    const score = response.lighthouseResult?.categories?.[category]?.score;
    if (typeof score !== 'number') {
      return defaultScore;
    }

    // Score is 0-1, convert to 0-100
    return Math.round(score * 100);
  } catch (error) {
    console.error(`Error extracting PageSpeed score for ${category}:`, error);
    return defaultScore;
  }
}

/**
 * Validates API quota response and checks for rate limiting
 */
export function checkApiQuotaError(error: any): {
  isQuotaError: boolean;
  retryAfter?: number;
  message?: string;
} {
  if (!error) {
    return { isQuotaError: false };
  }

  // Check for common quota error patterns
  const errorStr = JSON.stringify(error).toLowerCase();
  const quotaPatterns = [
    'quota',
    'rate limit',
    'too many requests',
    '429',
    'usage limit'
  ];

  const isQuotaError = quotaPatterns.some(pattern => errorStr.includes(pattern));

  if (isQuotaError) {
    // Try to extract retry-after information
    let retryAfter = 60; // Default to 60 seconds

    if (error.headers?.['retry-after']) {
      retryAfter = parseInt(error.headers['retry-after'], 10);
    } else if (error.response?.headers?.['retry-after']) {
      retryAfter = parseInt(error.response.headers['retry-after'], 10);
    }

    return {
      isQuotaError: true,
      retryAfter,
      message: error.message || 'API quota exceeded'
    };
  }

  return { isQuotaError: false };
}