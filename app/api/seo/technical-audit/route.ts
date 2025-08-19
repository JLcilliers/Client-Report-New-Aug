import { NextRequest, NextResponse } from 'next/server';

interface TechnicalAudit {
  domain: string;
  timestamp: string;
  score: number;
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
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
    impact: string;
  }[];
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
    const { domain, includePageSpeed = true } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    
    // Run all audits in parallel
    const auditPromises = [
      auditRobots(url),
      auditSitemap(url),
      auditSSL(url),
      auditMetaTags(url),
      auditStructuredData(url),
      auditContent(url),
      includePageSpeed ? auditPageSpeed(url) : Promise.resolve(null)
    ];

    const [
      robotsAudit,
      sitemapAudit,
      sslAudit,
      metaAudit,
      structuredDataAudit,
      contentAudit,
      pageSpeedAudit
    ] = await Promise.all(auditPromises);

    // Compile comprehensive audit
    const audit = compileAudit(
      url,
      robotsAudit,
      sitemapAudit,
      sslAudit,
      metaAudit,
      structuredDataAudit,
      contentAudit,
      pageSpeedAudit
    );

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Technical audit error:', error);
    return NextResponse.json(
      { error: 'Failed to perform technical audit' },
      { status: 500 }
    );
  }
}

async function auditRobots(url: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/seo/robots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: url })
    });
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function auditSitemap(url: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/seo/sitemap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: url })
    });
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function auditSSL(url: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/seo/ssl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: url })
    });
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function auditMetaTags(url: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/seo/meta-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function auditStructuredData(url: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/seo/structured-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function auditContent(url: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/seo/content-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function auditPageSpeed(url: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/data/pagespeed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, strategy: 'mobile' })
    });
    return await response.json();
  } catch (error) {
    return null;
  }
}

