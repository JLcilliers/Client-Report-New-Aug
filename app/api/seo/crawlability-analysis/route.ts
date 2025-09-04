import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface CrawlabilityAnalysisResult {
  url: string;
  domain: string;
  robots: {
    exists: boolean;
    accessible: boolean;
    size: number;
    userAgents: {
      userAgent: string;
      rules: {
        directive: 'Allow' | 'Disallow';
        path: string;
      }[];
    }[];
    sitemaps: string[];
    crawlDelay?: number;
    issues: string[];
    recommendations: string[];
  };
  sitemap: {
    xmlSitemap: {
      exists: boolean;
      accessible: boolean;
      urls: number;
      images: number;
      videos: number;
      lastModified?: string;
      errors: string[];
    };
    htmlSitemap: {
      exists: boolean;
      accessible: boolean;
      linkCount: number;
    };
    sitemapIndex: {
      exists: boolean;
      childSitemaps: number;
    };
  };
  indexability: {
    metaRobots: {
      noindex: boolean;
      nofollow: boolean;
      noarchive: boolean;
      nosnippet: boolean;
      noimageindex: boolean;
      content: string;
    };
    xRobotsTag: {
      present: boolean;
      directives: string[];
    };
    canonical: {
      present: boolean;
      url?: string;
      selfReferencing: boolean;
      issues: string[];
    };
    hreflang: {
      present: boolean;
      tags: {
        hreflang: string;
        href: string;
      }[];
      issues: string[];
    };
  };
  technicalFactors: {
    httpStatus: number;
    redirects: number;
    loadTime: number;
    pageSize: number;
    wordCount: number;
    headingStructure: {
      h1: number;
      h2: number;
      h3: number;
      h4: number;
      h5: number;
      h6: number;
    };
    images: {
      total: number;
      withAlt: number;
      withoutAlt: number;
      lazy: number;
    };
  };
  crawlBudget: {
    estimatedCrawlBudget: number;
    factorsAffecting: string[];
    optimization: {
      score: number;
      recommendations: string[];
    };
  };
  internalLinking: {
    depth: number;
    internalLinks: number;
    orphanPages: boolean;
    recommendations: string[];
  };
  issues: {
    type: string;
    severity: 'critical' | 'warning' | 'minor';
    description: string;
    recommendation: string;
    impact: string;
  }[];
  score: number;
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
    impact: string;
  }[];
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url, checkSitemap = true, checkRobots = true, analyzeCrawlBudget = true } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const result = await analyzeCrawlability(url, { checkSitemap, checkRobots, analyzeCrawlBudget });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Crawlability analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze crawlability' },
      { status: 500 }
    );
  }
}

