import { NextRequest, NextResponse } from 'next/server';

interface SitemapAnalysis {
  exists: boolean;
  url: string;
  format: 'xml' | 'index' | 'not-found';
  urlCount: number;
  sitemaps?: string[];
  urls?: {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
  }[];
  issues: string[];
  recommendations: string[];
  stats: {
    totalUrls: number;
    withLastmod: number;
    withChangefreq: number;
    withPriority: number;
    averagePriority?: number;
    oldestLastmod?: string;
    newestLastmod?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    
    // Try common sitemap locations
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
            const analysis = await analyzeSitemap(text, sitemapUrl);
            return NextResponse.json(analysis);
          }
        }
      } catch (error) {
        continue; // Try next URL
      }
    }

    // No sitemap found
    return NextResponse.json({
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
    } as SitemapAnalysis);

  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to analyze sitemap' },
      { status: 500 }
    );
  }
}

async function analyzeSitemap(xml: string, url: string): Promise<SitemapAnalysis> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check if it's a sitemap index
  const isSitemapIndex = xml.includes('<sitemapindex');
  
  if (isSitemapIndex) {
    // Parse sitemap index
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

  // Parse regular sitemap
  const urls: SitemapAnalysis['urls'] = [];
  const urlMatches = Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/gi));
  
  let withLastmod = 0;
  let withChangefreq = 0;
  let withPriority = 0;
  let totalPriority = 0;
  let oldestDate: Date | null = null;
  let newestDate: Date | null = null;

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
      
      const date = new Date(lastmodMatch[1]);
      if (!oldestDate || date < oldestDate) oldestDate = date;
      if (!newestDate || date > newestDate) newestDate = date;
    }

    if (changefreqMatch) {
      urlEntry.changefreq = changefreqMatch[1];
      withChangefreq++;
    }

    if (priorityMatch) {
      urlEntry.priority = priorityMatch[1];
      withPriority++;
      totalPriority += parseFloat(priorityMatch[1]);
    }

    urls.push(urlEntry);
  }

  // Analysis
  if (urls.length === 0) {
    issues.push('Sitemap contains no URLs');
  } else if (urls.length > 50000) {
    issues.push(`Sitemap contains ${urls.length} URLs (max recommended: 50,000)`);
    recommendations.push('Split sitemap into multiple files');
  }

  if (withLastmod < urls.length * 0.5) {
    recommendations.push('Add lastmod dates to more URLs for better crawl prioritization');
  }

  if (withPriority === 0) {
    recommendations.push('Consider adding priority values to important pages');
  }

  const fileSizeKb = new Blob([xml]).size / 1024;
  if (fileSizeKb > 50000) {
    issues.push(`Sitemap is ${Math.round(fileSizeKb)}KB (max: 50MB uncompressed)`);
  }

  // Check for duplicate URLs
  const uniqueUrls = new Set(urls.map(u => u.loc));
  if (uniqueUrls.size < urls.length) {
    issues.push(`Found ${urls.length - uniqueUrls.size} duplicate URLs`);
  }

  return {
    exists: true,
    url,
    format: 'xml',
    urlCount: urls.length,
    urls: urls.slice(0, 100), // Return first 100 URLs
    issues,
    recommendations: recommendations.length > 0 ? recommendations : ['Sitemap is well configured'],
    stats: {
      totalUrls: urls.length,
      withLastmod,
      withChangefreq,
      withPriority,
      averagePriority: withPriority > 0 ? totalPriority / withPriority : undefined,
      oldestLastmod: oldestDate?.toISOString(),
      newestLastmod: newestDate?.toISOString()
    }
  };
}