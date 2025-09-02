import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ContentAnalysis {
  url: string;
  wordCount: number;
  readability: {
    score: number;
    level: string;
    sentenceLength: number;
    syllablesPerWord: number;
  };
  keywords: {
    word: string;
    count: number;
    density: number;
  }[];
  headings: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    totalCount: number;
    structure: string[];
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    largeImages: number;
    lazyLoaded: number;
  };
  links: {
    internal: number;
    external: number;
    broken: number;
    nofollow: number;
    dofollow: number;
  };
  contentQuality: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  performance: {
    htmlSize: number;
    loadTime?: number;
    recommendations: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url, targetKeywords = [] } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const startTime = Date.now();

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Reporter/1.0)'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch page' },
        { status: response.status }
      );
    }

    const html = await response.text();
    const loadTime = Date.now() - startTime;
    
    const analysis = await analyzeContent(html, targetUrl, targetKeywords, loadTime);

    return NextResponse.json(analysis);
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

async function analyzeContent(
  html: string, 
  url: string, 
  targetKeywords: string[],
  loadTime: number
): Promise<ContentAnalysis> {
  const $ = cheerio.load(html);
  
  // Remove script and style content for text analysis
  $('script, style').remove();
  
  // Get page text
  const bodyText = $('body').text();
  const cleanText = bodyText.replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ').filter(word => word.length > 0);
  const wordCount = words.length;

  // Calculate readability
  const readability = calculateReadability(cleanText);

  // Analyze keywords
  const keywords = analyzeKeywords(cleanText, targetKeywords);

  // Analyze headings
  const headings = analyzeHeadings($);

  // Analyze images
  const images = analyzeImages($);

  // Analyze links
  const links = await analyzeLinks($, url);

  // Content quality assessment
  const contentQuality = assessContentQuality(
    wordCount,
    readability,
    headings,
    images,
    links,
    keywords,
    targetKeywords
  );

  // Performance metrics
  const htmlSize = new Blob([html]).size;
  const performance = {
    htmlSize,
    loadTime,
    recommendations: [] as string[]
  };

  if (htmlSize > 100000) {
    performance.recommendations.push('HTML size is large - consider optimization');
  }
  if (loadTime > 3000) {
    performance.recommendations.push('Page load time is slow - optimize performance');
  }

  return {
    url,
    wordCount,
    readability,
    keywords: keywords.slice(0, 20), // Top 20 keywords
    headings,
    images,
    links,
    contentQuality,
    performance
  };
}

function calculateReadability(text: string): ContentAnalysis['readability'] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  
  // Simple syllable estimation (not perfect but good enough)
  const totalSyllables = words.reduce((sum, word) => {
    return sum + countSyllables(word);
  }, 0);
  
  const avgSyllablesPerWord = words.length > 0 ? totalSyllables / words.length : 0;
  
  // Flesch Reading Ease score
  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  
  let level = 'Very Easy';
  if (score < 30) level = 'Very Difficult';
  else if (score < 50) level = 'Difficult';
  else if (score < 60) level = 'Fairly Difficult';
  else if (score < 70) level = 'Standard';
  else if (score < 80) level = 'Fairly Easy';
  else if (score < 90) level = 'Easy';

  return {
    score: Math.max(0, Math.min(100, score)),
    level,
    sentenceLength: Math.round(avgSentenceLength),
    syllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  let count = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = 'aeiou'.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  // Adjust for silent e
  if (word.endsWith('e')) {
    count--;
  }
  
  // Ensure at least one syllable
  return Math.max(1, count);
}

function analyzeKeywords(text: string, targetKeywords: string[]): ContentAnalysis['keywords'] {
  const words = text.toLowerCase().split(/\W+/).filter(word => 
    word.length > 3 && !isStopWord(word)
  );
  
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const totalWords = words.length;
  
  return Object.entries(wordFreq)
    .map(([word, count]) => ({
      word,
      count,
      density: (count / totalWords) * 100
    }))
    .sort((a, b) => b.count - a.count);
}

function isStopWord(word: string): boolean {
  const stopWords = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
    'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
    'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
    'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
    'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
    'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when'
  ];
  return stopWords.includes(word.toLowerCase());
}

