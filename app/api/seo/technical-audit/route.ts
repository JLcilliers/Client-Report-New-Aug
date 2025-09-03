import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import https from 'https';

const prisma = new PrismaClient();

interface ComprehensiveTechnicalAudit {
  domain: string;
  url: string;
  timestamp: string;
  overallScore: number;
  summary: {
    critical: number;
    warnings: number;
    passed: number;
    totalChecks: number;
  };
  categories: {
    performance: AuditCategory;
    security: AuditCategory;
    seo: AuditCategory;
    accessibility: AuditCategory;
    mobile: AuditCategory;
    crawlability: AuditCategory;
    contentQuality: AuditCategory;
  };
  coreWebVitals: {
    mobile: any;
    desktop: any;
    grade: 'good' | 'needs-improvement' | 'poor';
  };
  mobileUsability: {
    score: number;
    issues: any[];
    passedChecks: number;
    totalChecks: number;
  };
  pageSpeed: {
    mobile: any;
    desktop: any;
    averageScore: number;
  };
  crawlability: {
    score: number;
    robotsTxt: any;
    sitemap: any;
    indexability: any;
  };
  linkAnalysis: {
    internalLinks: any;
    externalLinks: any;
    issues: any[];
  };
  contentAnalysis: {
    duplicateContent: any;
    errorPages: any;
    contentQuality: any;
  };
  securityAnalysis: {
    ssl: any;
    headers: any;
    mixedContent: boolean;
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
    impact: string;
    estimatedImpact?: string;
  }[];
  auditId?: string;
}

interface AuditCategory {
  score: number;
  checks: {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    details?: any;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { 
      domain, 
      includePageSpeed = true, 
      includeCoreWebVitals = true,
      includeMobileUsability = true,
      includeCrawlability = true,
      includeLinkAnalysis = false, // Can be resource intensive
      includeContentAnalysis = false, // Can be resource intensive
      reportId,
      clientReportId
    } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    console.log('🔍 Starting comprehensive technical SEO audit for:', url);
    
    // Create audit record in database
    const auditRecord = await prisma.sEOAudit.create({
      data: {
        reportId: reportId || undefined,
        clientReportId: clientReportId || undefined,
        domain: new URL(url).hostname,
        url
      }
    });

    // Run core audits in parallel (fast ones first)
    console.log('🚀 Running core audits...');
    const coreAuditPromises = [
      auditRobots(url),
      auditSitemap(url),
      auditSSL(url),
      auditMetaTags(url),
      auditStructuredData(url),
      auditContent(url)
    ];

    const [
      robotsAudit,
      sitemapAudit,
      sslAudit,
      metaAudit,
      structuredDataAudit,
      contentAudit
    ] = await Promise.all(coreAuditPromises);

    console.log('✅ Core audits completed');

    // Run performance audits (slower)
    let pageSpeedAudit = null;
    let coreWebVitalsAudit = null;
    
    if (includePageSpeed || includeCoreWebVitals) {
      console.log('📊 Running performance audits...');
      const performancePromises = [];
      
      if (includePageSpeed) {
        performancePromises.push(auditPageSpeedComprehensive(url, auditRecord.id));
      }
      
      if (includeCoreWebVitals) {
        performancePromises.push(auditCoreWebVitals(url, auditRecord.id));
      }
      
      const performanceResults = await Promise.all(performancePromises);
      
      if (includePageSpeed) pageSpeedAudit = performanceResults[0];
      if (includeCoreWebVitals) coreWebVitalsAudit = performanceResults[includePageSpeed ? 1 : 0];
    }

    // Run mobile usability audit
    let mobileUsabilityAudit = null;
    if (includeMobileUsability) {
      console.log('📱 Running mobile usability audit...');
      mobileUsabilityAudit = await auditMobileUsability(url);
    }

    // Run crawlability audit
    let crawlabilityAudit = null;
    if (includeCrawlability) {
      console.log('🕷️ Running crawlability audit...');
      crawlabilityAudit = await auditCrawlability(url);
    }

    // Run link analysis (optional, can be slow)
    let linkAnalysisAudit = null;
    if (includeLinkAnalysis) {
      console.log('🔗 Running link analysis...');
      linkAnalysisAudit = await auditLinkAnalysis(url);
    }

    // Run content analysis (optional, can be slow)
    let contentAnalysisAudit = null;
    if (includeContentAnalysis) {
      console.log('📝 Running content analysis...');
      contentAnalysisAudit = await auditContentAnalysis(url);
    }

    console.log('🔧 Compiling comprehensive audit...');

    // Compile comprehensive audit
    const audit = await compileComprehensiveAudit(
      url,
      auditRecord.id,
      {
        robotsAudit,
        sitemapAudit,
        sslAudit,
        metaAudit,
        structuredDataAudit,
        contentAudit,
        pageSpeedAudit,
        coreWebVitalsAudit,
        mobileUsabilityAudit,
        crawlabilityAudit,
        linkAnalysisAudit,
        contentAnalysisAudit
      }
    );

    // Update audit record with results
    await prisma.sEOAudit.update({
      where: { id: auditRecord.id },
      data: {
        overallScore: audit.overallScore,
        performanceScore: audit.categories.performance.score,
        seoScore: audit.categories.seo.score,
        accessibilityScore: audit.categories.accessibility.score,
        securityScore: audit.categories.security.score,
        mobileScore: audit.categories.mobile.score,
        coreWebVitals: coreWebVitalsAudit ? JSON.stringify(coreWebVitalsAudit) : null,
        pageSpeedMetrics: pageSpeedAudit ? JSON.stringify(pageSpeedAudit) : null,
        mobileUsability: mobileUsabilityAudit ? JSON.stringify(mobileUsabilityAudit) : null,
        crawlabilityData: crawlabilityAudit ? JSON.stringify(crawlabilityAudit) : null,
        metaTagsAnalysis: metaAudit ? JSON.stringify(metaAudit) : null,
        structuredData: structuredDataAudit ? JSON.stringify(structuredDataAudit) : null,
        securityChecks: sslAudit ? JSON.stringify(sslAudit) : null,
        linkAnalysis: linkAnalysisAudit ? JSON.stringify(linkAnalysisAudit) : null,
        duplicateContent: contentAnalysisAudit?.duplicateContent ? JSON.stringify(contentAnalysisAudit.duplicateContent) : null,
        errorPages: contentAnalysisAudit?.errorPages ? JSON.stringify(contentAnalysisAudit.errorPages) : null,
        technicalIssues: JSON.stringify(audit.categories),
        recommendations: JSON.stringify(audit.recommendations)
      }
    });

    audit.auditId = auditRecord.id;
    console.log('✅ Comprehensive technical SEO audit completed');

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Technical audit error:', error);
    return NextResponse.json(
      { error: 'Failed to perform comprehensive technical audit' },
      { status: 500 }
    );
  }
}

