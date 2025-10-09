/**
 * Centralized metric calculation utilities
 * Provides consistent, tested calculation methods for all metrics
 */

/**
 * Calculate CTR (Click-Through Rate) properly
 * CTR should always be calculated as total clicks / total impressions
 * Never average CTR values directly
 */
export function calculateCTR(clicks: number, impressions: number): number {
  // Validate inputs
  if (typeof clicks !== 'number' || typeof impressions !== 'number') {
    console.warn('Invalid inputs for CTR calculation:', { clicks, impressions });
    return 0;
  }

  // Handle division by zero
  if (impressions === 0) {
    return 0;
  }

  // Calculate CTR as a decimal (0-1 range)
  const ctr = clicks / impressions;

  // Ensure result is valid
  if (!isFinite(ctr)) {
    return 0;
  }

  // CTR cannot exceed 1 (100%)
  return Math.min(1, Math.max(0, ctr));
}

/**
 * Calculate aggregate CTR from multiple data points
 * Properly sums clicks and impressions before calculating
 */
export function calculateAggregateCTR(dataPoints: Array<{ clicks?: number; impressions?: number }>): number {
  if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
    return 0;
  }

  const totals = dataPoints.reduce<{ clicks: number; impressions: number }>(
    (acc, item) => {
      acc.clicks += item.clicks || 0;
      acc.impressions += item.impressions || 0;
      return acc;
    },
    { clicks: 0, impressions: 0 }
  );

  return calculateCTR(totals.clicks, totals.impressions);
}

/**
 * Calculate percentage change for general metrics
 * Positive change means improvement
 */
export function calculatePercentageChange(current: number, previous: number): number {
  // Validate inputs
  if (typeof current !== 'number' || typeof previous !== 'number') {
    console.warn('Invalid inputs for percentage change:', { current, previous });
    return 0;
  }

  if (!isFinite(current) || !isFinite(previous)) {
    return 0;
  }

  // Handle zero baseline
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  // Calculate percentage change
  const change = ((current - previous) / previous) * 100;

  // Validate result
  if (!isFinite(change)) {
    return 0;
  }

  // Cap at reasonable limits (-100% to +999%)
  return Math.max(-100, Math.min(999, change));
}

/**
 * Calculate percentage change for position metrics
 * Lower position is better, so we invert the calculation
 * Going from position 20 to 10 is a 50% improvement
 */
export function calculatePositionChange(currentPosition: number, previousPosition: number): number {
  // Validate inputs
  if (typeof currentPosition !== 'number' || typeof previousPosition !== 'number') {
    console.warn('Invalid inputs for position change:', { currentPosition, previousPosition });
    return 0;
  }

  // Filter out invalid positions
  if (currentPosition <= 0 && previousPosition <= 0) {
    return 0; // Both invalid
  }

  // Handle cases where one position is invalid
  if (previousPosition <= 0) {
    // No previous data, can't calculate change
    return 0;
  }

  if (currentPosition <= 0) {
    // Lost all rankings (very bad)
    return -100;
  }

  // Calculate improvement (lower is better for position)
  // If position improved from 20 to 10: (20-10)/20 = 50% improvement
  // If position worsened from 10 to 20: (10-20)/10 = -100% decline
  const improvement = ((previousPosition - currentPosition) / previousPosition) * 100;

  // Validate result
  if (!isFinite(improvement)) {
    return 0;
  }

  // Cap at reasonable limits
  return Math.max(-100, Math.min(999, improvement));
}

/**
 * Calculate average position from multiple data points
 * Filters out invalid positions (0 or negative)
 */
export function calculateAveragePosition(positions: number[]): number {
  if (!Array.isArray(positions) || positions.length === 0) {
    return 0;
  }

  // Filter out invalid positions
  const validPositions = positions.filter(pos => pos > 0 && isFinite(pos));

  if (validPositions.length === 0) {
    return 0;
  }

  const sum = validPositions.reduce((acc, pos) => acc + pos, 0);
  return sum / validPositions.length;
}

