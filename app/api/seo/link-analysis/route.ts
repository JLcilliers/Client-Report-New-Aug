import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface LinkAnalysisResult {
  url: string;
  internalLinks: {
    total: number;
    unique: number;
    broken: number;
    redirects: number;
    links: {
      href: string;
      text: string;
      title?: string;
      status: 'valid' | 'broken' | 'redirect' | 'unknown';
      statusCode?: number;
      redirectChain?: string[];
      issues: string[];
    }[];
  };
  externalLinks: {
    total: number;
    unique: number;
    nofollow: number;
    broken: number;
    links: {
      href: string;
      text: string;
      title?: string;
      rel: string;
      domain: string;
      status: 'valid' | 'broken' | 'redirect' | 'unknown';
      statusCode?: number;
      issues: string[];
    }[];
  };
  redirectChains: {
    originalUrl: string;
    finalUrl: string;
    chain: {
      url: string;
      statusCode: number;
      redirectType: 'permanent' | 'temporary' | 'other';
    }[];
    issues: string[];
    recommendations: string[];
  }[];
  linkEquity: {
    totalInternalLinks: number;
    totalExternalLinks: number;
    nofollowRatio: number;
    linkDistribution: { [key: string]: number };
    recommendations: string[];
  };
  anchorTextAnalysis: {
    exactMatch: number;
    partial: number;
    generic: number;
    branded: number;
    naked: number;
    overOptimized: boolean;
    recommendations: string[];
  };
  issues: {
    type: string;
    severity: 'critical' | 'warning' | 'minor';
    count: number;
    description: string;
    recommendation: string;
  }[];
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
    const { url, checkRedirects = true, checkBrokenLinks = true, maxDepth = 1 } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const result = await analyzeLinkStructure(url, checkRedirects, checkBrokenLinks, maxDepth);
    return NextResponse.json(result);
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to analyze link structure' },
      { status: 500 }
    );
  }
}

async function analyzeLinkStructure(
  url: string, 
  checkRedirects: boolean, 
  checkBrokenLinks: boolean, 
  maxDepth: number
): Promise<LinkAnalysisResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Analyzer/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const baseUrl = new URL(url);
    const domain = baseUrl.hostname;

    // Extract all links
    const allLinks = $('a[href]').toArray();
    const internalLinks: any[] = [];
    const externalLinks: any[] = [];

    // Process each link
    for (const linkElement of allLinks) {
      const href = $(linkElement).attr('href');
      const text = $(linkElement).text().trim();
      const title = $(linkElement).attr('title');
      const rel = $(linkElement).attr('rel') || '';

      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }

      try {
        const linkUrl = new URL(href, url);
        const isInternal = linkUrl.hostname === domain || linkUrl.hostname === `www.${domain}` || domain === `www.${linkUrl.hostname}`;

        const linkData = {
          href: linkUrl.href,
          text: text || '[No text]',
          title,
          rel,
          domain: linkUrl.hostname,
          status: 'unknown' as const,
          statusCode: undefined,
          issues: [] as string[]
        };

        // Check for common issues
        if (!text && !title) {
          linkData.issues.push('Missing link text and title');
        }
        if (text.length > 100) {
          linkData.issues.push('Link text too long (over 100 characters)');
        }
        if (href.includes(' ')) {
          linkData.issues.push('URL contains spaces');
        }

        if (isInternal) {
          internalLinks.push({
            ...linkData,
            redirectChain: [] as string[]
          });
        } else {
          externalLinks.push(linkData);
        }
      } catch (parseError) {
        // Invalid URL
        const linkData = {
          href,
          text: text || '[No text]',
          title,
          rel,
          domain: 'invalid',
          status: 'broken' as const,
          statusCode: undefined,
          issues: ['Invalid URL format']
        };

        if (href.startsWith('/') || href.includes(domain)) {
          internalLinks.push({
            ...linkData,
            redirectChain: [] as string[]
          });
        } else {
          externalLinks.push(linkData);
        }
      }
    }

    // Check link status if requested
    if (checkBrokenLinks) {
      await checkLinksStatus(internalLinks, 'internal');
      await checkLinksStatus(externalLinks, 'external');
    }

    // Analyze redirect chains if requested
    let redirectChains: any[] = [];
    if (checkRedirects) {
      redirectChains = await analyzeRedirectChains([...internalLinks, ...externalLinks]);
    }

    // Analyze link equity distribution
    const linkEquity = analyzeLinkEquity(internalLinks, externalLinks);

    // Analyze anchor text
    const anchorTextAnalysis = analyzeAnchorText([...internalLinks, ...externalLinks], domain);

    // Identify issues
    const issues = identifyLinkIssues(internalLinks, externalLinks, redirectChains);

    // Generate recommendations
    const recommendations = generateLinkRecommendations(issues, linkEquity, anchorTextAnalysis);

    return {
      url,
      internalLinks: {
        total: internalLinks.length,
        unique: new Set(internalLinks.map(l => l.href)).size,
        broken: internalLinks.filter(l => l.status === 'broken').length,
        redirects: internalLinks.filter(l => l.status === 'redirect').length,
        links: internalLinks
      },
      externalLinks: {
        total: externalLinks.length,
        unique: new Set(externalLinks.map(l => l.href)).size,
        nofollow: externalLinks.filter(l => l.rel.includes('nofollow')).length,
        broken: externalLinks.filter(l => l.status === 'broken').length,
        links: externalLinks
      },
      redirectChains,
      linkEquity,
      anchorTextAnalysis,
      issues,
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    
    
    return {
      url,
      internalLinks: { total: 0, unique: 0, broken: 0, redirects: 0, links: [] },
      externalLinks: { total: 0, unique: 0, nofollow: 0, broken: 0, links: [] },
      redirectChains: [],
      linkEquity: {
        totalInternalLinks: 0,
        totalExternalLinks: 0,
        nofollowRatio: 0,
        linkDistribution: {},
        recommendations: ['Unable to analyze link equity due to fetch error']
      },
      anchorTextAnalysis: {
        exactMatch: 0,
        partial: 0,
        generic: 0,
        branded: 0,
        naked: 0,
        overOptimized: false,
        recommendations: ['Unable to analyze anchor text due to fetch error']
      },
      issues: [{
        type: 'analysis_error',
        severity: 'critical',
        count: 1,
        description: 'Unable to analyze links',
        recommendation: 'Check if the website is accessible and try again'
      }],
      recommendations: [],
      timestamp: new Date().toISOString()
    };
  }
}

