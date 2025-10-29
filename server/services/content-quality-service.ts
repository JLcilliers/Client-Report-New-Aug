/**
 * Content Quality Service
 * Analyzes content readability, SEO hygiene, and technical quality
 */

import { prisma } from '@/lib/db/prisma';

interface ContentQualityResult {
  url: string;
  score: number; // 0-100
  breakdown: {
    readability: number; // 0-30
    onPageSEO: number; // 0-40
    mediaSemantics: number; // 0-10
    linkHealth: number; // 0-20
  };
  details: {
    h1: string;
    title: string;
    metaDescLength: number;
    imageAltCoverage: string;
    readingGrade: number;
    readingEase: number;
    wordCount: number;
    hasCanonical: boolean;
    hasStructuredData: boolean;
    brokenInternalLinks: number;
    totalInternalLinks: number;
  };
  issues: string[];
  timestamp: Date;
  fromCache?: boolean;
}

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class ContentQualityService {
  private static instance: ContentQualityService;
  
  private constructor() {}
  
  static getInstance(): ContentQualityService {
    if (!ContentQualityService.instance) {
      ContentQualityService.instance = new ContentQualityService();
    }
    return ContentQualityService.instance;
  }
  
  /**
   * Analyze content quality for a URL
   */
  async analyzeContent(url: string): Promise<ContentQualityResult> {
    // Check cache first
    const cached = await this.getCachedData(url);
    if (cached && new Date(cached.expiresAt) > new Date()) {
      
      return {
        ...cached.data,
        fromCache: true
      };
    }
    
    try {
      // Fetch and analyze the page
      const result = await this.fetchAndAnalyze(url);
      
      // Cache the result
      await this.cacheData(url, result);
      
      return result;
    } catch (error: any) {
      
      
      // Return cached data if available
      if (cached) {
        return {
          ...cached.data,
          fromCache: true,
          issues: [...cached.data.issues, 'Using cached data due to analysis error']
        };
      }
      
      // Return minimal result on error
      return this.getErrorResult(url, error.message);
    }
  }
  
  /**
   * Fetch and analyze page content
   */
  private async fetchAndAnalyze(url: string): Promise<ContentQualityResult> {
    
    
    // Fetch the page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SearchInsightsHub/1.0 ContentQualityBot'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse HTML using JSDOM
    // @ts-ignore
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;
    
    // Extract main content using Readability
    let mainContent = '';
    
    try {
      // @ts-ignore
      const { Readability } = await import('@mozilla/readability');
      const reader = new Readability(doc.cloneNode(true) as Document);
      const article = reader.parse();
      mainContent = article?.textContent || doc.body?.textContent || '';
    } catch (error) {
      // Fallback to body text if Readability fails
      mainContent = doc.body?.textContent || '';
    }
    
    // Calculate text statistics
    const textStats = this.calculateTextStats(mainContent);
    
    // Perform on-page SEO checks
    const seoChecks = this.performSEOChecks(doc);
    
    // Check media semantics
    const mediaChecks = this.checkMediaSemantics(doc);
    
    // Check link health (simplified - doesn't actually crawl links)
    const linkChecks = this.checkLinkHealth(doc, url);
    
    // Calculate scores
    const readabilityScore = this.calculateReadabilityScore(textStats);
    const seoScore = this.calculateSEOScore(seoChecks);
    const mediaScore = this.calculateMediaScore(mediaChecks);
    const linkScore = this.calculateLinkScore(linkChecks);
    
    const totalScore = Math.round(readabilityScore + seoScore + mediaScore + linkScore);
    
    // Compile issues
    const issues = this.compileIssues(textStats, seoChecks, mediaChecks, linkChecks);
    
    return {
      url,
      score: Math.min(100, Math.max(0, totalScore)),
      breakdown: {
        readability: readabilityScore,
        onPageSEO: seoScore,
        mediaSemantics: mediaScore,
        linkHealth: linkScore
      },
      details: {
        h1: seoChecks.h1,
        title: seoChecks.title,
        metaDescLength: seoChecks.metaDescLength,
        imageAltCoverage: mediaChecks.altCoverage,
        readingGrade: textStats.gradeLevel,
        readingEase: textStats.readingEase,
        wordCount: textStats.wordCount,
        hasCanonical: seoChecks.hasCanonical,
        hasStructuredData: seoChecks.hasStructuredData,
        brokenInternalLinks: linkChecks.brokenCount,
        totalInternalLinks: linkChecks.totalInternal
      },
      issues: issues.slice(0, 5), // Top 5 issues
      timestamp: new Date()
    };
  }
  
  /**
   * Calculate text statistics
   */
  private calculateTextStats(text: string) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const syllables = this.countSyllables(text);
    
    // Flesch Reading Ease (0-100, higher is easier)
    const readingEase = Math.max(0, Math.min(100, 
      206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length)
    ));
    
    // Flesch-Kincaid Grade Level
    const gradeLevel = Math.max(0, 
      0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59
    );
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      syllableCount: syllables,
      readingEase,
      gradeLevel
    };
  }
  
  /**
   * Count syllables (simplified)
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;
    
    words.forEach(word => {
      word = word.replace(/[^a-z]/g, '');
      if (word.length <= 3) {
        totalSyllables += 1;
      } else {
        const vowels = word.match(/[aeiou]/g);
        totalSyllables += vowels ? vowels.length : 1;
      }
    });
    
    return totalSyllables;
  }
  
  /**
   * Perform on-page SEO checks
   */
  private performSEOChecks(doc: Document) {
    const h1 = doc.querySelector('h1')?.textContent?.trim() || '';
    const h1Count = doc.querySelectorAll('h1').length;
    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const structuredData = doc.querySelectorAll('script[type="application/ld+json"]');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    return {
      h1,
      h1Count,
      title,
      titleLength: title.length,
      metaDesc,
      metaDescLength: metaDesc.length,
      hasCanonical: !!canonical,
      canonical,
      hasStructuredData: structuredData.length > 0,
      structuredDataCount: structuredData.length,
      headingCount: headings.length,
      hasProperHeadingHierarchy: this.checkHeadingHierarchy(headings)
    };
  }
  
  /**
   * Check heading hierarchy
   */
  private checkHeadingHierarchy(headings: NodeListOf<Element>): boolean {
    let lastLevel = 0;
    let proper = true;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1]);
      if (level - lastLevel > 1) {
        proper = false;
      }
      lastLevel = level;
    });
    
    return proper;
  }
  
  /**
   * Check media semantics
   */
  private checkMediaSemantics(doc: Document) {
    const images = doc.querySelectorAll('img');
    const withAlt = Array.from(images).filter(img => img.hasAttribute('alt') && img.getAttribute('alt')?.trim());
    const lazyLoaded = Array.from(images).filter(img => img.hasAttribute('loading'));
    
    return {
      totalImages: images.length,
      imagesWithAlt: withAlt.length,
      altCoverage: images.length > 0 ? `${withAlt.length}/${images.length}` : '0/0',
      altPercentage: images.length > 0 ? (withAlt.length / images.length) * 100 : 100,
      lazyLoadedCount: lazyLoaded.length
    };
  }
  
  /**
   * Check link health (simplified version)
   */
  private checkLinkHealth(doc: Document, pageUrl: string) {
    const links = doc.querySelectorAll('a[href]');
    const pageOrigin = new URL(pageUrl).origin;
    
    let internalLinks = 0;
    let externalLinks = 0;
    let hashLinks = 0;
    let potentiallyBroken = 0;
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      if (href.startsWith('#')) {
        hashLinks++;
      } else if (href.startsWith('http')) {
        const linkUrl = new URL(href);
        if (linkUrl.origin === pageOrigin) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } else if (href.startsWith('/')) {
        internalLinks++;
      }
      
      // Simple heuristic for potentially broken links
      if (href.includes('undefined') || href.includes('null') || href === '#') {
        potentiallyBroken++;
      }
    });
    
    return {
      totalLinks: links.length,
      totalInternal: internalLinks,
      totalExternal: externalLinks,
      hashLinks,
      brokenCount: potentiallyBroken,
      linkHealthPercentage: links.length > 0 ? ((links.length - potentiallyBroken) / links.length) * 100 : 100
    };
  }
  
  /**
   * Calculate readability score (0-30)
   */
  private calculateReadabilityScore(stats: any): number {
    let score = 30;
    
    // Deduct for poor readability
    if (stats.readingEase < 30) score -= 10; // Very difficult
    else if (stats.readingEase < 50) score -= 5; // Difficult
    
    // Deduct for high grade level
    if (stats.gradeLevel > 16) score -= 10; // Graduate level
    else if (stats.gradeLevel > 12) score -= 5; // College level
    
    // Bonus for optimal word count
    if (stats.wordCount >= 300 && stats.wordCount <= 2000) score += 5;
    
    return Math.max(0, Math.min(30, score));
  }
  
  /**
   * Calculate SEO score (0-40)
   */
  private calculateSEOScore(checks: any): number {
    let score = 40;
    
    // Critical deductions
    if (!checks.h1) score -= 10;
    if (checks.h1Count > 1) score -= 5;
    if (!checks.title) score -= 10;
    if (checks.titleLength < 30 || checks.titleLength > 60) score -= 5;
    if (!checks.metaDesc) score -= 5;
    if (checks.metaDescLength < 120 || checks.metaDescLength > 160) score -= 3;
    if (!checks.hasCanonical) score -= 5;
    if (!checks.hasStructuredData) score -= 5;
    if (!checks.hasProperHeadingHierarchy) score -= 3;
    
    return Math.max(0, Math.min(40, score));
  }
  
  /**
   * Calculate media score (0-10)
   */
  private calculateMediaScore(checks: any): number {
    if (checks.totalImages === 0) return 10; // No images = full score
    
    const altCoverageScore = (checks.altPercentage / 100) * 10;
    return Math.round(altCoverageScore);
  }
  
  /**
   * Calculate link score (0-20)
   */
  private calculateLinkScore(checks: any): number {
    if (checks.totalLinks === 0) return 20; // No links = full score
    
    const healthScore = (checks.linkHealthPercentage / 100) * 20;
    return Math.round(healthScore);
  }
  
  /**
   * Compile issues list
   */
  private compileIssues(textStats: any, seoChecks: any, mediaChecks: any, linkChecks: any): string[] {
    const issues = [];
    
    // Readability issues
    if (textStats.readingEase < 30) issues.push('Very difficult reading level');
    if (textStats.gradeLevel > 14) issues.push(`High reading grade: ${textStats.gradeLevel.toFixed(1)}`);
    
    // SEO issues
    if (!seoChecks.h1) issues.push('Missing H1 tag');
    if (seoChecks.h1Count > 1) issues.push(`Multiple H1 tags (${seoChecks.h1Count})`);
    if (!seoChecks.title) issues.push('Missing page title');
    if (seoChecks.titleLength < 30 || seoChecks.titleLength > 60) {
      issues.push(`Title length issue (${seoChecks.titleLength} chars)`);
    }
    if (!seoChecks.metaDesc) issues.push('Missing meta description');
    if (seoChecks.metaDescLength > 0 && (seoChecks.metaDescLength < 120 || seoChecks.metaDescLength > 160)) {
      issues.push(`Meta description length (${seoChecks.metaDescLength} chars)`);
    }
    if (!seoChecks.hasCanonical) issues.push('Missing canonical tag');
    if (!seoChecks.hasStructuredData) issues.push('No structured data found');
    if (!seoChecks.hasProperHeadingHierarchy) issues.push('Improper heading hierarchy');
    
    // Media issues
    if (mediaChecks.totalImages > 0 && mediaChecks.altPercentage < 70) {
      issues.push(`Low image alt coverage (${mediaChecks.altPercentage.toFixed(0)}%)`);
    }
    
    // Link issues
    if (linkChecks.brokenCount > 0) {
      issues.push(`${linkChecks.brokenCount} potentially broken links`);
    }
    
    // Sort by priority
    return issues;
  }
  
  /**
   * Get error result
   */
  private getErrorResult(url: string, error: string): ContentQualityResult {
    return {
      url,
      score: 0,
      breakdown: {
        readability: 0,
        onPageSEO: 0,
        mediaSemantics: 0,
        linkHealth: 0
      },
      details: {
        h1: '',
        title: '',
        metaDescLength: 0,
        imageAltCoverage: '0/0',
        readingGrade: 0,
        readingEase: 0,
        wordCount: 0,
        hasCanonical: false,
        hasStructuredData: false,
        brokenInternalLinks: 0,
        totalInternalLinks: 0
      },
      issues: [`Analysis failed: ${error}`],
      timestamp: new Date()
    };
  }
  
  /**
   * Get cached data from database
   */
  private async getCachedData(url: string) {
    try {
      const cached = await prisma.contentQuality.findFirst({
        where: { url },
        orderBy: { collectedAt: 'desc' }
      });
      
      if (!cached) return null;
      
      const expiresAt = new Date(cached.collectedAt.getTime() + CACHE_DURATION_MS);
      
      return {
        data: {
          url: cached.url,
          score: cached.score,
          breakdown: {
            readability: cached.readabilityScore,
            onPageSEO: cached.tagsScore,
            mediaSemantics: cached.mediaScore,
            linkHealth: cached.linkHealthScore
          },
          details: JSON.parse(cached.details),
          issues: JSON.parse(cached.topIssues),
          timestamp: cached.collectedAt
        },
        expiresAt
      };
    } catch (error) {
      
      return null;
    }
  }
  
  /**
   * Cache data in database
   */
  private async cacheData(url: string, data: ContentQualityResult) {
    try {
      await prisma.contentQuality.create({
        data: {
          url,
          score: data.score,
          readabilityScore: data.breakdown.readability,
          tagsScore: data.breakdown.onPageSEO,
          mediaScore: data.breakdown.mediaSemantics,
          linkHealthScore: data.breakdown.linkHealth,
          details: JSON.stringify(data.details),
          topIssues: JSON.stringify(data.issues),
          collectedAt: new Date()
        }
      });
      
    } catch (error) {
      
    }
  }
}

export const contentQualityService = ContentQualityService.getInstance();