function analyzeHeadings($: cheerio.CheerioAPI): ContentAnalysis['headings'] {
  const structure: string[] = [];
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = el.tagName.toUpperCase();
    const text = $(el).text().trim().substring(0, 50);
    structure.push(`${tag}: ${text}`);
  });
  
  return {
    h1Count,
    h2Count,
    h3Count,
    totalCount: structure.length,
    structure: structure.slice(0, 20) // First 20 headings
  };
}

function analyzeImages($: cheerio.CheerioAPI): ContentAnalysis['images'] {
  let withAlt = 0;
  let withoutAlt = 0;
  let largeImages = 0;
  let lazyLoaded = 0;
  
  $('img').each((_, img) => {
    const alt = $(img).attr('alt');
    if (alt && alt.trim()) {
      withAlt++;
    } else {
      withoutAlt++;
    }
    
    const width = $(img).attr('width');
    if (width && parseInt(width) > 1200) {
      largeImages++;
    }
    
    const loading = $(img).attr('loading');
    if (loading === 'lazy') {
      lazyLoaded++;
    }
  });
  
  return {
    total: withAlt + withoutAlt,
    withAlt,
    withoutAlt,
    largeImages,
    lazyLoaded
  };
}

async function analyzeLinks($: cheerio.CheerioAPI, pageUrl: string): Promise<ContentAnalysis['links']> {
  let internal = 0;
  let external = 0;
  let nofollow = 0;
  let dofollow = 0;
  const brokenUrls: string[] = [];
  
  const pageHost = new URL(pageUrl).hostname;
  
  $('a[href]').each((_, link) => {
    const href = $(link).attr('href') || '';
    const rel = $(link).attr('rel') || '';
    
    if (rel.includes('nofollow')) {
      nofollow++;
    } else {
      dofollow++;
    }
    
    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const linkHost = new URL(href).hostname;
        if (linkHost === pageHost) {
          internal++;
        } else {
          external++;
        }
      } else if (href.startsWith('/') || href.startsWith('#')) {
        internal++;
      }
    } catch (e) {
      // Invalid URL
    }
  });
  
  return {
    internal,
    external,
    broken: brokenUrls.length,
    nofollow,
    dofollow
  };
}

function assessContentQuality(
  wordCount: number,
  readability: ContentAnalysis['readability'],
  headings: ContentAnalysis['headings'],
  images: ContentAnalysis['images'],
  links: ContentAnalysis['links'],
  keywords: ContentAnalysis['keywords'],
  targetKeywords: string[]
): ContentAnalysis['contentQuality'] {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  
  // Word count assessment
  if (wordCount < 300) {
    issues.push('Content is too short (less than 300 words)');
    recommendations.push('Add more comprehensive content');
    score -= 20;
  } else if (wordCount < 600) {
    recommendations.push('Consider expanding content for better SEO');
    score -= 10;
  }
  
  // Readability assessment
  if (readability.score < 30) {
    issues.push('Content is very difficult to read');
    recommendations.push('Simplify sentences and use common words');
    score -= 15;
  } else if (readability.score < 60) {
    recommendations.push('Improve readability for better user experience');
    score -= 5;
  }
  
  // Heading assessment
  if (headings.h1Count === 0) {
    issues.push('No H1 heading found');
    score -= 10;
  } else if (headings.h1Count > 1) {
    issues.push('Multiple H1 headings found');
    score -= 5;
  }
  
  if (headings.totalCount === 0) {
    issues.push('No headings found');
    recommendations.push('Add headings to structure content');
    score -= 10;
  }
  
  // Image assessment
  if (images.total === 0 && wordCount > 500) {
    recommendations.push('Add images to improve engagement');
    score -= 5;
  }
  
  if (images.withoutAlt > 0) {
    issues.push(`${images.withoutAlt} images missing alt text`);
    score -= Math.min(10, images.withoutAlt * 2);
  }
  
  // Keyword optimization
  if (targetKeywords.length > 0) {
    const foundKeywords = targetKeywords.filter(kw => 
      keywords.some(k => k.word.includes(kw.toLowerCase()))
    );
    
    if (foundKeywords.length === 0) {
      issues.push('Target keywords not found in content');
      score -= 15;
    } else if (foundKeywords.length < targetKeywords.length / 2) {
      recommendations.push('Optimize content for more target keywords');
      score -= 5;
    }
  }
  
  // Link assessment
  if (links.internal === 0) {
    recommendations.push('Add internal links to improve site navigation');
    score -= 5;
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
}