function compileAudit(
  url: string,
  robots: any,
  sitemap: any,
  ssl: any,
  meta: any,
  structuredData: any,
  content: any,
  pageSpeed: any
): TechnicalAudit {
  const categories: TechnicalAudit['categories'] = {
    performance: {
      score: 0,
      checks: []
    },
    security: {
      score: 0,
      checks: []
    },
    seo: {
      score: 0,
      checks: []
    },
    accessibility: {
      score: 0,
      checks: []
    },
    mobile: {
      score: 0,
      checks: []
    }
  };

  const recommendations: TechnicalAudit['recommendations'] = [];
  let criticalCount = 0;
  let warningCount = 0;
  let passedCount = 0;

  // Performance checks
  if (pageSpeed) {
    const perfScore = pageSpeed.lighthouse?.performance || 0;
    categories.performance.score = perfScore;
    
    categories.performance.checks.push({
      name: 'PageSpeed Score',
      status: perfScore >= 90 ? 'pass' : perfScore >= 50 ? 'warning' : 'fail',
      message: `Performance score: ${perfScore}/100`,
      details: pageSpeed.lighthouse
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
      status: pageSpeed.coreWebVitals ? 'pass' : 'warning',
      message: 'Core Web Vitals metrics',
      details: pageSpeed.coreWebVitals
    });
  }

  // Security checks
  if (ssl) {
    categories.security.score = ssl.grade === 'A' ? 100 : 
                                ssl.grade === 'B' ? 80 :
                                ssl.grade === 'C' ? 60 :
                                ssl.grade === 'D' ? 40 : 20;
    
    categories.security.checks.push({
      name: 'SSL Certificate',
      status: ssl.valid ? 'pass' : 'fail',
      message: ssl.valid ? `SSL valid until ${ssl.validTo}` : 'SSL certificate issues',
      details: ssl
    });

    if (!ssl.valid) {
      criticalCount++;
      recommendations.push({
        priority: 'high',
        category: 'Security',
        issue: 'SSL certificate issues detected',
        recommendation: ssl.recommendations?.[0] || 'Fix SSL certificate',
        impact: 'Security warnings will deter visitors and hurt SEO'
      });
    } else {
      passedCount++;
    }
  }

  // SEO checks
  let seoScore = 100;
  
  // Robots.txt check
  if (robots) {
    categories.seo.checks.push({
      name: 'Robots.txt',
      status: robots.exists ? 'pass' : 'warning',
      message: robots.exists ? 'Robots.txt found' : 'No robots.txt file',
      details: { issues: robots.issues, recommendations: robots.recommendations }
    });
    
    if (!robots.exists) {
      warningCount++;
      seoScore -= 10;
    } else {
      passedCount++;
    }
  }

  // Sitemap check
  if (sitemap) {
    categories.seo.checks.push({
      name: 'XML Sitemap',
      status: sitemap.exists ? 'pass' : 'fail',
      message: sitemap.exists ? `Sitemap found with ${sitemap.urlCount} URLs` : 'No sitemap found',
      details: sitemap.stats
    });
    
    if (!sitemap.exists) {
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
  if (meta) {
    categories.seo.checks.push({
      name: 'Meta Tags',
      status: meta.seoScore >= 80 ? 'pass' : meta.seoScore >= 60 ? 'warning' : 'fail',
      message: `SEO score: ${meta.seoScore}/100`,
      details: {
        title: meta.title,
        description: meta.description,
        issues: meta.issues
      }
    });
    
    seoScore = Math.min(seoScore, meta.seoScore);
    
    if (meta.seoScore < 60) {
      criticalCount++;
      if (meta.title.issues.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'SEO',
          issue: meta.title.issues[0],
          recommendation: 'Fix title tag issues',
          impact: 'Title tags are crucial for SEO and click-through rates'
        });
      }
    } else if (meta.seoScore < 80) {
      warningCount++;
    } else {
      passedCount++;
    }
  }

  // Structured data check
  if (structuredData) {
    categories.seo.checks.push({
      name: 'Structured Data',
      status: structuredData.hasStructuredData ? 'pass' : 'warning',
      message: structuredData.hasStructuredData ? 
        `Found ${structuredData.schemas.length} schema types` : 
        'No structured data found',
      details: structuredData.richResultsEligible
    });
    
    if (!structuredData.hasStructuredData) {
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
  if (content) {
    categories.accessibility.checks.push({
      name: 'Content Quality',
      status: content.contentQuality.score >= 80 ? 'pass' : 
              content.contentQuality.score >= 60 ? 'warning' : 'fail',
      message: `Content quality score: ${content.contentQuality.score}/100`,
      details: content.contentQuality
    });
    
    categories.accessibility.checks.push({
      name: 'Image Alt Text',
      status: content.images.withoutAlt === 0 ? 'pass' : 
              content.images.withoutAlt <= 2 ? 'warning' : 'fail',
      message: `${content.images.withoutAlt} images missing alt text`,
      details: content.images
    });
    
    if (content.images.withoutAlt > 2) {
      criticalCount++;
      recommendations.push({
        priority: 'high',
        category: 'Accessibility',
        issue: `${content.images.withoutAlt} images missing alt text`,
        recommendation: 'Add descriptive alt text to all images',
        impact: 'Affects accessibility and image SEO'
      });
    } else if (content.images.withoutAlt > 0) {
      warningCount++;
    } else {
      passedCount++;
    }
    
    categories.accessibility.score = content.contentQuality.score;
  }

  // Mobile checks
  if (meta?.viewport) {
    categories.mobile.checks.push({
      name: 'Viewport Meta Tag',
      status: 'pass',
      message: 'Viewport meta tag found',
      details: { viewport: meta.viewport }
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
    domain: url,
    timestamp: new Date().toISOString(),
    score: overallScore,
    summary: {
      critical: criticalCount,
      warnings: warningCount,
      passed: passedCount,
      totalChecks: criticalCount + warningCount + passedCount
    },
    categories,
    recommendations: recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
  };
}