async function auditRobots(url: string) {
  try {
    const robotsUrl = new URL('/robots.txt', url).href;
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Reporter/1.0)'
      }
    });

    if (!response.ok) {
      return {
        exists: false,
        url: robotsUrl,
        issues: ['No robots.txt file found'],
        recommendations: [
          'Create a robots.txt file to control search engine crawling',
          'Include sitemap references in robots.txt',
          'Define crawl rules for different user agents'
        ]
      };
    }

    const content = await response.text();
    return parseRobotsTxt(content, robotsUrl);
  } catch (error) {
    return {
      exists: false,
      url: new URL('/robots.txt', url).href,
      issues: ['Failed to fetch robots.txt - site may be unreachable'],
      recommendations: ['Ensure website is accessible', 'Check server configuration']
    };
  }
}

function parseRobotsTxt(content: string, url: string) {
  const lines = content.split('\n').map(line => line.trim());
  const rules: any[] = [];
  const sitemaps: string[] = [];
  const issues: string[] = [];
  const recommendations: string[] = [];

  let currentRule: any = null;

  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;

    const [directive, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    switch (directive.toLowerCase()) {
      case 'user-agent':
        if (currentRule) {
          rules.push(currentRule);
        }
        currentRule = {
          userAgent: value,
          allow: [],
          disallow: []
        };
        break;

      case 'allow':
        if (currentRule) {
          currentRule.allow.push(value);
        }
        break;

      case 'disallow':
        if (currentRule) {
          currentRule.disallow.push(value);
          if (value === '/') {
            issues.push(`All pages blocked for ${currentRule.userAgent}`);
          }
        }
        break;

      case 'sitemap':
        sitemaps.push(value);
        break;
    }
  }

  if (currentRule) {
    rules.push(currentRule);
  }

  if (rules.length === 0) {
    issues.push('No valid rules found in robots.txt');
    recommendations.push('Add User-agent and crawling directives');
  }

  if (sitemaps.length === 0) {
    recommendations.push('Add sitemap reference to robots.txt');
  }

  return {
    exists: true,
    url,
    content: content.substring(0, 5000),
    rules,
    sitemaps,
    issues,
    recommendations: recommendations.length > 0 ? recommendations : ['Robots.txt is properly configured']
  };
}

