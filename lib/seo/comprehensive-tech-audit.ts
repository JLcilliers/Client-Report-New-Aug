/**
 * Comprehensive Technical SEO Audit Service
 * Covers all critical 2025 SEO checklist items with specific thresholds and guidelines
 */

export interface TechnicalSEOAuditResult {
  url: string;
  domain: string;
  timestamp: string;
  overallScore: number;

  summary: {
    critical: number;
    warnings: number;
    passed: number;
    totalChecks: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };

  categories: {
    crawlabilityIndexability: AuditCategory;
    urlCanonicalization: AuditCategory;
    coreWebVitals: AuditCategory;
    mobileFirstParity: AuditCategory;
    structuredData: AuditCategory;
    securityHeaders: AuditCategory;
    internalLinking: AuditCategory;
    internationalization: AuditCategory;
    ecommerceFacets: AuditCategory;
    spamCompliance: AuditCategory;
  };

  detailedResults: {
    crawlability: CrawlabilityResults;
    canonicalization: CanonicalizationResults;
    coreWebVitals: CoreWebVitalsResults;
    mobileIndexing: MobileIndexingResults;
    structuredData: StructuredDataResults;
    security: SecurityResults;
    linkStructure: LinkStructureResults;
    internationalization: InternationalizationResults;
    ecommerce: EcommerceResults;
    spamChecks: SpamComplianceResults;
  };

  recommendations: SEORecommendation[];
}

export interface AuditCategory {
  score: number;
  checks: SEOCheck[];
  status: 'pass' | 'warning' | 'fail';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface SEOCheck {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: any;
  threshold?: string;
  actualValue?: string | number;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface SEORecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  issue: string;
  recommendation: string;
  impact: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  technicalComplexity: 'low' | 'medium' | 'high';
  businessImpact: 'low' | 'medium' | 'high';
}

// Individual audit result interfaces
export interface CrawlabilityResults {
  robotsTxt: {
    exists: boolean;
    accessible: boolean;
    valid: boolean;
    size: number;
    rules: any[];
    sitemapReferences: string[];
    issues: string[];
    blockingRules: string[];
  };
  xmlSitemap: {
    exists: boolean;
    accessible: boolean;
    valid: boolean;
    urlCount: number;
    lastModified: string;
    compression: boolean;
    errors: string[];
    coverage: number; // percentage of site pages covered
  };
  metaRobots: {
    noindex: boolean;
    nofollow: boolean;
    noarchive: boolean;
    nosnippet: boolean;
    maxImagePreview: string;
    maxSnippet: string;
    maxVideoPreview: string;
  };
  canonicalTags: {
    present: boolean;
    valid: boolean;
    selfReferencing: boolean;
    issues: string[];
  };
}

export interface CanonicalizationResults {
  canonical: {
    present: boolean;
    valid: boolean;
    selfReferencing: boolean;
    httpVsHttps: 'consistent' | 'mixed';
    wwwVsNonWww: 'consistent' | 'mixed';
    trailingSlash: 'consistent' | 'mixed';
  };
  redirects: {
    httpToHttps: boolean;
    wwwRedirect: 'www_to_non_www' | 'non_www_to_www' | 'none' | 'both';
    redirectChains: number;
    redirectLoops: boolean;
    status: number[];
  };
  duplicateContent: {
    urlVariations: string[];
    parameterHandling: 'good' | 'needs_improvement';
    caseVariations: boolean;
  };
}

export interface CoreWebVitalsResults {
  mobile: {
    lcp: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: '≤2.5s' };
    inp: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: '≤200ms' };
    cls: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: '≤0.1' };
    overallGrade: 'good' | 'needs-improvement' | 'poor';
  };
  desktop: {
    lcp: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: '≤2.5s' };
    inp: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: '≤200ms' };
    cls: { value: number; grade: 'good' | 'needs-improvement' | 'poor'; threshold: '≤0.1' };
    overallGrade: 'good' | 'needs-improvement' | 'poor';
  };
  fieldData: boolean; // Whether real user data is available
  labData: boolean; // Whether lab data is available
}

