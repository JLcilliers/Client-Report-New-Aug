import { 
  format, 
  subDays, 
  startOfDay, 
  endOfDay,
  parseISO,
  differenceInDays,
  addDays,
  isAfter,
  isBefore,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth
} from 'date-fns'

export type DateRangeOption = '7d' | '30d' | '90d' | 'custom'

export interface DateRangeValues {
  startDate: Date
  endDate: Date
  label: string
}

export function getDateRange(range: DateRangeOption, customStart?: Date, customEnd?: Date): DateRangeValues {
  const now = new Date()
  
  switch (range) {
    case '7d':
      return {
        startDate: startOfDay(subDays(now, 7)),
        endDate: endOfDay(now),
        label: 'Last 7 days'
      }
    case '30d':
      return {
        startDate: startOfDay(subDays(now, 30)),
        endDate: endOfDay(now),
        label: 'Last 30 days'
      }
    case '90d':
      return {
        startDate: startOfDay(subDays(now, 90)),
        endDate: endOfDay(now),
        label: 'Last 90 days'
      }
    case 'custom':
      if (!customStart || !customEnd) {
        // Default to last 30 days if custom dates not provided
        return getDateRange('30d')
      }
      return {
        startDate: startOfDay(customStart),
        endDate: endOfDay(customEnd),
        label: `${formatDate(customStart)} - ${formatDate(customEnd)}`
      }
    default:
      return getDateRange('30d')
  }
}

export function formatDate(date: Date | string, formatStr: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

export function formatDateForAPI(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getPreviousPeriod(startDate: Date, endDate: Date): { startDate: Date; endDate: Date } {
  const daysDiff = differenceInDays(endDate, startDate)
  return {
    startDate: subDays(startDate, daysDiff + 1),
    endDate: subDays(startDate, 1)
  }
}

export function calculatePercentageChange(current: number, previous: number): number {
  // Handle edge cases
  if (typeof current !== 'number' || typeof previous !== 'number') {
    console.warn('Invalid input to calculatePercentageChange:', { current, previous });
    return 0;
  }
  
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  
  const change = ((current - previous) / previous) * 100;
  
  // Handle Infinity and NaN
  if (!isFinite(change)) {
    return 0;
  }
  
  // Cap at reasonable limits (-100% to +999%)
  return Math.max(-100, Math.min(999, change));
}

export function formatPercentage(value: number, decimals: number = 1): string {
  // Handle invalid inputs
  if (typeof value !== 'number' || !isFinite(value)) {
    console.warn('Invalid value for formatPercentage:', value);
    return '0.0%';
  }
  
  // Determine if value is already a percentage or needs conversion
  // CTR from Google is typically 0-1, but percentage changes are already 0-100
  let percentage = value;
  
  // If value is between 0 and 1 (exclusive), likely a decimal that needs conversion
  // But if it's exactly 0 or 1, it could be either format
  if (value > 0 && value < 1) {
    percentage = value * 100;
  }
  
  // Ensure reasonable bounds
  percentage = Math.max(-999, Math.min(999, percentage));
  
  return `${percentage.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

export function getRelativeTimeLabel(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffInDays = differenceInDays(now, dateObj)
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

export function getCacheExpiry(hours: number = 24): Date {
  return addDays(new Date(), hours / 24)
}

export function isCacheExpired(expiryDate: Date | string): boolean {
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate
  return isAfter(new Date(), expiry)
}

export function getDateRangeForChart(range: DateRangeOption): Date[] {
  const { startDate, endDate } = getDateRange(range)
  const dates: Date[] = []
  let currentDate = startDate
  
  while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
    dates.push(new Date(currentDate))
    currentDate = addDays(currentDate, 1)
  }
  
  return dates
}

export function formatChartDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM dd')
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 })
  }
}

export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  }
}