async function auditSitemap(url: string) {
  const sitemapUrls = [
    `${url}/sitemap.xml`,
    `${url}/sitemap_index.xml`,
    `${url}/sitemap`,
    `${url}/sitemap.xml.gz`
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Reporter/1.0)'
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();
        
        if (text.includes('<?xml') || contentType.includes('xml')) {
          return analyzeSitemap(text, sitemapUrl);
        }
      }
    } catch (error) {
      continue;
    }
  }

  return {
    exists: false,
    url: `${url}/sitemap.xml`,
    format: 'not-found',
    urlCount: 0,
    issues: ['No sitemap found at common locations'],
    recommendations: [
      'Create an XML sitemap',
      'Submit sitemap to Google Search Console',
      'Reference sitemap in robots.txt',
      'Ensure sitemap is accessible at /sitemap.xml'
    ],
    stats: {
      totalUrls: 0,
      withLastmod: 0,
      withChangefreq: 0,
      withPriority: 0
    }
  };
}

function analyzeSitemap(xml: string, url: string) {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const isSitemapIndex = xml.includes('<sitemapindex');
  
  if (isSitemapIndex) {
    const sitemaps: string[] = [];
    const sitemapMatches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi));
    
    for (const match of sitemapMatches) {
      sitemaps.push(match[1]);
    }

    if (sitemaps.length === 0) {
      issues.push('Sitemap index contains no sitemaps');
    }

    return {
      exists: true,
      url,
      format: 'index',
      urlCount: 0,
      sitemaps,
      issues,
      recommendations: sitemaps.length > 0 
        ? ['Sitemap index properly configured']
        : ['Add sitemaps to the sitemap index'],
      stats: {
        totalUrls: sitemaps.length,
        withLastmod: 0,
        withChangefreq: 0,
        withPriority: 0
      }
    };
  }

  const urls: any[] = [];
  const urlMatches = Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/gi));
  
  let withLastmod = 0;
  let withChangefreq = 0;
  let withPriority = 0;

  for (const match of urlMatches) {
    const urlBlock = match[1];
    
    const locMatch = urlBlock.match(/<loc>([^<]+)<\/loc>/i);
    const lastmodMatch = urlBlock.match(/<lastmod>([^<]+)<\/lastmod>/i);
    const changefreqMatch = urlBlock.match(/<changefreq>([^<]+)<\/changefreq>/i);
    const priorityMatch = urlBlock.match(/<priority>([^<]+)<\/priority>/i);

    if (!locMatch) continue;

    const urlEntry: any = {
      loc: locMatch[1]
    };

    if (lastmodMatch) {
      urlEntry.lastmod = lastmodMatch[1];
      withLastmod++;
    }

    if (changefreqMatch) {
      urlEntry.changefreq = changefreqMatch[1];
      withChangefreq++;
    }

    if (priorityMatch) {
      urlEntry.priority = priorityMatch[1];
      withPriority++;
    }

    urls.push(urlEntry);
  }

  if (urls.length === 0) {
    issues.push('Sitemap contains no URLs');
  } else if (urls.length > 50000) {
    issues.push(`Sitemap contains ${urls.length} URLs (max recommended: 50,000)`);
    recommendations.push('Split sitemap into multiple files');
  }

  if (withLastmod < urls.length * 0.5) {
    recommendations.push('Add lastmod dates to more URLs for better crawl prioritization');
  }

  return {
    exists: true,
    url,
    format: 'xml',
    urlCount: urls.length,
    urls: urls.slice(0, 100),
    issues,
    recommendations: recommendations.length > 0 ? recommendations : ['Sitemap is well configured'],
    stats: {
      totalUrls: urls.length,
      withLastmod,
      withChangefreq,
      withPriority
    }
  };
}

