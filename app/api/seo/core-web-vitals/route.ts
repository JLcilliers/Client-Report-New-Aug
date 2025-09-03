import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CoreWebVitalsResult {
  url: string;
  device: 'mobile' | 'desktop';
  metrics: {
    lcp: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: { good: number; poor: number } };
    fid: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: { good: number; poor: number } };
    cls: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: { good: number; poor: number } };
    ttfb: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: { good: number; poor: number } };
    fcp: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: { good: number; poor: number } };
    inp: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: { good: number; poor: number } };
  };
  overallGrade: 'good' | 'needs-improvement' | 'poor';
  timestamp: string;
  recommendations: {
    metric: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }[];
}

// Core Web Vitals thresholds (in milliseconds for LCP, FID, TTFB, FCP, INP and ratio for CLS)
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
  fcp: { good: 1800, poor: 3000 },
  inp: { good: 200, poor: 500 }
};

export async function POST(request: NextRequest) {
  try {
    const { url, devices = ['mobile', 'desktop'], reportId, auditId } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const results: CoreWebVitalsResult[] = [];

    for (const device of devices) {
      const cwvResult = await measureCoreWebVitals(url, device as 'mobile' | 'desktop');
      results.push(cwvResult);

      // Store in database if reportId or auditId provided
      if (reportId || auditId) {
        await prisma.coreWebVitalsMetric.create({
          data: {
            reportId: reportId || undefined,
            auditId: auditId || undefined,
            url,
            device,
            lcp: cwvResult.metrics.lcp.value,
            fid: cwvResult.metrics.fid.value,
            cls: cwvResult.metrics.cls.value,
            ttfb: cwvResult.metrics.ttfb.value,
            fcp: cwvResult.metrics.fcp.value,
            inp: cwvResult.metrics.inp.value,
            lcpGrade: cwvResult.metrics.lcp.grade,
            fidGrade: cwvResult.metrics.fid.grade,
            clsGrade: cwvResult.metrics.cls.grade,
            ttfbGrade: cwvResult.metrics.ttfb.grade,
            fcpGrade: cwvResult.metrics.fcp.grade,
            inpGrade: cwvResult.metrics.inp.grade
          }
        });
      }
    }

    return NextResponse.json({
      url,
      results,
      summary: {
        mobile: results.find(r => r.device === 'mobile'),
        desktop: results.find(r => r.device === 'desktop'),
        combinedGrade: getCombinedGrade(results)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Core Web Vitals analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze Core Web Vitals' },
      { status: 500 }
    );
  }
}

async function measureCoreWebVitals(url: string, device: 'mobile' | 'desktop'): Promise<CoreWebVitalsResult> {
  try {
    // Use PageSpeed Insights API for real Core Web Vitals data
    const pageSpeedUrl = `https://www.googleapis.com/pagespeedinsuights/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${device}&key=${process.env.PAGESPEED_API_KEY}&category=performance`;
    
    const response = await fetch(pageSpeedUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'PageSpeed API error');
    }

    // Extract Core Web Vitals from PageSpeed Insights
    const lightlouseResult = data.lighthouseResult;
    const fieldData = data.loadingExperience;
    const labData = lightlouseResult.audits;

    const metrics = {
      lcp: extractMetric(fieldData, labData, 'largest-contentful-paint', 'LARGEST_CONTENTFUL_PAINT_MS', THRESHOLDS.lcp),
      fid: extractMetric(fieldData, labData, 'max-potential-fid', 'FIRST_INPUT_DELAY_MS', THRESHOLDS.fid),
      cls: extractMetric(fieldData, labData, 'cumulative-layout-shift', 'CUMULATIVE_LAYOUT_SHIFT_SCORE', THRESHOLDS.cls),
      ttfb: extractMetric(fieldData, labData, 'server-response-time', 'EXPERIMENTAL_TIME_TO_FIRST_BYTE', THRESHOLDS.ttfb),
      fcp: extractMetric(fieldData, labData, 'first-contentful-paint', 'FIRST_CONTENTFUL_PAINT_MS', THRESHOLDS.fcp),
      inp: extractMetric(fieldData, labData, 'experimental-interaction-to-next-paint', 'INTERACTION_TO_NEXT_PAINT', THRESHOLDS.inp)
    };

    const overallGrade = calculateOverallGrade(metrics);
    const recommendations = generateRecommendations(metrics, labData);

    return {
      url,
      device,
      metrics,
      overallGrade,
      timestamp: new Date().toISOString(),
      recommendations
    };
  } catch (error) {
    console.error(`Core Web Vitals measurement error for ${url} (${device}):`, error);
    
    // Return fallback data if API fails
    return {
      url,
      device,
      metrics: {
        lcp: { value: 0, grade: 'poor', threshold: THRESHOLDS.lcp },
        fid: { value: 0, grade: 'poor', threshold: THRESHOLDS.fid },
        cls: { value: 0, grade: 'poor', threshold: THRESHOLDS.cls },
        ttfb: { value: 0, grade: 'poor', threshold: THRESHOLDS.ttfb },
        fcp: { value: 0, grade: 'poor', threshold: THRESHOLDS.fcp },
        inp: { value: 0, grade: 'poor', threshold: THRESHOLDS.inp }
      },
      overallGrade: 'poor',
      timestamp: new Date().toISOString(),
      recommendations: [{
        metric: 'general',
        issue: 'Unable to measure Core Web Vitals',
        recommendation: 'Check if the website is accessible and try again',
        priority: 'high',
        impact: 'Cannot assess user experience metrics'
      }]
    };
  }
}

function extractMetric(fieldData: any, labData: any, auditKey: string, fieldKey: string, threshold: { good: number; poor: number }) {
  // Prefer field data (real user data) over lab data
  let value = 0;
  
  if (fieldData?.metrics?.[fieldKey]) {
    value = fieldData.metrics[fieldKey].percentile;
  } else if (labData?.[auditKey]?.numericValue !== undefined) {
    value = labData[auditKey].numericValue;
  }

  const grade = value <= threshold.good ? 'good' : 
               value <= threshold.poor ? 'needs-improvement' : 'poor';

  return {
    value: Math.round(value * 100) / 100, // Round to 2 decimal places
    grade: grade as 'good' | 'needs-improvement' | 'poor',
    threshold
  };
}

function calculateOverallGrade(metrics: CoreWebVitalsResult['metrics']): 'good' | 'needs-improvement' | 'poor' {
  const grades = Object.values(metrics).map(m => m.grade);
  
  if (grades.every(grade => grade === 'good')) return 'good';
  if (grades.some(grade => grade === 'poor')) return 'poor';
  return 'needs-improvement';
}

function generateRecommendations(metrics: CoreWebVitalsResult['metrics'], labData: any) {
  const recommendations = [];

  // LCP recommendations
  if (metrics.lcp.grade !== 'good') {
    recommendations.push({
      metric: 'LCP',
      issue: `Largest Contentful Paint is ${metrics.lcp.value}ms (${metrics.lcp.grade})`,
      recommendation: 'Optimize server response time, remove render-blocking resources, optimize images',
      priority: metrics.lcp.grade === 'poor' ? 'high' : 'medium',
      impact: 'LCP measures loading performance. Poor LCP affects user experience and SEO rankings.'
    } as const);
  }

  // FID recommendations
  if (metrics.fid.grade !== 'good') {
    recommendations.push({
      metric: 'FID',
      issue: `First Input Delay is ${metrics.fid.value}ms (${metrics.fid.grade})`,
      recommendation: 'Reduce JavaScript execution time, eliminate render-blocking resources, minimize main thread work',
      priority: metrics.fid.grade === 'poor' ? 'high' : 'medium',
      impact: 'FID measures interactivity. Poor FID makes the site feel unresponsive to users.'
    } as const);
  }

  // CLS recommendations
  if (metrics.cls.grade !== 'good') {
    recommendations.push({
      metric: 'CLS',
      issue: `Cumulative Layout Shift is ${metrics.cls.value} (${metrics.cls.grade})`,
      recommendation: 'Add size attributes to images and videos, avoid inserting content above existing content',
      priority: metrics.cls.grade === 'poor' ? 'high' : 'medium',
      impact: 'CLS measures visual stability. High CLS causes frustrating user experience.'
    } as const);
  }

  // TTFB recommendations
  if (metrics.ttfb.grade !== 'good') {
    recommendations.push({
      metric: 'TTFB',
      issue: `Time to First Byte is ${metrics.ttfb.value}ms (${metrics.ttfb.grade})`,
      recommendation: 'Optimize server configuration, use CDN, improve database queries, enable caching',
      priority: metrics.ttfb.grade === 'poor' ? 'high' : 'medium',
      impact: 'TTFB measures server responsiveness. Slow TTFB delays all other metrics.'
    } as const);
  }

  // FCP recommendations  
  if (metrics.fcp.grade !== 'good') {
    recommendations.push({
      metric: 'FCP',
      issue: `First Contentful Paint is ${metrics.fcp.value}ms (${metrics.fcp.grade})`,
      recommendation: 'Eliminate render-blocking resources, minify CSS, optimize web fonts',
      priority: metrics.fcp.grade === 'poor' ? 'high' : 'medium',
      impact: 'FCP measures perceived loading speed. Slow FCP makes site feel slow to users.'
    } as const);
  }

  // INP recommendations
  if (metrics.inp.grade !== 'good') {
    recommendations.push({
      metric: 'INP',
      issue: `Interaction to Next Paint is ${metrics.inp.value}ms (${metrics.inp.grade})`,
      recommendation: 'Optimize JavaScript execution, reduce main thread blocking, improve event handlers',
      priority: metrics.inp.grade === 'poor' ? 'high' : 'medium',
      impact: 'INP measures responsiveness. Poor INP makes interactions feel sluggish.'
    } as const);
  }

  return recommendations;
}

function getCombinedGrade(results: CoreWebVitalsResult[]): 'good' | 'needs-improvement' | 'poor' {
  if (results.length === 0) return 'poor';
  
  const grades = results.map(r => r.overallGrade);
  
  if (grades.every(grade => grade === 'good')) return 'good';
  if (grades.some(grade => grade === 'poor')) return 'poor';
  return 'needs-improvement';
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

    const metrics = await prisma.coreWebVitalsMetric.findMany({
      where,
      orderBy: { measuredAt: 'desc' },
      take: 50 // Limit to recent 50 measurements
    });

    return NextResponse.json({
      metrics,
      summary: {
        total: metrics.length,
        latest: metrics[0] || null,
        trend: calculateTrend(metrics)
      }
    });
  } catch (error) {
    console.error('Get Core Web Vitals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Core Web Vitals data' },
      { status: 500 }
    );
  }
}

function calculateTrend(metrics: any[]) {
  if (metrics.length < 2) return null;
  
  const latest = metrics[0];
  const previous = metrics[1];
  
  return {
    lcp: calculateMetricTrend(latest.lcp, previous.lcp),
    fid: calculateMetricTrend(latest.fid, previous.fid),
    cls: calculateMetricTrend(latest.cls, previous.cls),
    ttfb: calculateMetricTrend(latest.ttfb, previous.ttfb),
    fcp: calculateMetricTrend(latest.fcp, previous.fcp),
    inp: calculateMetricTrend(latest.inp, previous.inp)
  };
}

function calculateMetricTrend(current: number, previous: number) {
  if (!current || !previous) return null;
  
  const change = ((current - previous) / previous) * 100;
  return {
    change: Math.round(change * 100) / 100,
    direction: change > 0 ? 'worse' : change < 0 ? 'better' : 'same',
    improvement: change < 0 // Lower values are better for Core Web Vitals
  };
}