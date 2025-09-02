import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface StructuredDataAnalysis {
  url: string;
  hasStructuredData: boolean;
  formats: {
    jsonLd: boolean;
    microdata: boolean;
    rdfa: boolean;
  };
  schemas: {
    type: string;
    properties: Record<string, any>;
    issues: string[];
    recommendations: string[];
  }[];
  richResultsEligible: {
    article: boolean;
    breadcrumb: boolean;
    faq: boolean;
    howTo: boolean;
    localBusiness: boolean;
    product: boolean;
    recipe: boolean;
    review: boolean;
    video: boolean;
  };
  issues: string[];
  recommendations: string[];
  validationErrors: string[];
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
    const analysis = analyzeStructuredData(html, targetUrl);

    // Optionally validate with Google's Rich Results Test API
    // This would require additional setup and API key

    return NextResponse.json(analysis);
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to analyze structured data' },
      { status: 500 }
    );
  }
}

function analyzeStructuredData(html: string, url: string): StructuredDataAnalysis {
  const $ = cheerio.load(html);
  const issues: string[] = [];
  const recommendations: string[] = [];
  const validationErrors: string[] = [];
  const schemas: StructuredDataAnalysis['schemas'] = [];

  // Check for JSON-LD
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const hasJsonLd = jsonLdScripts.length > 0;

  jsonLdScripts.each((_, element) => {
    try {
      const content = $(element).html();
      if (!content) return;

      const data = JSON.parse(content);
      const analyzed = analyzeSchema(data);
      schemas.push(analyzed);
    } catch (error) {
      validationErrors.push('Invalid JSON-LD syntax found');
    }
  });

  // Check for Microdata
  const hasMicrodata = $('[itemscope]').length > 0;
  if (hasMicrodata) {
    $('[itemscope]').each((_, element) => {
      const itemtype = $(element).attr('itemtype');
      const properties: Record<string, any> = {};
      
      $(element).find('[itemprop]').each((_, prop) => {
        const propName = $(prop).attr('itemprop');
        const propValue = $(prop).attr('content') || $(prop).text();
        if (propName) {
          properties[propName] = propValue;
        }
      });

      if (itemtype) {
        schemas.push({
          type: itemtype.split('/').pop() || 'Unknown',
          properties,
          issues: [],
          recommendations: []
        });
      }
    });
  }

  // Check for RDFa
  const hasRdfa = $('[typeof]').length > 0 || $('[property]').length > 0;

  // Determine rich results eligibility
  const richResultsEligible = {
    article: schemas.some(s => ['Article', 'NewsArticle', 'BlogPosting'].includes(s.type)),
    breadcrumb: schemas.some(s => s.type === 'BreadcrumbList'),
    faq: schemas.some(s => s.type === 'FAQPage'),
    howTo: schemas.some(s => s.type === 'HowTo'),
    localBusiness: schemas.some(s => s.type === 'LocalBusiness' || s.type.includes('Business')),
    product: schemas.some(s => s.type === 'Product'),
    recipe: schemas.some(s => s.type === 'Recipe'),
    review: schemas.some(s => s.type === 'Review' || s.type === 'AggregateRating'),
    video: schemas.some(s => s.type === 'VideoObject')
  };

  // General analysis
  if (!hasJsonLd && !hasMicrodata && !hasRdfa) {
    issues.push('No structured data found on the page');
    recommendations.push('Add JSON-LD structured data for better search visibility');
    recommendations.push('Consider implementing Schema.org markup');
  } else {
    if (!hasJsonLd) {
      recommendations.push('Consider using JSON-LD format (recommended by Google)');
    }
  }

  // Schema-specific recommendations
  const hasOrganization = schemas.some(s => s.type === 'Organization');
  const hasWebSite = schemas.some(s => s.type === 'WebSite');
  const hasWebPage = schemas.some(s => s.type === 'WebPage');

  if (!hasOrganization) {
    recommendations.push('Add Organization schema for brand visibility');
  }

  if (!hasWebSite) {
    recommendations.push('Add WebSite schema with SearchAction for sitelinks search box');
  }

  // Check for common schema issues
  schemas.forEach(schema => {
    // Check required properties based on schema type
    checkRequiredProperties(schema);
  });

  return {
    url,
    hasStructuredData: hasJsonLd || hasMicrodata || hasRdfa,
    formats: {
      jsonLd: hasJsonLd,
      microdata: hasMicrodata,
      rdfa: hasRdfa
    },
    schemas,
    richResultsEligible,
    issues,
    recommendations,
    validationErrors
  };
}

function analyzeSchema(data: any): StructuredDataAnalysis['schemas'][0] {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Handle arrays of schemas
  if (Array.isArray(data)) {
    data = data[0]; // Analyze first schema in array
  }

  const type = data['@type'] || 'Unknown';
  const properties = { ...data };
  delete properties['@context'];
  delete properties['@type'];

  // Type-specific validation
  switch (type) {
    case 'Article':
    case 'NewsArticle':
    case 'BlogPosting':
      if (!properties.headline) issues.push('Missing headline property');
      if (!properties.author) issues.push('Missing author property');
      if (!properties.datePublished) issues.push('Missing datePublished property');
      if (!properties.image) recommendations.push('Add image property for rich results');
      break;

    case 'Product':
      if (!properties.name) issues.push('Missing product name');
      if (!properties.offers) issues.push('Missing offers property');
      if (!properties.aggregateRating) recommendations.push('Add aggregateRating for review stars');
      if (!properties.image) issues.push('Missing product image');
      break;

    case 'LocalBusiness':
      if (!properties.name) issues.push('Missing business name');
      if (!properties.address) issues.push('Missing address property');
      if (!properties.telephone) recommendations.push('Add telephone number');
      if (!properties.openingHoursSpecification) recommendations.push('Add opening hours');
      break;

    case 'FAQPage':
      if (!properties.mainEntity || !Array.isArray(properties.mainEntity)) {
        issues.push('FAQPage requires mainEntity array with questions');
      }
      break;

    case 'BreadcrumbList':
      if (!properties.itemListElement || !Array.isArray(properties.itemListElement)) {
        issues.push('BreadcrumbList requires itemListElement array');
      }
      break;

    case 'Organization':
      if (!properties.name) issues.push('Missing organization name');
      if (!properties.url) issues.push('Missing organization URL');
      if (!properties.logo) recommendations.push('Add logo for brand visibility');
      if (!properties.sameAs) recommendations.push('Add sameAs with social media profiles');
      break;

    case 'WebSite':
      if (!properties.url) issues.push('Missing website URL');
      if (!properties.potentialAction) {
        recommendations.push('Add SearchAction for sitelinks search box');
      }
      break;
  }

  return {
    type,
    properties,
    issues,
    recommendations
  };
}

function checkRequiredProperties(schema: StructuredDataAnalysis['schemas'][0]) {
  // This function checks for required properties based on Google's guidelines
  // You can expand this based on specific requirements
  
  const requiredByType: Record<string, string[]> = {
    Article: ['headline', 'author', 'datePublished'],
    Product: ['name', 'image'],
    LocalBusiness: ['name', 'address'],
    Recipe: ['name', 'recipeIngredient', 'recipeInstructions'],
    Event: ['name', 'startDate', 'location'],
    JobPosting: ['title', 'description', 'datePosted', 'hiringOrganization'],
    Course: ['name', 'description', 'provider']
  };

  const required = requiredByType[schema.type];
  if (required) {
    required.forEach(prop => {
      if (!schema.properties[prop]) {
        schema.issues.push(`Missing required property: ${prop}`);
      }
    });
  }
}