async function auditSSL(url: string) {
  const parsedUrl = new URL(url);
  
  return new Promise((resolve) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      const tlsSocket = res.socket as any;
      const cert: any = tlsSocket.getPeerCertificate ? tlsSocket.getPeerCertificate() : {};
      
      if (!cert || Object.keys(cert).length === 0) {
        resolve({
          valid: false,
          issues: ['No SSL certificate found'],
          recommendations: [
            'Install an SSL certificate',
            'Use Let\'s Encrypt for free SSL certificates',
            'Ensure HTTPS is properly configured'
          ],
          grade: 'F'
        });
        return;
      }

      const now = new Date();
      const validFrom = cert.valid_from ? new Date(cert.valid_from) : new Date();
      const validTo = cert.valid_to ? new Date(cert.valid_to) : new Date();
      const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';

      if (now < validFrom || now > validTo) {
        issues.push('Certificate is expired or not yet valid');
        grade = 'F';
      } else if (daysRemaining < 30) {
        issues.push(`Certificate expires in ${daysRemaining} days`);
        recommendations.push('Renew SSL certificate soon');
        grade = 'C';
      } else if (daysRemaining < 60) {
        recommendations.push(`Certificate expires in ${daysRemaining} days - plan renewal`);
        grade = 'B';
      }

      resolve({
        valid: true,
        issuer: cert.issuer?.O || cert.issuer?.CN,
        subject: cert.subject?.CN,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        daysRemaining,
        issues,
        recommendations: recommendations.length > 0 ? recommendations : ['SSL certificate is properly configured'],
        grade
      });
    });

    req.on('error', (error) => {
      resolve({
        valid: false,
        issues: [`SSL check failed: ${error.message}`],
        recommendations: [
          'Ensure HTTPS is enabled',
          'Check firewall settings',
          'Verify SSL certificate installation'
        ],
        grade: 'F'
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        valid: false,
        issues: ['SSL check timed out'],
        recommendations: ['Check server response time', 'Verify HTTPS configuration'],
        grade: 'F'
      });
    });

    req.end();
  });
}

async function auditMetaTags(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Reporter/1.0)'
      }
    });

    if (!response.ok) {
      return {
        url,
        title: { content: '', length: 0, issues: ['Failed to fetch page'] },
        description: { content: '', length: 0, issues: ['Failed to fetch page'] },
        issues: ['Failed to fetch page'],
        recommendations: ['Check if the website is accessible'],
        seoScore: 0
      };
    }

    const html = await response.text();
    return analyzeMetaTags(html, url);
  } catch (error) {
    return {
      url,
      title: { content: '', length: 0, issues: ['Failed to fetch page'] },
      description: { content: '', length: 0, issues: ['Failed to fetch page'] },
      issues: ['Failed to fetch page'],
      recommendations: ['Check if the website is accessible'],
      seoScore: 0
    };
  }
}

function analyzeMetaTags(html: string, url: string) {
  const $ = cheerio.load(html);
  const issues: string[] = [];
  const recommendations: string[] = [];
  let seoScore = 100;

  // Title analysis
  const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
  const titleAnalysis = {
    content: title,
    length: title.length,
    issues: [] as string[]
  };

  if (!title) {
    titleAnalysis.issues.push('No title tag found');
    seoScore -= 15;
  } else if (title.length < 30) {
    titleAnalysis.issues.push('Title too short (recommended: 30-60 characters)');
    seoScore -= 5;
  } else if (title.length > 60) {
    titleAnalysis.issues.push('Title too long (recommended: 30-60 characters)');
    seoScore -= 5;
  }

  // Description analysis
  const description = $('meta[name="description"]').attr('content') || 
                     $('meta[property="og:description"]').attr('content') || '';
  const descriptionAnalysis = {
    content: description,
    length: description.length,
    issues: [] as string[]
  };

  if (!description) {
    descriptionAnalysis.issues.push('No meta description found');
    seoScore -= 15;
  } else if (description.length < 120) {
    descriptionAnalysis.issues.push('Description too short (recommended: 120-160 characters)');
    seoScore -= 5;
  } else if (description.length > 160) {
    descriptionAnalysis.issues.push('Description too long (recommended: 120-160 characters)');
    seoScore -= 5;
  }

  // Viewport check
  const viewport = $('meta[name="viewport"]').attr('content');
  if (!viewport) {
    issues.push('No viewport meta tag found');
    recommendations.push('Add viewport meta tag for mobile responsiveness');
    seoScore -= 5;
  }

  // Additional basic checks
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    recommendations.push('Add canonical URL to prevent duplicate content issues');
    seoScore -= 3;
  }

  return {
    url,
    title: titleAnalysis,
    description: descriptionAnalysis,
    viewport,
    canonical,
    issues,
    recommendations,
    seoScore: Math.max(0, seoScore)
  };
}

