import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

interface DuplicateContentAndErrorsResult {
  url: string;
  domain: string;
  duplicateContent: {
    titleDuplicates: {
      title: string;
      urls: string[];
      count: number;
    }[];
    metaDescriptionDuplicates: {
      description: string;
      urls: string[];
      count: number;
    }[];
    h1Duplicates: {
      h1: string;
      urls: string[];
      count: number;
    }[];
    contentSimilarity: {
      similarPages: {
        url1: string;
        url2: string;
        similarity: number;
        contentHash1: string;
        contentHash2: string;
      }[];
      threshold: number;
    };
    canonicalIssues: {
      missingCanonical: string[];
      selfCanonical: string[];
      nonSelfCanonical: {
        url: string;
        canonical: string;
      }[];
    };
  };
  errorPages: {
    notFound404: {
      brokenLinks: {
        sourceUrl: string;
        brokenUrl: string;
        linkText: string;
        statusCode: number;
        error: string;
      }[];
      custom404Page: {
        exists: boolean;
        url: string;
        hasSearchBox: boolean;
        hasNavigation: boolean;
        hasHelpfulContent: boolean;
        recommendations: string[];
      };
      orphanedPages: string[];
    };
    serverErrors5xx: {
      urls: string[];
      errors: {
        url: string;
        statusCode: number;
        error: string;
      }[];
    };
    redirectErrors: {
      redirectLoops: {
        url: string;
        chain: string[];
      }[];
      brokenRedirects: {
        url: string;
        redirectTarget: string;
        finalStatus: number;
      }[];
      unnecessaryRedirects: {
        url: string;
        redirectChain: string[];
        recommendation: string;
      }[];
    };
  };
  contentAnalysis: {
    thinContent: {
      pages: {
        url: string;
        wordCount: number;
        contentRatio: number;
        issues: string[];
      }[];
      threshold: number;
    };
    duplicateImages: {
      groups: {
        hash: string;
        urls: string[];
        imageSrc: string;
        count: number;
      }[];
    };
    missingContent: {
      noHeadings: string[];
      noImages: string[];
      noInternalLinks: string[];
    };
  };
  crawlData: {
    totalPagesCrawled: number;
    crawlDepth: number;
    crawlTime: number;
    robotsBlocked: string[];
    indexablePages: number;
    nonIndexablePages: number;
  };
  issues: {
    type: string;
    severity: 'critical' | 'warning' | 'minor';
    count: number;
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
    const { 
      url, 
      crawlDepth = 2, 
      maxPages = 50, 
      checkSimilarity = true, 
      similarityThreshold = 0.8 
    } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const result = await analyzeDuplicateContentAndErrors(
      url, 
      { crawlDepth, maxPages, checkSimilarity, similarityThreshold }
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Duplicate content and 404 analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze duplicate content and errors' },
      { status: 500 }
    );
  }
}

