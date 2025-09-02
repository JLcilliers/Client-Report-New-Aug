import { NextRequest, NextResponse } from 'next/server';

interface RobotsAnalysis {
  exists: boolean;
  url: string;
  content?: string;
  rules: {
    userAgent: string;
    allow: string[];
    disallow: string[];
    crawlDelay?: number;
    sitemap?: string[];
  }[];
  sitemaps: string[];
  issues: string[];
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Ensure domain has protocol
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const robotsUrl = new URL('/robots.txt', url).href;

    try {
      const response = await fetch(robotsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Reporter/1.0)'
        }
      });

      if (!response.ok) {
        return NextResponse.json({
          exists: false,
          url: robotsUrl,
          issues: ['No robots.txt file found'],
          recommendations: [
            'Create a robots.txt file to control search engine crawling',
            'Include sitemap references in robots.txt',
            'Define crawl rules for different user agents'
          ]
        } as RobotsAnalysis);
      }

      const content = await response.text();
      const analysis = parseRobotsTxt(content, robotsUrl);

      return NextResponse.json(analysis);
    } catch (fetchError) {
      return NextResponse.json({
        exists: false,
        url: robotsUrl,
        issues: ['Failed to fetch robots.txt - site may be unreachable'],
        recommendations: ['Ensure website is accessible', 'Check server configuration']
      } as RobotsAnalysis);
    }
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to analyze robots.txt' },
      { status: 500 }
    );
  }
}

function parseRobotsTxt(content: string, url: string): RobotsAnalysis {
  const lines = content.split('\n').map(line => line.trim());
  const rules: RobotsAnalysis['rules'] = [];
  const sitemaps: string[] = [];
  const issues: string[] = [];
  const recommendations: string[] = [];

  let currentRule: RobotsAnalysis['rules'][0] | null = null;

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

      case 'crawl-delay':
        if (currentRule) {
          currentRule.crawlDelay = parseInt(value);
          if (currentRule.crawlDelay > 10) {
            issues.push(`High crawl delay (${currentRule.crawlDelay}s) may slow indexing`);
          }
        }
        break;

      case 'sitemap':
        sitemaps.push(value);
        if (!currentRule) {
          currentRule = { userAgent: '*', allow: [], disallow: [] };
        }
        if (!currentRule.sitemap) {
          currentRule.sitemap = [];
        }
        currentRule.sitemap.push(value);
        break;
    }
  }

  if (currentRule) {
    rules.push(currentRule);
  }

  // Analysis and recommendations
  if (rules.length === 0) {
    issues.push('No valid rules found in robots.txt');
    recommendations.push('Add User-agent and crawling directives');
  }

  if (sitemaps.length === 0) {
    recommendations.push('Add sitemap reference to robots.txt');
  }

  const hasGooglebot = rules.some(r => 
    r.userAgent.toLowerCase().includes('googlebot') || r.userAgent === '*'
  );
  if (!hasGooglebot) {
    recommendations.push('Consider adding specific Googlebot rules');
  }

  // Check for common issues
  const hasCSSJSBlocked = rules.some(r => 
    r.disallow.some(d => d.includes('.css') || d.includes('.js'))
  );
  if (hasCSSJSBlocked) {
    issues.push('CSS or JS files may be blocked - this can affect rendering');
  }

  return {
    exists: true,
    url,
    content: content.substring(0, 5000), // Limit content size
    rules,
    sitemaps,
    issues,
    recommendations: recommendations.length > 0 ? recommendations : ['Robots.txt is properly configured']
  };
}