export interface MobileIndexingResults {
  viewport: {
    present: boolean;
    valid: boolean;
    content: string;
  };
  mobileFriendly: {
    score: number;
    issues: string[];
    blocked: boolean;
  };
  contentParity: {
    textParity: number; // percentage
    imageParity: number; // percentage
    linkParity: number; // percentage
    structuredDataParity: number; // percentage
  };
  loading: {
    aboveFoldTime: number;
    totalLoadTime: number;
    criticalResourceBlocking: boolean;
  };
}

export interface StructuredDataResults {
  jsonLd: {
    present: boolean;
    valid: boolean;
    schemas: string[];
    errors: string[];
  };
  microdata: {
    present: boolean;
    schemas: string[];
  };
  rdfa: {
    present: boolean;
    schemas: string[];
  };
  richResults: {
    eligible: string[];
    implemented: string[];
    testing: {
      valid: boolean;
      warnings: string[];
      errors: string[];
    };
  };
}

export interface SecurityResults {
  https: {
    implemented: boolean;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    certificate: {
      valid: boolean;
      issuer: string;
      expiryDays: number;
    };
    mixedContent: boolean;
  };
  headers: {
    hsts: { present: boolean; maxAge: number; includeSubdomains: boolean };
    csp: { present: boolean; valid: boolean; directives: string[] };
    xFrameOptions: { present: boolean; value: string };
    xContentTypeOptions: { present: boolean };
    referrerPolicy: { present: boolean; value: string };
    permissionsPolicy: { present: boolean; directives: string[] };
  };
}

export interface LinkStructureResults {
  internal: {
    totalLinks: number;
    uniquePages: number;
    orphanedPages: number;
    deepLevel: number; // max clicks from homepage
    brokenLinks: number;
    noFollowPercentage: number;
  };
  external: {
    totalLinks: number;
    domains: number;
    noFollowPercentage: number;
    brokenLinks: number;
    suspiciousLinks: number;
  };
  anchor: {
    overOptimization: boolean;
    genericAnchors: number;
    exactMatchPercentage: number;
  };
}

export interface InternationalizationResults {
  hreflang: {
    implemented: boolean;
    valid: boolean;
    languages: string[];
    regions: string[];
    xDefault: boolean;
    bidirectional: boolean;
    errors: string[];
  };
  language: {
    htmlLang: string;
    contentLanguage: string;
    consistent: boolean;
  };
  geographic: {
    targeting: string;
    currency: string;
    timezone: string;
  };
}

export interface EcommerceResults {
  facetedNavigation: {
    implemented: boolean;
    indexable: boolean;
    parameterHandling: 'good' | 'needs_improvement' | 'poor';
    noindexUsage: boolean;
  };
  pagination: {
    relNextPrev: boolean;
    canonicalization: 'view_all' | 'page_1' | 'self_referencing';
    loadMore: boolean;
    infiniteScroll: boolean;
  };
  products: {
    structuredData: boolean;
    reviews: boolean;
    availability: boolean;
    pricing: boolean;
    images: boolean;
  };
  categories: {
    breadcrumbs: boolean;
    structuredData: boolean;
    descriptions: boolean;
  };
}

export interface SpamComplianceResults {
  content: {
    thin: boolean;
    duplicate: number; // percentage
    keyword: {
      stuffing: boolean;
      density: number;
      natural: boolean;
    };
    readability: {
      grade: number;
      score: number;
    };
  };
  links: {
    quality: 'good' | 'suspicious' | 'poor';
    paidLinks: number;
    unnaturalPatterns: boolean;
    linkFarms: boolean;
  };
  technical: {
    cloaking: boolean;
    redirect: {
      malicious: boolean;
      sneaky: boolean;
    };
    hiddenContent: boolean;
  };
  user: {
    experience: {
      intrusive: boolean;
      mobile: {
        popups: boolean;
        interstitials: boolean;
      };
    };
  };
}