async function checkLinksStatus(links: any[], type: 'internal' | 'external') {
  // Limit concurrent requests to avoid overwhelming servers
  const BATCH_SIZE = type === 'internal' ? 10 : 5;
  const TIMEOUT = 10000; // 10 second timeout per request

  for (let i = 0; i < links.length; i += BATCH_SIZE) {
    const batch = links.slice(i, i + BATCH_SIZE);
    
    await Promise.allSettled(
      batch.map(async (link) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

          const response = await fetch(link.href, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; SEO-Link-Checker/1.0)'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          link.statusCode = response.status;
          
          if (response.status >= 200 && response.status < 300) {
            link.status = 'valid';
          } else if (response.status >= 300 && response.status < 400) {
            link.status = 'redirect';
            // Get redirect location
            const location = response.headers.get('location');
            if (location) {
              link.redirectChain = [location];
            }
          } else {
            link.status = 'broken';
            link.issues.push(`HTTP ${response.status} error`);
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            link.status = 'broken';
            link.issues.push('Request timeout');
          } else {
            link.status = 'broken';
            link.issues.push(`Network error: ${error.message}`);
          }
        }
      })
    );

    // Add small delay between batches to be respectful
    if (i + BATCH_SIZE < links.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function analyzeRedirectChains(links: any[]) {
  const redirectChains = [];
  const MAX_REDIRECTS = 5;

  const redirectLinks = links.filter(l => l.status === 'redirect');

  for (const link of redirectLinks) {
    const chain = [];
    let currentUrl = link.href;
    let redirectCount = 0;

    while (redirectCount < MAX_REDIRECTS) {
      try {
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEO-Redirect-Checker/1.0)'
          }
        });

        chain.push({
          url: currentUrl,
          statusCode: response.status,
          redirectType: response.status === 301 ? 'permanent' : 
                       response.status === 302 ? 'temporary' : 'other'
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location) {
            currentUrl = new URL(location, currentUrl).href;
            redirectCount++;
          } else {
            break;
          }
        } else {
          break;
        }
      } catch (error) {
        break;
      }
    }

    if (chain.length > 1) {
      const issues = [];
      const recommendations = [];

      if (chain.length > 3) {
        issues.push('Long redirect chain (over 3 redirects)');
        recommendations.push('Reduce redirect chain length for better performance');
      }

      if (chain.some(c => c.redirectType === 'temporary')) {
        issues.push('Contains temporary redirects (302)');
        recommendations.push('Use permanent redirects (301) when appropriate');
      }

      redirectChains.push({
        originalUrl: link.href,
        finalUrl: currentUrl,
        chain,
        issues,
        recommendations
      });
    }
  }

  return redirectChains;
}

function analyzeLinkEquity(internalLinks: any[], externalLinks: any[]) {
  const totalInternal = internalLinks.length;
  const totalExternal = externalLinks.length;
  const nofollowExternal = externalLinks.filter(l => l.rel.includes('nofollow')).length;
  const nofollowRatio = totalExternal > 0 ? nofollowExternal / totalExternal : 0;

  // Analyze link distribution by path
  const linkDistribution: { [key: string]: number } = {};
  internalLinks.forEach(link => {
    try {
      const path = new URL(link.href).pathname;
      linkDistribution[path] = (linkDistribution[path] || 0) + 1;
    } catch (error) {
      linkDistribution['invalid-urls'] = (linkDistribution['invalid-urls'] || 0) + 1;
    }
  });

  const recommendations = [];

  if (totalInternal < 10) {
    recommendations.push('Consider adding more internal links to improve site navigation and SEO');
  }

  if (nofollowRatio > 0.8) {
    recommendations.push('High ratio of nofollow external links may indicate over-optimization');
  }

  if (totalExternal / totalInternal > 3) {
    recommendations.push('High ratio of external to internal links may leak link equity');
  }

  return {
    totalInternalLinks: totalInternal,
    totalExternalLinks: totalExternal,
    nofollowRatio: Math.round(nofollowRatio * 100) / 100,
    linkDistribution,
    recommendations
  };
}