async function analyzeCrawlability(
  url: string, 
  options: { checkSitemap: boolean; checkRobots: boolean; analyzeCrawlBudget: boolean }
): Promise<CrawlabilityAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const baseUrl = new URL(url);
    const domain = baseUrl.hostname;
    const robotsUrl = `${baseUrl.origin}/robots.txt`;
    const sitemapUrl = `${baseUrl.origin}/sitemap.xml`;

    // Fetch the main page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Crawler/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const loadTime = Date.now() - startTime;

    // Analyze robots.txt
    let robots = await analyzeRobotsTxt(robotsUrl);

    // Analyze sitemaps
    let sitemap = await analyzeSitemaps(sitemapUrl, robotsUrl, robots.sitemaps);

    // Analyze indexability
    const indexability = analyzeIndexability($, response.headers, url);

    // Analyze technical factors
    const technicalFactors = analyzeTechnicalFactors($, response, loadTime, html);

    // Analyze internal linking
    const internalLinking = analyzeInternalLinking($, domain);

    // Estimate crawl budget optimization
    let crawlBudget: {
      estimatedCrawlBudget: number;
      factorsAffecting: string[];
      optimization: {
        score: number;
        recommendations: string[];
      };
    } = { estimatedCrawlBudget: 0, factorsAffecting: [], optimization: { score: 0, recommendations: [] } };
    if (options.analyzeCrawlBudget) {
      crawlBudget = analyzeCrawlBudgetFactors(technicalFactors, robots, sitemap, indexability);
    }

    // Identify issues
    const issues = identifyCrawlabilityIssues(robots, sitemap, indexability, technicalFactors, crawlBudget);

    // Calculate overall score
    const score = calculateCrawlabilityScore(robots, sitemap, indexability, technicalFactors, issues);

    // Generate recommendations
    const recommendations = generateCrawlabilityRecommendations(issues, crawlBudget);

    return {
      url,
      domain,
      robots,
      sitemap,
      indexability,
      technicalFactors,
      crawlBudget,
      internalLinking,
      issues,
      score,
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Crawlability analysis error for ${url}:`, error);
    
    return {
      url,
      domain: new URL(url).hostname,
      robots: {
        exists: false,
        accessible: false,
        size: 0,
        userAgents: [],
        sitemaps: [],
        issues: ['Unable to check robots.txt'],
        recommendations: []
      },
      sitemap: {
        xmlSitemap: { exists: false, accessible: false, urls: 0, images: 0, videos: 0, errors: ['Unable to check sitemap'] },
        htmlSitemap: { exists: false, accessible: false, linkCount: 0 },
        sitemapIndex: { exists: false, childSitemaps: 0 }
      },
      indexability: {
        metaRobots: { noindex: false, nofollow: false, noarchive: false, nosnippet: false, noimageindex: false, content: '' },
        xRobotsTag: { present: false, directives: [] },
        canonical: { present: false, selfReferencing: false, issues: [] },
        hreflang: { present: false, tags: [], issues: [] }
      },
      technicalFactors: {
        httpStatus: 0,
        redirects: 0,
        loadTime: 0,
        pageSize: 0,
        wordCount: 0,
        headingStructure: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
        images: { total: 0, withAlt: 0, withoutAlt: 0, lazy: 0 }
      },
      crawlBudget: {
        estimatedCrawlBudget: 0,
        factorsAffecting: ['Analysis failed'],
        optimization: { score: 0, recommendations: ['Unable to analyze crawl budget factors'] }
      },
      internalLinking: {
        depth: 0,
        internalLinks: 0,
        orphanPages: true,
        recommendations: ['Unable to analyze internal linking']
      },
      issues: [{
        type: 'analysis_error',
        severity: 'critical',
        description: 'Unable to analyze crawlability',
        recommendation: 'Check if the website is accessible and try again',
        impact: 'Cannot assess crawlability factors'
      }],
      score: 0,
      recommendations: [],
      timestamp: new Date().toISOString()
    };
  }
}

async function analyzeRobotsTxt(robotsUrl: string) {
  try {
    const response = await fetch(robotsUrl);
    const exists = response.ok;
    let content = '';
    
    if (exists) {
      content = await response.text();
    }

    const robots = {
      exists,
      accessible: exists,
      size: content.length,
      userAgents: [] as any[],
      sitemaps: [] as string[],
      crawlDelay: undefined as number | undefined,
      issues: [] as string[],
      recommendations: [] as string[]
    };

    if (!exists) {
      robots.recommendations.push('Create a robots.txt file to guide search engine crawlers');
      return robots;
    }

    // Parse robots.txt content
    const lines = content.split('\n');
    let currentUserAgent = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('User-agent:')) {
        currentUserAgent = trimmed.substring(11).trim();
        const existing = robots.userAgents.find(ua => ua.userAgent === currentUserAgent);
        if (!existing) {
          robots.userAgents.push({ userAgent: currentUserAgent, rules: [] });
        }
      } else if (trimmed.startsWith('Disallow:') || trimmed.startsWith('Allow:')) {
        const directive = trimmed.startsWith('Disallow:') ? 'Disallow' : 'Allow';
        const path = trimmed.substring(trimmed.indexOf(':') + 1).trim();
        
        const userAgentEntry = robots.userAgents.find(ua => ua.userAgent === currentUserAgent);
        if (userAgentEntry) {
          userAgentEntry.rules.push({ directive, path });
        }
      } else if (trimmed.startsWith('Sitemap:')) {
        const sitemapUrl = trimmed.substring(8).trim();
        robots.sitemaps.push(sitemapUrl);
      } else if (trimmed.startsWith('Crawl-delay:')) {
        const delay = parseInt(trimmed.substring(12).trim());
        if (!isNaN(delay)) {
          robots.crawlDelay = delay;
        }
      }
    }

    // Check for common issues
    const hasWildcardDisallow = robots.userAgents.some(ua => 
      ua.userAgent === '*' && ua.rules.some((rule: { directive: string; path: string }) => rule.directive === 'Disallow' && rule.path === '/')
    );
    
    if (hasWildcardDisallow) {
      robots.issues.push('Robots.txt blocks all crawlers from entire site');
      robots.recommendations.push('Review robots.txt - currently blocking all search engines');
    }

    if (robots.sitemaps.length === 0) {
      robots.recommendations.push('Add sitemap URLs to robots.txt');
    }

    if (content.length > 500 * 1024) { // 500KB limit
      robots.issues.push('Robots.txt file is very large (>500KB)');
      robots.recommendations.push('Optimize robots.txt file size for better crawler efficiency');
    }

    return robots;
  } catch (error) {
    return {
      exists: false,
      accessible: false,
      size: 0,
      userAgents: [],
      sitemaps: [],
      issues: ['Unable to fetch robots.txt'],
      recommendations: ['Ensure robots.txt is accessible and properly formatted']
    };
  }
}

async function analyzeSitemaps(primarySitemapUrl: string, robotsUrl: string, robotsSitemaps: string[]) {
  const sitemap = {
    xmlSitemap: {
      exists: false,
      accessible: false,
      urls: 0,
      images: 0,
      videos: 0,
      lastModified: undefined as string | undefined,
      errors: [] as string[]
    },
    htmlSitemap: {
      exists: false,
      accessible: false,
      linkCount: 0
    },
    sitemapIndex: {
      exists: false,
      childSitemaps: 0
    }
  };

  // Check XML sitemap
  const sitemapsToCheck = [primarySitemapUrl, ...robotsSitemaps];
  
  for (const sitemapUrl of sitemapsToCheck) {
    try {
      const response = await fetch(sitemapUrl);
      if (response.ok) {
        const content = await response.text();
        const lastModified = response.headers.get('last-modified');
        
        sitemap.xmlSitemap.exists = true;
        sitemap.xmlSitemap.accessible = true;
        if (lastModified) {
          sitemap.xmlSitemap.lastModified = lastModified;
        }

        // Parse sitemap content
        if (content.includes('<sitemapindex')) {
          sitemap.sitemapIndex.exists = true;
          const sitemapMatches = content.match(/<sitemap>/g);
          sitemap.sitemapIndex.childSitemaps = sitemapMatches ? sitemapMatches.length : 0;
        }

        // Count URLs, images, videos
        const urlMatches = content.match(/<url>/g);
        const imageMatches = content.match(/<image:image>/g);
        const videoMatches = content.match(/<video:video>/g);
        
        sitemap.xmlSitemap.urls += urlMatches ? urlMatches.length : 0;
        sitemap.xmlSitemap.images += imageMatches ? imageMatches.length : 0;
        sitemap.xmlSitemap.videos += videoMatches ? videoMatches.length : 0;

        // Check for common sitemap errors
        if (!content.includes('<?xml')) {
          sitemap.xmlSitemap.errors.push('Missing XML declaration');
        }
        
        if (!content.includes('xmlns')) {
          sitemap.xmlSitemap.errors.push('Missing XML namespace');
        }

        break; // Found a working sitemap
      }
    } catch (error) {
      sitemap.xmlSitemap.errors.push(`Unable to fetch sitemap: ${sitemapUrl}`);
    }
  }

  return sitemap;
}

function analyzeIndexability($: cheerio.CheerioAPI, headers: Headers, url: string) {
  // Meta robots analysis
  const metaRobots = $('meta[name="robots"]').attr('content') || '';
  const metaRobotsData = {
    noindex: metaRobots.includes('noindex'),
    nofollow: metaRobots.includes('nofollow'),
    noarchive: metaRobots.includes('noarchive'),
    nosnippet: metaRobots.includes('nosnippet'),
    noimageindex: metaRobots.includes('noimageindex'),
    content: metaRobots
  };

  // X-Robots-Tag analysis
  const xRobotsTag = headers.get('x-robots-tag');
  const xRobotsData = {
    present: !!xRobotsTag,
    directives: xRobotsTag ? xRobotsTag.split(',').map(d => d.trim()) : []
  };

  // Canonical analysis
  const canonicalLink = $('link[rel="canonical"]').attr('href');
  const canonicalData = {
    present: !!canonicalLink,
    url: canonicalLink,
    selfReferencing: canonicalLink === url,
    issues: [] as string[]
  };

  if (canonicalLink) {
    try {
      const canonicalUrl = new URL(canonicalLink, url);
      const currentUrl = new URL(url);
      
      if (canonicalUrl.href !== currentUrl.href && canonicalUrl.pathname === currentUrl.pathname) {
        canonicalData.issues.push('Canonical URL differs only in domain/protocol');
      }
    } catch (error) {
      canonicalData.issues.push('Invalid canonical URL format');
    }
  }

  // Hreflang analysis
  const hreflangLinks = $('link[rel="alternate"][hreflang]');
  const hreflangData = {
    present: hreflangLinks.length > 0,
    tags: hreflangLinks.map((_, el) => ({
      hreflang: $(el).attr('hreflang') || '',
      href: $(el).attr('href') || ''
    })).get(),
    issues: [] as string[]
  };

  // Check for hreflang issues
  const hreflangValues = hreflangData.tags.map(tag => tag.hreflang);
  const duplicateHreflang = hreflangValues.length !== new Set(hreflangValues).size;
  
  if (duplicateHreflang) {
    hreflangData.issues.push('Duplicate hreflang values found');
  }

  return {
    metaRobots: metaRobotsData,
    xRobotsTag: xRobotsData,
    canonical: canonicalData,
    hreflang: hreflangData
  };
}

function analyzeTechnicalFactors($: cheerio.CheerioAPI, response: Response, loadTime: number, html: string) {
  // Basic metrics
  const httpStatus = response.status;
  const pageSize = new Blob([html]).size;
  const wordCount = $('body').text().split(/\s+/).filter(word => word.length > 0).length;

  // Heading structure
  const headingStructure = {
    h1: $('h1').length,
    h2: $('h2').length,
    h3: $('h3').length,
    h4: $('h4').length,
    h5: $('h5').length,
    h6: $('h6').length
  };

  // Image analysis
  const images = $('img');
  const imagesData = {
    total: images.length,
    withAlt: images.filter((_, img) => !!$(img).attr('alt')).length,
    withoutAlt: images.filter((_, img) => !$(img).attr('alt')).length,
    lazy: images.filter((_, img) => $(img).attr('loading') === 'lazy' || !!$(img).attr('data-src')).length
  };

  return {
    httpStatus,
    redirects: 0, // Would need redirect chain analysis
    loadTime,
    pageSize,
    wordCount,
    headingStructure,
    images: imagesData
  };
}

function analyzeInternalLinking($: cheerio.CheerioAPI, domain: string) {
  const internalLinks = $('a[href]').filter((_, link) => {
    const href = $(link).attr('href');
    if (!href) return false;
    
    try {
      const linkUrl = new URL(href, `https://${domain}`);
      return linkUrl.hostname === domain || linkUrl.hostname === `www.${domain}`;
    } catch {
      return href.startsWith('/');
    }
  });

  return {
    depth: 1, // Would need full site crawl to determine
    internalLinks: internalLinks.length,
    orphanPages: false, // Would need site-wide analysis
    recommendations: internalLinks.length < 5 ? 
      ['Add more internal links to improve navigation and SEO'] : 
      ['Internal linking structure appears adequate']
  };
}

