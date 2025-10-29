import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface MobileUsabilityResult {
  url: string;
  score: number;
  issues: {
    type: string;
    severity: 'critical' | 'warning' | 'minor';
    description: string;
    recommendation: string;
    elements?: string[];
  }[];
  checks: {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    description: string;
    details?: any;
  }[];
  viewport: {
    hasViewportTag: boolean;
    content: string;
    isOptimal: boolean;
    issues: string[];
  };
  touchElements: {
    total: number;
    tooSmall: number;
    tooClose: number;
    adequateSize: number;
  };
  textReadability: {
    score: number;
    smallText: number;
    illegibleText: number;
    issues: string[];
  };
  contentFitsViewport: {
    horizontalScrolling: boolean;
    contentWidth: number;
    viewportWidth: number;
  };
  loading: {
    flashUsage: boolean;
    incompatiblePlugins: string[];
  };
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
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const result = await analyzeMobileUsability(url);
    return NextResponse.json(result);
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to analyze mobile usability' },
      { status: 500 }
    );
  }
}

async function analyzeMobileUsability(url: string): Promise<MobileUsabilityResult> {
  try {
    // Fetch the page with mobile user agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const issues: MobileUsabilityResult['issues'] = [];
    const checks: MobileUsabilityResult['checks'] = [];
    const recommendations: MobileUsabilityResult['recommendations'] = [];

    // 1. Viewport Configuration Analysis
    const viewport = analyzeViewport($);
    if (!viewport.hasViewportTag) {
      issues.push({
        type: 'missing_viewport',
        severity: 'critical',
        description: 'No viewport meta tag found',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to the <head> section'
      });
      
      recommendations.push({
        priority: 'high',
        category: 'Mobile Compatibility',
        issue: 'Missing viewport meta tag',
        recommendation: 'Add viewport meta tag for proper mobile rendering',
        impact: 'Page may not display correctly on mobile devices'
      });
    }

    checks.push({
      name: 'Viewport Meta Tag',
      status: viewport.hasViewportTag ? 'pass' : 'fail',
      description: viewport.hasViewportTag ? 'Viewport meta tag configured' : 'No viewport meta tag found',
      details: viewport
    });

    // 2. Touch Element Analysis
    const touchElements = analyzeTouchElements($);
    
    if (touchElements.tooSmall > 0) {
      issues.push({
        type: 'small_touch_targets',
        severity: 'warning',
        description: `${touchElements.tooSmall} touch targets are smaller than recommended 44px`,
        recommendation: 'Increase size of clickable elements to at least 44x44 pixels'
      });
      
      recommendations.push({
        priority: 'medium',
        category: 'Touch Targets',
        issue: 'Touch targets too small',
        recommendation: 'Ensure all clickable elements are at least 44x44 pixels',
        impact: 'Small touch targets are difficult to tap on mobile devices'
      });
    }

    if (touchElements.tooClose > 0) {
      issues.push({
        type: 'close_touch_targets',
        severity: 'warning',
        description: `${touchElements.tooClose} touch targets are too close together`,
        recommendation: 'Add adequate spacing between clickable elements (at least 8px)'
      });
    }

    checks.push({
      name: 'Touch Target Size',
      status: touchElements.tooSmall === 0 ? 'pass' : 'warning',
      description: `${touchElements.adequateSize}/${touchElements.total} touch targets have adequate size`,
      details: touchElements
    });

    // 3. Text Readability Analysis
    const textReadability = analyzeTextReadability($);
    
    if (textReadability.smallText > 0) {
      issues.push({
        type: 'small_text',
        severity: 'warning',
        description: `Text too small to read on mobile (${textReadability.smallText} elements)`,
        recommendation: 'Use minimum 16px font size for body text on mobile'
      });
      
      recommendations.push({
        priority: 'medium',
        category: 'Typography',
        issue: 'Text too small for mobile reading',
        recommendation: 'Increase font size to at least 16px for body text',
        impact: 'Small text is difficult to read on mobile devices'
      });
    }

    checks.push({
      name: 'Text Readability',
      status: textReadability.score >= 80 ? 'pass' : textReadability.score >= 60 ? 'warning' : 'fail',
      description: `Text readability score: ${textReadability.score}%`,
      details: textReadability
    });

    // 4. Content Width Analysis
    const contentFitsViewport = analyzeContentWidth($);
    
    if (contentFitsViewport.horizontalScrolling) {
      issues.push({
        type: 'horizontal_scroll',
        severity: 'critical',
        description: 'Content wider than screen causes horizontal scrolling',
        recommendation: 'Use responsive design to fit content within viewport width'
      });
      
      recommendations.push({
        priority: 'high',
        category: 'Responsive Design',
        issue: 'Horizontal scrolling required',
        recommendation: 'Implement responsive design to fit content in viewport',
        impact: 'Horizontal scrolling provides poor user experience on mobile'
      });
    }

    checks.push({
      name: 'Content Fits Viewport',
      status: !contentFitsViewport.horizontalScrolling ? 'pass' : 'fail',
      description: contentFitsViewport.horizontalScrolling ? 'Content causes horizontal scrolling' : 'Content fits within viewport',
      details: contentFitsViewport
    });

    // 5. Loading and Compatibility Analysis
    const loading = analyzeLoadingCompatibility($);
    
    if (loading.flashUsage) {
      issues.push({
        type: 'flash_usage',
        severity: 'critical',
        description: 'Flash content detected - not supported on mobile devices',
        recommendation: 'Replace Flash content with HTML5 alternatives'
      });
      
      recommendations.push({
        priority: 'high',
        category: 'Compatibility',
        issue: 'Flash content not supported on mobile',
        recommendation: 'Replace Flash with HTML5, CSS3, and JavaScript',
        impact: 'Flash content will not work on most mobile devices'
      });
    }

    if (loading.incompatiblePlugins.length > 0) {
      issues.push({
        type: 'incompatible_plugins',
        severity: 'warning',
        description: `Incompatible plugins detected: ${loading.incompatiblePlugins.join(', ')}`,
        recommendation: 'Replace with mobile-compatible alternatives'
      });
    }

    checks.push({
      name: 'Mobile Compatibility',
      status: !loading.flashUsage && loading.incompatiblePlugins.length === 0 ? 'pass' : 'warning',
      description: 'Mobile-compatible content and plugins',
      details: loading
    });

    // 6. Additional Mobile-Specific Checks
    
    // Font size check
    const hasAdequateFontSize = checkMinimumFontSize($);
    checks.push({
      name: 'Minimum Font Size',
      status: hasAdequateFontSize ? 'pass' : 'warning',
      description: hasAdequateFontSize ? 'Font sizes are mobile-friendly' : 'Some text may be too small on mobile'
    });

    // Image optimization for mobile
    const imageAnalysis = analyzeImagesForMobile($);
    checks.push({
      name: 'Mobile Image Optimization',
      status: imageAnalysis.score >= 80 ? 'pass' : 'warning',
      description: `${imageAnalysis.optimized}/${imageAnalysis.total} images are mobile-optimized`,
      details: imageAnalysis
    });

    // Calculate overall score
    const passedChecks = checks.filter(c => c.status === 'pass').length;
    const totalChecks = checks.length;
    const score = Math.round((passedChecks / totalChecks) * 100);

    return {
      url,
      score,
      issues,
      checks,
      viewport,
      touchElements,
      textReadability,
      contentFitsViewport,
      loading,
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    
    
    return {
      url,
      score: 0,
      issues: [{
        type: 'analysis_error',
        severity: 'critical',
        description: 'Unable to analyze mobile usability',
        recommendation: 'Ensure the website is accessible and try again'
      }],
      checks: [],
      viewport: {
        hasViewportTag: false,
        content: '',
        isOptimal: false,
        issues: ['Unable to analyze']
      },
      touchElements: { total: 0, tooSmall: 0, tooClose: 0, adequateSize: 0 },
      textReadability: { score: 0, smallText: 0, illegibleText: 0, issues: ['Unable to analyze'] },
      contentFitsViewport: { horizontalScrolling: false, contentWidth: 0, viewportWidth: 0 },
      loading: { flashUsage: false, incompatiblePlugins: [] },
      recommendations: [],
      timestamp: new Date().toISOString()
    };
  }
}

function analyzeViewport($: cheerio.CheerioAPI) {
  const viewportTag = $('meta[name="viewport"]').first();
  const hasViewportTag = viewportTag.length > 0;
  const content = viewportTag.attr('content') || '';
  
  const issues: string[] = [];
  let isOptimal = true;

  if (!hasViewportTag) {
    issues.push('Missing viewport meta tag');
    isOptimal = false;
  } else {
    if (!content.includes('width=device-width')) {
      issues.push('Should include width=device-width');
      isOptimal = false;
    }
    if (!content.includes('initial-scale=1')) {
      issues.push('Should include initial-scale=1.0');
      isOptimal = false;
    }
    if (content.includes('user-scalable=no')) {
      issues.push('Consider allowing user scaling for accessibility');
    }
  }

  return {
    hasViewportTag,
    content,
    isOptimal,
    issues
  };
}

function analyzeTouchElements($: cheerio.CheerioAPI) {
  const touchableElements = $('a, button, input[type="button"], input[type="submit"], [onclick], [role="button"]');
  let total = 0;
  let tooSmall = 0;
  let tooClose = 0;
  let adequateSize = 0;

  touchableElements.each((_, element) => {
    total++;
    
    // Simulate size analysis (in real implementation, you might use Puppeteer for accurate measurements)
    const tagName = element.tagName.toLowerCase();
    const hasStyles = $(element).attr('style') || '';
    
    // Basic heuristics for size estimation
    const text = $(element).text().trim();
    const isLikelySmall = text.length < 3 && !$(element).find('img').length;
    
    if (isLikelySmall || tagName === 'input') {
      tooSmall++;
    } else {
      adequateSize++;
    }
  });

  return {
    total,
    tooSmall,
    tooClose, // Would need DOM measurements to accurately determine
    adequateSize
  };
}

function analyzeTextReadability($: cheerio.CheerioAPI) {
  const textElements = $('p, div, span, h1, h2, h3, h4, h5, h6, li, td');
  let totalElements = 0;
  let smallText = 0;
  let illegibleText = 0;
  const issues: string[] = [];

  textElements.each((_, element) => {
    const text = $(element).text().trim();
    if (text.length > 10) {
      totalElements++;
      
      const styles = $(element).attr('style') || '';
      const fontSize = extractFontSize(styles);
      
      if (fontSize && fontSize < 16) {
        if (fontSize < 12) {
          illegibleText++;
        } else {
          smallText++;
        }
      }
    }
  });

  if (smallText > 0) {
    issues.push(`${smallText} elements have small text (12-16px)`);
  }
  if (illegibleText > 0) {
    issues.push(`${illegibleText} elements have very small text (<12px)`);
  }

  const score = totalElements > 0 ? Math.round(((totalElements - smallText - illegibleText) / totalElements) * 100) : 100;

  return {
    score,
    smallText,
    illegibleText,
    issues
  };
}

function analyzeContentWidth($: cheerio.CheerioAPI) {
  // This would need real browser measurements in production
  // For now, return basic analysis
  const hasFixedWidthElements = $('[style*="width:"][style*="px"]').length > 0;
  
  return {
    horizontalScrolling: hasFixedWidthElements,
    contentWidth: hasFixedWidthElements ? 1200 : 375, // Simulated values
    viewportWidth: 375 // Typical mobile viewport
  };
}

function analyzeLoadingCompatibility($: cheerio.CheerioAPI) {
  const flashElements = $('embed[type*="flash"], object[type*="flash"], [data*=".swf"]');
  const flashUsage = flashElements.length > 0;
  
  const incompatiblePlugins: string[] = [];
  if (flashUsage) {
    incompatiblePlugins.push('Flash');
  }
  
  // Check for other incompatible plugins
  const silverlightElements = $('[data*="silverlight"], [type*="silverlight"]');
  if (silverlightElements.length > 0) {
    incompatiblePlugins.push('Silverlight');
  }

  return {
    flashUsage,
    incompatiblePlugins
  };
}

function checkMinimumFontSize($: cheerio.CheerioAPI): boolean {
  const textElements = $('p, div, span, li, td');
  let hasSmallFont = false;

  textElements.each((_, element) => {
    const styles = $(element).attr('style') || '';
    const fontSize = extractFontSize(styles);
    
    if (fontSize && fontSize < 16) {
      hasSmallFont = true;
      return false; // Break the loop
    }
  });

  return !hasSmallFont;
}

function analyzeImagesForMobile($: cheerio.CheerioAPI) {
  const images = $('img');
  let total = 0;
  let optimized = 0;

  images.each((_, img) => {
    total++;
    
    const src = $(img).attr('src') || '';
    const hasResponsiveAttributes = $(img).attr('srcset') || $(img).attr('sizes');
    const hasAltText = $(img).attr('alt');
    
    if (hasResponsiveAttributes || src.includes('responsive') || hasAltText) {
      optimized++;
    }
  });

  const score = total > 0 ? Math.round((optimized / total) * 100) : 100;
  
  return {
    total,
    optimized,
    score
  };
}

function extractFontSize(styles: string): number | null {
  const fontSizeMatch = styles.match(/font-size:\s*(\d+)px/);
  return fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : null;
}