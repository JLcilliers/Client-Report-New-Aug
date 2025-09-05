/**
 * Chrome UX Report (CrUX) Service
 * Fetches real-user Core Web Vitals data with proper caching
 */

import { prisma } from '@/lib/db/prisma';

interface CrUXMetric {
  histogram: Array<{ start: number; end?: number; density: number }>;
  percentiles: { p75: number };
}

interface CrUXResponse {
  record?: {
    key: { url?: string; origin?: string; formFactor?: string };
    metrics: {
      largest_contentful_paint?: CrUXMetric;
      interaction_to_next_paint?: CrUXMetric;
      cumulative_layout_shift?: CrUXMetric;
      first_contentful_paint?: CrUXMetric;
      first_input_delay?: CrUXMetric;
      time_to_first_byte?: CrUXMetric;
    };
    collectionPeriod: {
      firstDate: { year: number; month: number; day: number };
      lastDate: { year: number; month: number; day: number };
    };
  };
  error?: { code: number; message: string };
}

interface CWVData {
  url?: string;
  origin?: string;
  formFactor: 'PHONE' | 'DESKTOP';
  metrics: {
    LCP: number; // milliseconds
    INP: number; // milliseconds  
    CLS: number; // unitless
    FCP?: number | null; // milliseconds
    TTFB?: number | null; // milliseconds
  };
  grade: string;
  collectionPeriod: {
    start: string;
    end: string;
  };
  timestamp: Date;
  fromCache?: boolean;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours (CrUX updates daily)
const API_TIMEOUT_MS = 10000; // 10 seconds

export class CrUXService {
  private static instance: CrUXService;
  private apiKey: string;
  
  private constructor() {
    this.apiKey = process.env.GOOGLE_CRUX_API_KEY || process.env.GOOGLE_PSI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ CrUX API key not configured. Set GOOGLE_CRUX_API_KEY');
    }
  }
  
  static getInstance(): CrUXService {
    if (!CrUXService.instance) {
      CrUXService.instance = new CrUXService();
    }
    return CrUXService.instance;
  }
  
  /**
   * Get Core Web Vitals for a URL
   */
  async getCoreWebVitals(url: string): Promise<{ mobile: CWVData | null; desktop: CWVData | null }> {
    const [mobileData, desktopData] = await Promise.allSettled([
      this.fetchCWVData(url, 'PHONE'),
      this.fetchCWVData(url, 'DESKTOP')
    ]);
    
    return {
      mobile: mobileData.status === 'fulfilled' ? mobileData.value : null,
      desktop: desktopData.status === 'fulfilled' ? desktopData.value : null
    };
  }
  
  /**
   * Fetch CWV data with caching and fallback
   */
  private async fetchCWVData(url: string, formFactor: 'PHONE' | 'DESKTOP'): Promise<CWVData | null> {
    // Check cache first
    const cached = await this.getCachedData(url, formFactor);
    if (cached && new Date(cached.expiresAt) > new Date()) {
      console.log(`📦 Using cached CrUX data for ${url} (${formFactor})`);
      return {
        ...cached.data,
        fromCache: true
      };
    }
    
    if (!this.apiKey) {
      console.warn('CrUX API key not configured');
      return cached?.data || null;
    }
    
    try {
      // Try page-level data first
      let data = await this.queryCrUXAPI({ url }, formFactor);
      
      // Fall back to origin-level if page-level not available
      if (!data && url) {
        const origin = new URL(url).origin;
        console.log(`📊 Falling back to origin-level data for ${origin}`);
        data = await this.queryCrUXAPI({ origin }, formFactor);
      }
      
      if (data) {
        // Cache the successful response
        await this.cacheData(url, formFactor, data);
        return data;
      }
      
      // No data available
      return cached?.data || null;
      
    } catch (error: any) {
      console.error(`❌ CrUX API error for ${url}:`, error.message);
      
      // Return cached data if available
      return cached?.data || null;
    }
  }
  