function analyzeCrawlBudgetFactors(
  technicalFactors: any, 
  robots: any, 
  sitemap: any, 
  indexability: any
): {
  estimatedCrawlBudget: number;
  factorsAffecting: string[];
  optimization: {
    score: number;
    recommendations: string[];
  };
} {
  let score = 100;
  const factorsAffecting: string[] = [];
  const recommendations: string[] = [];

  // Page load time impact
  if (technicalFactors.loadTime > 3000) {
    score -= 20;
    factorsAffecting.push('Slow page load time');
    recommendations.push('Optimize page load speed to improve crawl efficiency');
  }

  // Page size impact
  if (technicalFactors.pageSize > 2 * 1024 * 1024) { // 2MB
    score -= 15;
    factorsAffecting.push('Large page size');
    recommendations.push('Reduce page size for better crawl budget utilization');
  }

  // Robots.txt impact
  if (!robots.exists) {
    score -= 10;
    factorsAffecting.push('Missing robots.txt');
    recommendations.push('Create robots.txt to guide crawler behavior');
  }

  // Sitemap impact
  if (!sitemap.xmlSitemap.exists) {
    score -= 15;
    factorsAffecting.push('Missing XML sitemap');
    recommendations.push('Create and submit XML sitemap');
  }

  // Indexability issues
  if (indexability.metaRobots.noindex) {
    score -= 30;
    factorsAffecting.push('Page blocked from indexing');
    recommendations.push('Review meta robots noindex directive');
  }

  // Estimate crawl budget (very rough estimation)
  const baseBudget = 1000; // Base assumption for average site
  const estimatedCrawlBudget = Math.max(100, Math.round(baseBudget * (score / 100)));

  return {
    estimatedCrawlBudget,
    factorsAffecting,
    optimization: {
      score: Math.max(0, score),
      recommendations
    }
  };
}

