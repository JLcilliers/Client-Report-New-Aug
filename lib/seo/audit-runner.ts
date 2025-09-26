/**
 * Audit Runner Utility
 * Provides easy-to-use functions for running comprehensive technical SEO audits
 */

import { TechnicalSEOAuditService } from './audit-service';
import { TechnicalSEOAuditResult } from './comprehensive-tech-audit';

export interface AuditOptions {
  /**
   * Maximum pages to crawl for internal linking analysis
   * Higher values provide more comprehensive results but take longer
   */
  maxCrawlPages?: number;

  /**
   * Timeout for individual audit checks in milliseconds
   */
  timeout?: number;

  /**
   * Whether to include resource-intensive checks
   */
  includeResourceIntensive?: boolean;

  /**
   * Priority focus areas for the audit
   */
  focusAreas?: Array<'crawlability' | 'performance' | 'mobile' | 'security' | 'content' | 'technical'>;
}

/**
 * Run a comprehensive technical SEO audit
 */
export async function runComprehensiveTechnicalAudit(
  url: string,
  options: AuditOptions = {}
): Promise<TechnicalSEOAuditResult> {
  console.log(`🚀 Starting comprehensive technical SEO audit for: ${url}`);
  console.log(`📋 Options:`, options);

  const startTime = Date.now();

  try {
    // Initialize audit service
    const auditService = new TechnicalSEOAuditService(url);

    // Run comprehensive audit
    const result = await auditService.runComprehensiveAudit();

    const duration = Date.now() - startTime;
    console.log(`✅ Audit completed in ${duration}ms`);
    console.log(`📊 Overall Score: ${result.overallScore}/100 (${result.summary.grade})`);
    console.log(`⚠️  Issues: ${result.summary.critical} critical, ${result.summary.warnings} warnings`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Audit failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Run a quick technical audit (essential checks only)
 */
export async function runQuickTechnicalAudit(url: string): Promise<Partial<TechnicalSEOAuditResult>> {
  console.log(`⚡ Starting quick technical SEO audit for: ${url}`);

  const startTime = Date.now();

  try {
    const auditService = new TechnicalSEOAuditService(url);

    // Run only essential audits
    const [crawlability, coreWebVitals, security] = await Promise.allSettled([
      auditService['auditCrawlabilityIndexability'](),
      auditService['auditCoreWebVitals'](),
      auditService['auditSecurityHeaders']()
    ]);

    const duration = Date.now() - startTime;
    console.log(`✅ Quick audit completed in ${duration}ms`);

    return {
      url,
      domain: new URL(url).hostname,
      timestamp: new Date().toISOString(),
      detailedResults: {
        crawlability: crawlability.status === 'fulfilled' ? crawlability.value : null,
        coreWebVitals: coreWebVitals.status === 'fulfilled' ? coreWebVitals.value : null,
        security: security.status === 'fulfilled' ? security.value : null
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Quick audit failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get audit recommendations summary
 */
export function getAuditSummary(audit: TechnicalSEOAuditResult): {
  score: number;
  grade: string;
  topIssues: string[];
  quickWins: string[];
  technicalDebt: string[];
} {
  const topIssues = audit.recommendations
    .filter(r => r.priority === 'critical' || r.priority === 'high')
    .slice(0, 5)
    .map(r => r.title);

  const quickWins = audit.recommendations
    .filter(r => r.estimatedEffort === 'low' && r.technicalComplexity === 'low')
    .slice(0, 5)
    .map(r => r.title);

  const technicalDebt = audit.recommendations
    .filter(r => r.technicalComplexity === 'high')
    .slice(0, 5)
    .map(r => r.title);

  return {
    score: audit.overallScore,
    grade: audit.summary.grade,
    topIssues,
    quickWins,
    technicalDebt
  };
}

/**
 * Generate audit report summary
 */
export function generateAuditReport(audit: TechnicalSEOAuditResult): string {
  const summary = getAuditSummary(audit);

  const report = `
# Technical SEO Audit Report

**URL:** ${audit.url}
**Date:** ${new Date(audit.timestamp).toLocaleDateString()}
**Overall Score:** ${audit.overallScore}/100 (Grade: ${audit.summary.grade})

## Summary
- ✅ **Passed:** ${audit.summary.passed} checks
- ⚠️  **Warnings:** ${audit.summary.warnings} issues
- ❌ **Critical:** ${audit.summary.critical} failures
- 📊 **Total Checks:** ${audit.summary.totalChecks}

## Category Breakdown
${Object.entries(audit.categories).map(([category, data]) =>
  `- **${category.replace(/([A-Z])/g, ' $1').trim()}:** ${data.score}/100 (${data.status})`
).join('\n')}

## Core Web Vitals
- **Mobile:** ${audit.detailedResults.coreWebVitals?.mobile?.overallGrade || 'N/A'}
  - LCP: ${audit.detailedResults.coreWebVitals?.mobile?.lcp?.value || 'N/A'}ms
  - INP: ${audit.detailedResults.coreWebVitals?.mobile?.inp?.value || 'N/A'}ms
  - CLS: ${audit.detailedResults.coreWebVitals?.mobile?.cls?.value || 'N/A'}
- **Desktop:** ${audit.detailedResults.coreWebVitals?.desktop?.overallGrade || 'N/A'}

## Top Priority Issues
${summary.topIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

## Quick Wins (Low Effort)
${summary.quickWins.map((win, i) => `${i + 1}. ${win}`).join('\n')}

## Technical Recommendations
${audit.recommendations.slice(0, 10).map((rec, i) => `
${i + 1}. **${rec.title}** (${rec.priority} priority)
   - Issue: ${rec.issue}
   - Solution: ${rec.recommendation}
   - Impact: ${rec.impact}
`).join('\n')}

---
*Generated by Search Insights Hub - Technical SEO Audit Tool*
`;

  return report;
}

/**
 * Export audit data for external analysis
 */
export function exportAuditData(audit: TechnicalSEOAuditResult, format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(audit, null, 2);
  }

  if (format === 'csv') {
    const csvData = [
      ['Category', 'Check', 'Status', 'Score', 'Message', 'Impact'],
      ...Object.entries(audit.categories).flatMap(([category, categoryData]) =>
        categoryData.checks.map(check => [
          category,
          check.name,
          check.status,
          categoryData.score.toString(),
          check.message,
          check.impact
        ])
      )
    ];

    return csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  throw new Error(`Unsupported export format: ${format}`);
}

/**
 * Compare two audit results
 */
export function compareAudits(
  oldAudit: TechnicalSEOAuditResult,
  newAudit: TechnicalSEOAuditResult
): {
  scoreChange: number;
  improvedCategories: string[];
  declinedCategories: string[];
  newIssues: string[];
  resolvedIssues: string[];
} {
  const scoreChange = newAudit.overallScore - oldAudit.overallScore;

  const improvedCategories = Object.keys(newAudit.categories).filter(
    category =>
      newAudit.categories[category as keyof typeof newAudit.categories].score >
      oldAudit.categories[category as keyof typeof oldAudit.categories].score
  );

  const declinedCategories = Object.keys(newAudit.categories).filter(
    category =>
      newAudit.categories[category as keyof typeof newAudit.categories].score <
      oldAudit.categories[category as keyof typeof oldAudit.categories].score
  );

  const oldIssueIds = new Set(oldAudit.recommendations.map(r => r.id));
  const newIssueIds = new Set(newAudit.recommendations.map(r => r.id));

  const newIssues = newAudit.recommendations
    .filter(r => !oldIssueIds.has(r.id))
    .map(r => r.title);

  const resolvedIssues = oldAudit.recommendations
    .filter(r => !newIssueIds.has(r.id))
    .map(r => r.title);

  return {
    scoreChange,
    improvedCategories,
    declinedCategories,
    newIssues,
    resolvedIssues
  };
}