  /**
   * Query CrUX API
   */
  private async queryCrUXAPI(
    key: { url?: string; origin?: string },
    formFactor: 'PHONE' | 'DESKTOP'
  ): Promise<CWVData | null> {
    const endpoint = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${this.apiKey}`;
    
    const body = {
      ...key,
      formFactor,
      metrics: [
        'largest_contentful_paint',
        'interaction_to_next_paint',
        'cumulative_layout_shift',
        'first_contentful_paint',
        'time_to_first_byte'
      ]
    };
    
    console.log(`🔍 Querying CrUX for ${key.url || key.origin} (${formFactor})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data: CrUXResponse = await response.json();
      
      if (data.error) {
        if (data.error.code === 404) {
          console.log('No CrUX data available for this URL/origin');
          return null;
        }
        throw new Error(data.error.message);
      }
      
      if (!data.record) {
        return null;
      }
      
      // Extract metrics
      const metrics = {
        LCP: data.record.metrics.largest_contentful_paint?.percentiles?.p75 || 0,
        INP: data.record.metrics.interaction_to_next_paint?.percentiles?.p75 || 0,
        CLS: data.record.metrics.cumulative_layout_shift?.percentiles?.p75 || 0,
        FCP: data.record.metrics.first_contentful_paint?.percentiles?.p75,
        TTFB: data.record.metrics.time_to_first_byte?.percentiles?.p75
      };
      
      // Calculate grade
      const grade = this.calculateGrade(metrics);
      
      // Format collection period
      const firstDate = data.record.collectionPeriod.firstDate;
      const lastDate = data.record.collectionPeriod.lastDate;
      
      return {
        url: data.record.key.url,
        origin: data.record.key.origin,
        formFactor,
        metrics,
        grade,
        collectionPeriod: {
          start: `${firstDate.year}-${String(firstDate.month).padStart(2, '0')}-${String(firstDate.day).padStart(2, '0')}`,
          end: `${lastDate.year}-${String(lastDate.month).padStart(2, '0')}-${String(lastDate.day).padStart(2, '0')}`
        },
        timestamp: new Date()
      };
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }
  
  /**
   * Calculate overall CWV grade
   */
  private calculateGrade(metrics: { LCP: number; INP: number; CLS: number }): string {
    const scores = {
      LCP: this.gradeMetric('LCP', metrics.LCP),
      INP: this.gradeMetric('INP', metrics.INP),
      CLS: this.gradeMetric('CLS', metrics.CLS)
    };
    
    // All good = A
    if (Object.values(scores).every(s => s === 'good')) {
      return 'A';
    }
    
    // Any poor = F
    if (Object.values(scores).some(s => s === 'poor')) {
      return 'F';
    }
    
    // Mix of good and needs improvement
    const goodCount = Object.values(scores).filter(s => s === 'good').length;
    if (goodCount === 2) return 'B';
    if (goodCount === 1) return 'C';
    
    return 'D';
  }
  
  /**
   * Grade individual metric
   */
  private gradeMetric(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
      LCP: { good: 2500, needsImprovement: 4000 }, // milliseconds
      INP: { good: 200, needsImprovement: 500 }, // milliseconds
      CLS: { good: 0.1, needsImprovement: 0.25 } // unitless
    };
    
    const threshold = thresholds[metric];
    if (!threshold) return 'poor';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }
  
  /**
   * Get cached data from database
   */
  private async getCachedData(url: string, formFactor: string) {
    try {
      const cached = await prisma.cwvMeasurement.findFirst({
        where: {
          url,
          formFactor
        },
        orderBy: {
          collectedAt: 'desc'
        }
      });
      
      if (!cached) return null;
      
      const expiresAt = new Date(cached.collectedAt.getTime() + CACHE_DURATION_MS);
      
      return {
        data: {
          url: cached.url,
          origin: cached.origin,
          formFactor: cached.formFactor as 'PHONE' | 'DESKTOP',
          metrics: {
            LCP: cached.p75LcpMs,
            INP: cached.p75InpMs,
            CLS: cached.p75Cls,
            FCP: cached.p75FcpMs,
            TTFB: cached.p75TtfbMs
          },
          grade: cached.grade || this.calculateGrade({
            LCP: cached.p75LcpMs,
            INP: cached.p75InpMs,
            CLS: cached.p75Cls
          }),
          collectionPeriod: {
            start: cached.windowStart.toISOString().split('T')[0],
            end: cached.windowEnd.toISOString().split('T')[0]
          },
          timestamp: cached.collectedAt
        },
        expiresAt
      };
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }
  
  /**
   * Cache data in database
   */
  private async cacheData(url: string, formFactor: string, data: CWVData) {
    try {
      await prisma.cwvMeasurement.create({
        data: {
          url: data.url || url,
          origin: data.origin || new URL(url).origin,
          formFactor,
          p75LcpMs: data.metrics.LCP,
          p75InpMs: data.metrics.INP,
          p75Cls: data.metrics.CLS,
          p75FcpMs: data.metrics.FCP || null,
          p75TtfbMs: data.metrics.TTFB || null,
          grade: data.grade,
          windowStart: new Date(data.collectionPeriod.start),
          windowEnd: new Date(data.collectionPeriod.end),
          collectedAt: new Date()
        }
      });
      console.log(`💾 Cached CrUX data for ${url} (${formFactor})`);
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }
}

export const cruxService = CrUXService.getInstance();