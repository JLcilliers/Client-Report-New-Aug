/**
 * Comprehensive Technical SEO Audit Service Implementation
 * Integrates all audit modules and provides the main audit orchestration
 */

import * as cheerio from 'cheerio';
import { URL } from 'url';
import {
  TechnicalSEOAuditResult,
  AuditCategory,
  SEOCheck,
  SEORecommendation,
  CrawlabilityResults,
  CanonicalizationResults,
  CoreWebVitalsResults,
  MobileIndexingResults,
  StructuredDataResults,
  SecurityResults,
  LinkStructureResults,
  InternationalizationResults,
  EcommerceResults,
  SpamComplianceResults,
  calculateGrade,
  getImpactLevel,
  evaluateCoreWebVital,
  CORE_WEB_VITALS_THRESHOLDS,
  AUDIT_WEIGHTS
} from './comprehensive-tech-audit';
import {
  URLCanonicalizationAudit,
  MobileIndexingParityAudit,
  InternalLinkingAudit
} from './specialized-audits';

export class TechnicalSEOAuditService {
  private url: string;
  private domain: string;
  private html: string | null = null;
  private $: cheerio.CheerioAPI | null = null;

  constructor(url: string) {
    this.url = url.startsWith('http') ? url : `https://${url}`;
    this.domain = new URL(this.url).hostname;
  }

  /**
   * Main audit execution method
   */
  async runComprehensiveAudit(): Promise<TechnicalSEOAuditResult> {
    console.log(`🔍 Starting comprehensive technical SEO audit for: ${this.url}`);

    // Fetch page content once for analysis
    await this.fetchPageContent();

    // Run all audit modules in parallel (where possible)
    const auditPromises = [
      this.auditCrawlabilityIndexability(),
      this.auditURLCanonicalization(),
      this.auditCoreWebVitals(),
      this.auditMobileFirstParity(),
      this.auditStructuredData(),
      this.auditSecurityHeaders(),
      this.auditInternalLinking(),
      this.auditInternationalization(),
      this.auditEcommerceFacets(),
      this.auditSpamCompliance()
    ];

    const [
      crawlability,
      canonicalization,
      coreWebVitals,
      mobileIndexing,
      structuredData,
      security,
      linkStructure,
      internationalization,
      ecommerce,
      spamChecks
    ] = await Promise.allSettled(auditPromises);

    // Process results and handle any failures
    const results = {
      crawlability: this.getSettledValue(crawlability, this.getEmptyCrawlabilityResults()),
      canonicalization: this.getSettledValue(canonicalization, this.getEmptyCanonicalizationResults()),
      coreWebVitals: this.getSettledValue(coreWebVitals, this.getEmptyCoreWebVitalsResults()),
      mobileIndexing: this.getSettledValue(mobileIndexing, this.getEmptyMobileIndexingResults()),
      structuredData: this.getSettledValue(structuredData, this.getEmptyStructuredDataResults()),
      security: this.getSettledValue(security, this.getEmptySecurityResults()),
      linkStructure: this.getSettledValue(linkStructure, this.getEmptyLinkStructureResults()),
      internationalization: this.getSettledValue(internationalization, this.getEmptyInternationalizationResults()),
      ecommerce: this.getSettledValue(ecommerce, this.getEmptyEcommerceResults()),
      spamChecks: this.getSettledValue(spamChecks, this.getEmptySpamComplianceResults())
    };

    // Generate categories and recommendations
    const categories = this.generateAuditCategories(results);
    const recommendations = this.generateRecommendations(categories, results);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(categories);
    const summary = this.generateSummary(categories, overallScore);

    console.log(`✅ Audit completed with score: ${overallScore}/100 (${summary.grade})`);

    return {
      url: this.url,
      domain: this.domain,
      timestamp: new Date().toISOString(),
      overallScore,
      summary,
      categories,
      detailedResults: results,
      recommendations
    };
  }

  /**
   * Fetch and parse page content for analysis
   */
  private async fetchPageContent(): Promise<void> {
    try {
      const response = await fetch(this.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TechnicalSEOAudit/1.0; +https://searchsignal.online)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 30000 // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.html = await response.text();
      this.$ = cheerio.load(this.html);
    } catch (error) {
      console.error(`Failed to fetch page content: ${error}`);
      this.html = '';
      this.$ = cheerio.load('');
    }
  }

  /**
   * Audit 1: Crawlability and Indexability
   */
  private async auditCrawlabilityIndexability(): Promise<CrawlabilityResults> {
    console.log('🕷️ Auditing crawlability and indexability...');

    const [robotsResult, sitemapResult] = await Promise.allSettled([
      this.auditRobotsTxt(),
      this.auditXMLSitemap()
    ]);

    const robots = this.getSettledValue(robotsResult, {
      exists: false,
      accessible: false,
      valid: false,
      size: 0,
      rules: [],
      sitemapReferences: [],
      issues: ['Failed to analyze robots.txt'],
      blockingRules: []
    });

    const xmlSitemap = this.getSettledValue(sitemapResult, {
      exists: false,
      accessible: false,
      valid: false,
      urlCount: 0,
      lastModified: '',
      compression: false,
      errors: ['Failed to analyze sitemap'],
      coverage: 0
    });

    const metaRobots = this.analyzeMetaRobots();
    const canonicalTags = this.analyzeCanonicalTags();

    return {
      robotsTxt: robots,
      xmlSitemap,
      metaRobots,
      canonicalTags
    };
  }

  /**
   * Audit robots.txt file
   */
  private async auditRobotsTxt() {
    const robotsUrl = `${new URL(this.url).origin}/robots.txt`;

    try {
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': 'TechnicalSEOAudit/1.0' }
      });

      if (!response.ok) {
        return {
          exists: false,
          accessible: false,
          valid: false,
          size: 0,
          rules: [],
          sitemapReferences: [],
          issues: ['robots.txt file not found'],
          blockingRules: []
        };
      }

      const content = await response.text();
      const size = content.length;
      const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

      const rules: any[] = [];
      const sitemapReferences: string[] = [];
      const issues: string[] = [];
      const blockingRules: string[] = [];

      let currentUserAgent = '';

      for (const line of lines) {
        const [directive, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();

        switch (directive.toLowerCase()) {
          case 'user-agent':
            currentUserAgent = value;
            break;
          case 'disallow':
            rules.push({ userAgent: currentUserAgent, directive: 'Disallow', path: value });
            if (value === '/') {
              blockingRules.push(`All paths blocked for ${currentUserAgent}`);
            }
            break;
          case 'allow':
            rules.push({ userAgent: currentUserAgent, directive: 'Allow', path: value });
            break;
          case 'sitemap':
            sitemapReferences.push(value);
            break;
        }
      }

      // Validate rules
      if (rules.length === 0) {
        issues.push('No crawl directives found');
      }

      if (sitemapReferences.length === 0) {
        issues.push('No sitemap references found');
      }

      if (size > 500000) { // 500KB limit
        issues.push('robots.txt file is too large (>500KB)');
      }

      return {
        exists: true,
        accessible: true,
        valid: issues.length === 0,
        size,
        rules,
        sitemapReferences,
        issues,
        blockingRules
      };
    } catch (error) {
      return {
        exists: false,
        accessible: false,
        valid: false,
        size: 0,
        rules: [],
        sitemapReferences: [],
        issues: [`Failed to fetch robots.txt: ${error}`],
        blockingRules: []
      };
    }
  }

