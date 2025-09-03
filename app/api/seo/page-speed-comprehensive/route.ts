import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PageSpeedResult {
  url: string;
  device: 'mobile' | 'desktop';
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    pwa?: number;
  };
  coreWebVitals: {
    lcp: { value: number; grade: string; threshold: { good: number; poor: number } };
    fid: { value: number; grade: string; threshold: { good: number; poor: number } };
    cls: { value: number; grade: string; threshold: { good: number; poor: number } };
    ttfb: { value: number; grade: string; threshold: { good: number; poor: number } };
    fcp: { value: number; grade: string; threshold: { good: number; poor: number } };
    inp?: { value: number; grade: string; threshold: { good: number; poor: number } };
  };
  performanceMetrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
    timeToInteractive: number;
    serverResponseTime: number;
  };
  opportunities: {
    id: string;
    title: string;
    description: string;
    savings: number;
    savingsUnit: 'ms' | 'bytes';
    displayValue: string;
    details: any;
  }[];
  diagnostics: {
    id: string;
    title: string;
    description: string;
    displayValue: string;
    score: number;
    scoreDisplayMode: string;
    details: any;
  }[];
  resourceSummary: {
    scripts: { count: number; transferSize: number; wastedBytes?: number };
    stylesheets: { count: number; transferSize: number; wastedBytes?: number };
    images: { count: number; transferSize: number; wastedBytes?: number };
    fonts: { count: number; transferSize: number; wastedBytes?: number };
    documents: { count: number; transferSize: number };
    other: { count: number; transferSize: number };
    total: { count: number; transferSize: number };
  };
  recommendations: {
    category: string;
    priority: 'high' | 'medium' | 'low';
    issue: string;
    recommendation: string;
    impact: string;
    estimatedSavings?: string;
  }[];
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url, devices = ['mobile', 'desktop'], categories = ['performance'], reportId, auditId } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const results: PageSpeedResult[] = [];

    for (const device of devices) {
      const result = await analyzePageSpeed(url, device as 'mobile' | 'desktop', categories);
      results.push(result);

      // Store in database if reportId or auditId provided
      if (reportId || auditId) {
        await prisma.pageSpeedAudit.create({
          data: {
            reportId: reportId || undefined,
            auditId: auditId || undefined,
            url,
            device,
            performanceScore: result.scores.performance,
            opportunities: JSON.stringify(result.opportunities),
            diagnostics: JSON.stringify(result.diagnostics),
            labData: JSON.stringify(result.performanceMetrics),
            auditDetails: JSON.stringify({
              scores: result.scores,
              coreWebVitals: result.coreWebVitals,
              resourceSummary: result.resourceSummary
            })
          }
        });
      }
    }

    return NextResponse.json({
      url,
      results,
      summary: generateSummary(results),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Page speed analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze page speed' },
      { status: 500 }
    );
  }
}