async function analyzeDuplicateContentAndErrors(
  url: string,
  options: { crawlDepth: number; maxPages: number; checkSimilarity: boolean; similarityThreshold: number }
): Promise<DuplicateContentAndErrorsResult> {
  const startTime = Date.now();
  
  try {
    const baseUrl = new URL(url);
    const domain = baseUrl.hostname;

    // Crawl site to collect pages
    const crawlData = await crawlSite(url, options);

    // Analyze duplicate content
    const duplicateContent = await analyzeDuplicateContent(crawlData.pages, options.similarityThreshold);

    // Analyze error pages
    const errorPages = await analyzeErrorPages(crawlData.pages, url);

    // Analyze content quality
    const contentAnalysis = analyzeContentQuality(crawlData.pages);

    // Identify issues
    const issues = identifyContentAndErrorIssues(duplicateContent, errorPages, contentAnalysis);

    // Calculate score
    const score = calculateContentQualityScore(issues, crawlData, duplicateContent);

    // Generate recommendations
    const recommendations = generateContentRecommendations(issues, duplicateContent, errorPages, contentAnalysis);

    const crawlTime = Date.now() - startTime;

    return {
      url,
      domain,
      duplicateContent,
      errorPages,
      contentAnalysis,
      crawlData: {
        ...crawlData,
        crawlTime
      },
      issues,
      score,
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Duplicate content analysis error for ${url}:`, error);
    
    return {
      url,
      domain: new URL(url).hostname,
      duplicateContent: {
        titleDuplicates: [],
        metaDescriptionDuplicates: [],
        h1Duplicates: [],
        contentSimilarity: { similarPages: [], threshold: 0.8 },
        canonicalIssues: { missingCanonical: [], selfCanonical: [], nonSelfCanonical: [] }
      },
      errorPages: {
        notFound404: {
          brokenLinks: [],
          custom404Page: {
            exists: false,
            url: '',
            hasSearchBox: false,
            hasNavigation: false,
            hasHelpfulContent: false,
            recommendations: []
          },
          orphanedPages: []
        },
        serverErrors5xx: { urls: [], errors: [] },
        redirectErrors: { redirectLoops: [], brokenRedirects: [], unnecessaryRedirects: [] }
      },
      contentAnalysis: {
        thinContent: { pages: [], threshold: 300 },
        duplicateImages: { groups: [] },
        missingContent: { noHeadings: [], noImages: [], noInternalLinks: [] }
      },
      crawlData: {
        totalPagesCrawled: 0,
        crawlDepth: 0,
        crawlTime: 0,
        robotsBlocked: [],
        indexablePages: 0,
        nonIndexablePages: 0
      },
      issues: [{
        type: 'analysis_error',
        severity: 'critical',
        count: 1,
        description: 'Unable to analyze duplicate content and errors',
        recommendation: 'Check if the website is accessible and try again',
        impact: 'Cannot assess content quality and errors'
      }],
      score: 0,
      recommendations: [],
      timestamp: new Date().toISOString()
    };
  }
}

async function crawlSite(startUrl: string, options: { crawlDepth: number; maxPages: number }) {
  const baseUrl = new URL(startUrl);
  const domain = baseUrl.hostname;
  const visitedUrls = new Set<string>();
  const pages: any[] = [];
  const robotsBlocked: string[] = [];
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

  while (queue.length > 0 && pages.length < options.maxPages) {
    const { url, depth } = queue.shift()!;
    
    if (visitedUrls.has(url) || depth > options.crawlDepth) {
      continue;
    }

    visitedUrls.add(url);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Content-Analyzer/1.0)'
        }
      });

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract page data
      const pageData = {
        url,
        statusCode: response.status,
        title: $('title').text().trim() || '',
        metaDescription: $('meta[name="description"]').attr('content')?.trim() || '',
        h1: $('h1').first().text().trim() || '',
        canonical: $('link[rel="canonical"]').attr('href') || '',
        metaRobots: $('meta[name="robots"]').attr('content') || '',
        wordCount: $('body').text().split(/\s+/).filter(word => word.length > 0).length,
        contentHash: generateContentHash($('body').text()),
        images: $('img').map((_, img) => $(img).attr('src')).get().filter(Boolean),
        internalLinks: [] as string[],
        headings: {
          h1: $('h1').length,
          h2: $('h2').length,
          h3: $('h3').length,
          h4: $('h4').length,
          h5: $('h5').length,
          h6: $('h6').length
        },
        isIndexable: !$('meta[name="robots"]').attr('content')?.includes('noindex') && response.status === 200
      };

      // Extract internal links for further crawling
      $('a[href]').each((_, link) => {
        const href = $(link).attr('href');
        if (href) {
          try {
            const linkUrl = new URL(href, url);
            if (linkUrl.hostname === domain && !visitedUrls.has(linkUrl.href)) {
              pageData.internalLinks.push(linkUrl.href);
              if (depth < options.crawlDepth) {
                queue.push({ url: linkUrl.href, depth: depth + 1 });
              }
            }
          } catch (error) {
            // Invalid URL, skip
          }
        }
      });

      pages.push(pageData);
    } catch (error) {
      // Page not accessible
      if (url !== startUrl) {
        robotsBlocked.push(url);
      }
    }
  }

  return {
    pages,
    totalPagesCrawled: pages.length,
    crawlDepth: options.crawlDepth,
    robotsBlocked,
    indexablePages: pages.filter(p => p.isIndexable).length,
    nonIndexablePages: pages.filter(p => !p.isIndexable).length
  };
}

function generateContentHash(content: string): string {
  // Remove whitespace and normalize content for comparison
  const normalizedContent = content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
  
  return crypto.createHash('md5').update(normalizedContent).digest('hex');
}

async function analyzeDuplicateContent(pages: any[], similarityThreshold: number) {
  // Analyze title duplicates
  const titleGroups: { [key: string]: string[] } = {};
  pages.forEach(page => {
    if (page.title) {
      if (!titleGroups[page.title]) {
        titleGroups[page.title] = [];
      }
      titleGroups[page.title].push(page.url);
    }
  });

  const titleDuplicates = Object.entries(titleGroups)
    .filter(([_, urls]) => urls.length > 1)
    .map(([title, urls]) => ({ title, urls, count: urls.length }));

  // Analyze meta description duplicates
  const metaGroups: { [key: string]: string[] } = {};
  pages.forEach(page => {
    if (page.metaDescription) {
      if (!metaGroups[page.metaDescription]) {
        metaGroups[page.metaDescription] = [];
      }
      metaGroups[page.metaDescription].push(page.url);
    }
  });

  const metaDescriptionDuplicates = Object.entries(metaGroups)
    .filter(([_, urls]) => urls.length > 1)
    .map(([description, urls]) => ({ description, urls, count: urls.length }));

  // Analyze H1 duplicates
  const h1Groups: { [key: string]: string[] } = {};
  pages.forEach(page => {
    if (page.h1) {
      if (!h1Groups[page.h1]) {
        h1Groups[page.h1] = [];
      }
      h1Groups[page.h1].push(page.url);
    }
  });

  const h1Duplicates = Object.entries(h1Groups)
    .filter(([_, urls]) => urls.length > 1)
    .map(([h1, urls]) => ({ h1, urls, count: urls.length }));

  // Analyze content similarity
  const similarPages = [];
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const similarity = calculateContentSimilarity(pages[i].contentHash, pages[j].contentHash, pages[i].wordCount, pages[j].wordCount);
      if (similarity >= similarityThreshold) {
        similarPages.push({
          url1: pages[i].url,
          url2: pages[j].url,
          similarity: Math.round(similarity * 100) / 100,
          contentHash1: pages[i].contentHash,
          contentHash2: pages[j].contentHash
        });
      }
    }
  }

  // Analyze canonical issues
  const missingCanonical = pages.filter(p => !p.canonical).map(p => p.url);
  const selfCanonical = pages.filter(p => p.canonical === p.url).map(p => p.url);
  const nonSelfCanonical = pages
    .filter(p => p.canonical && p.canonical !== p.url)
    .map(p => ({ url: p.url, canonical: p.canonical }));

  return {
    titleDuplicates,
    metaDescriptionDuplicates,
    h1Duplicates,
    contentSimilarity: {
      similarPages,
      threshold: similarityThreshold
    },
    canonicalIssues: {
      missingCanonical,
      selfCanonical,
      nonSelfCanonical
    }
  };
}

function calculateContentSimilarity(hash1: string, hash2: string, wordCount1: number, wordCount2: number): number {
  // Simple similarity based on hash comparison and word count difference
  if (hash1 === hash2) return 1.0;
  
  const wordCountDiff = Math.abs(wordCount1 - wordCount2);
  const maxWordCount = Math.max(wordCount1, wordCount2);
  
  if (maxWordCount === 0) return 0;
  
  // Simple heuristic: if word counts are very similar, assume high similarity
  const wordSimilarity = 1 - (wordCountDiff / maxWordCount);
  
  // For more accurate similarity, would need full content comparison
  return wordSimilarity > 0.9 ? 0.95 : wordSimilarity;
}

async function analyzeErrorPages(pages: any[], baseUrl: string) {
  const brokenLinks: any[] = [];
  const serverErrors5xx: any[] = [];
  const redirectErrors = {
    redirectLoops: [] as any[],
    brokenRedirects: [] as any[],
    unnecessaryRedirects: [] as any[]
  };

  // Check for broken internal links
  for (const page of pages) {
    for (const link of page.internalLinks) {
      try {
        const response = await fetch(link, { method: 'HEAD' });
        if (!response.ok) {
          if (response.status === 404) {
            brokenLinks.push({
              sourceUrl: page.url,
              brokenUrl: link,
              linkText: '', // Would need to extract from original HTML
              statusCode: response.status,
              error: '404 Not Found'
            });
          } else if (response.status >= 500) {
            serverErrors5xx.push({
              url: link,
              statusCode: response.status,
              error: `Server error: ${response.status}`
            });
          }
        }
      } catch (error) {
        // Network error
        brokenLinks.push({
          sourceUrl: page.url,
          brokenUrl: link,
          linkText: '',
          statusCode: 0,
          error: 'Network error'
        });
      }
    }
  }

  // Check for custom 404 page
  let custom404Page = {
    exists: false,
    url: '',
    hasSearchBox: false,
    hasNavigation: false,
    hasHelpfulContent: false,
    recommendations: [] as string[]
  };

  try {
    const testUrl = new URL(baseUrl);
    testUrl.pathname = '/this-page-does-not-exist-404-test';
    
    const response = await fetch(testUrl.href);
    if (response.status === 404) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      custom404Page = {
        exists: true,
        url: testUrl.href,
        hasSearchBox: $('input[type="search"], input[name*="search"], input[id*="search"]').length > 0,
        hasNavigation: $('nav, .navigation, .menu').length > 0 || $('a').length > 5,
        hasHelpfulContent: $('body').text().length > 200,
        recommendations: []
      };

      if (!custom404Page.hasSearchBox) {
        custom404Page.recommendations.push('Add a search box to help users find what they\'re looking for');
      }
      if (!custom404Page.hasNavigation) {
        custom404Page.recommendations.push('Include navigation menu or important links');
      }
      if (!custom404Page.hasHelpfulContent) {
        custom404Page.recommendations.push('Provide helpful content and suggestions for users');
      }
    }
  } catch (error) {
    // Unable to test 404 page
  }

  return {
    notFound404: {
      brokenLinks,
      custom404Page: custom404Page,
      orphanedPages: [] // Would need backlink analysis to determine
    },
    serverErrors5xx: {
      urls: serverErrors5xx.map(e => e.url),
      errors: serverErrors5xx
    },
    redirectErrors
  };
}

function analyzeContentQuality(pages: any[]) {
  const THIN_CONTENT_THRESHOLD = 300;

  // Analyze thin content
  const thinContentPages = pages
    .filter(page => page.wordCount < THIN_CONTENT_THRESHOLD && page.isIndexable)
    .map(page => ({
      url: page.url,
      wordCount: page.wordCount,
      contentRatio: page.wordCount / THIN_CONTENT_THRESHOLD,
      issues: [
        page.wordCount < 100 ? 'Extremely thin content (under 100 words)' : 'Thin content',
        page.headings.h1 === 0 ? 'Missing H1 heading' : null,
        page.metaDescription === '' ? 'Missing meta description' : null
      ].filter(Boolean)
    }));

  // Analyze duplicate images
  const imageGroups: { [key: string]: { urls: string[]; src: string } } = {};
  pages.forEach(page => {
    page.images.forEach((imageSrc: string) => {
      const imageHash = crypto.createHash('md5').update(imageSrc).digest('hex');
      if (!imageGroups[imageHash]) {
        imageGroups[imageHash] = { urls: [], src: imageSrc };
      }
      imageGroups[imageHash].urls.push(page.url);
    });
  });

  const duplicateImageGroups = Object.entries(imageGroups)
    .filter(([_, data]) => data.urls.length > 1)
    .map(([hash, data]) => ({
      hash,
      urls: [...new Set(data.urls)], // Remove duplicates
      imageSrc: data.src,
      count: new Set(data.urls).size
    }));

  // Analyze missing content elements
  const missingContent = {
    noHeadings: pages.filter(p => Object.values(p.headings).every(count => count === 0)).map(p => p.url),
    noImages: pages.filter(p => p.images.length === 0).map(p => p.url),
    noInternalLinks: pages.filter(p => p.internalLinks.length === 0).map(p => p.url)
  };

  return {
    thinContent: {
      pages: thinContentPages,
      threshold: THIN_CONTENT_THRESHOLD
    },
    duplicateImages: {
      groups: duplicateImageGroups
    },
    missingContent
  };
}

function identifyContentAndErrorIssues(duplicateContent: any, errorPages: any, contentAnalysis: any) {
  const issues = [];

  // Duplicate content issues
  if (duplicateContent.titleDuplicates.length > 0) {
    issues.push({
      type: 'duplicate_titles',
      severity: 'critical' as const,
      count: duplicateContent.titleDuplicates.reduce((sum: number, dup: any) => sum + dup.count, 0),
      description: `${duplicateContent.titleDuplicates.length} groups of duplicate titles found`,
      recommendation: 'Create unique, descriptive titles for each page',
      impact: 'Duplicate titles confuse search engines and hurt rankings'
    });
  }

  if (duplicateContent.metaDescriptionDuplicates.length > 0) {
    issues.push({
      type: 'duplicate_meta_descriptions',
      severity: 'warning' as const,
      count: duplicateContent.metaDescriptionDuplicates.reduce((sum: number, dup: any) => sum + dup.count, 0),
      description: `${duplicateContent.metaDescriptionDuplicates.length} groups of duplicate meta descriptions found`,
      recommendation: 'Write unique meta descriptions for each page',
      impact: 'Duplicate meta descriptions reduce click-through rates'
    });
  }

  if (duplicateContent.contentSimilarity.similarPages.length > 0) {
    issues.push({
      type: 'similar_content',
      severity: 'warning' as const,
      count: duplicateContent.contentSimilarity.similarPages.length,
      description: `${duplicateContent.contentSimilarity.similarPages.length} pairs of similar content found`,
      recommendation: 'Differentiate similar pages or consolidate duplicate content',
      impact: 'Similar content can cause keyword cannibalization'
    });
  }

  // Error page issues
  if (errorPages.notFound404.brokenLinks.length > 0) {
    issues.push({
      type: 'broken_links',
      severity: 'critical' as const,
      count: errorPages.notFound404.brokenLinks.length,
      description: `${errorPages.notFound404.brokenLinks.length} broken internal links found`,
      recommendation: 'Fix or remove broken internal links',
      impact: 'Broken links hurt user experience and waste crawl budget'
    });
  }

  if (errorPages.serverErrors5xx.errors.length > 0) {
    issues.push({
      type: 'server_errors',
      severity: 'critical' as const,
      count: errorPages.serverErrors5xx.errors.length,
      description: `${errorPages.serverErrors5xx.errors.length} server errors (5xx) found`,
      recommendation: 'Fix server errors immediately',
      impact: 'Server errors prevent indexing and hurt user experience'
    });
  }

  // Content quality issues
  if (contentAnalysis.thinContent.pages.length > 0) {
    issues.push({
      type: 'thin_content',
      severity: 'warning' as const,
      count: contentAnalysis.thinContent.pages.length,
      description: `${contentAnalysis.thinContent.pages.length} pages with thin content found`,
      recommendation: 'Expand content or consolidate thin pages',
      impact: 'Thin content may not rank well in search results'
    });
  }

  return issues;
}

function generateContentRecommendations(issues: any[], duplicateContent: any, errorPages: any, contentAnalysis: any) {
  const recommendations = [];

  // Add issue-based recommendations
  issues.forEach(issue => {
    recommendations.push({
      priority: issue.severity === 'critical' ? 'high' as const : 
               issue.severity === 'warning' ? 'medium' as const : 'low' as const,
      category: 'Content Quality',
      issue: issue.description,
      recommendation: issue.recommendation,
      impact: issue.impact
    });
  });

  // Specific recommendations for canonical issues
  if (duplicateContent.canonicalIssues.missingCanonical.length > 0) {
    recommendations.push({
      priority: 'medium' as const,
      category: 'Technical SEO',
      issue: `${duplicateContent.canonicalIssues.missingCanonical.length} pages missing canonical tags`,
      recommendation: 'Add canonical tags to all indexable pages',
      impact: 'Missing canonical tags can cause duplicate content issues'
    });
  }

  // 404 page recommendations
  if (!errorPages.notFound404.custom404Page.exists) {
    recommendations.push({
      priority: 'medium' as const,
      category: 'User Experience',
      issue: 'No custom 404 page found',
      recommendation: 'Create a helpful custom 404 page with navigation and search',
      impact: '404 errors provide poor user experience without custom page'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function calculateContentQualityScore(issues: any[], crawlData: any, duplicateContent: any) {
  let score = 100;

  // Deduct points for issues
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const warningIssues = issues.filter(i => i.severity === 'warning').length;
  
  score -= criticalIssues * 20;
  score -= warningIssues * 10;

  // Bonus points for good practices
  if (crawlData.indexablePages > 0) {
    const indexabilityRatio = crawlData.indexablePages / crawlData.totalPagesCrawled;
    if (indexabilityRatio > 0.8) score += 5;
  }

  if (duplicateContent.canonicalIssues.selfCanonical.length > 0) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}