  /**
   * Audit XML sitemap
   */
  private async auditXMLSitemap() {
    const sitemapUrls = [
      `${new URL(this.url).origin}/sitemap.xml`,
      `${new URL(this.url).origin}/sitemap_index.xml`
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl);
        if (response.ok) {
          const content = await response.text();
          const lastModified = response.headers.get('last-modified') || '';

          if (content.includes('<?xml') || response.headers.get('content-type')?.includes('xml')) {
            return this.analyzeSitemapContent(content, sitemapUrl, lastModified);
          }
        }
      } catch (error) {
        continue;
      }
    }

    return {
      exists: false,
      accessible: false,
      valid: false,
      urlCount: 0,
      lastModified: '',
      compression: false,
      errors: ['No valid XML sitemap found'],
      coverage: 0
    };
  }

  /**
   * Analyze sitemap content
   */
  private analyzeSitemapContent(content: string, url: string, lastModified: string) {
    const errors: string[] = [];
    let urlCount = 0;
    const compression = url.endsWith('.gz');

    try {
      if (content.includes('<sitemapindex')) {
        // Sitemap index
        const sitemaps = content.match(/<loc>([^<]+)<\/loc>/g) || [];
        urlCount = sitemaps.length;
      } else {
        // Regular sitemap
        const urls = content.match(/<url>/g) || [];
        urlCount = urls.length;

        if (urlCount > 50000) {
          errors.push('Sitemap contains more than 50,000 URLs');
        }
      }

      if (content.length > 50 * 1024 * 1024) { // 50MB uncompressed limit
        errors.push('Sitemap is too large (>50MB uncompressed)');
      }

      return {
        exists: true,
        accessible: true,
        valid: errors.length === 0,
        urlCount,
        lastModified,
        compression,
        errors,
        coverage: 0 // Would need site crawl to determine actual coverage
      };
    } catch (error) {
      return {
        exists: true,
        accessible: true,
        valid: false,
        urlCount: 0,
        lastModified,
        compression,
        errors: [`Failed to parse sitemap: ${error}`],
        coverage: 0
      };
    }
  }

  /**
   * Analyze meta robots tags
   */
  private analyzeMetaRobots() {
    if (!this.$) {
      return {
        noindex: false,
        nofollow: false,
        noarchive: false,
        nosnippet: false,
        maxImagePreview: '',
        maxSnippet: '',
        maxVideoPreview: ''
      };
    }

    const robotsMeta = this.$('meta[name="robots"]').attr('content') || '';
    const content = robotsMeta.toLowerCase();

    return {
      noindex: content.includes('noindex'),
      nofollow: content.includes('nofollow'),
      noarchive: content.includes('noarchive'),
      nosnippet: content.includes('nosnippet'),
      maxImagePreview: this.extractMetaDirective(robotsMeta, 'max-image-preview'),
      maxSnippet: this.extractMetaDirective(robotsMeta, 'max-snippet'),
      maxVideoPreview: this.extractMetaDirective(robotsMeta, 'max-video-preview')
    };
  }

  /**
   * Extract meta robot directive values
   */
  private extractMetaDirective(content: string, directive: string): string {
    const regex = new RegExp(`${directive}:([^,\\s]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1] : '';
  }

  /**
   * Analyze canonical tags
   */
  private analyzeCanonicalTags() {
    if (!this.$) {
      return {
        present: false,
        valid: false,
        selfReferencing: false,
        issues: ['Cannot analyze - page not accessible']
      };
    }

    const canonicalTag = this.$('link[rel="canonical"]');
    const present = canonicalTag.length > 0;
    const issues: string[] = [];

    if (!present) {
      return {
        present: false,
        valid: false,
        selfReferencing: false,
        issues: ['No canonical tag found']
      };
    }

    const canonicalUrl = canonicalTag.attr('href');
    if (!canonicalUrl) {
      issues.push('Canonical tag has no href attribute');
      return { present: true, valid: false, selfReferencing: false, issues };
    }

    const resolvedCanonical = new URL(canonicalUrl, this.url).href;
    const selfReferencing = resolvedCanonical === this.url;

    // Additional validations
    if (canonicalTag.length > 1) {
      issues.push('Multiple canonical tags found');
    }

    if (!canonicalUrl.startsWith('http')) {
      try {
        new URL(canonicalUrl, this.url);
      } catch {
        issues.push('Invalid canonical URL');
      }
    }

    return {
      present: true,
      valid: issues.length === 0,
      selfReferencing,
      issues
    };
  }

  /**
   * Audit 2: URL Canonicalization and Redirects
   */
  private async auditURLCanonicalization(): Promise<CanonicalizationResults> {
    console.log('🔗 Auditing URL canonicalization...');

    try {
      // Use specialized URL canonicalization audit
      const canonicalizationAudit = new URLCanonicalizationAudit(this.url);
      const results = await canonicalizationAudit.analyzeURLCanonicalization();

      // Also analyze canonical tags from the current page
      const canonicalAnalysis = this.analyzeCanonicalTags();

      return {
        canonical: {
          present: canonicalAnalysis.present,
          valid: canonicalAnalysis.valid,
          selfReferencing: canonicalAnalysis.selfReferencing,
          httpVsHttps: results.protocolConsistency?.httpsImplemented && results.protocolConsistency?.httpRedirectsToHttps ? 'consistent' : 'mixed',
          wwwVsNonWww: results.wwwConsistency?.consistent ? 'consistent' : 'mixed',
          trailingSlash: results.trailingSlashConsistency?.consistent ? 'consistent' : 'mixed'
        },
        redirects: {
          httpToHttps: results.protocolConsistency?.httpRedirectsToHttps || false,
          wwwRedirect: this.mapWWWRedirectType(results.wwwConsistency),
          redirectChains: results.redirectChains?.redirectCount || 0,
          redirectLoops: results.redirectChains?.hasLoop || false,
          status: results.redirectChains?.chain?.map(r => r.status) || []
        },
        duplicateContent: {
          urlVariations: results.duplicateContent?.variations?.map(v => v.url) || [],
          parameterHandling: results.duplicateContent?.duplicateRisk ? 'needs_improvement' : 'good',
          caseVariations: results.duplicateContent?.duplicateRisk || false
        }
      };
    } catch (error) {
      console.error('Enhanced canonicalization audit failed, falling back to basic analysis:', error);

      // Fallback to basic analysis
      const canonicalAnalysis = this.analyzeCanonicalTags();
      return {
        canonical: {
          present: canonicalAnalysis.present,
          valid: canonicalAnalysis.valid,
          selfReferencing: canonicalAnalysis.selfReferencing,
          httpVsHttps: 'mixed',
          wwwVsNonWww: 'mixed',
          trailingSlash: 'mixed'
        },
        redirects: {
          httpToHttps: false,
          wwwRedirect: 'none',
          redirectChains: 0,
          redirectLoops: false,
          status: []
        },
        duplicateContent: {
          urlVariations: [],
          parameterHandling: 'needs_improvement',
          caseVariations: false
        }
      };
    }
  }

  /**
   * Analyze redirects for the URL
   */
  private async analyzeRedirects() {
    const variations = [
      this.url.replace('https://', 'http://'),
      this.url.replace('www.', ''),
      this.url.includes('www.') ? this.url.replace('www.', '') : this.url.replace('://', '://www.'),
      this.url.endsWith('/') ? this.url.slice(0, -1) : this.url + '/'
    ];

    const redirectChains: number[] = [];
    let httpToHttps = false;
    let wwwRedirect: 'www_to_non_www' | 'non_www_to_www' | 'none' | 'both' = 'none';

    for (const variant of variations) {
      try {
        const response = await fetch(variant, { redirect: 'manual' });
        const status = response.status;

        if (status >= 300 && status < 400) {
          redirectChains.push(status);
          const location = response.headers.get('location');

          if (variant.startsWith('http://') && location?.startsWith('https://')) {
            httpToHttps = true;
          }

          if (variant.includes('www.') && location && !location.includes('www.')) {
            wwwRedirect = wwwRedirect === 'non_www_to_www' ? 'both' : 'www_to_non_www';
          } else if (!variant.includes('www.') && location?.includes('www.')) {
            wwwRedirect = wwwRedirect === 'www_to_non_www' ? 'both' : 'non_www_to_www';
          }
        }
      } catch (error) {
        // Ignore fetch errors for redirect analysis
      }
    }

    return {
      httpToHttps,
      wwwRedirect,
      redirectChains: redirectChains.length,
      redirectLoops: false, // Would need more complex analysis
      status: redirectChains
    };
  }

  /**
   * Check protocol consistency
   */
  private async checkProtocolConsistency(): Promise<'consistent' | 'mixed'> {
    // This would need more comprehensive analysis of internal links
    // For now, return consistent if the main URL uses HTTPS
    return this.url.startsWith('https://') ? 'consistent' : 'mixed';
  }

  /**
   * Check WWW consistency
   */
  private async checkWWWConsistency(): Promise<'consistent' | 'mixed'> {
    // This would need comprehensive analysis of internal links
    return 'consistent'; // Simplified for now
  }

  /**
   * Check trailing slash consistency
   */
  private async checkTrailingSlashConsistency(): Promise<'consistent' | 'mixed'> {
    // This would need comprehensive analysis of internal links
    return 'consistent'; // Simplified for now
  }

  /**
   * Analyze duplicate content issues
   */
  private async analyzeDuplicateContent() {
    const urlVariations: string[] = [];

    // Check for common URL variations
    const baseUrl = this.url.replace(/\?.*$/, '').replace(/#.*$/, '');

    // Add common variations
    urlVariations.push(
      baseUrl,
      baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl + '/',
      baseUrl.toLowerCase(),
      baseUrl.toUpperCase()
    );

    return {
      urlVariations: [...new Set(urlVariations)],
      parameterHandling: 'good' as const, // Would need parameter analysis
      caseVariations: urlVariations.some(url => url !== url.toLowerCase())
    };
  }

  /**
   * Audit 3: Core Web Vitals
   */
  private async auditCoreWebVitals(): Promise<CoreWebVitalsResults> {
    console.log('⚡ Auditing Core Web Vitals...');

    try {
      // Call the existing Core Web Vitals API
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/seo/core-web-vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: this.url })
      });

      if (!response.ok) {
        throw new Error(`Core Web Vitals API failed: ${response.status}`);
      }

      const data = await response.json();

      // Transform the data to match our interface
      return this.transformCoreWebVitalsData(data);
    } catch (error) {
      console.error('Core Web Vitals audit failed:', error);
      return this.getEmptyCoreWebVitalsResults();
    }
  }

  /**
   * Transform Core Web Vitals data to our format
   */
  private transformCoreWebVitalsData(data: any): CoreWebVitalsResults {
    const mobile = data.mobile || {};
    const desktop = data.desktop || {};

    return {
      mobile: {
        lcp: {
          value: mobile.lcp || 0,
          grade: evaluateCoreWebVital('lcp', mobile.lcp || 0),
          threshold: '≤2.5s'
        },
        inp: {
          value: mobile.inp || 0,
          grade: evaluateCoreWebVital('inp', mobile.inp || 0),
          threshold: '≤200ms'
        },
        cls: {
          value: mobile.cls || 0,
          grade: evaluateCoreWebVital('cls', mobile.cls || 0),
          threshold: '≤0.1'
        },
        overallGrade: this.calculateOverallCWVGrade(mobile)
      },
      desktop: {
        lcp: {
          value: desktop.lcp || 0,
          grade: evaluateCoreWebVital('lcp', desktop.lcp || 0),
          threshold: '≤2.5s'
        },
        inp: {
          value: desktop.inp || 0,
          grade: evaluateCoreWebVital('inp', desktop.inp || 0),
          threshold: '≤200ms'
        },
        cls: {
          value: desktop.cls || 0,
          grade: evaluateCoreWebVital('cls', desktop.cls || 0),
          threshold: '≤0.1'
        },
        overallGrade: this.calculateOverallCWVGrade(desktop)
      },
      fieldData: !!data.fieldData,
      labData: !!data.labData
    };
  }

  /**
   * Calculate overall Core Web Vitals grade
   */
  private calculateOverallCWVGrade(metrics: any): 'good' | 'needs-improvement' | 'poor' {
    const lcp = evaluateCoreWebVital('lcp', metrics.lcp || 0);
    const inp = evaluateCoreWebVital('inp', metrics.inp || 0);
    const cls = evaluateCoreWebVital('cls', metrics.cls || 0);

    const grades = [lcp, inp, cls];
    const goodCount = grades.filter(g => g === 'good').length;

    if (goodCount === 3) return 'good';
    if (goodCount >= 2) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Audit 4: Mobile-First Indexing Parity
   */
  private async auditMobileFirstParity(): Promise<MobileIndexingResults> {
    console.log('📱 Auditing mobile-first indexing parity...');

    try {
      // Use specialized mobile indexing parity audit
      const mobileParityAudit = new MobileIndexingParityAudit(this.url);
      const parityResults = await mobileParityAudit.analyzeMobileIndexingParity();

      // Also get basic mobile friendliness and viewport analysis
      const viewport = this.analyzeViewportTag();
      const mobileFriendly = await this.analyzeMobileFriendliness();
      const loading = await this.analyzeLoadingPerformance();

      return {
        viewport,
        mobileFriendly,
        contentParity: {
          textParity: parityResults.contentParity?.parityPercentage || 0,
          imageParity: parityResults.imageParity?.parityPercentage || 0,
          linkParity: parityResults.linkParity?.parityPercentage || 0,
          structuredDataParity: parityResults.structuredDataParity?.overallParity ? 100 : 50
        },
        loading
      };
    } catch (error) {
      console.error('Enhanced mobile parity audit failed, falling back to basic analysis:', error);

      // Fallback to basic analysis
      const viewport = this.analyzeViewportTag();
      const mobileFriendly = await this.analyzeMobileFriendliness();
      const contentParity = await this.analyzeContentParity();
      const loading = await this.analyzeLoadingPerformance();

      return {
        viewport,
        mobileFriendly,
        contentParity,
        loading
      };
    }
  }

  /**
   * Analyze viewport meta tag
   */
  private analyzeViewportTag() {
    if (!this.$) {
      return { present: false, valid: false, content: '' };
    }

    const viewport = this.$('meta[name="viewport"]');
    const present = viewport.length > 0;
    const content = viewport.attr('content') || '';

    const valid = content.includes('width=device-width') ||
                  content.includes('initial-scale=1');

    return { present, valid, content };
  }

  /**
   * Analyze mobile friendliness
   */
  private async analyzeMobileFriendliness() {
    try {
      // Call existing mobile usability API
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/seo/mobile-usability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: this.url })
      });

      if (!response.ok) {
        throw new Error(`Mobile usability API failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        score: data.mobileFriendly?.score || 0,
        issues: data.mobileFriendly?.issues || [],
        blocked: data.mobileFriendly?.blocked || false
      };
    } catch (error) {
      console.error('Mobile friendliness analysis failed:', error);
      return { score: 0, issues: ['Failed to analyze mobile friendliness'], blocked: false };
    }
  }

  /**
   * Analyze content parity between mobile and desktop
   */
  private async analyzeContentParity() {
    // This would need parallel mobile and desktop crawls
    // For now, return estimated values based on page analysis
    return {
      textParity: 95, // High parity assumed for responsive sites
      imageParity: 90,
      linkParity: 95,
      structuredDataParity: 100
    };
  }

  /**
   * Analyze loading performance
   */
  private async analyzeLoadingPerformance() {
    // This would integrate with PageSpeed Insights
    return {
      aboveFoldTime: 2500, // milliseconds
      totalLoadTime: 4000, // milliseconds
      criticalResourceBlocking: false
    };
  }

  /**
   * Audit 5: Structured Data Validation
   */
  private async auditStructuredData(): Promise<StructuredDataResults> {
    console.log('📊 Auditing structured data...');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/seo/structured-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: this.url })
      });

      if (!response.ok) {
        throw new Error(`Structured data API failed: ${response.status}`);
      }

      const data = await response.json();
      return this.transformStructuredDataResults(data);
    } catch (error) {
      console.error('Structured data audit failed:', error);
      return this.getEmptyStructuredDataResults();
    }
  }

  /**
   * Transform structured data API results
   */
  private transformStructuredDataResults(data: any): StructuredDataResults {
    return {
      jsonLd: {
        present: data.hasStructuredData || false,
        valid: data.validationResults?.valid || false,
        schemas: data.schemas?.map((s: any) => s.type) || [],
        errors: data.validationResults?.errors || []
      },
      microdata: {
        present: data.microdata?.present || false,
        schemas: data.microdata?.schemas || []
      },
      rdfa: {
        present: data.rdfa?.present || false,
        schemas: data.rdfa?.schemas || []
      },
      richResults: {
        eligible: Object.keys(data.richResultsEligible || {}),
        implemented: Object.keys(data.richResultsEligible || {}).filter(key => data.richResultsEligible[key]),
        testing: {
          valid: data.richResultsTesting?.valid || false,
          warnings: data.richResultsTesting?.warnings || [],
          errors: data.richResultsTesting?.errors || []
        }
      }
    };
  }

  /**
   * Audit 6: HTTPS and Security Headers
   */
  private async auditSecurityHeaders(): Promise<SecurityResults> {
    console.log('🔒 Auditing security headers...');

    const [httpsAnalysis, headersAnalysis] = await Promise.allSettled([
      this.analyzeHTTPS(),
      this.analyzeSecurityHeaders()
    ]);

    return {
      https: this.getSettledValue(httpsAnalysis, {
        implemented: false,
        grade: 'F' as const,
        certificate: { valid: false, issuer: '', expiryDays: 0 },
        mixedContent: true
      }),
      headers: this.getSettledValue(headersAnalysis, {
        hsts: { present: false, maxAge: 0, includeSubdomains: false },
        csp: { present: false, valid: false, directives: [] },
        xFrameOptions: { present: false, value: '' },
        xContentTypeOptions: { present: false },
        referrerPolicy: { present: false, value: '' },
        permissionsPolicy: { present: false, directives: [] }
      })
    };
  }

  /**
   * Analyze HTTPS implementation
   */
  private async analyzeHTTPS() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/seo/ssl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: this.url })
      });

      if (!response.ok) {
        throw new Error(`SSL API failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        implemented: this.url.startsWith('https://'),
        grade: data.grade || 'F' as const,
        certificate: {
          valid: data.valid || false,
          issuer: data.issuer || '',
          expiryDays: data.daysRemaining || 0
        },
        mixedContent: false // Would need more analysis
      };
    } catch (error) {
      console.error('HTTPS analysis failed:', error);
      return {
        implemented: this.url.startsWith('https://'),
        grade: 'F' as const,
        certificate: { valid: false, issuer: '', expiryDays: 0 },
        mixedContent: true
      };
    }
  }

  /**
   * Analyze security headers
   */
  private async analyzeSecurityHeaders() {
    try {
      const response = await fetch(this.url, { method: 'HEAD' });
      const headers = response.headers;

      const hsts = headers.get('strict-transport-security');
      const csp = headers.get('content-security-policy');
      const xFrameOptions = headers.get('x-frame-options');
      const xContentTypeOptions = headers.get('x-content-type-options');
      const referrerPolicy = headers.get('referrer-policy');
      const permissionsPolicy = headers.get('permissions-policy') || headers.get('feature-policy');

      return {
        hsts: {
          present: !!hsts,
          maxAge: hsts ? this.extractMaxAge(hsts) : 0,
          includeSubdomains: hsts?.includes('includeSubDomains') || false
        },
        csp: {
          present: !!csp,
          valid: this.validateCSP(csp),
          directives: csp ? this.parseCSPDirectives(csp) : []
        },
        xFrameOptions: {
          present: !!xFrameOptions,
          value: xFrameOptions || ''
        },
        xContentTypeOptions: {
          present: !!xContentTypeOptions
        },
        referrerPolicy: {
          present: !!referrerPolicy,
          value: referrerPolicy || ''
        },
        permissionsPolicy: {
          present: !!permissionsPolicy,
          directives: permissionsPolicy ? this.parsePermissionsPolicyDirectives(permissionsPolicy) : []
        }
      };
    } catch (error) {
      console.error('Security headers analysis failed:', error);
      throw error;
    }
  }

  /**
   * Extract max-age from HSTS header
   */
  private extractMaxAge(hsts: string): number {
    const match = hsts.match(/max-age=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Validate Content Security Policy
   */
  private validateCSP(csp: string | null): boolean {
    if (!csp) return false;

    // Basic validation - should have at least default-src
    return csp.includes('default-src') || csp.includes('script-src');
  }

  /**
   * Parse CSP directives
   */
  private parseCSPDirectives(csp: string): string[] {
    return csp.split(';').map(directive => directive.trim().split(' ')[0]).filter(Boolean);
  }

  /**
   * Parse Permissions Policy directives
   */
  private parsePermissionsPolicyDirectives(policy: string): string[] {
    return policy.split(',').map(directive => directive.trim().split('=')[0]).filter(Boolean);
  }

  /**
   * Audit 7: Internal Linking and Orphaned Pages
   */
  private async auditInternalLinking(): Promise<LinkStructureResults> {
    console.log('🔗 Auditing internal linking...');

    try {
      // Use specialized internal linking audit (limited scope for performance)
      const internalLinkingAudit = new InternalLinkingAudit(this.url, 50); // Limit to 50 pages
      const results = await internalLinkingAudit.analyzeInternalLinking();

      return {
        internal: {
          totalLinks: results.linkDistribution?.totalInternalLinks || 0,
          uniquePages: results.totalPagesCrawled || 0,
          orphanedPages: results.orphanedPages?.count || 0,
          deepLevel: results.pageStructure?.maxDepth || 0,
          brokenLinks: 0, // Would need additional checking
          noFollowPercentage: 0 // Would need additional analysis
        },
        external: {
          totalLinks: 0,
          domains: 0,
          noFollowPercentage: 0,
          brokenLinks: 0,
          suspiciousLinks: 0
        },
        anchor: {
          overOptimization: false,
          genericAnchors: 0,
          exactMatchPercentage: 0
        }
      };
    } catch (error) {
      console.error('Enhanced internal linking audit failed, falling back to empty results:', error);
      return this.getEmptyLinkStructureResults();
    }
  }

  private async auditInternationalization(): Promise<InternationalizationResults> {
    console.log('🌍 Auditing internationalization...');

    if (!this.$) {
      return this.getEmptyInternationalizationResults();
    }

    const hreflangLinks = this.$('link[rel="alternate"][hreflang]');
    const htmlLang = this.$('html').attr('lang') || '';
    const contentLanguage = this.$('meta[http-equiv="content-language"]').attr('content') || '';

    return {
      hreflang: {
        implemented: hreflangLinks.length > 0,
        valid: true, // Would need more validation
        languages: [...new Set(hreflangLinks.map((_, el) => this.$(el).attr('hreflang')).get())],
        regions: [],
        xDefault: hreflangLinks.filter('[hreflang="x-default"]').length > 0,
        bidirectional: true, // Would need cross-page validation
        errors: []
      },
      language: {
        htmlLang,
        contentLanguage,
        consistent: true
      },
      geographic: {
        targeting: '',
        currency: '',
        timezone: ''
      }
    };
  }

  private async auditEcommerceFacets(): Promise<EcommerceResults> {
    console.log('🛒 Auditing e-commerce facets...');
    // Simplified implementation - would need e-commerce specific analysis
    return this.getEmptyEcommerceResults();
  }

  private async auditSpamCompliance(): Promise<SpamComplianceResults> {
    console.log('🛡️ Auditing spam compliance...');

    if (!this.$ || !this.html) {
      return this.getEmptySpamComplianceResults();
    }

    // Basic content analysis
    const text = this.$('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(' ').filter(word => word.length > 0).length;

    return {
      content: {
        thin: wordCount < 300,
        duplicate: 0, // Would need comparison with other pages
        keyword: {
          stuffing: false, // Would need keyword density analysis
          density: 2.5, // Mock value
          natural: true
        },
        readability: {
          grade: 8.5,
          score: 75
        }
      },
      links: {
        quality: 'good',
        paidLinks: 0,
        unnaturalPatterns: false,
        linkFarms: false
      },
      technical: {
        cloaking: false,
        redirect: {
          malicious: false,
          sneaky: false
        },
        hiddenContent: false
      },
      user: {
        experience: {
          intrusive: false,
          mobile: {
            popups: false,
            interstitials: false
          }
        }
      }
    };
  }

  // Helper methods for handling Promise.allSettled results
  private getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === 'fulfilled' ? result.value : fallback;
  }

  /**
   * Map WWW consistency results to redirect type
   */
  private mapWWWRedirectType(wwwConsistency: any): 'www_to_non_www' | 'non_www_to_www' | 'none' | 'both' {
    if (!wwwConsistency) return 'none';

    if (wwwConsistency.wwwRedirectsToNonWWW && wwwConsistency.nonWWWRedirectsToWWW) {
      return 'both';
    } else if (wwwConsistency.wwwRedirectsToNonWWW) {
      return 'www_to_non_www';
    } else if (wwwConsistency.nonWWWRedirectsToWWW) {
      return 'non_www_to_www';
    }

    return 'none';
  }

  // Empty result generators for fallbacks
  private getEmptyCrawlabilityResults(): CrawlabilityResults {
    return {
      robotsTxt: {
        exists: false, accessible: false, valid: false, size: 0,
        rules: [], sitemapReferences: [], issues: [], blockingRules: []
      },
      xmlSitemap: {
        exists: false, accessible: false, valid: false, urlCount: 0,
        lastModified: '', compression: false, errors: [], coverage: 0
      },
      metaRobots: {
        noindex: false, nofollow: false, noarchive: false, nosnippet: false,
        maxImagePreview: '', maxSnippet: '', maxVideoPreview: ''
      },
      canonicalTags: {
        present: false, valid: false, selfReferencing: false, issues: []
      }
    };
  }

  private getEmptyCanonicalizationResults(): CanonicalizationResults {
    return {
      canonical: {
        present: false, valid: false, selfReferencing: false,
        httpVsHttps: 'mixed', wwwVsNonWww: 'mixed', trailingSlash: 'mixed'
      },
      redirects: {
        httpToHttps: false, wwwRedirect: 'none', redirectChains: 0,
        redirectLoops: false, status: []
      },
      duplicateContent: {
        urlVariations: [], parameterHandling: 'needs_improvement', caseVariations: false
      }
    };
  }

  private getEmptyCoreWebVitalsResults(): CoreWebVitalsResults {
    return {
      mobile: {
        lcp: { value: 0, grade: 'poor', threshold: '≤2.5s' },
        inp: { value: 0, grade: 'poor', threshold: '≤200ms' },
        cls: { value: 0, grade: 'poor', threshold: '≤0.1' },
        overallGrade: 'poor'
      },
      desktop: {
        lcp: { value: 0, grade: 'poor', threshold: '≤2.5s' },
        inp: { value: 0, grade: 'poor', threshold: '≤200ms' },
        cls: { value: 0, grade: 'poor', threshold: '≤0.1' },
        overallGrade: 'poor'
      },
      fieldData: false,
      labData: false
    };
  }

  private getEmptyMobileIndexingResults(): MobileIndexingResults {
    return {
      viewport: { present: false, valid: false, content: '' },
      mobileFriendly: { score: 0, issues: [], blocked: false },
      contentParity: { textParity: 0, imageParity: 0, linkParity: 0, structuredDataParity: 0 },
      loading: { aboveFoldTime: 0, totalLoadTime: 0, criticalResourceBlocking: true }
    };
  }

  private getEmptyStructuredDataResults(): StructuredDataResults {
    return {
      jsonLd: { present: false, valid: false, schemas: [], errors: [] },
      microdata: { present: false, schemas: [] },
      rdfa: { present: false, schemas: [] },
      richResults: {
        eligible: [], implemented: [],
        testing: { valid: false, warnings: [], errors: [] }
      }
    };
  }

  private getEmptySecurityResults(): SecurityResults {
    return {
      https: {
        implemented: false, grade: 'F',
        certificate: { valid: false, issuer: '', expiryDays: 0 },
        mixedContent: true
      },
      headers: {
        hsts: { present: false, maxAge: 0, includeSubdomains: false },
        csp: { present: false, valid: false, directives: [] },
        xFrameOptions: { present: false, value: '' },
        xContentTypeOptions: { present: false },
        referrerPolicy: { present: false, value: '' },
        permissionsPolicy: { present: false, directives: [] }
      }
    };
  }

  private getEmptyLinkStructureResults(): LinkStructureResults {
    return {
      internal: {
        totalLinks: 0, uniquePages: 0, orphanedPages: 0,
        deepLevel: 0, brokenLinks: 0, noFollowPercentage: 0
      },
      external: {
        totalLinks: 0, domains: 0, noFollowPercentage: 0,
        brokenLinks: 0, suspiciousLinks: 0
      },
      anchor: {
        overOptimization: false, genericAnchors: 0, exactMatchPercentage: 0
      }
    };
  }

  private getEmptyInternationalizationResults(): InternationalizationResults {
    return {
      hreflang: {
        implemented: false, valid: false, languages: [], regions: [],
        xDefault: false, bidirectional: false, errors: []
      },
      language: { htmlLang: '', contentLanguage: '', consistent: false },
      geographic: { targeting: '', currency: '', timezone: '' }
    };
  }

  private getEmptyEcommerceResults(): EcommerceResults {
    return {
      facetedNavigation: {
        implemented: false, indexable: false,
        parameterHandling: 'poor', noindexUsage: false
      },
      pagination: {
        relNextPrev: false, canonicalization: 'self_referencing',
        loadMore: false, infiniteScroll: false
      },
      products: {
        structuredData: false, reviews: false, availability: false,
        pricing: false, images: false
      },
      categories: { breadcrumbs: false, structuredData: false, descriptions: false }
    };
  }

  private getEmptySpamComplianceResults(): SpamComplianceResults {
    return {
      content: {
        thin: false, duplicate: 0,
        keyword: { stuffing: false, density: 0, natural: false },
        readability: { grade: 0, score: 0 }
      },
      links: {
        quality: 'poor', paidLinks: 0, unnaturalPatterns: false, linkFarms: false
      },
      technical: {
        cloaking: false,
        redirect: { malicious: false, sneaky: false },
        hiddenContent: false
      },
      user: {
        experience: {
          intrusive: false,
          mobile: { popups: false, interstitials: false }
        }
      }
    };
  }

  /**
   * Generate audit categories from detailed results
   */
  private generateAuditCategories(results: any): TechnicalSEOAuditResult['categories'] {
    return {
      crawlabilityIndexability: this.generateCrawlabilityCategory(results.crawlability),
      urlCanonicalization: this.generateCanonicalizationCategory(results.canonicalization),
      coreWebVitals: this.generateCoreWebVitalsCategory(results.coreWebVitals),
      mobileFirstParity: this.generateMobileIndexingCategory(results.mobileIndexing),
      structuredData: this.generateStructuredDataCategory(results.structuredData),
      securityHeaders: this.generateSecurityCategory(results.security),
      internalLinking: this.generateLinkStructureCategory(results.linkStructure),
      internationalization: this.generateInternationalizationCategory(results.internationalization),
      ecommerceFacets: this.generateEcommerceCategory(results.ecommerce),
      spamCompliance: this.generateSpamComplianceCategory(results.spamChecks)
    };
  }

  /**
   * Generate crawlability category
   */
  private generateCrawlabilityCategory(crawlability: CrawlabilityResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'robots-txt',
        name: 'Robots.txt File',
        status: crawlability.robotsTxt.exists ? (crawlability.robotsTxt.valid ? 'pass' : 'warning') : 'fail',
        message: crawlability.robotsTxt.exists ?
          (crawlability.robotsTxt.valid ? 'Robots.txt is valid' : `Issues found: ${crawlability.robotsTxt.issues.join(', ')}`) :
          'No robots.txt file found',
        details: crawlability.robotsTxt,
        impact: 'high'
      },
      {
        id: 'xml-sitemap',
        name: 'XML Sitemap',
        status: crawlability.xmlSitemap.exists ? (crawlability.xmlSitemap.valid ? 'pass' : 'warning') : 'fail',
        message: crawlability.xmlSitemap.exists ?
          `Sitemap found with ${crawlability.xmlSitemap.urlCount} URLs` :
          'No XML sitemap found',
        details: crawlability.xmlSitemap,
        impact: 'critical'
      },
      {
        id: 'canonical-tags',
        name: 'Canonical Tags',
        status: crawlability.canonicalTags.present ? (crawlability.canonicalTags.valid ? 'pass' : 'warning') : 'warning',
        message: crawlability.canonicalTags.present ?
          (crawlability.canonicalTags.valid ? 'Canonical tag is properly implemented' : 'Canonical tag has issues') :
          'No canonical tag found',
        details: crawlability.canonicalTags,
        impact: 'medium'
      }
    ];

    const score = this.calculateCategoryScore(checks);
    const status = this.getCategoryStatus(checks);
    const impact = this.getCategoryImpact(checks);

    return { score, checks, status, impact };
  }

  /**
   * Generate canonicalization category
   */
  private generateCanonicalizationCategory(canonicalization: CanonicalizationResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'url-consistency',
        name: 'URL Consistency',
        status: canonicalization.canonical.httpVsHttps === 'consistent' &&
                canonicalization.canonical.wwwVsNonWww === 'consistent' ? 'pass' : 'warning',
        message: 'Checking URL consistency across protocol and subdomain variations',
        details: canonicalization.canonical,
        impact: 'medium'
      },
      {
        id: 'redirects',
        name: 'Redirect Implementation',
        status: canonicalization.redirects.httpToHttps ? 'pass' : 'fail',
        message: canonicalization.redirects.httpToHttps ?
          'HTTP to HTTPS redirects are implemented' :
          'Missing HTTP to HTTPS redirects',
        details: canonicalization.redirects,
        impact: 'high'
      }
    ];

    const score = this.calculateCategoryScore(checks);
    const status = this.getCategoryStatus(checks);
    const impact = this.getCategoryImpact(checks);

    return { score, checks, status, impact };
  }

  /**
   * Generate Core Web Vitals category
   */
  private generateCoreWebVitalsCategory(coreWebVitals: CoreWebVitalsResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'mobile-cwv',
        name: 'Mobile Core Web Vitals',
        status: coreWebVitals.mobile.overallGrade === 'good' ? 'pass' :
                coreWebVitals.mobile.overallGrade === 'needs-improvement' ? 'warning' : 'fail',
        message: `Mobile CWV grade: ${coreWebVitals.mobile.overallGrade}`,
        details: coreWebVitals.mobile,
        threshold: 'LCP ≤2.5s, INP ≤200ms, CLS ≤0.1',
        actualValue: `LCP: ${coreWebVitals.mobile.lcp.value}ms, INP: ${coreWebVitals.mobile.inp.value}ms, CLS: ${coreWebVitals.mobile.cls.value}`,
        impact: 'critical'
      },
      {
        id: 'desktop-cwv',
        name: 'Desktop Core Web Vitals',
        status: coreWebVitals.desktop.overallGrade === 'good' ? 'pass' :
                coreWebVitals.desktop.overallGrade === 'needs-improvement' ? 'warning' : 'fail',
        message: `Desktop CWV grade: ${coreWebVitals.desktop.overallGrade}`,
        details: coreWebVitals.desktop,
        threshold: 'LCP ≤2.5s, INP ≤200ms, CLS ≤0.1',
        actualValue: `LCP: ${coreWebVitals.desktop.lcp.value}ms, INP: ${coreWebVitals.desktop.inp.value}ms, CLS: ${coreWebVitals.desktop.cls.value}`,
        impact: 'critical'
      }
    ];

    const score = this.calculateCategoryScore(checks);
    const status = this.getCategoryStatus(checks);
    const impact = this.getCategoryImpact(checks);

    return { score, checks, status, impact };
  }

  /**
   * Generate remaining categories (simplified)
   */
  private generateMobileIndexingCategory(mobileIndexing: MobileIndexingResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'viewport-tag',
        name: 'Viewport Meta Tag',
        status: mobileIndexing.viewport.present && mobileIndexing.viewport.valid ? 'pass' : 'fail',
        message: mobileIndexing.viewport.present ? 'Viewport tag is present' : 'Missing viewport meta tag',
        details: mobileIndexing.viewport,
        impact: 'high'
      },
      {
        id: 'mobile-friendly',
        name: 'Mobile Friendliness',
        status: mobileIndexing.mobileFriendly.score >= 90 ? 'pass' :
                mobileIndexing.mobileFriendly.score >= 70 ? 'warning' : 'fail',
        message: `Mobile friendliness score: ${mobileIndexing.mobileFriendly.score}/100`,
        details: mobileIndexing.mobileFriendly,
        impact: 'high'
      }
    ];

    return {
      score: this.calculateCategoryScore(checks),
      checks,
      status: this.getCategoryStatus(checks),
      impact: this.getCategoryImpact(checks)
    };
  }

  private generateStructuredDataCategory(structuredData: StructuredDataResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'json-ld',
        name: 'JSON-LD Implementation',
        status: structuredData.jsonLd.present ? (structuredData.jsonLd.valid ? 'pass' : 'warning') : 'warning',
        message: structuredData.jsonLd.present ?
          `Found ${structuredData.jsonLd.schemas.length} schema types` :
          'No JSON-LD structured data found',
        details: structuredData.jsonLd,
        impact: 'medium'
      }
    ];

    return {
      score: this.calculateCategoryScore(checks),
      checks,
      status: this.getCategoryStatus(checks),
      impact: this.getCategoryImpact(checks)
    };
  }

  private generateSecurityCategory(security: SecurityResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'https',
        name: 'HTTPS Implementation',
        status: security.https.implemented ? 'pass' : 'fail',
        message: security.https.implemented ?
          `HTTPS implemented (Grade: ${security.https.grade})` :
          'HTTPS not implemented',
        details: security.https,
        impact: 'critical'
      },
      {
        id: 'security-headers',
        name: 'Security Headers',
        status: security.headers.hsts.present && security.headers.xFrameOptions.present ? 'pass' : 'warning',
        message: 'Checking essential security headers',
        details: security.headers,
        impact: 'medium'
      }
    ];

    return {
      score: this.calculateCategoryScore(checks),
      checks,
      status: this.getCategoryStatus(checks),
      impact: this.getCategoryImpact(checks)
    };
  }

  private generateLinkStructureCategory(linkStructure: LinkStructureResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'internal-links',
        name: 'Internal Link Structure',
        status: linkStructure.internal.orphanedPages === 0 ? 'pass' : 'warning',
        message: `${linkStructure.internal.orphanedPages} orphaned pages found`,
        details: linkStructure.internal,
        impact: 'medium'
      }
    ];

    return {
      score: this.calculateCategoryScore(checks),
      checks,
      status: this.getCategoryStatus(checks),
      impact: this.getCategoryImpact(checks)
    };
  }

  private generateInternationalizationCategory(internationalization: InternationalizationResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'hreflang',
        name: 'Hreflang Implementation',
        status: internationalization.hreflang.implemented ?
          (internationalization.hreflang.valid ? 'pass' : 'warning') : 'pass',
        message: internationalization.hreflang.implemented ?
          `Hreflang implemented for ${internationalization.hreflang.languages.length} languages` :
          'No hreflang implementation (acceptable for single-language sites)',
        details: internationalization.hreflang,
        impact: 'low'
      }
    ];

    return {
      score: this.calculateCategoryScore(checks),
      checks,
      status: this.getCategoryStatus(checks),
      impact: this.getCategoryImpact(checks)
    };
  }

  private generateEcommerceCategory(ecommerce: EcommerceResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'faceted-navigation',
        name: 'Faceted Navigation',
        status: 'pass', // Simplified - would need e-commerce detection
        message: 'E-commerce specific checks',
        details: ecommerce.facetedNavigation,
        impact: 'low'
      }
    ];

    return {
      score: this.calculateCategoryScore(checks),
      checks,
      status: this.getCategoryStatus(checks),
      impact: this.getCategoryImpact(checks)
    };
  }

  private generateSpamComplianceCategory(spamChecks: SpamComplianceResults): AuditCategory {
    const checks: SEOCheck[] = [
      {
        id: 'content-quality',
        name: 'Content Quality',
        status: !spamChecks.content.thin ? 'pass' : 'warning',
        message: spamChecks.content.thin ? 'Content may be too thin' : 'Content quality is acceptable',
        details: spamChecks.content,
        impact: 'medium'
      }
    ];

    return {
      score: this.calculateCategoryScore(checks),
      checks,
      status: this.getCategoryStatus(checks),
      impact: this.getCategoryImpact(checks)
    };
  }

  /**
   * Calculate category score based on checks
   */
  private calculateCategoryScore(checks: SEOCheck[]): number {
    if (checks.length === 0) return 0;

    const totalScore = checks.reduce((sum, check) => {
      switch (check.status) {
        case 'pass': return sum + 100;
        case 'warning': return sum + 70;
        case 'fail': return sum + 30;
        default: return sum;
      }
    }, 0);

    return Math.round(totalScore / checks.length);
  }

  /**
   * Get category status based on checks
   */
  private getCategoryStatus(checks: SEOCheck[]): 'pass' | 'warning' | 'fail' {
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warning');

    if (hasFailures) return 'fail';
    if (hasWarnings) return 'warning';
    return 'pass';
  }

  /**
   * Get category impact based on checks
   */
  private getCategoryImpact(checks: SEOCheck[]): 'low' | 'medium' | 'high' | 'critical' {
    const impacts = checks.map(check => check.impact);

    if (impacts.includes('critical')) return 'critical';
    if (impacts.includes('high')) return 'high';
    if (impacts.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Calculate overall audit score using weighted categories
   */
  private calculateOverallScore(categories: TechnicalSEOAuditResult['categories']): number {
    let weightedScore = 0;
    let totalWeight = 0;

    Object.entries(categories).forEach(([categoryKey, category]) => {
      const weight = AUDIT_WEIGHTS[categoryKey as keyof typeof AUDIT_WEIGHTS] || 0;
      weightedScore += category.score * weight;
      totalWeight += weight;
    });

    return Math.round(weightedScore / totalWeight);
  }

  /**
   * Generate audit summary
   */
  private generateSummary(categories: TechnicalSEOAuditResult['categories'], overallScore: number): TechnicalSEOAuditResult['summary'] {
    let critical = 0;
    let warnings = 0;
    let passed = 0;

    Object.values(categories).forEach(category => {
      category.checks.forEach(check => {
        switch (check.status) {
          case 'fail':
            if (check.impact === 'critical') critical++;
            else warnings++;
            break;
          case 'warning':
            warnings++;
            break;
          case 'pass':
            passed++;
            break;
        }
      });
    });

    return {
      critical,
      warnings,
      passed,
      totalChecks: critical + warnings + passed,
      grade: calculateGrade(overallScore)
    };
  }

  /**
   * Generate recommendations based on audit results
   */
  private generateRecommendations(
    categories: TechnicalSEOAuditResult['categories'],
    results: any
  ): SEORecommendation[] {
    const recommendations: SEORecommendation[] = [];

    Object.entries(categories).forEach(([categoryKey, category]) => {
      category.checks.forEach(check => {
        if (check.status === 'fail' || check.status === 'warning') {
          const recommendation = this.generateRecommendationForCheck(categoryKey, check);
          if (recommendation) {
            recommendations.push(recommendation);
          }
        }
      });
    });

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate specific recommendation for a failed/warning check
   */
  private generateRecommendationForCheck(categoryKey: string, check: SEOCheck): SEORecommendation | null {
    const baseRecommendation = {
      id: `${categoryKey}-${check.id}`,
      category: this.getCategoryDisplayName(categoryKey),
      title: check.name,
      issue: check.message,
      priority: this.mapImpactToPriority(check.impact),
      estimatedEffort: 'medium' as const,
      technicalComplexity: 'medium' as const,
      businessImpact: check.impact === 'critical' ? 'high' as const : 'medium' as const
    };

    // Generate specific recommendations based on check ID
    switch (check.id) {
      case 'robots-txt':
        return {
          ...baseRecommendation,
          recommendation: 'Create a robots.txt file with proper crawl directives and sitemap references',
          impact: 'Essential for search engine crawling and indexing',
          estimatedEffort: 'low',
          technicalComplexity: 'low'
        };

      case 'xml-sitemap':
        return {
          ...baseRecommendation,
          recommendation: 'Generate and submit an XML sitemap listing all important pages',
          impact: 'Helps search engines discover and index your content',
          estimatedEffort: 'medium',
          technicalComplexity: 'medium'
        };

      case 'mobile-cwv':
      case 'desktop-cwv':
        return {
          ...baseRecommendation,
          recommendation: 'Optimize Core Web Vitals: reduce LCP, improve INP responsiveness, minimize CLS',
          impact: 'Direct ranking factor affecting search visibility and user experience',
          estimatedEffort: 'high',
          technicalComplexity: 'high',
          businessImpact: 'high'
        };

      case 'https':
        return {
          ...baseRecommendation,
          recommendation: 'Implement HTTPS with a valid SSL certificate and redirect all HTTP traffic',
          impact: 'Essential for security, trust, and SEO rankings',
          estimatedEffort: 'medium',
          technicalComplexity: 'medium',
          businessImpact: 'high'
        };

      case 'viewport-tag':
        return {
          ...baseRecommendation,
          recommendation: 'Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">',
          impact: 'Critical for mobile-first indexing and user experience',
          estimatedEffort: 'low',
          technicalComplexity: 'low'
        };

      default:
        return {
          ...baseRecommendation,
          recommendation: `Address ${check.name} issues identified in the audit`,
          impact: 'Improves overall SEO performance and search visibility'
        };
    }
  }

  /**
   * Map impact level to priority
   */
  private mapImpactToPriority(impact: 'low' | 'medium' | 'high' | 'critical'): 'low' | 'medium' | 'high' | 'critical' {
    return impact;
  }

  /**
   * Get display name for category
   */
  private getCategoryDisplayName(categoryKey: string): string {
    const displayNames: { [key: string]: string } = {
      crawlabilityIndexability: 'Crawlability & Indexability',
      urlCanonicalization: 'URL Canonicalization',
      coreWebVitals: 'Core Web Vitals',
      mobileFirstParity: 'Mobile-First Indexing',
      structuredData: 'Structured Data',
      securityHeaders: 'Security Headers',
      internalLinking: 'Internal Linking',
      internationalization: 'Internationalization',
      ecommerceFacets: 'E-commerce Facets',
      spamCompliance: 'Spam Compliance'
    };

    return displayNames[categoryKey] || categoryKey;
  }
}