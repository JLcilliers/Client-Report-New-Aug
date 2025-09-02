const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 60000, // Increased timeout
  viewport: { width: 1920, height: 1080 },
  screenshotDir: path.join(__dirname, 'screenshots'),
  headless: true, // Set to false to see the browser
  slowMo: 50 // Slow down for stability
};

// Test results
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  screenshots: [],
  errors: []
};

// Helper functions
async function ensureScreenshotDir() {
  try {
    await fs.mkdir(CONFIG.screenshotDir, { recursive: true });
  } catch (error) {
    console.error('Error creating screenshot directory:', error);
  }
}

async function takeScreenshot(page, name) {
  try {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(CONFIG.screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    results.screenshots.push({ name, filename, timestamp });
    console.log(`📸 Screenshot: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`Error taking screenshot ${name}:`, error.message);
    return null;
  }
}

async function testPage(page, url, name) {
  console.log(`\n🔍 Testing ${name}...`);
  const test = { name, url, status: 'pending', data: {} };
  
  try {
    // Navigate with relaxed waiting
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for JS to load
    
    test.status = 'loaded';
    test.data.currentUrl = page.url();
    test.data.title = await page.title();
    
    // Take screenshot
    await takeScreenshot(page, name.toLowerCase().replace(/\s+/g, '-'));
    
    // Extract page data
    test.data.pageContent = await page.evaluate(() => {
      const data = {
        hasContent: document.body.innerText.length > 100,
        textLength: document.body.innerText.length,
        hasNavigation: !!document.querySelector('nav, .navigation, .sidebar'),
        hasMainContent: !!document.querySelector('main, .main-content, #content'),
        visibleText: document.body.innerText.substring(0, 500),
        errorMessages: [],
        dataElements: 0,
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length
      };
      
      // Check for error messages
      const errorElements = document.querySelectorAll('.error, .alert-error, [role="alert"]');
      errorElements.forEach(el => {
        if (el.innerText) data.errorMessages.push(el.innerText);
      });
      
      // Count data elements
      data.dataElements = document.querySelectorAll('[data-value], .metric-value, .data-point, td:not(:empty)').length;
      
      return data;
    });
    
    console.log(`  ✅ Page loaded successfully`);
    console.log(`  📊 Found ${test.data.pageContent.dataElements} data elements`);
    console.log(`  🔗 ${test.data.pageContent.links} links, ${test.data.pageContent.buttons} buttons`);
    
    test.status = 'success';
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    test.status = 'error';
    test.error = error.message;
    results.errors.push({ page: name, error: error.message });
  }
  
  results.tests.push(test);
  return test;
}

async function testReportPage(page) {
  console.log('\n📊 Testing Report Page Functionality...');
  
  try {
    // Try to find a report
    const reportUrls = [
      `${CONFIG.baseUrl}/reports`,
      `${CONFIG.baseUrl}/report/1`,
      `${CONFIG.baseUrl}/report/test`
    ];
    
    let reportFound = false;
    let reportTest = null;
    
    for (const url of reportUrls) {
      reportTest = await testPage(page, url, `Report - ${url}`);
      if (reportTest.status === 'success' && reportTest.data.pageContent.hasContent) {
        reportFound = true;
        break;
      }
    }
    
    if (!reportFound) {
      console.log('  ⚠️  No report page found');
      return;
    }
    
    // Test tabs if on report page
    console.log('\n📑 Testing Report Tabs...');
    const tabs = ['Insights', 'Search', 'Traffic', 'Engagement', 'Technical', 'Visualize'];
    
    for (const tabName of tabs) {
      try {
        // Look for tab buttons/links
        const tabFound = await page.evaluate((name) => {
          const elements = Array.from(document.querySelectorAll('button, a, [role="tab"]'));
          const tab = elements.find(el => el.innerText && el.innerText.includes(name));
          if (tab) {
            tab.click();
            return true;
          }
          return false;
        }, tabName);
        
        if (tabFound) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`  ✅ ${tabName} tab clicked`);
          
          // Check for specific content based on tab
          const tabData = await page.evaluate((name) => {
            const data = {
              hasContent: false,
              metrics: []
            };
            
            const bodyText = document.body.innerText.toLowerCase();
            
            switch(name) {
              case 'Technical':
                data.hasContent = bodyText.includes('core web vitals') || 
                                bodyText.includes('pagespeed') ||
                                bodyText.includes('performance');
                // Look for metrics
                ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].forEach(metric => {
                  if (bodyText.includes(metric.toLowerCase())) {
                    data.metrics.push(metric);
                  }
                });
                break;
              case 'Search':
                data.hasContent = bodyText.includes('search') || 
                                bodyText.includes('queries') ||
                                bodyText.includes('impressions');
                break;
              case 'Traffic':
                data.hasContent = bodyText.includes('sessions') || 
                                bodyText.includes('users') ||
                                bodyText.includes('traffic');
                break;
              case 'Engagement':
                data.hasContent = bodyText.includes('bounce') || 
                                bodyText.includes('engagement') ||
                                bodyText.includes('duration');
                break;
              case 'Insights':
                data.hasContent = bodyText.includes('summary') || 
                                bodyText.includes('insights') ||
                                bodyText.includes('overview');
                break;
              case 'Visualize':
                data.hasContent = !!document.querySelector('canvas, svg, .chart');
                break;
            }
            
            return data;
          }, tabName);
          
          if (tabData.hasContent) {
            console.log(`    ✅ ${tabName} content detected`);
            if (tabData.metrics.length > 0) {
              console.log(`    📊 Metrics found: ${tabData.metrics.join(', ')}`);
            }
          } else {
            console.log(`    ⚠️  ${tabName} content not clearly detected`);
          }
          
          await takeScreenshot(page, `tab-${tabName.toLowerCase()}`);
          
        } else {
          console.log(`  ❌ ${tabName} tab not found`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing ${tabName} tab: ${error.message}`);
      }
    }
    
    // Test Core Web Vitals specifically
    console.log('\n🚀 Checking Core Web Vitals...');
    const vitalsData = await page.evaluate(() => {
      const vitals = {};
      const bodyText = document.body.innerText;
      
      // Look for metric values
      const metricPatterns = {
        LCP: /LCP[:\s]+([0-9.]+\s*[ms]*)/i,
        FID: /FID[:\s]+([0-9.]+\s*[ms]*)/i,
        CLS: /CLS[:\s]+([0-9.]+)/i,
        FCP: /FCP[:\s]+([0-9.]+\s*[ms]*)/i,
        TTFB: /TTFB[:\s]+([0-9.]+\s*[ms]*)/i
      };
      
      for (const [metric, pattern] of Object.entries(metricPatterns)) {
        const match = bodyText.match(pattern);
        if (match) {
          vitals[metric] = match[1];
        }
      }
      
      // Also check for PageSpeed score
      const pageSpeedMatch = bodyText.match(/(?:PageSpeed|Performance)[\s:]+([0-9]+)/i);
      if (pageSpeedMatch) {
        vitals.PageSpeed = pageSpeedMatch[1];
      }
      
      return vitals;
    });
    
    if (Object.keys(vitalsData).length > 0) {
      console.log('  ✅ Core Web Vitals found:');
      for (const [metric, value] of Object.entries(vitalsData)) {
        console.log(`    ${metric}: ${value}`);
      }
    } else {
      console.log('  ⚠️  Core Web Vitals not detected in current view');
    }
    
  } catch (error) {
    console.error('❌ Error testing report page:', error);
    results.errors.push({ context: 'reportPage', error: error.message });
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 TEST REPORT SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.tests.filter(t => t.status === 'success').length;
  const failed = results.tests.filter(t => t.status === 'error').length;
  
  console.log(`\n📊 Results:`);
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📸 Screenshots: ${results.screenshots.length}`);
  
  console.log(`\n📄 Pages Tested:`);
  results.tests.forEach(test => {
    const icon = test.status === 'success' ? '✅' : '❌';
    console.log(`  ${icon} ${test.name}`);
    if (test.data.pageContent) {
      console.log(`     - Data elements: ${test.data.pageContent.dataElements}`);
      console.log(`     - Has content: ${test.data.pageContent.hasContent}`);
    }
  });
  
  if (results.errors.length > 0) {
    console.log(`\n⚠️  Errors:`);
    results.errors.forEach(err => {
      console.log(`  - ${err.page || err.context}: ${err.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Save detailed report
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log(`📸 Screenshots saved to: ${CONFIG.screenshotDir}`);
}

// Main execution
async function runTest() {
  console.log('🚀 Starting Dashboard Test');
  console.log(`📍 URL: ${CONFIG.baseUrl}`);
  console.log('');
  
  let browser;
  
  try {
    await ensureScreenshotDir();
    
    // Launch browser
    console.log('🌐 Launching browser...\n');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: CONFIG.viewport
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(CONFIG.timeout);
    
    // Monitor console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.errors.push({ context: 'console', error: msg.text() });
      }
    });
    
    // Test main pages
    await testPage(page, CONFIG.baseUrl, 'Homepage');
    await testPage(page, `${CONFIG.baseUrl}/dashboard`, 'Dashboard');
    await testPage(page, `${CONFIG.baseUrl}/properties`, 'Properties');
    await testPage(page, `${CONFIG.baseUrl}/connections`, 'Connections');
    
    // Test report functionality
    await testReportPage(page);
    
    // Generate report
    await generateReport();
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    results.errors.push({ context: 'fatal', error: error.message });
  } finally {
    if (browser) {
      console.log('\n🔒 Closing browser...');
      await browser.close();
    }
  }
  
  console.log('\n✅ Test completed!');
  process.exit(results.errors.length > 0 ? 1 : 0);
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});