async function auditStructuredData(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Reporter/1.0)'
      }
    });

    if (!response.ok) {
      return {
        url,
        hasStructuredData: false,
        schemas: [],
        richResultsEligible: {},
        issues: ['Failed to fetch page'],
        recommendations: ['Check if the website is accessible']
      };
    }

    const html = await response.text();
    return analyzeStructuredData(html, url);
  } catch (error) {
    return {
      url,
      hasStructuredData: false,
      schemas: [],
      richResultsEligible: {},
      issues: ['Failed to fetch page'],
      recommendations: ['Check if the website is accessible']
    };
  }
}

function analyzeStructuredData(html: string, url: string) {
  const $ = cheerio.load(html);
  const issues: string[] = [];
  const recommendations: string[] = [];
  const schemas: any[] = [];

  // Check for JSON-LD
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const hasJsonLd = jsonLdScripts.length > 0;

  jsonLdScripts.each((_, element) => {
    try {
      const content = $(element).html();
      if (!content) return;

      const data = JSON.parse(content);
      const type = data['@type'] || 'Unknown';
      const properties = { ...data };
      delete properties['@context'];
      delete properties['@type'];

      schemas.push({
        type,
        properties,
        issues: [],
        recommendations: []
      });
    } catch (error) {
      issues.push('Invalid JSON-LD syntax found');
    }
  });

  // Check for Microdata
  const hasMicrodata = $('[itemscope]').length > 0;
  if (hasMicrodata) {
    $('[itemscope]').each((_, element) => {
      const itemtype = $(element).attr('itemtype');
      const properties: any = {};
      
      $(element).find('[itemprop]').each((_, prop) => {
        const propName = $(prop).attr('itemprop');
        const propValue = $(prop).attr('content') || $(prop).text();
        if (propName) {
          properties[propName] = propValue;
        }
      });

      if (itemtype) {
        schemas.push({
          type: itemtype.split('/').pop() || 'Unknown',
          properties,
          issues: [],
          recommendations: []
        });
      }
    });
  }

  const richResultsEligible = {
    article: schemas.some(s => ['Article', 'NewsArticle', 'BlogPosting'].includes(s.type)),
    breadcrumb: schemas.some(s => s.type === 'BreadcrumbList'),
    faq: schemas.some(s => s.type === 'FAQPage'),
    howTo: schemas.some(s => s.type === 'HowTo'),
    localBusiness: schemas.some(s => s.type === 'LocalBusiness' || s.type.includes('Business')),
    product: schemas.some(s => s.type === 'Product'),
    recipe: schemas.some(s => s.type === 'Recipe'),
    review: schemas.some(s => s.type === 'Review' || s.type === 'AggregateRating'),
    video: schemas.some(s => s.type === 'VideoObject')
  };

  if (!hasJsonLd && !hasMicrodata) {
    issues.push('No structured data found on the page');
    recommendations.push('Add JSON-LD structured data for better search visibility');
    recommendations.push('Consider implementing Schema.org markup');
  }

  return {
    url,
    hasStructuredData: hasJsonLd || hasMicrodata,
    schemas,
    richResultsEligible,
    issues,
    recommendations
  };
}

async function auditContent(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Reporter/1.0)'
      }
    });

    if (!response.ok) {
      return {
        url,
        contentQuality: { score: 0, issues: ['Failed to fetch page'], recommendations: [] },
        images: { total: 0, withAlt: 0, withoutAlt: 0 },
        headings: { h1Count: 0, h2Count: 0, h3Count: 0 }
      };
    }

    const html = await response.text();
    return analyzeContent(html, url);
  } catch (error) {
    return {
      url,
      contentQuality: { score: 0, issues: ['Failed to fetch page'], recommendations: [] },
      images: { total: 0, withAlt: 0, withoutAlt: 0 },
      headings: { h1Count: 0, h2Count: 0, h3Count: 0 }
    };
  }
}

function analyzeContent(html: string, url: string) {
  const $ = cheerio.load(html);
  
  // Remove script and style content
  $('script, style').remove();
  
  const bodyText = $('body').text();
  const cleanText = bodyText.replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ').filter(word => word.length > 0);
  const wordCount = words.length;

  // Analyze headings
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;

  // Analyze images
  let withAlt = 0;
  let withoutAlt = 0;
  
  $('img').each((_, img) => {
    const alt = $(img).attr('alt');
    if (alt && alt.trim()) {
      withAlt++;
    } else {
      withoutAlt++;
    }
  });

  // Content quality assessment
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (wordCount < 300) {
    issues.push('Content is too short (less than 300 words)');
    recommendations.push('Add more comprehensive content');
    score -= 20;
  }

  if (h1Count === 0) {
    issues.push('No H1 heading found');
    score -= 10;
  } else if (h1Count > 1) {
    issues.push('Multiple H1 headings found');
    score -= 5;
  }

  if (withoutAlt > 0) {
    issues.push(`${withoutAlt} images missing alt text`);
    score -= Math.min(10, withoutAlt * 2);
  }

  return {
    url,
    wordCount,
    contentQuality: {
      score: Math.max(0, score),
      issues,
      recommendations
    },
    images: {
      total: withAlt + withoutAlt,
      withAlt,
      withoutAlt
    },
    headings: {
      h1Count,
      h2Count,
      h3Count
    }
  };
}