function identifyCrawlabilityIssues(robots: any, sitemap: any, indexability: any, technicalFactors: any, crawlBudget: any) {
  const issues = [];

  // Critical issues
  if (!robots.exists) {
    issues.push({
      type: 'missing_robots',
      severity: 'critical' as const,
      description: 'No robots.txt file found',
      recommendation: 'Create a robots.txt file to guide search engine crawlers',
      impact: 'Search engines may not understand crawling preferences'
    });
  }

  if (!sitemap.xmlSitemap.exists) {
    issues.push({
      type: 'missing_sitemap',
      severity: 'critical' as const,
      description: 'No XML sitemap found',
      recommendation: 'Create and submit an XML sitemap to search engines',
      impact: 'Search engines may not discover all your pages'
    });
  }

  if (indexability.metaRobots.noindex) {
    issues.push({
      type: 'noindex_directive',
      severity: 'critical' as const,
      description: 'Page has noindex directive',
      recommendation: 'Remove noindex if you want this page to be indexed',
      impact: 'Page will not appear in search results'
    });
  }

  // Warning issues
  if (technicalFactors.loadTime > 5000) {
    issues.push({
      type: 'slow_load_time',
      severity: 'warning' as const,
      description: `Page load time is slow (${technicalFactors.loadTime}ms)`,
      recommendation: 'Optimize page speed for better crawlability',
      impact: 'Slow pages may be crawled less frequently'
    });
  }

  if (technicalFactors.headingStructure.h1 === 0) {
    issues.push({
      type: 'missing_h1',
      severity: 'warning' as const,
      description: 'No H1 heading found',
      recommendation: 'Add an H1 heading to improve content structure',
      impact: 'Missing H1 may affect content understanding'
    });
  }

  if (technicalFactors.headingStructure.h1 > 1) {
    issues.push({
      type: 'multiple_h1',
      severity: 'warning' as const,
      description: 'Multiple H1 headings found',
      recommendation: 'Use only one H1 heading per page',
      impact: 'Multiple H1s may confuse search engines about page topic'
    });
  }

  return issues;
}

