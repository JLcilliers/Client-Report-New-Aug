/**
 * Test Script for Comprehensive Technical SEO Audit
 *
 * This script tests the comprehensive technical SEO audit functionality
 * Run with: node scripts/test-comprehensive-audit.js
 */

const fetch = require('node-fetch');

// Test configuration
const TEST_URLS = [
  'https://searchsignal.online',
  'https://example.com',
  'https://google.com'
];

const API_BASE = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

/**
 * Test the comprehensive technical audit API
 */
async function testComprehensiveAudit(url) {
  console.log(`\n🔍 Testing comprehensive audit for: ${url}`);
  console.log('=' + '='.repeat(60));

  try {
    const startTime = Date.now();

    // Call the comprehensive technical audit API
    const response = await fetch(`${API_BASE}/api/seo/comprehensive-tech-audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        options: {
          maxCrawlPages: 10, // Limit for testing
          timeout: 30000
        }
      })
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Audit failed');
    }

    const audit = result.audit;

    console.log(`✅ Audit completed in ${duration}ms`);
    console.log(`📊 Overall Score: ${audit.overallScore}/100 (Grade: ${audit.summary.grade})`);

    // Summary stats
    console.log(`📈 Summary:`);
    console.log(`   - Passed: ${audit.summary.passed} checks`);
    console.log(`   - Warnings: ${audit.summary.warnings} issues`);
    console.log(`   - Critical: ${audit.summary.critical} failures`);
    console.log(`   - Total: ${audit.summary.totalChecks} checks`);

    // Category breakdown
    console.log(`\n📋 Category Breakdown:`);
    Object.entries(audit.categories).forEach(([category, data]) => {
      const status = data.status === 'pass' ? '✅' :
                     data.status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${status} ${formatCategoryName(category)}: ${data.score}/100`);
    });

    // Core Web Vitals
    if (audit.detailedResults.coreWebVitals) {
      console.log(`\n⚡ Core Web Vitals:`);
      const mobile = audit.detailedResults.coreWebVitals.mobile;
      const desktop = audit.detailedResults.coreWebVitals.desktop;

      console.log(`   📱 Mobile: ${mobile.overallGrade}`);
      console.log(`      - LCP: ${mobile.lcp.value}ms (${mobile.lcp.grade})`);
      console.log(`      - INP: ${mobile.inp.value}ms (${mobile.inp.grade})`);
      console.log(`      - CLS: ${mobile.cls.value} (${mobile.cls.grade})`);

      console.log(`   🖥️  Desktop: ${desktop.overallGrade}`);
      console.log(`      - LCP: ${desktop.lcp.value}ms (${desktop.lcp.grade})`);
      console.log(`      - INP: ${desktop.inp.value}ms (${desktop.inp.grade})`);
      console.log(`      - CLS: ${desktop.cls.value} (${desktop.cls.grade})`);
    }

    // Top recommendations
    console.log(`\n🔧 Top 5 Recommendations:`);
    audit.recommendations.slice(0, 5).forEach((rec, index) => {
      const priority = rec.priority === 'critical' ? '🚨' :
                      rec.priority === 'high' ? '🔴' :
                      rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${index + 1}. ${priority} ${rec.title} (${rec.priority})`);
      console.log(`      Issue: ${rec.issue}`);
      console.log(`      Solution: ${rec.recommendation}`);
    });

    // Crawlability results
    if (audit.detailedResults.crawlability) {
      console.log(`\n🕷️  Crawlability:`);
      const crawl = audit.detailedResults.crawlability;
      console.log(`   - Robots.txt: ${crawl.robotsTxt.exists ? '✅ Found' : '❌ Missing'}`);
      console.log(`   - XML Sitemap: ${crawl.xmlSitemap.exists ? `✅ Found (${crawl.xmlSitemap.urlCount} URLs)` : '❌ Missing'}`);
      console.log(`   - Canonical: ${crawl.canonicalTags.present ? '✅ Present' : '❌ Missing'}`);
    }

    // Security results
    if (audit.detailedResults.security) {
      console.log(`\n🔒 Security:`);
      const security = audit.detailedResults.security;
      console.log(`   - HTTPS: ${security.https.implemented ? `✅ Enabled (${security.https.grade})` : '❌ Missing'}`);
      console.log(`   - HSTS: ${security.headers.hsts.present ? '✅ Enabled' : '❌ Missing'}`);
      console.log(`   - CSP: ${security.headers.csp.present ? '✅ Present' : '❌ Missing'}`);
    }

    console.log(`\n💾 Audit ID: ${result.metadata.auditId}`);

    return {
      success: true,
      auditId: result.metadata.auditId,
      score: audit.overallScore,
      grade: audit.summary.grade,
      duration,
      url
    };

  } catch (error) {
    console.error(`❌ Audit failed:`, error.message);
    return {
      success: false,
      error: error.message,
      url
    };
  }
}

/**
 * Test getting an existing audit
 */
async function testGetAudit(auditId) {
  console.log(`\n📖 Testing get audit: ${auditId}`);
  console.log('-'.repeat(50));

  try {
    const response = await fetch(`${API_BASE}/api/seo/comprehensive-tech-audit?auditId=${auditId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get audit');
    }

    console.log(`✅ Retrieved audit for: ${result.audit.url}`);
    console.log(`📊 Score: ${result.audit.overallScore}/100`);
    console.log(`📅 Created: ${new Date(result.audit.timestamp).toLocaleString()}`);

    return { success: true };
  } catch (error) {
    console.error(`❌ Get audit failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Format category names for display
 */
function formatCategoryName(category) {
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Comprehensive Technical SEO Audit Tests');
  console.log('=' + '='.repeat(70));

  const results = [];

  // Test each URL
  for (const url of TEST_URLS) {
    const result = await testGetAudit(url);
    results.push(result);

    // Add delay between tests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test getting an audit (if we have successful ones)
  const successfulAudits = results.filter(r => r.success && r.auditId);
  if (successfulAudits.length > 0) {
    await testGetAudit(successfulAudits[0].auditId);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful audits: ${successful.length}/${results.length}`);
  console.log(`❌ Failed audits: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log(`\n🏆 Top Scores:`);
    successful
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.url}: ${result.score}/100 (${result.grade}) - ${result.duration}ms`);
      });
  }

  if (failed.length > 0) {
    console.log(`\n⚠️  Failed URLs:`);
    failed.forEach(result => {
      console.log(`   - ${result.url}: ${result.error}`);
    });
  }

  console.log('\n✨ Testing completed!');
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testComprehensiveAudit,
  testGetAudit,
  runTests
};