async function analyzePageSpeed(url: string, device: 'mobile' | 'desktop', categories: string[]): Promise<PageSpeedResult> {
  try {
    const categoryParam = categories.join('&category=');
    const pageSpeedUrl = `https://www.googleapis.com/pagespeedinsuights/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${device}&category=${categoryParam}&key=${process.env.PAGESPEED_API_KEY}`;
    
    const response = await fetch(pageSpeedUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'PageSpeed API error');
    }

    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;
    const categories_result = lighthouseResult.categories;

    // Extract scores
    const scores = {
      performance: Math.round((categories_result.performance?.score || 0) * 100),
      accessibility: Math.round((categories_result.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories_result['best-practices']?.score || 0) * 100),
      seo: Math.round((categories_result.seo?.score || 0) * 100),
      pwa: categories_result.pwa ? Math.round(categories_result.pwa.score * 100) : undefined
    };

    // Extract Core Web Vitals
    const coreWebVitals = {
      lcp: extractCoreWebVital(audits['largest-contentful-paint'], { good: 2500, poor: 4000 }),
      fid: extractCoreWebVital(audits['max-potential-fid'], { good: 100, poor: 300 }),
      cls: extractCoreWebVital(audits['cumulative-layout-shift'], { good: 0.1, poor: 0.25 }),
      ttfb: extractCoreWebVital(audits['server-response-time'], { good: 800, poor: 1800 }),
      fcp: extractCoreWebVital(audits['first-contentful-paint'], { good: 1800, poor: 3000 }),
      inp: audits['experimental-interaction-to-next-paint'] ? 
           extractCoreWebVital(audits['experimental-interaction-to-next-paint'], { good: 200, poor: 500 }) : 
           undefined
    };

    // Extract performance metrics
    const performanceMetrics = {
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
      totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
      speedIndex: audits['speed-index']?.numericValue || 0,
      timeToInteractive: audits['interactive']?.numericValue || 0,
      serverResponseTime: audits['server-response-time']?.numericValue || 0
    };

    // Extract opportunities
    const opportunities = extractOpportunities(audits);
    
    // Extract diagnostics
    const diagnostics = extractDiagnostics(audits);

    // Analyze resource summary
    const resourceSummary = analyzeResourceSummary(audits);

    // Generate recommendations
    const recommendations = generateRecommendations(scores, opportunities, diagnostics);

    return {
      url,
      device,
      scores,
      coreWebVitals,
      performanceMetrics,
      opportunities,
      diagnostics,
      resourceSummary,
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Page speed analysis error for ${url} (${device}):`, error);
    
    return {
      url,
      device,
      scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
      coreWebVitals: {
        lcp: { value: 0, grade: 'poor', threshold: { good: 2500, poor: 4000 } },
        fid: { value: 0, grade: 'poor', threshold: { good: 100, poor: 300 } },
        cls: { value: 0, grade: 'poor', threshold: { good: 0.1, poor: 0.25 } },
        ttfb: { value: 0, grade: 'poor', threshold: { good: 800, poor: 1800 } },
        fcp: { value: 0, grade: 'poor', threshold: { good: 1800, poor: 3000 } }
      },
      performanceMetrics: {
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        totalBlockingTime: 0,
        cumulativeLayoutShift: 0,
        speedIndex: 0,
        timeToInteractive: 0,
        serverResponseTime: 0
      },
      opportunities: [],
      diagnostics: [],
      resourceSummary: {
        scripts: { count: 0, transferSize: 0 },
        stylesheets: { count: 0, transferSize: 0 },
        images: { count: 0, transferSize: 0 },
        fonts: { count: 0, transferSize: 0 },
        documents: { count: 0, transferSize: 0 },
        other: { count: 0, transferSize: 0 },
        total: { count: 0, transferSize: 0 }
      },
      recommendations: [{
        category: 'Error',
        priority: 'high',
        issue: 'Unable to analyze page speed',
        recommendation: 'Check if the website is accessible and try again',
        impact: 'Cannot assess performance metrics'
      }],
      timestamp: new Date().toISOString()
    };
  }
}

function extractCoreWebVital(audit: any, threshold: { good: number; poor: number }) {
  const value = audit?.numericValue || 0;
  const grade = value <= threshold.good ? 'good' : 
               value <= threshold.poor ? 'needs-improvement' : 'poor';
  
  return {
    value: Math.round(value * 100) / 100,
    grade,
    threshold
  };
}

function extractOpportunities(audits: any) {
  const opportunityKeys = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'offscreen-images',
    'unminified-css',
    'unminified-javascript',
    'efficient-animated-content',
    'duplicated-javascript',
    'legacy-javascript',
    'total-byte-weight',
    'uses-optimized-images',
    'uses-webp-images',
    'uses-responsive-images',
    'dom-size',
    'critical-request-chains',
    'user-timings',
    'bootup-time',
    'mainthread-work-breakdown',
    'font-display'
  ];

  return opportunityKeys
    .map(key => audits[key])
    .filter(audit => audit && audit.details && audit.numericValue > 0)
    .map(audit => ({
      id: audit.id,
      title: audit.title,
      description: audit.description,
      savings: Math.round(audit.numericValue),
      savingsUnit: audit.displayValue?.includes('KiB') || audit.displayValue?.includes('MB') ? 'bytes' as const : 'ms' as const,
      displayValue: audit.displayValue || '',
      details: audit.details
    }))
    .sort((a, b) => b.savings - a.savings);
}

function extractDiagnostics(audits: any) {
  const diagnosticKeys = [
    'metrics',
    'screenshot-thumbnails',
    'final-screenshot',
    'largest-contentful-paint-element',
    'layout-shift-elements',
    'long-tasks',
    'third-party-summary',
    'third-party-facades',
    'largest-contentful-paint-element',
    'lcp-lazy-loaded',
    'uses-long-cache-ttl',
    'total-blocking-time',
    'max-potential-fid',
    'no-document-write',
    'uses-http2',
    'uses-passive-event-listeners',
    'no-vulnerable-libraries',
    'notification-on-start',
    'viewport',
    'without-javascript',
    'first-contentful-paint-3g',
    'interactive-3g',
    'speed-index-3g',
    'first-cpu-idle-3g'
  ];

  return diagnosticKeys
    .map(key => audits[key])
    .filter(audit => audit && audit.score !== null && audit.score !== undefined)
    .map(audit => ({
      id: audit.id,
      title: audit.title,
      description: audit.description,
      displayValue: audit.displayValue || '',
      score: audit.score,
      scoreDisplayMode: audit.scoreDisplayMode,
      details: audit.details
    }));
}

function analyzeResourceSummary(audits: any) {
  const resourceSummary = audits['resource-summary'];
  
  if (!resourceSummary || !resourceSummary.details) {
    return {
      scripts: { count: 0, transferSize: 0 },
      stylesheets: { count: 0, transferSize: 0 },
      images: { count: 0, transferSize: 0 },
      fonts: { count: 0, transferSize: 0 },
      documents: { count: 0, transferSize: 0 },
      other: { count: 0, transferSize: 0 },
      total: { count: 0, transferSize: 0 }
    };
  }

  const items = resourceSummary.details.items || [];
  const summary = {
    scripts: { count: 0, transferSize: 0, wastedBytes: 0 },
    stylesheets: { count: 0, transferSize: 0, wastedBytes: 0 },
    images: { count: 0, transferSize: 0, wastedBytes: 0 },
    fonts: { count: 0, transferSize: 0, wastedBytes: 0 },
    documents: { count: 0, transferSize: 0 },
    other: { count: 0, transferSize: 0 },
    total: { count: 0, transferSize: 0 }
  };

  items.forEach((item: any) => {
    const resourceType = item.resourceType || 'other';
    const count = item.requestCount || 0;
    const size = item.transferSize || 0;

    if (summary[resourceType as keyof typeof summary]) {
      summary[resourceType as keyof typeof summary].count += count;
      summary[resourceType as keyof typeof summary].transferSize += size;
    } else {
      summary.other.count += count;
      summary.other.transferSize += size;
    }

    summary.total.count += count;
    summary.total.transferSize += size;
  });

  // Add waste analysis from unused resources
  const unusedCSS = audits['unused-css-rules'];
  if (unusedCSS && unusedCSS.details && unusedCSS.details.items) {
    const wastedCSS = unusedCSS.details.items.reduce((total: number, item: any) => total + (item.wastedBytes || 0), 0);
    summary.stylesheets.wastedBytes = wastedCSS;
  }

  const unusedJS = audits['unused-javascript'];
  if (unusedJS && unusedJS.details && unusedJS.details.items) {
    const wastedJS = unusedJS.details.items.reduce((total: number, item: any) => total + (item.wastedBytes || 0), 0);
    summary.scripts.wastedBytes = wastedJS;
  }

  return summary;
}

function generateRecommendations(scores: any, opportunities: any[], diagnostics: any[]) {
  const recommendations = [];

  // Performance recommendations based on score
  if (scores.performance < 50) {
    recommendations.push({
      category: 'Performance',
      priority: 'high' as const,
      issue: `Poor performance score: ${scores.performance}/100`,
      recommendation: 'Focus on critical performance optimizations immediately',
      impact: 'Poor performance severely affects user experience and SEO rankings'
    });
  } else if (scores.performance < 90) {
    recommendations.push({
      category: 'Performance',
      priority: 'medium' as const,
      issue: `Performance score needs improvement: ${scores.performance}/100`,
      recommendation: 'Implement performance optimizations to reach 90+ score',
      impact: 'Better performance improves user experience and search rankings'
    });
  }

  // Top opportunity recommendations
  opportunities.slice(0, 3).forEach(opp => {
    recommendations.push({
      category: 'Performance Optimization',
      priority: opp.savings > 1000 ? 'high' as const : 'medium' as const,
      issue: opp.title,
      recommendation: opp.description,
      impact: `Potential savings: ${opp.displayValue}`,
      estimatedSavings: opp.displayValue
    });
  });

  // Accessibility recommendations
  if (scores.accessibility < 90) {
    recommendations.push({
      category: 'Accessibility',
      priority: scores.accessibility < 70 ? 'high' as const : 'medium' as const,
      issue: `Accessibility score: ${scores.accessibility}/100`,
      recommendation: 'Improve accessibility for better user experience and compliance',
      impact: 'Accessibility issues prevent some users from using your site effectively'
    });
  }

  // SEO recommendations
  if (scores.seo < 90) {
    recommendations.push({
      category: 'SEO',
      priority: scores.seo < 70 ? 'high' as const : 'medium' as const,
      issue: `SEO score: ${scores.seo}/100`,
      recommendation: 'Address SEO issues to improve search engine visibility',
      impact: 'SEO problems can significantly impact search rankings'
    });
  }

  // Best practices recommendations
  if (scores.bestPractices < 90) {
    recommendations.push({
      category: 'Best Practices',
      priority: 'medium' as const,
      issue: `Best practices score: ${scores.bestPractices}/100`,
      recommendation: 'Follow web development best practices for better reliability',
      impact: 'Best practices improve site security, reliability, and maintainability'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function generateSummary(results: PageSpeedResult[]) {
  const mobile = results.find(r => r.device === 'mobile');
  const desktop = results.find(r => r.device === 'desktop');

  const avgPerformance = results.length > 0 ? 
    Math.round(results.reduce((sum, r) => sum + r.scores.performance, 0) / results.length) : 0;

  return {
    averagePerformance: avgPerformance,
    grade: avgPerformance >= 90 ? 'good' : avgPerformance >= 50 ? 'needs-improvement' : 'poor',
    mobile: mobile ? {
      performance: mobile.scores.performance,
      coreWebVitals: mobile.coreWebVitals,
      topIssues: mobile.opportunities.slice(0, 3)
    } : null,
    desktop: desktop ? {
      performance: desktop.scores.performance,
      coreWebVitals: desktop.coreWebVitals,
      topIssues: desktop.opportunities.slice(0, 3)
    } : null,
    combinedRecommendations: results.flatMap(r => r.recommendations)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 10)
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const auditId = searchParams.get('auditId');
    const url = searchParams.get('url');

    if (!reportId && !auditId && !url) {
      return NextResponse.json({ error: 'reportId, auditId, or url is required' }, { status: 400 });
    }

    const where: any = {};
    if (reportId) where.reportId = reportId;
    if (auditId) where.auditId = auditId;
    if (url) where.url = url;

    const audits = await prisma.pageSpeedAudit.findMany({
      where,
      orderBy: { auditedAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      audits,
      summary: {
        total: audits.length,
        latest: audits[0] || null
      }
    });
  } catch (error) {
    console.error('Get page speed audits error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page speed audit data' },
      { status: 500 }
    );
  }
}