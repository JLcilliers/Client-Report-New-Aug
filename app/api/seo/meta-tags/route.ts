import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface MetaTagsAnalysis {
  url: string;
  title: {
    content: string;
    length: number;
    issues: string[];
  };
  description: {
    content: string;
    length: number;
    issues: string[];
  };
  keywords?: string;
  canonical?: string;
  robots?: string;
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
    issues: string[];
  };
  twitter: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
    issues: string[];
  };
  viewport?: string;
  charset?: string;
  language?: string;
  structuredData: any[];
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    hierarchy_issues: string[];
  };
  images: {
    total: number;
    withoutAlt: number;
    issues: string[];
  };
  links: {
    internal: number;
    external: number;
    nofollow: number;
    issues: string[];
  };
  issues: string[];
  recommendations: string[];
  seoScore: number;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

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
    const analysis = analyzeMetaTags(html, targetUrl);

    return NextResponse.json(analysis);
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to analyze meta tags' },
      { status: 500 }
    );
  }
}

function analyzeMetaTags(html: string, url: string): MetaTagsAnalysis {
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

  // Other meta tags
  const keywords = $('meta[name="keywords"]').attr('content');
  const canonical = $('link[rel="canonical"]').attr('href');
  const robots = $('meta[name="robots"]').attr('content');
  const viewport = $('meta[name="viewport"]').attr('content');
  const charset = $('meta[charset]').attr('charset') || 
                 $('meta[http-equiv="Content-Type"]').attr('content');
  const language = $('html').attr('lang') || $('meta[name="language"]').attr('content');

  // Open Graph tags
  const openGraph = {
    title: $('meta[property="og:title"]').attr('content'),
    description: $('meta[property="og:description"]').attr('content'),
    image: $('meta[property="og:image"]').attr('content'),
    url: $('meta[property="og:url"]').attr('content'),
    type: $('meta[property="og:type"]').attr('content'),
    siteName: $('meta[property="og:site_name"]').attr('content'),
    issues: [] as string[]
  };

  if (!openGraph.title && !openGraph.description) {
    openGraph.issues.push('Missing Open Graph tags');
    recommendations.push('Add Open Graph tags for better social sharing');
    seoScore -= 5;
  }
  if (!openGraph.image) {
    openGraph.issues.push('No Open Graph image specified');
    seoScore -= 3;
  }

  // Twitter Card tags
  const twitter = {
    card: $('meta[name="twitter:card"]').attr('content'),
    title: $('meta[name="twitter:title"]').attr('content'),
    description: $('meta[name="twitter:description"]').attr('content'),
    image: $('meta[name="twitter:image"]').attr('content'),
    site: $('meta[name="twitter:site"]').attr('content'),
    creator: $('meta[name="twitter:creator"]').attr('content'),
    issues: [] as string[]
  };

  if (!twitter.card) {
    twitter.issues.push('No Twitter Card tags found');
    recommendations.push('Add Twitter Card tags for better Twitter sharing');
    seoScore -= 3;
  }

  // Structured data
  const structuredData: any[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const data = JSON.parse($(element).html() || '{}');
      structuredData.push(data);
    } catch (e) {
      issues.push('Invalid structured data found');
      seoScore -= 5;
    }
  });

  if (structuredData.length === 0) {
    recommendations.push('Add structured data (Schema.org) for rich snippets');
    seoScore -= 5;
  }

  // Headings analysis
  const headings = {
    h1: [] as string[],
    h2: [] as string[],
    h3: [] as string[],
    hierarchy_issues: [] as string[]
  };

  $('h1').each((_, el) => {
    headings.h1.push($(el).text().trim());
  });
  $('h2').each((_, el) => {
    headings.h2.push($(el).text().trim());
  });
  $('h3').each((_, el) => {
    headings.h3.push($(el).text().trim());
  });

  if (headings.h1.length === 0) {
    headings.hierarchy_issues.push('No H1 tag found');
    seoScore -= 10;
  } else if (headings.h1.length > 1) {
    headings.hierarchy_issues.push(`Multiple H1 tags found (${headings.h1.length})`);
    seoScore -= 5;
  }

  // Images analysis
  const images = {
    total: $('img').length,
    withoutAlt: 0,
    issues: [] as string[]
  };

  $('img').each((_, img) => {
    if (!$(img).attr('alt')) {
      images.withoutAlt++;
    }
  });

  if (images.withoutAlt > 0) {
    images.issues.push(`${images.withoutAlt} images without alt text`);
    seoScore -= Math.min(10, images.withoutAlt * 2);
  }

  // Links analysis
  const links = {
    internal: 0,
    external: 0,
    nofollow: 0,
    issues: [] as string[]
  };

  $('a[href]').each((_, link) => {
    const href = $(link).attr('href') || '';
    const rel = $(link).attr('rel') || '';
    
    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (href.includes(new URL(url).hostname)) {
        links.internal++;
      } else {
        links.external++;
      }
    } else if (href.startsWith('/') || href.startsWith('#')) {
      links.internal++;
    }
    
    if (rel.includes('nofollow')) {
      links.nofollow++;
    }
  });

  // Additional checks
  if (!canonical) {
    recommendations.push('Add canonical URL to prevent duplicate content issues');
    seoScore -= 3;
  }

  if (!viewport) {
    issues.push('No viewport meta tag found');
    recommendations.push('Add viewport meta tag for mobile responsiveness');
    seoScore -= 5;
  }

  if (!charset || (!charset.includes('utf-8') && !charset.includes('UTF-8'))) {
    issues.push('UTF-8 charset not specified');
    seoScore -= 3;
  }

  if (!language) {
    recommendations.push('Specify page language with lang attribute');
    seoScore -= 3;
  }

  // Ensure score doesn't go below 0
  seoScore = Math.max(0, seoScore);

  return {
    url,
    title: titleAnalysis,
    description: descriptionAnalysis,
    keywords,
    canonical,
    robots,
    openGraph,
    twitter,
    viewport,
    charset,
    language,
    structuredData,
    headings,
    images,
    links,
    issues,
    recommendations,
    seoScore
  };
}