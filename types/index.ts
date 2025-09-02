export interface Client {
  id: string
  name: string
  domain: string
  report_token: string
  settings: ClientSettings
  created_at: string
  updated_at: string
}

export interface ClientSettings {
  reportSections: ReportSection[]
}

export type ReportSection = 'overview' | 'traffic' | 'keywords' | 'technical' | 'content'

export interface GoogleCredentials {
  id: string
  client_id: string
  access_token: string | null
  refresh_token: string | null
  token_expiry: string | null
  gsc_site_url: string | null
  ga4_property_id: string | null
  created_at: string
  updated_at: string
}

export interface MetricsCache {
  id: string
  client_id: string
  metric_type: MetricType
  date_range: DateRange
  data: any
  expires_at: string
  created_at: string
}

export type MetricType = 
  | 'gsc_performance' 
  | 'ga4_traffic' 
  | 'pagespeed' 
  | 'gsc_queries'
  | 'gsc_pages'
  | 'ga4_sources'
  | 'ga4_landing_pages'

export type DateRange = '7d' | '30d' | '90d' | 'custom'

export interface HistoricalMetrics {
  id: string
  client_id: string
  date: string
  metrics: DailyMetrics
  created_at: string
}

export interface DailyMetrics {
  clicks: number
  impressions: number
  ctr: number
  position: number
  users: number
  sessions: number
  pageviews: number
  bounce_rate: number
  avg_session_duration: number
}

export interface AdminUser {
  id: string
  email: string
  created_at: string
}

// Google Search Console types
export interface GSCPerformanceData {
  rows: GSCRow[]
  responseAggregationType: string
}

export interface GSCRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  previousPosition?: number
  positionChange?: number
}

export interface GSCPage {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// Google Analytics 4 types
export interface GA4Metrics {
  users: number
  sessions: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
  newUsers: number
  engagementRate: number
  conversions: number
}

export interface GA4TrafficSource {
  source: string
  medium: string
  users: number
  sessions: number
  percentage: number
}

export interface GA4LandingPage {
  page: string
  users: number
  sessions: number
  bounceRate: number
  avgSessionDuration: number
  pageviews: number
}

// PageSpeed Insights types
export interface PageSpeedResult {
  url: string
  mobile: PageSpeedData
  desktop: PageSpeedData
}

export interface PageSpeedData {
  score: number
  metrics: CoreWebVitals
  opportunities: PageSpeedOpportunity[]
  diagnostics: PageSpeedDiagnostic[]
}

export interface CoreWebVitals {
  LCP: number // Largest Contentful Paint
  FID: number // First Input Delay
  CLS: number // Cumulative Layout Shift
  INP: number // Interaction to Next Paint
  TTFB: number // Time to First Byte
  FCP: number // First Contentful Paint
}

export interface PageSpeedOpportunity {
  id: string
  title: string
  description: string
  savings: number
}

export interface PageSpeedDiagnostic {
  id: string
  title: string
  description: string
  details: any
}

// Report types
export interface ReportData {
  client: Client
  dateRange: DateRange
  overview: OverviewMetrics
  traffic: TrafficMetrics
  keywords: KeywordPerformance
  technical: TechnicalSEO
  content: ContentPerformance
  lastUpdated: string
}

export interface OverviewMetrics {
  totalClicks: number
  totalImpressions: number
  avgCTR: number
  avgPosition: number
  clicksChange: number
  impressionsChange: number
  ctrChange: number
  positionChange: number
  insights: string[]
}

export interface TrafficMetrics {
  organicTraffic: ChartDataPoint[]
  trafficSources: GA4TrafficSource[]
  clicksVsImpressions: ChartDataPoint[]
  metrics: GA4Metrics
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface KeywordPerformance {
  keywords: GSCQuery[]
  improved: GSCQuery[]
  declined: GSCQuery[]
  new: GSCQuery[]
}

export interface TechnicalSEO {
  coreWebVitals: CoreWebVitals
  mobileScore: number
  desktopScore: number
  issues: PageSpeedDiagnostic[]
  crawlErrors: CrawlError[]
}

export interface CrawlError {
  url: string
  type: string
  lastCrawled: string
}

export interface ContentPerformance {
  topPerforming: GSCPage[]
  highEngagement: GA4LandingPage[]
  declining: GSCPage[]
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

// Auth types
export interface AuthSession {
  user: {
    id: string
    email: string
    isAdmin: boolean
  }
  accessToken: string
}