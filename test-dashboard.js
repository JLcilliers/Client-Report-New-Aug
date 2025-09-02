const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test results structure
const testResults = {
  timestamp: new Date().toISOString(),
  insights: {},
  search: {},
  traffic: {},
  engagement: {},
  technical: {},
  visualize: {},
  executiveSummary: {},
  errors: [],
  warnings: []
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotsDir = path.join(__dirname, 'test-screenshots');
  try {
    await fs.mkdir(screenshotsDir, { recursive: true });
    await page.screenshot({ 
      path: path.join(screenshotsDir, `${name}.png`),
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${name}.png`);
  } catch (error) {
    console.error(`Failed to save screenshot ${name}:`, error);
  }
}

async function checkDataExists(page, selector, description) {
  try {
    const element = await page.$(selector);
    if (element) {
      const text = await page.evaluate(el => el.textContent, element);
      return {
        exists: true,
        hasContent: text && text.trim().length > 0,
        content: text ? text.trim() : null,
        description
      };
    }
    return {
      exists: false,
      hasContent: false,
      content: null,
      description
    };
  } catch (error) {
    return {
      exists: false,
      hasContent: false,
      error: error.message,
      description
    };
  }
}

async function testDashboard() {
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.errors.push({
          type: 'console',
          message: msg.text(),
          url: page.url()
        });
      }
    });

    // Monitor network errors
    page.on('requestfailed', request => {
      testResults.errors.push({
        type: 'network',
        url: request.url(),
        failure: request.failure().errorText
      });
    });

    console.log('🚀 Starting dashboard tests...\n');

    // Navigate to the dashboard
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:3000/admin/reports', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await delay(3000);
    await takeScreenshot(page, '01-reports-page');

    // Check if we need to select a report first
    const reportLinks = await page.$$('a[href*="/admin/reports/"]');
    if (reportLinks.length > 0) {
      console.log(`📊 Found ${reportLinks.length} reports, clicking the first one...`);
      await reportLinks[0].click();
      await delay(3000);
      await takeScreenshot(page, '02-report-detail');
    }

    // Look for public report link
    const publicReportLink = await page.$('a[href*="/report/"]');
    if (publicReportLink) {
      const reportUrl = await page.evaluate(el => el.href, publicReportLink);
      console.log(`🔗 Found public report URL: ${reportUrl}`);
      
      // Navigate to the public report
      await page.goto(reportUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      await delay(3000);
      await takeScreenshot(page, '03-public-report-main');

      // Test Insights Tab (usually the default)
      console.log('\n📈 Testing INSIGHTS tab...');
      testResults.insights = {
        url: page.url(),
        checks: []
      };

      // Check for key metrics
      testResults.insights.checks.push(
        await checkDataExists(page, '[data-metric="total-clicks"]', 'Total Clicks'),
        await checkDataExists(page, '[data-metric="total-impressions"]', 'Total Impressions'),
        await checkDataExists(page, '[data-metric="avg-ctr"]', 'Average CTR'),
        await checkDataExists(page, '[data-metric="avg-position"]', 'Average Position'),
        await checkDataExists(page, 'h1, h2, h3', 'Headers'),
        await checkDataExists(page, '.chart, canvas, svg', 'Charts/Visualizations')
      );

      // Check for executive summary
      const summaryElement = await page.$('[class*="summary"], [class*="executive"], [id*="summary"]');
      if (summaryElement) {
        const summaryText = await page.evaluate(el => el.textContent, summaryElement);
        testResults.executiveSummary = {
          exists: true,
          content: summaryText?.substring(0, 200) + '...',
          length: summaryText?.length
        };
      }

      // Test SEARCH tab
      console.log('\n🔍 Testing SEARCH tab...');
      const searchTab = await page.$('a[href*="search"], button:has-text("Search"), [role="tab"]:has-text("Search")');
      if (searchTab) {
        await searchTab.click();
        await delay(2000);
        await takeScreenshot(page, '04-search-tab');
        
        testResults.search = {
          exists: true,
          checks: [
            await checkDataExists(page, '[class*="query"], [class*="keyword"]', 'Search Queries'),
            await checkDataExists(page, '[class*="clicks"]', 'Click Data'),
            await checkDataExists(page, '[class*="impressions"]', 'Impressions Data'),
            await checkDataExists(page, '[class*="position"]', 'Position Data')
          ]
        };
      }

      // Test TRAFFIC tab
      console.log('\n🚦 Testing TRAFFIC tab...');
      const trafficTab = await page.$('a[href*="traffic"], button:has-text("Traffic"), [role="tab"]:has-text("Traffic")');
      if (trafficTab) {
        await trafficTab.click();
        await delay(2000);
        await takeScreenshot(page, '05-traffic-tab');
        
        testResults.traffic = {
          exists: true,
          checks: [
            await checkDataExists(page, '[class*="users"], [class*="visitors"]', 'User/Visitor Data'),
            await checkDataExists(page, '[class*="sessions"]', 'Sessions Data'),
            await checkDataExists(page, '[class*="source"], [class*="channel"]', 'Traffic Sources'),
            await checkDataExists(page, '[class*="device"]', 'Device Data')
          ]
        };
      }

      // Test ENGAGEMENT tab
      console.log('\n💡 Testing ENGAGEMENT tab...');
      const engagementTab = await page.$('a[href*="engagement"], button:has-text("Engagement"), [role="tab"]:has-text("Engagement")');
      if (engagementTab) {
        await engagementTab.click();
        await delay(2000);
        await takeScreenshot(page, '06-engagement-tab');
        
        testResults.engagement = {
          exists: true,
          checks: [
            await checkDataExists(page, '[class*="bounce"], [class*="rate"]', 'Bounce Rate'),
            await checkDataExists(page, '[class*="duration"], [class*="time"]', 'Session Duration'),
            await checkDataExists(page, '[class*="pages"], [class*="views"]', 'Page Views'),
            await checkDataExists(page, '[class*="events"]', 'Events Data')
          ]
        };
      }

      // Test TECHNICAL tab (Core Web Vitals & PageSpeed)
      console.log('\n⚙️ Testing TECHNICAL tab...');
      const technicalTab = await page.$('a[href*="technical"], button:has-text("Technical"), [role="tab"]:has-text("Technical")');
      if (technicalTab) {
        await technicalTab.click();
        await delay(3000); // Give more time for PageSpeed data
        await takeScreenshot(page, '07-technical-tab');
        
        // Check for Core Web Vitals
        const coreWebVitals = {
          lcp: await checkDataExists(page, '[class*="lcp"], [class*="LCP"]', 'Largest Contentful Paint'),
          fid: await checkDataExists(page, '[class*="fid"], [class*="FID"]', 'First Input Delay'),
          cls: await checkDataExists(page, '[class*="cls"], [class*="CLS"]', 'Cumulative Layout Shift'),
          fcp: await checkDataExists(page, '[class*="fcp"], [class*="FCP"]', 'First Contentful Paint'),
          inp: await checkDataExists(page, '[class*="inp"], [class*="INP"]', 'Interaction to Next Paint'),
          ttfb: await checkDataExists(page, '[class*="ttfb"], [class*="TTFB"]', 'Time to First Byte')
        };

        // Check for PageSpeed scores
        const pageSpeed = {
          performance: await checkDataExists(page, '[class*="performance"]', 'Performance Score'),
          accessibility: await checkDataExists(page, '[class*="accessibility"]', 'Accessibility Score'),
          seo: await checkDataExists(page, '[class*="seo"]', 'SEO Score'),
          bestPractices: await checkDataExists(page, '[class*="best"], [class*="practices"]', 'Best Practices Score')
        };

        testResults.technical = {
          exists: true,
          coreWebVitals,
          pageSpeed
        };
      }

      // Test VISUALIZE tab
      console.log('\n📊 Testing VISUALIZE tab...');
      const visualizeTab = await page.$('a[href*="visualize"], button:has-text("Visualize"), [role="tab"]:has-text("Visualize")');
      if (visualizeTab) {
        await visualizeTab.click();
        await delay(2000);
        await takeScreenshot(page, '08-visualize-tab');
        
        testResults.visualize = {
          exists: true,
          checks: [
            await checkDataExists(page, 'canvas, svg, .chart', 'Charts Present'),
            await checkDataExists(page, '[class*="legend"]', 'Chart Legends'),
            await checkDataExists(page, '[class*="axis"]', 'Chart Axes')
          ]
        };
      }

      // Final summary screenshot
      await takeScreenshot(page, '09-final-state');

    } else {
      testResults.errors.push({
        type: 'navigation',
        message: 'Could not find public report link'
      });
    }

    // Generate report
    console.log('\n📝 Generating test report...\n');
    console.log('=' .repeat(60));
    console.log('DASHBOARD TEST RESULTS');
    console.log('=' .repeat(60));
    
    // Insights Tab
    console.log('\n📈 INSIGHTS TAB:');
    if (testResults.insights.checks) {
      testResults.insights.checks.forEach(check => {
        const status = check.exists && check.hasContent ? '✅' : '❌';
        console.log(`  ${status} ${check.description}: ${check.exists ? (check.hasContent ? 'Has data' : 'Empty') : 'Not found'}`);
      });
    }

    // Executive Summary
    console.log('\n📋 EXECUTIVE SUMMARY:');
    if (testResults.executiveSummary.exists) {
      console.log(`  ✅ Found (${testResults.executiveSummary.length} characters)`);
    } else {
      console.log('  ❌ Not found');
    }

    // Search Tab
    console.log('\n🔍 SEARCH TAB:');
    if (testResults.search.exists) {
      testResults.search.checks?.forEach(check => {
        const status = check.exists && check.hasContent ? '✅' : '❌';
        console.log(`  ${status} ${check.description}: ${check.exists ? (check.hasContent ? 'Has data' : 'Empty') : 'Not found'}`);
      });
    } else {
      console.log('  ❌ Tab not found');
    }

    // Traffic Tab
    console.log('\n🚦 TRAFFIC TAB:');
    if (testResults.traffic.exists) {
      testResults.traffic.checks?.forEach(check => {
        const status = check.exists && check.hasContent ? '✅' : '❌';
        console.log(`  ${status} ${check.description}: ${check.exists ? (check.hasContent ? 'Has data' : 'Empty') : 'Not found'}`);
      });
    } else {
      console.log('  ❌ Tab not found');
    }

    // Engagement Tab
    console.log('\n💡 ENGAGEMENT TAB:');
    if (testResults.engagement.exists) {
      testResults.engagement.checks?.forEach(check => {
        const status = check.exists && check.hasContent ? '✅' : '❌';
        console.log(`  ${status} ${check.description}: ${check.exists ? (check.hasContent ? 'Has data' : 'Empty') : 'Not found'}`);
      });
    } else {
      console.log('  ❌ Tab not found');
    }

    // Technical Tab
    console.log('\n⚙️ TECHNICAL TAB:');
    if (testResults.technical.exists) {
      console.log('  Core Web Vitals:');
      Object.entries(testResults.technical.coreWebVitals).forEach(([key, check]) => {
        const status = check.exists && check.hasContent ? '✅' : '❌';
        console.log(`    ${status} ${check.description}: ${check.exists ? (check.hasContent ? 'Has data' : 'Empty') : 'Not found'}`);
      });
      
      console.log('  PageSpeed Scores:');
      Object.entries(testResults.technical.pageSpeed).forEach(([key, check]) => {
        const status = check.exists && check.hasContent ? '✅' : '❌';
        console.log(`    ${status} ${check.description}: ${check.exists ? (check.hasContent ? 'Has data' : 'Empty') : 'Not found'}`);
      });
    } else {
      console.log('  ❌ Tab not found');
    }

    // Visualize Tab
    console.log('\n📊 VISUALIZE TAB:');
    if (testResults.visualize.exists) {
      testResults.visualize.checks?.forEach(check => {
        const status = check.exists && check.hasContent ? '✅' : '❌';
        console.log(`  ${status} ${check.description}: ${check.exists ? (check.hasContent ? 'Has data' : 'Empty') : 'Not found'}`);
      });
    } else {
      console.log('  ❌ Tab not found');
    }

    // Errors
    if (testResults.errors.length > 0) {
      console.log('\n⚠️ ERRORS DETECTED:');
      testResults.errors.forEach(error => {
        console.log(`  - ${error.type}: ${error.message || error.failure}`);
      });
    }

    // Save results to file
    await fs.writeFile(
      path.join(__dirname, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    console.log('\n💾 Test results saved to test-results.json');
    console.log('📸 Screenshots saved to test-screenshots/');

  } catch (error) {
    console.error('❌ Test failed:', error);
    testResults.errors.push({
      type: 'fatal',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await browser.close();
    console.log('\n✅ Test completed!');
  }
}

// Run the test
testDashboard().catch(console.error);