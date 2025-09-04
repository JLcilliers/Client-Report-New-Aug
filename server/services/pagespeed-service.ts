/**
 * PageSpeed Insights Service
 * Handles PSI API calls with caching, error handling, and fallback logic
 */

import { prisma } from '@/lib/db/prisma';

interface PSICache {
  url: string;
  strategy: 'mobile' | 'desktop';
  data: any;
  timestamp: Date;
  expiresAt: Date;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const API_TIMEOUT_MS = 30000; // 30 seconds
const RATE_LIMIT_DELAY_MS = 1000; // 1 second between requests

export class PageSpeedService {
  private static instance: PageSpeedService;
  private apiKey: string;
  
  private constructor() {
    this.apiKey = process.env.GOOGLE_PSI_API_KEY || process.env.PAGESPEED_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ PageSpeed API key not configured. Set GOOGLE_PSI_API_KEY or PAGESPEED_API_KEY');
    }
  }
  
  static getInstance(): PageSpeedService {
    if (!PageSpeedService.instance) {
      PageSpeedService.instance = new PageSpeedService();
    }
    return PageSpeedService.instance;
  }
  
  /**
   * Fetch PageSpeed data with caching
   */
  async getPageSpeedData(url: string, strategy: 'mobile' | 'desktop' = 'mobile') {
    // Check cache first
    const cached = await this.getCachedData(url, strategy);
    if (cached && cached.expiresAt > new Date()) {
      console.log(`📦 Using cached PSI data for ${url} (${strategy})`);
      return {
        ...cached.data,
        fromCache: true,
        cachedAt: cached.timestamp
      };
    }
    
    // Check if API key is configured
    if (!this.apiKey) {
      return {
        error: 'PageSpeed API key not configured',
        recommendation: 'Set GOOGLE_PSI_API_KEY or PAGESPEED_API_KEY environment variable',
        fallbackData: cached?.data || null,
        cachedAt: cached?.timestamp || null
      };
    }
    
    try {
      // Fetch fresh data from API
      const data = await this.fetchFromAPI(url, strategy);
      
      // Cache the successful response
      await this.cacheData(url, strategy, data);
      
      return {
        ...data,
        fromCache: false,
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error(`❌ PSI API error for ${url}:`, error.message);
      
      // Return cached data if available
      if (cached) {
        return {
          ...cached.data,
          fromCache: true,
          cachedAt: cached.timestamp,
          warning: 'Using stale cache due to API error',
          error: error.message
        };
      }
      
      // No cache available, return error
      return {
        error: error.message,
        url,
        strategy,
        recommendation: this.getErrorRecommendation(error)
      };
    }
  }
  
  /**
   * Fetch data from PageSpeed Insights API
   */
  private async fetchFromAPI(url: string, strategy: 'mobile' | 'desktop') {
    const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    
    // Set parameters
    endpoint.searchParams.set('url', url);
    endpoint.searchParams.set('key', this.apiKey);
    endpoint.searchParams.set('strategy', strategy);
    
    // Include all categories
    const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
    categories.forEach(cat => endpoint.searchParams.set('category', cat));
    
    console.log(`🔍 Fetching PSI data for ${url} (${strategy})`);
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    
    try {
      const response = await fetch(endpoint.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SearchInsightsHub/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('RATE_LIMIT: Too many requests. Please try again later.');
        }
        if (response.status === 403) {
          throw new Error('API_KEY_INVALID: Invalid or missing API key');
        }
        throw new Error(`API_ERROR_${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract key metrics
      return this.extractMetrics(data);
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT: Request took longer than 30 seconds');
      }
      
      throw error;
    }
  }
  
  /**
   * Extract and normalize metrics from PSI response
   */
  private extractMetrics(data: any) {
    const result = data.lighthouseResult;
    
    return {
      url: data.id,
      fetchTime: data.analysisUTCTimestamp,
      scores: {
        performance: Math.round((result.categories?.performance?.score || 0) * 100),
        accessibility: Math.round((result.categories?.accessibility?.score || 0) * 100),
        bestPractices: Math.round((result.categories?.['best-practices']?.score || 0) * 100),
        seo: Math.round((result.categories?.seo?.score || 0) * 100)
      },
      metrics: {
        FCP: result.audits?.['first-contentful-paint']?.numericValue || 0,
        LCP: result.audits?.['largest-contentful-paint']?.numericValue || 0,
        TBT: result.audits?.['total-blocking-time']?.numericValue || 0,
        CLS: result.audits?.['cumulative-layout-shift']?.numericValue || 0,
        SI: result.audits?.['speed-index']?.numericValue || 0,
        TTI: result.audits?.['interactive']?.numericValue || 0
      },
      opportunities: Object.entries(result.audits || {})
        .filter(([key, audit]: [string, any]) => 
          audit.score !== null && 
          audit.score < 1 && 
          audit.details?.type === 'opportunity'
        )
        .map(([key, audit]: [string, any]) => ({
          id: key,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          savings: audit.details?.overallSavingsMs || 0
        }))
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 5),
      diagnostics: Object.entries(result.audits || {})
        .filter(([key, audit]: [string, any]) => 
          audit.score !== null && 
          audit.score < 0.9 && 
          audit.details?.type === 'table'
        )
        .map(([key, audit]: [string, any]) => ({
          id: key,
          title: audit.title,
          description: audit.description,
          score: audit.score
        }))
        .slice(0, 5),
      rawData: data
    };
  }
  
  /**
   * Get cached data from database
   */
  private async getCachedData(url: string, strategy: string): Promise<PSICache | null> {
    try {
      const cached = await prisma.pageAudit.findFirst({
        where: {
          url,
          strategy,
          source: 'PSI'
        },
        orderBy: {
          collectedAt: 'desc'
        }
      });
      
      if (!cached) return null;
      
      const expiresAt = new Date(cached.collectedAt.getTime() + CACHE_DURATION_MS);
      
      return {
        url: cached.url,
        strategy: strategy as 'mobile' | 'desktop',
        data: JSON.parse(cached.rawJson),
        timestamp: cached.collectedAt,
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
  private async cacheData(url: string, strategy: string, data: any) {
    try {
      await prisma.pageAudit.create({
        data: {
          url,
          strategy,
          source: 'PSI',
          rawJson: JSON.stringify(data),
          collectedAt: new Date()
        }
      });
      console.log(`💾 Cached PSI data for ${url} (${strategy})`);
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }
  
  /**
   * Get error recommendation based on error type
   */
  private getErrorRecommendation(error: any): string {
    const message = error.message || '';
    
    if (message.includes('RATE_LIMIT')) {
      return 'You have exceeded the API quota. Wait a few minutes or upgrade your API key quota.';
    }
    
    if (message.includes('API_KEY_INVALID')) {
      return 'Check that GOOGLE_PSI_API_KEY is correctly set in your environment variables.';
    }
    
    if (message.includes('TIMEOUT')) {
      return 'The target URL took too long to analyze. Try a faster page or check the site availability.';
    }
    
    if (message.includes('ENOTFOUND') || message.includes('ECONNREFUSED')) {
      return 'Network error. Check your internet connection and firewall settings.';
    }
    
    return 'An unexpected error occurred. Check the logs for details.';
  }
  
  /**
   * Batch fetch with rate limiting
   */
  async batchFetch(urls: string[], strategy: 'mobile' | 'desktop' = 'mobile') {
    const results = [];
    
    for (const url of urls) {
      results.push(await this.getPageSpeedData(url, strategy));
      
      // Rate limit delay
      if (urls.indexOf(url) < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
    }
    
    return results;
  }
}

export const pageSpeedService = PageSpeedService.getInstance();