/**
 * Core Web Vitals thresholds based on Google's 2025 guidelines
 */
export const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: {
    GOOD: 2500, // ≤2.5 seconds
    NEEDS_IMPROVEMENT: 4000, // 2.5-4.0 seconds
    // >4.0 seconds is poor
  },
  INP: {
    GOOD: 200, // ≤200 milliseconds
    NEEDS_IMPROVEMENT: 500, // 200-500 milliseconds
    // >500 milliseconds is poor
  },
  CLS: {
    GOOD: 0.1, // ≤0.1
    NEEDS_IMPROVEMENT: 0.25, // 0.1-0.25
    // >0.25 is poor
  }
} as const;

/**
 * SEO audit scoring weights by category importance
 */
export const AUDIT_WEIGHTS = {
  crawlabilityIndexability: 0.20, // 20% - Critical for discoverability
  urlCanonicalization: 0.15,     // 15% - Important for duplicate content
  coreWebVitals: 0.15,          // 15% - Major ranking factor
  mobileFirstParity: 0.12,       // 12% - Mobile-first indexing
  structuredData: 0.10,          // 10% - Rich results opportunity
  securityHeaders: 0.08,         // 8% - Trust and security
  internalLinking: 0.08,         // 8% - Site authority distribution
  internationalization: 0.05,    // 5% - Global reach (if applicable)
  ecommerceFacets: 0.04,        // 4% - E-commerce specific (if applicable)
  spamCompliance: 0.03          // 3% - Penalty avoidance
} as const;

/**
 * Grade calculation based on overall score
 */
export const GRADE_THRESHOLDS = {
  A: 90, // Excellent (90-100)
  B: 80, // Good (80-89)
  C: 70, // Average (70-79)
  D: 60, // Poor (60-69)
  F: 0   // Failing (<60)
} as const;

/**
 * Calculates the overall audit grade based on score
 */
export function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  if (score >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
}

/**
 * Determines the impact level based on the check status and category
 */
export function getImpactLevel(category: string, status: 'pass' | 'warning' | 'fail'): 'low' | 'medium' | 'high' | 'critical' {
  const criticalCategories = ['crawlabilityIndexability', 'coreWebVitals', 'securityHeaders'];
  const highCategories = ['urlCanonicalization', 'mobileFirstParity', 'structuredData'];

  if (status === 'fail') {
    if (criticalCategories.includes(category)) return 'critical';
    if (highCategories.includes(category)) return 'high';
    return 'medium';
  }

  if (status === 'warning') {
    if (criticalCategories.includes(category)) return 'high';
    if (highCategories.includes(category)) return 'medium';
    return 'low';
  }

  return 'low'; // pass
}

/**
 * Core Web Vitals metric evaluation
 */
export function evaluateCoreWebVital(metric: 'lcp' | 'inp' | 'cls', value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (metric) {
    case 'lcp':
      if (value <= CORE_WEB_VITALS_THRESHOLDS.LCP.GOOD) return 'good';
      if (value <= CORE_WEB_VITALS_THRESHOLDS.LCP.NEEDS_IMPROVEMENT) return 'needs-improvement';
      return 'poor';

    case 'inp':
      if (value <= CORE_WEB_VITALS_THRESHOLDS.INP.GOOD) return 'good';
      if (value <= CORE_WEB_VITALS_THRESHOLDS.INP.NEEDS_IMPROVEMENT) return 'needs-improvement';
      return 'poor';

    case 'cls':
      if (value <= CORE_WEB_VITALS_THRESHOLDS.CLS.GOOD) return 'good';
      if (value <= CORE_WEB_VITALS_THRESHOLDS.CLS.NEEDS_IMPROVEMENT) return 'needs-improvement';
      return 'poor';

    default:
      return 'poor';
  }
}