function analyzeAnchorText(links: any[], domain: string) {
  let exactMatch = 0;
  let partial = 0;
  let generic = 0;
  let branded = 0;
  let naked = 0;

  const genericTerms = ['click here', 'read more', 'learn more', 'here', 'this', 'more info', 'continue'];
  const brandTerms = domain.split('.')[0];

  links.forEach(link => {
    const text = link.text.toLowerCase();
    
    if (text.includes('http://') || text.includes('https://')) {
      naked++;
    } else if (text.includes(brandTerms)) {
      branded++;
    } else if (genericTerms.some(term => text.includes(term))) {
      generic++;
    } else if (text.length > 3) {
      // Simple heuristic for exact/partial match
      if (text.length < 10) {
        exactMatch++;
      } else {
        partial++;
      }
    }
  });

  const total = exactMatch + partial + generic + branded + naked;
  const overOptimized = total > 0 && (exactMatch / total > 0.6);

  const recommendations = [];
  
  if (generic / total > 0.3) {
    recommendations.push('Reduce use of generic anchor text like "click here" and "read more"');
  }
  
  if (overOptimized) {
    recommendations.push('Diversify anchor text to avoid over-optimization');
  }
  
  if (naked / total > 0.2) {
    recommendations.push('Replace naked URLs with descriptive anchor text');
  }

  return {
    exactMatch,
    partial,
    generic,
    branded,
    naked,
    overOptimized,
    recommendations
  };
}

function identifyLinkIssues(internalLinks: any[], externalLinks: any[], redirectChains: any[]) {
  const issues = [];

  const brokenInternal = internalLinks.filter(l => l.status === 'broken').length;
  const brokenExternal = externalLinks.filter(l => l.status === 'broken').length;

  if (brokenInternal > 0) {
    issues.push({
      type: 'broken_internal_links',
      severity: 'critical' as const,
      count: brokenInternal,
      description: `${brokenInternal} broken internal links found`,
      recommendation: 'Fix or remove broken internal links to improve user experience and SEO'
    });
  }

  if (brokenExternal > 0) {
    issues.push({
      type: 'broken_external_links',
      severity: 'warning' as const,
      count: brokenExternal,
      description: `${brokenExternal} broken external links found`,
      recommendation: 'Update or remove broken external links'
    });
  }

  const longRedirectChains = redirectChains.filter(c => c.chain.length > 3).length;
  if (longRedirectChains > 0) {
    issues.push({
      type: 'long_redirect_chains',
      severity: 'warning' as const,
      count: longRedirectChains,
      description: `${longRedirectChains} long redirect chains found`,
      recommendation: 'Shorten redirect chains to improve page load speed'
    });
  }

  const linksWithIssues = [...internalLinks, ...externalLinks].filter(l => l.issues.length > 0).length;
  if (linksWithIssues > 0) {
    issues.push({
      type: 'links_with_issues',
      severity: 'minor' as const,
      count: linksWithIssues,
      description: `${linksWithIssues} links have minor issues`,
      recommendation: 'Review and fix link issues for better SEO'
    });
  }

  return issues;
}

function generateLinkRecommendations(issues: any[], linkEquity: any, anchorTextAnalysis: any) {
  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    recommendation: string;
    impact: string;
  }> = [];

  // Add issue-based recommendations
  issues.forEach(issue => {
    recommendations.push({
      priority: issue.severity === 'critical' ? 'high' as const : 
               issue.severity === 'warning' ? 'medium' as const : 'low' as const,
      category: 'Link Quality',
      issue: issue.description,
      recommendation: issue.recommendation,
      impact: issue.severity === 'critical' ? 'Critical impact on SEO and user experience' :
              issue.severity === 'warning' ? 'Moderate impact on SEO performance' :
              'Minor impact on overall SEO'
    });
  });

  // Add link equity recommendations
  linkEquity.recommendations.forEach((rec: string) => {
    recommendations.push({
      priority: 'medium' as const,
      category: 'Link Equity',
      issue: 'Link equity distribution needs optimization',
      recommendation: rec,
      impact: 'Affects how authority is distributed throughout the site'
    });
  });

  // Add anchor text recommendations
  anchorTextAnalysis.recommendations.forEach((rec: string) => {
    recommendations.push({
      priority: anchorTextAnalysis.overOptimized ? 'high' as const : 'medium' as const,
      category: 'Anchor Text',
      issue: 'Anchor text needs optimization',
      recommendation: rec,
      impact: 'Affects relevance signals and user experience'
    });
  });

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}