function generateCrawlabilityRecommendations(issues: any[], crawlBudget: any): {
  priority: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  recommendation: string;
  impact: string;
}[] {
  const recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
    impact: string;
  }[] = [];

  // Add issue-based recommendations
  issues.forEach(issue => {
    recommendations.push({
      priority: issue.severity === 'critical' ? 'high' as const : 
               issue.severity === 'warning' ? 'medium' as const : 'low' as const,
      category: 'Crawlability',
      issue: issue.description,
      recommendation: issue.recommendation,
      impact: issue.impact
    });
  });

  // Add crawl budget recommendations
  crawlBudget.optimization.recommendations.forEach((rec: string) => {
    recommendations.push({
      priority: 'medium' as const,
      category: 'Crawl Budget',
      issue: 'Crawl budget optimization needed',
      recommendation: rec,
      impact: 'Improves crawler efficiency and coverage'
    });
  });

  return recommendations.sort((a, b) => {
    const priorityOrder: { [key in 'high' | 'medium' | 'low']: number } = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function calculateCrawlabilityScore(robots: any, sitemap: any, indexability: any, technicalFactors: any, issues: any[]) {
  let score = 100;

  // Deduct points for critical issues
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const warningIssues = issues.filter(i => i.severity === 'warning').length;
  
  score -= criticalIssues * 25;
  score -= warningIssues * 10;

  // Positive factors
  if (robots.exists && robots.accessible) score += 5;
  if (sitemap.xmlSitemap.exists && sitemap.xmlSitemap.accessible) score += 10;
  if (indexability.canonical.present && indexability.canonical.selfReferencing) score += 5;
  if (technicalFactors.headingStructure.h1 === 1) score += 5;

  return Math.max(0, Math.min(100, score));
}