/**
 * Calculate weighted average for rate metrics
 * Used for bounce rate, engagement rate, etc.
 */
export function calculateWeightedAverage(
  values: Array<{ value: number; weight: number }>
): number {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  let totalWeight = 0;
  let weightedSum = 0;

  for (const item of values) {
    const value = item.value || 0;
    const weight = item.weight || 0;

    if (weight > 0 && isFinite(value) && isFinite(weight)) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return 0;
  }

  return weightedSum / totalWeight;
}

/**
 * Calculate bounce rate from sessions data
 */
export function calculateBounceRate(bouncedSessions: number, totalSessions: number): number {
  if (typeof bouncedSessions !== 'number' || typeof totalSessions !== 'number') {
    return 0;
  }

  if (totalSessions === 0) {
    return 0;
  }

  const rate = bouncedSessions / totalSessions;

  // Bounce rate is between 0 and 1 (0-100%)
  return Math.min(1, Math.max(0, rate));
}

/**
 * Calculate engagement rate from engaged sessions
 */
export function calculateEngagementRate(engagedSessions: number, totalSessions: number): number {
  if (typeof engagedSessions !== 'number' || typeof totalSessions !== 'number') {
    return 0;
  }

  if (totalSessions === 0) {
    return 0;
  }

  const rate = engagedSessions / totalSessions;

  // Engagement rate is between 0 and 1 (0-100%)
  return Math.min(1, Math.max(0, rate));
}

/**
 * Format a decimal as a percentage string
 * @param value - Decimal value (0-1 range typically)
 * @param decimals - Number of decimal places
 * @param assumeDecimal - If true, assumes value is 0-1 range, otherwise 0-100
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  assumeDecimal: boolean = false
): string {
  if (typeof value !== 'number' || !isFinite(value)) {
    return '0.0%';
  }

  let percentage = value;

  // Convert to percentage if needed
  if (assumeDecimal) {
    percentage = value * 100;
  } else if (value > 0 && value < 1) {
    // Auto-detect: values between 0 and 1 (exclusive) are likely decimals
    percentage = value * 100;
  }

  // Ensure reasonable bounds
  percentage = Math.max(-999, Math.min(999, percentage));

  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format number with K/M suffixes
 */
export function formatCompactNumber(value: number): string {
  if (typeof value !== 'number' || !isFinite(value)) {
    return '0';
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return Math.round(value).toString();
}

/**
 * Convert seconds to formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (typeof seconds !== 'number' || !isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate trend direction based on change percentage
 */
export function getTrendDirection(
  changePercent: number,
  isInverseMetric: boolean = false
): 'up' | 'down' | 'neutral' {
  if (!isFinite(changePercent) || Math.abs(changePercent) < 0.01) {
    return 'neutral';
  }

  // For inverse metrics (like bounce rate, position), down is good
  if (isInverseMetric) {
    return changePercent > 0 ? 'down' : 'up';
  }

  // For normal metrics, up is good
  return changePercent > 0 ? 'up' : 'down';
}

/**
 * Validate if a value is likely a percentage (0-100) vs decimal (0-1)
 */
export function isLikelyPercentage(value: number): boolean {
  if (typeof value !== 'number' || !isFinite(value)) {
    return false;
  }

  // Values greater than 1 are definitely percentages
  if (value > 1) {
    return true;
  }

  // Values less than 0 are percentages (negative change)
  if (value < 0) {
    return true;
  }

  // Values exactly 0 or 1 are ambiguous, assume percentage
  return false;
}

/**
 * Safe division with fallback
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (typeof numerator !== 'number' || typeof denominator !== 'number') {
    return fallback;
  }

  if (denominator === 0 || !isFinite(numerator) || !isFinite(denominator)) {
    return fallback;
  }

  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}