// Placeholder functions for optional audits (not implemented in basic version)
async function auditPageSpeedComprehensive(url: string, auditId: string) {
  return { averageScore: 0, mobile: null, desktop: null };
}

async function auditCoreWebVitals(url: string, auditId: string) {
  return { mobile: null, desktop: null, grade: 'poor' };
}

async function auditMobileUsability(url: string) {
  return { score: 0, issues: [], passedChecks: 0, totalChecks: 0 };
}

async function auditCrawlability(url: string) {
  return { score: 0, robotsTxt: null, sitemap: null, indexability: null };
}

async function auditLinkAnalysis(url: string) {
  return { internalLinks: null, externalLinks: null, issues: [] };
}

async function auditContentAnalysis(url: string) {
  return { duplicateContent: null, errorPages: null, contentQuality: null };
}

async function compileComprehensiveAudit(
  url: string,
  auditId: string,
  auditResults: {
    robotsAudit: any;
    sitemapAudit: any;
    sslAudit: any;
    metaAudit: any;
    structuredDataAudit: any;
    contentAudit: any;
    pageSpeedAudit: any;
    coreWebVitalsAudit: any;
    mobileUsabilityAudit: any;
    crawlabilityAudit: any;
    linkAnalysisAudit: any;
    contentAnalysisAudit: any;
  }
): Promise<ComprehensiveTechnicalAudit> {
  const {
    robotsAudit,
    sitemapAudit,
    sslAudit,
    metaAudit,
    structuredDataAudit,
    contentAudit,
    pageSpeedAudit,
    coreWebVitalsAudit,
    mobileUsabilityAudit,
    crawlabilityAudit,
    linkAnalysisAudit,
    contentAnalysisAudit
  } = auditResults;

  const categories = {
    performance: {
      score: 0,
      checks: [] as any[]
    },
    security: {
      score: 0,
      checks: [] as any[]
    },
    seo: {
      score: 0,
      checks: [] as any[]
    },
    accessibility: {
      score: 0,
      checks: [] as any[]
    },
    mobile: {
      score: 0,
      checks: [] as any[]
    },
    crawlability: {
      score: 0,
      checks: [] as any[]
    },
    contentQuality: {
      score: 0,
      checks: [] as any[]
    }
  };

  const recommendations: ComprehensiveTechnicalAudit['recommendations'] = [];
  let criticalCount = 0;
  let warningCount = 0;
  let passedCount = 0;

  // Performance checks
  if (pageSpeedAudit) {
    const perfScore = pageSpeedAudit.averageScore || 0;
    categories.performance.score = perfScore;
    
    categories.performance.checks.push({
      name: 'PageSpeed Score',
      status: perfScore >= 90 ? 'pass' : perfScore >= 50 ? 'warning' : 'fail',
      message: `Performance score: ${perfScore}/100`,
      details: pageSpeedAudit
    });

    if (perfScore < 50) {
      criticalCount++;
      recommendations.push({
        priority: 'high',
        category: 'Performance',
        issue: 'Poor PageSpeed performance score',
        recommendation: 'Optimize images, reduce JavaScript, enable caching',
        impact: 'Slow page load affects user experience and SEO rankings'
      });
    } else if (perfScore < 90) {
      warningCount++;
    } else {
      passedCount++;
    }

    // Core Web Vitals
    categories.performance.checks.push({
      name: 'Core Web Vitals',
      status: coreWebVitalsAudit ? 'pass' : 'warning',
      message: 'Core Web Vitals metrics',
      details: coreWebVitalsAudit
    });
  }

  // Security checks
  if (sslAudit) {
    categories.security.score = sslAudit.grade === 'A' ? 100 : 
                                sslAudit.grade === 'B' ? 80 :
                                sslAudit.grade === 'C' ? 60 :
                                sslAudit.grade === 'D' ? 40 : 20;
    
    categories.security.checks.push({
      name: 'SSL Certificate',
      status: sslAudit.valid ? 'pass' : 'fail',
      message: sslAudit.valid ? `SSL valid until ${sslAudit.validTo}` : 'SSL certificate issues',
      details: sslAudit
    });

    if (!sslAudit.valid) {
      criticalCount++;
      recommendations.push({
        priority: 'high',
        category: 'Security',
        issue: 'SSL certificate issues detected',
        recommendation: sslAudit.recommendations?.[0] || 'Fix SSL certificate',
        impact: 'Security warnings will deter visitors and hurt SEO'
      });
    } else {
      passedCount++;
    }
  }

  // SEO checks
  let seoScore = 100;
  
  // Robots.txt check
  if (robotsAudit) {
    categories.seo.checks.push({
      name: 'Robots.txt',
      status: robotsAudit.exists ? 'pass' : 'warning',
      message: robotsAudit.exists ? 'Robots.txt found' : 'No robots.txt file',
      details: { issues: robotsAudit.issues, recommendations: robotsAudit.recommendations }
    });
    
    if (!robotsAudit.exists) {
      warningCount++;
      seoScore -= 10;
    } else {
      passedCount++;
    }
  }

  // Sitemap check
  if (sitemapAudit) {
    categories.seo.checks.push({
      name: 'XML Sitemap',
      status: sitemapAudit.exists ? 'pass' : 'fail',
      message: sitemapAudit.exists ? `Sitemap found with ${sitemapAudit.urlCount} URLs` : 'No sitemap found',
      details: sitemapAudit.stats
    });
    
    if (!sitemapAudit.exists) {
      criticalCount++;
      seoScore -= 15;
      recommendations.push({
        priority: 'high',
        category: 'SEO',
        issue: 'No XML sitemap found',
        recommendation: 'Create and submit XML sitemap to search engines',
        impact: 'Search engines may not discover all your pages'
      });
    } else {
      passedCount++;
    }
  }

  // Meta tags check
  if (metaAudit) {
    categories.seo.checks.push({
      name: 'Meta Tags',
      status: metaAudit.seoScore >= 80 ? 'pass' : metaAudit.seoScore >= 60 ? 'warning' : 'fail',
      message: `SEO score: ${metaAudit.seoScore}/100`,
      details: {
        title: metaAudit.title,
        description: metaAudit.description,
        issues: metaAudit.issues
      }
    });
    
    seoScore = Math.min(seoScore, metaAudit.seoScore);
    
    if (metaAudit.seoScore < 60) {
      criticalCount++;
      if (metaAudit.title.issues.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'SEO',
          issue: metaAudit.title.issues[0],
          recommendation: 'Fix title tag issues',
          impact: 'Title tags are crucial for SEO and click-through rates'
        });
      }
    } else if (metaAudit.seoScore < 80) {
      warningCount++;
    } else {
      passedCount++;
    }
  }

  // Structured data check
  if (structuredDataAudit) {
    categories.seo.checks.push({
      name: 'Structured Data',
      status: structuredDataAudit.hasStructuredData ? 'pass' : 'warning',
      message: structuredDataAudit.hasStructuredData ? 
        `Found ${structuredDataAudit.schemas.length} schema types` : 
        'No structured data found',
      details: structuredDataAudit.richResultsEligible
    });
    
    if (!structuredDataAudit.hasStructuredData) {
      warningCount++;
      seoScore -= 10;
      recommendations.push({
        priority: 'medium',
        category: 'SEO',
        issue: 'No structured data found',
        recommendation: 'Add Schema.org markup for rich snippets',
        impact: 'Missing opportunity for enhanced search results'
      });
    } else {
      passedCount++;
    }
  }

  categories.seo.score = seoScore;

  // Content quality checks
  if (contentAudit) {
    categories.accessibility.checks.push({
      name: 'Content Quality',
      status: contentAudit.contentQuality.score >= 80 ? 'pass' : 
              contentAudit.contentQuality.score >= 60 ? 'warning' : 'fail',
      message: `Content quality score: ${contentAudit.contentQuality.score}/100`,
      details: contentAudit.contentQuality
    });
    
    categories.accessibility.checks.push({
      name: 'Image Alt Text',
      status: contentAudit.images.withoutAlt === 0 ? 'pass' : 
              contentAudit.images.withoutAlt <= 2 ? 'warning' : 'fail',
      message: `${contentAudit.images.withoutAlt} images missing alt text`,
      details: contentAudit.images
    });
    
    if (contentAudit.images.withoutAlt > 2) {
      criticalCount++;
      recommendations.push({
        priority: 'high',
        category: 'Accessibility',
        issue: `${contentAudit.images.withoutAlt} images missing alt text`,
        recommendation: 'Add descriptive alt text to all images',
        impact: 'Affects accessibility and image SEO'
      });
    } else if (contentAudit.images.withoutAlt > 0) {
      warningCount++;
    } else {
      passedCount++;
    }
    
    categories.accessibility.score = contentAudit.contentQuality.score;
  }

  // Mobile checks
  if (metaAudit?.viewport) {
    categories.mobile.checks.push({
      name: 'Viewport Meta Tag',
      status: 'pass',
      message: 'Viewport meta tag found',
      details: { viewport: metaAudit.viewport }
    });
    categories.mobile.score = 100;
    passedCount++;
  } else {
    categories.mobile.checks.push({
      name: 'Viewport Meta Tag',
      status: 'fail',
      message: 'No viewport meta tag',
      details: null
    });
    categories.mobile.score = 0;
    criticalCount++;
    
    recommendations.push({
      priority: 'high',
      category: 'Mobile',
      issue: 'Missing viewport meta tag',
      recommendation: 'Add viewport meta tag for mobile responsiveness',
      impact: 'Site may not display correctly on mobile devices'
    });
  }

  // Mobile usability
  if (mobileUsabilityAudit) {
    categories.mobile.checks.push({
      name: 'Mobile Usability',
      status: mobileUsabilityAudit.score >= 90 ? 'pass' : 
              mobileUsabilityAudit.score >= 70 ? 'warning' : 'fail',
      message: `Mobile usability score: ${mobileUsabilityAudit.score}/100`,
      details: mobileUsabilityAudit
    });
    
    categories.mobile.score = Math.min(categories.mobile.score, mobileUsabilityAudit.score);
  }

  // Crawlability
  if (crawlabilityAudit) {
    categories.crawlability.score = crawlabilityAudit.score;
    categories.crawlability.checks.push({
      name: 'Crawlability',
      status: crawlabilityAudit.score >= 90 ? 'pass' : 
              crawlabilityAudit.score >= 70 ? 'warning' : 'fail',
      message: `Crawlability score: ${crawlabilityAudit.score}/100`,
      details: crawlabilityAudit
    });
  }

  // Link analysis
  if (linkAnalysisAudit) {
    categories.seo.checks.push({
      name: 'Link Analysis',
      status: linkAnalysisAudit.issues.length === 0 ? 'pass' : 
              linkAnalysisAudit.issues.length <= 3 ? 'warning' : 'fail',
      message: `${linkAnalysisAudit.issues.length} link issues found`,
      details: linkAnalysisAudit
    });
    
    if (linkAnalysisAudit.issues.length > 3) {
      criticalCount++;
    } else if (linkAnalysisAudit.issues.length > 0) {
      warningCount++;
    } else {
      passedCount++;
    }
  }

  // Calculate overall score
  const categoryScores = [
    categories.performance.score,
    categories.security.score,
    categories.seo.score,
    categories.accessibility.score,
    categories.mobile.score
  ].filter(score => score > 0);
  
  const overallScore = categoryScores.length > 0 ?
    Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length) : 0;

  return {
    domain: new URL(url).hostname,
    url,
    timestamp: new Date().toISOString(),
    overallScore,
    summary: {
      critical: criticalCount,
      warnings: warningCount,
      passed: passedCount,
      totalChecks: criticalCount + warningCount + passedCount
    },
    categories,
    coreWebVitals: coreWebVitalsAudit || { mobile: null, desktop: null, grade: 'poor' },
    mobileUsability: mobileUsabilityAudit || { score: 0, issues: [], passedChecks: 0, totalChecks: 0 },
    pageSpeed: pageSpeedAudit || { mobile: null, desktop: null, averageScore: 0 },
    crawlability: crawlabilityAudit || { score: 0, robotsTxt: null, sitemap: null, indexability: null },
    linkAnalysis: linkAnalysisAudit || { internalLinks: null, externalLinks: null, issues: [] },
    contentAnalysis: contentAnalysisAudit || { duplicateContent: null, errorPages: null, contentQuality: null },
    securityAnalysis: sslAudit || { ssl: null, headers: null, mixedContent: false },
    recommendations: recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
  };
}