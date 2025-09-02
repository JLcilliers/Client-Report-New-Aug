const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  viewport: { width: 1920, height: 1080 },
  screenshotDir: path.join(__dirname, 'screenshots'),
  headless: false, // Set to false to see the browser in action
  slowMo: 100 // Slow down actions for better visibility
};

// Test results collector
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  authentication: {},
  navigation: {},
  tabs: {},
  dataValidation: {},
  performance: {},
  errors: [],
  screenshots: []
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
    testResults.screenshots.push({ name, filename, timestamp });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`Error taking screenshot ${name}:`, error);
    return null;
  }
}

async function waitAndClick(page, selector, options = {}) {
  try {
    await page.waitForSelector(selector, { timeout: options.timeout || 10000 });
    await page.click(selector);
    return true;
  } catch (error) {
    console.error(`Error clicking ${selector}:`, error.message);
    return false;
  }
}

async function extractTextContent(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return await page.$eval(selector, el => el.textContent?.trim());
  } catch (error) {
    return null;
  }
}

async function checkElementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function extractMetrics(page, metricSelectors) {
  const metrics = {};
  for (const [key, selector] of Object.entries(metricSelectors)) {
    metrics[key] = await extractTextContent(page, selector);
  }
  return metrics;
}

// Main test functions
async function testAuthentication(page) {
  console.log('\n🔐 Testing Authentication...');
  testResults.totalTests++;
  
  try {
    // Check if we're already logged in or need to authenticate
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'initial-load');
    
    // Check for common auth indicators
    const isLoggedIn = await checkElementExists(page, '[data-testid="dashboard"], .dashboard, #dashboard, main');
    const hasLoginButton = await checkElementExists(page, 'button:has-text("Sign in"), button:has-text("Login"), a[href*="login"], a[href*="auth"]');
    
    testResults.authentication = {
      isLoggedIn,
      hasLoginButton,
      currentUrl: page.url(),
      status: isLoggedIn ? 'authenticated' : 'not_authenticated'
    };
    
    if (!isLoggedIn && hasLoginButton) {
      console.log('⚠️  Not authenticated, login required');
      testResults.summary.warnings++;
    } else if (isLoggedIn) {
      console.log('✅ Already authenticated or no auth required');
      testResults.summary.passed++;
    }
    
    return isLoggedIn;
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    testResults.authentication.error = error.message;
    testResults.summary.failed++;
    return false;
  }
}

async function testNavigation(page) {
  console.log('\n🧭 Testing Navigation...');
  
  const navigationItems = [
    { name: 'Dashboard', selectors: ['a[href="/dashboard"]', 'a:has-text("Dashboard")', 'nav a:has-text("Dashboard")'] },
    { name: 'Reports', selectors: ['a[href="/reports"]', 'a:has-text("Reports")', 'nav a:has-text("Reports")'] },
    { name: 'Properties', selectors: ['a[href="/properties"]', 'a:has-text("Properties")', 'nav a:has-text("Properties")'] },
    { name: 'Connections', selectors: ['a[href="/connections"]', 'a:has-text("Connections")', 'nav a:has-text("Connections")'] }
  ];
  
  testResults.navigation.items = {};
  
  for (const item of navigationItems) {
    testResults.totalTests++;
    let found = false;
    
    for (const selector of item.selectors) {
      if (await checkElementExists(page, selector)) {
        found = true;
        testResults.navigation.items[item.name] = { found: true, selector };
        console.log(`✅ Found navigation item: ${item.name}`);
        testResults.summary.passed++;
        break;
      }
    }
    
    if (!found) {
      testResults.navigation.items[item.name] = { found: false };
      console.log(`⚠️  Navigation item not found: ${item.name}`);
      testResults.summary.warnings++;
    }
  }
  
  await takeScreenshot(page, 'navigation');
}

async function findAndNavigateToReport(page) {
  console.log('\n📊 Finding and navigating to a report...');
  testResults.totalTests++;
  
  try {
    // Try multiple strategies to find reports
    const reportStrategies = [
      // Strategy 1: Direct navigation to reports page
      async () => {
        await page.goto(`${CONFIG.baseUrl}/reports`, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Look for report links or cards
        const reportSelectors = [
          'a[href*="/report/"]',
          'a[href*="/reports/"]',
          '.report-card a',
          '[data-testid="report-link"]',
          'div[role="link"][onclick*="report"]'
        ];
        
        for (const selector of reportSelectors) {
          const reportLink = await page.$(selector);
          if (reportLink) {
            await reportLink.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
            return true;
          }
        }
        return false;
      },
      
      // Strategy 2: Look for "View Report" or similar buttons
      async () => {
        const viewReportSelectors = [
          'button:has-text("View Report")',
          'a:has-text("View Report")',
          'button:has-text("Open Report")',
          'a:has-text("Open Report")',
          'button:has-text("View")',
          'a:has-text("View")'
        ];
        
        for (const selector of viewReportSelectors) {
          if (await waitAndClick(page, selector)) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            return true;
          }
        }
        return false;
      },
      
      // Strategy 3: Try a known report ID if available
      async () => {
        const testReportIds = ['1', '2', '3', 'test', 'demo'];
        for (const id of testReportIds) {
          try {
            await page.goto(`${CONFIG.baseUrl}/report/${id}`, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if we landed on a valid report page
            const hasReportContent = await checkElementExists(page, '.report-content, #report-content, main:has-text("Report"), main:has-text("Insights")');
            if (hasReportContent) {
              return true;
            }
          } catch (error) {
            // Continue to next ID
          }
        }
        return false;
      }
    ];
    
    // Try each strategy
    for (const strategy of reportStrategies) {
      if (await strategy()) {
        console.log('✅ Successfully navigated to a report');
        testResults.summary.passed++;
        await takeScreenshot(page, 'report-page');
        return true;
      }
    }
    
    console.log('❌ Could not find or navigate to any report');
    testResults.summary.failed++;
    return false;
  } catch (error) {
    console.error('❌ Error finding report:', error);
    testResults.errors.push({ context: 'findReport', error: error.message });
    testResults.summary.failed++;
    return false;
  }
}

async function testReportTabs(page) {
  console.log('\n📑 Testing Report Tabs...');
  
  const tabs = [
    { name: 'Insights', selectors: ['button:has-text("Insights")', 'a:has-text("Insights")', '[role="tab"]:has-text("Insights")'] },
    { name: 'Search', selectors: ['button:has-text("Search")', 'a:has-text("Search")', '[role="tab"]:has-text("Search")'] },
    { name: 'Traffic', selectors: ['button:has-text("Traffic")', 'a:has-text("Traffic")', '[role="tab"]:has-text("Traffic")'] },
    { name: 'Engagement', selectors: ['button:has-text("Engagement")', 'a:has-text("Engagement")', '[role="tab"]:has-text("Engagement")'] },
    { name: 'Technical', selectors: ['button:has-text("Technical")', 'a:has-text("Technical")', '[role="tab"]:has-text("Technical")'] },
    { name: 'Visualize', selectors: ['button:has-text("Visualize")', 'a:has-text("Visualize")', '[role="tab"]:has-text("Visualize")'] }
  ];
  
  testResults.tabs = {};
  
  for (const tab of tabs) {
    testResults.totalTests++;
    console.log(`\n  Testing ${tab.name} tab...`);
    
    let tabFound = false;
    let tabClickable = false;
    let contentLoaded = false;
    
    // Try to find and click the tab
    for (const selector of tab.selectors) {
      if (await checkElementExists(page, selector)) {
        tabFound = true;
        
        try {
          await page.click(selector);
          await new Promise(resolve => setTimeout(resolve, 2000));
          tabClickable = true;
          
          // Check if content loaded
          contentLoaded = await checkForTabContent(page, tab.name);
          
          await takeScreenshot(page, `tab-${tab.name.toLowerCase()}`);
          break;
        } catch (error) {
          console.error(`    Error clicking ${tab.name} tab:`, error.message);
        }
      }
    }
    
    testResults.tabs[tab.name] = {
      found: tabFound,
      clickable: tabClickable,
      contentLoaded,
      data: await extractTabData(page, tab.name)
    };
    
    if (tabFound && tabClickable && contentLoaded) {
      console.log(`  ✅ ${tab.name} tab is functional`);
      testResults.summary.passed++;
    } else if (tabFound) {
      console.log(`  ⚠️  ${tab.name} tab found but issues with loading`);
      testResults.summary.warnings++;
    } else {
      console.log(`  ❌ ${tab.name} tab not found`);
      testResults.summary.failed++;
    }
  }
}

async function checkForTabContent(page, tabName) {
  // Check for common content indicators based on tab name
  const contentChecks = {
    'Insights': ['Executive Summary', 'Key Metrics', 'Performance', 'Overview'],
    'Search': ['Search Queries', 'Keywords', 'Impressions', 'Clicks', 'CTR'],
    'Traffic': ['Sessions', 'Users', 'Page Views', 'Traffic Sources'],
    'Engagement': ['Bounce Rate', 'Session Duration', 'Pages per Session', 'User Engagement'],
    'Technical': ['Core Web Vitals', 'PageSpeed', 'Performance Score', 'LCP', 'FID', 'CLS'],
    'Visualize': ['Chart', 'Graph', 'Visualization', 'Data Visualization']
  };
  
  const expectedContent = contentChecks[tabName] || [];
  
  for (const content of expectedContent) {
    const hasContent = await page.evaluate((text) => {
      return document.body.innerText.includes(text);
    }, content);
    
    if (hasContent) {
      return true;
    }
  }
  
  // Also check for data containers
  const hasDataContainer = await checkElementExists(page, '.data-container, .metric-card, .chart-container, .report-content, [data-testid="tab-content"]');
  return hasDataContainer;
}

async function extractTabData(page, tabName) {
  const data = {};
  
  try {
    switch (tabName) {
      case 'Insights':
        data.executiveSummary = await extractTextContent(page, '.executive-summary, [data-testid="executive-summary"]');
        data.keyMetrics = await page.evaluate(() => {
          const metrics = [];
          document.querySelectorAll('.metric-card, .key-metric, [data-metric]').forEach(el => {
            metrics.push(el.innerText);
          });
          return metrics;
        });
        break;
        
      case 'Technical':
        // Extract Core Web Vitals
        data.coreWebVitals = await extractMetrics(page, {
          lcp: '[data-metric="lcp"], .lcp-value, :has-text("LCP") + *',
          fid: '[data-metric="fid"], .fid-value, :has-text("FID") + *',
          cls: '[data-metric="cls"], .cls-value, :has-text("CLS") + *',
          fcp: '[data-metric="fcp"], .fcp-value, :has-text("FCP") + *',
          ttfb: '[data-metric="ttfb"], .ttfb-value, :has-text("TTFB") + *'
        });
        
        // Extract PageSpeed Score
        data.pageSpeedScore = await extractTextContent(page, '.pagespeed-score, [data-metric="pagespeed"], .performance-score');
        
        // Check for performance data
        data.hasPerformanceData = await page.evaluate(() => {
          const text = document.body.innerText.toLowerCase();
          return text.includes('performance') || text.includes('pagespeed') || text.includes('core web vitals');
        });
        break;
        
      case 'Search':
        data.totalImpressions = await extractTextContent(page, '[data-metric="impressions"], .impressions-value');
        data.totalClicks = await extractTextContent(page, '[data-metric="clicks"], .clicks-value');
        data.avgCTR = await extractTextContent(page, '[data-metric="ctr"], .ctr-value');
        data.avgPosition = await extractTextContent(page, '[data-metric="position"], .position-value');
        break;
        
      case 'Traffic':
        data.sessions = await extractTextContent(page, '[data-metric="sessions"], .sessions-value');
        data.users = await extractTextContent(page, '[data-metric="users"], .users-value');
        data.pageViews = await extractTextContent(page, '[data-metric="pageviews"], .pageviews-value');
        break;
        
      case 'Engagement':
        data.bounceRate = await extractTextContent(page, '[data-metric="bounce-rate"], .bounce-rate-value');
        data.avgSessionDuration = await extractTextContent(page, '[data-metric="session-duration"], .session-duration-value');
        data.pagesPerSession = await extractTextContent(page, '[data-metric="pages-per-session"], .pages-per-session-value');
        break;
    }
    
    // Count visible data points
    data.visibleDataPoints = await page.evaluate(() => {
      const dataElements = document.querySelectorAll('[data-value], .metric-value, .data-point, td:not(:empty)');
      return Array.from(dataElements).filter(el => el.innerText && el.innerText.trim() !== '').length;
    });
    
  } catch (error) {
    console.error(`    Error extracting data for ${tabName}:`, error.message);
    data.error = error.message;
  }
  
  return data;
}

async function testCoreWebVitals(page) {
  console.log('\n🚀 Testing Core Web Vitals Display...');
  testResults.totalTests++;
  
  try {
    // Navigate to Technical tab if not already there
    const technicalTabClicked = await waitAndClick(page, 'button:has-text("Technical"), a:has-text("Technical"), [role="tab"]:has-text("Technical")');
    
    if (!technicalTabClicked) {
      console.log('  ⚠️  Could not navigate to Technical tab for Core Web Vitals');
      testResults.summary.warnings++;
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const vitals = {
      LCP: { found: false, value: null, status: null },
      FID: { found: false, value: null, status: null },
      CLS: { found: false, value: null, status: null },
      FCP: { found: false, value: null, status: null },
      TTFB: { found: false, value: null, status: null }
    };
    
    // Search for Core Web Vitals metrics
    for (const [metric, data] of Object.entries(vitals)) {
      // Try multiple selector strategies
      const selectors = [
        `[data-metric="${metric.toLowerCase()}"]`,
        `.${metric.toLowerCase()}-value`,
        `div:has-text("${metric}") + *`,
        `span:has-text("${metric}") + *`,
        `td:has-text("${metric}") + td`
      ];
      
      for (const selector of selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            data.found = true;
            data.value = await page.evaluate(el => el.innerText, element);
            
            // Check for status indicators (good, needs improvement, poor)
            const parentElement = await page.evaluateHandle(el => el.parentElement, element);
            const className = await page.evaluate(el => el.className, parentElement);
            
            if (className.includes('good') || className.includes('green')) {
              data.status = 'good';
            } else if (className.includes('needs-improvement') || className.includes('yellow')) {
              data.status = 'needs improvement';
            } else if (className.includes('poor') || className.includes('red')) {
              data.status = 'poor';
            }
            
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (data.found) {
        console.log(`  ✅ ${metric}: ${data.value} (${data.status || 'no status'})`);
      } else {
        console.log(`  ❌ ${metric}: Not found`);
      }
    }
    
    testResults.dataValidation.coreWebVitals = vitals;
    
    // Check if any vitals were found
    const vitalsFound = Object.values(vitals).filter(v => v.found).length;
    if (vitalsFound >= 3) {
      console.log(`  ✅ Core Web Vitals display is working (${vitalsFound}/5 metrics found)`);
      testResults.summary.passed++;
    } else if (vitalsFound > 0) {
      console.log(`  ⚠️  Partial Core Web Vitals data (${vitalsFound}/5 metrics found)`);
      testResults.summary.warnings++;
    } else {
      console.log('  ❌ No Core Web Vitals data found');
      testResults.summary.failed++;
    }
    
    await takeScreenshot(page, 'core-web-vitals');
    
  } catch (error) {
    console.error('❌ Error testing Core Web Vitals:', error);
    testResults.errors.push({ context: 'coreWebVitals', error: error.message });
    testResults.summary.failed++;
  }
}

async function testPageSpeedData(page) {
  console.log('\n⚡ Testing PageSpeed Data...');
  testResults.totalTests++;
  
  try {
    const pageSpeedData = {
      score: null,
      found: false,
      metrics: {}
    };
    
    // Look for PageSpeed score
    const scoreSelectors = [
      '.pagespeed-score',
      '[data-metric="pagespeed"]',
      '.performance-score',
      'div:has-text("Performance Score") + *',
      'div:has-text("PageSpeed") + *'
    ];
    
    for (const selector of scoreSelectors) {
      const element = await page.$(selector);
      if (element) {
        pageSpeedData.found = true;
        pageSpeedData.score = await page.evaluate(el => el.innerText, element);
        break;
      }
    }
    
    // Look for additional PageSpeed metrics
    const additionalMetrics = [
      'First Contentful Paint',
      'Speed Index',
      'Time to Interactive',
      'Total Blocking Time',
      'Cumulative Layout Shift',
      'Largest Contentful Paint'
    ];
    
    for (const metric of additionalMetrics) {
      const hasMetric = await page.evaluate((text) => {
        return document.body.innerText.includes(text);
      }, metric);
      
      if (hasMetric) {
        pageSpeedData.metrics[metric] = true;
      }
    }
    
    testResults.dataValidation.pageSpeed = pageSpeedData;
    
    if (pageSpeedData.found) {
      console.log(`  ✅ PageSpeed Score found: ${pageSpeedData.score}`);
      console.log(`  📊 Additional metrics found: ${Object.keys(pageSpeedData.metrics).length}`);
      testResults.summary.passed++;
    } else {
      console.log('  ❌ PageSpeed data not found');
      testResults.summary.failed++;
    }
    
  } catch (error) {
    console.error('❌ Error testing PageSpeed data:', error);
    testResults.errors.push({ context: 'pageSpeed', error: error.message });
    testResults.summary.failed++;
  }
}

async function testExecutiveSummary(page) {
  console.log('\n📝 Testing Executive Summary...');
  testResults.totalTests++;
  
  try {
    // Navigate to Insights tab
    await waitAndClick(page, 'button:has-text("Insights"), a:has-text("Insights"), [role="tab"]:has-text("Insights")');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const summaryData = {
      found: false,
      content: null,
      metrics: [],
      recommendations: []
    };
    
    // Look for executive summary section
    const summarySelectors = [
      '.executive-summary',
      '[data-testid="executive-summary"]',
      'section:has-text("Executive Summary")',
      'div:has-text("Executive Summary")'
    ];
    
    for (const selector of summarySelectors) {
      const element = await page.$(selector);
      if (element) {
        summaryData.found = true;
        summaryData.content = await page.evaluate(el => el.innerText, element);
        break;
      }
    }
    
    // Look for key metrics in the summary
    const metrics = await page.evaluate(() => {
      const metricElements = document.querySelectorAll('.metric-card, .key-metric, [data-metric]');
      return Array.from(metricElements).map(el => ({
        label: el.querySelector('.metric-label, .label')?.innerText,
        value: el.querySelector('.metric-value, .value')?.innerText
      })).filter(m => m.label || m.value);
    });
    
    summaryData.metrics = metrics;
    
    // Look for recommendations
    const recommendations = await page.evaluate(() => {
      const recElements = document.querySelectorAll('.recommendation, li:has-text("Improve"), li:has-text("Consider"), li:has-text("Optimize")');
      return Array.from(recElements).map(el => el.innerText).slice(0, 5);
    });
    
    summaryData.recommendations = recommendations;
    
    testResults.dataValidation.executiveSummary = summaryData;
    
    if (summaryData.found || summaryData.metrics.length > 0) {
      console.log(`  ✅ Executive Summary found`);
      console.log(`  📊 Metrics found: ${summaryData.metrics.length}`);
      console.log(`  💡 Recommendations found: ${summaryData.recommendations.length}`);
      testResults.summary.passed++;
    } else {
      console.log('  ⚠️  Executive Summary not clearly identified');
      testResults.summary.warnings++;
    }
    
    await takeScreenshot(page, 'executive-summary');
    
  } catch (error) {
    console.error('❌ Error testing Executive Summary:', error);
    testResults.errors.push({ context: 'executiveSummary', error: error.message });
    testResults.summary.failed++;
  }
}

async function testDataPopulation(page) {
  console.log('\n📊 Testing Overall Data Population...');
  testResults.totalTests++;
  
  try {
    const dataCheck = {
      emptyValues: 0,
      populatedValues: 0,
      loadingIndicators: 0,
      errorMessages: 0,
      nullValues: 0
    };
    
    // Check for data values across the page
    const dataValues = await page.evaluate(() => {
      const results = {
        empty: 0,
        populated: 0,
        loading: 0,
        error: 0,
        null: 0
      };
      
      // Check all potential data containers
      const dataElements = document.querySelectorAll('[data-value], .metric-value, .data-point, td, .stat-value, .number');
      
      dataElements.forEach(el => {
        const text = el.innerText?.trim();
        if (!text || text === '' || text === '-') {
          results.empty++;
        } else if (text.toLowerCase().includes('loading')) {
          results.loading++;
        } else if (text.toLowerCase().includes('error') || text.toLowerCase().includes('failed')) {
          results.error++;
        } else if (text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined' || text === 'N/A') {
          results.null++;
        } else {
          results.populated++;
        }
      });
      
      return results;
    });
    
    dataCheck.emptyValues = dataValues.empty;
    dataCheck.populatedValues = dataValues.populated;
    dataCheck.loadingIndicators = dataValues.loading;
    dataCheck.errorMessages = dataValues.error;
    dataCheck.nullValues = dataValues.null;
    
    testResults.dataValidation.overallDataPopulation = dataCheck;
    
    const totalDataPoints = dataCheck.emptyValues + dataCheck.populatedValues + dataCheck.nullValues;
    const populationRate = totalDataPoints > 0 ? (dataCheck.populatedValues / totalDataPoints * 100).toFixed(1) : 0;
    
    console.log(`  📊 Data Population Statistics:`);
    console.log(`     - Populated values: ${dataCheck.populatedValues}`);
    console.log(`     - Empty values: ${dataCheck.emptyValues}`);
    console.log(`     - Null/N/A values: ${dataCheck.nullValues}`);
    console.log(`     - Loading indicators: ${dataCheck.loadingIndicators}`);
    console.log(`     - Error messages: ${dataCheck.errorMessages}`);
    console.log(`     - Population rate: ${populationRate}%`);
    
    if (populationRate > 70) {
      console.log(`  ✅ Good data population (${populationRate}%)`);
      testResults.summary.passed++;
    } else if (populationRate > 30) {
      console.log(`  ⚠️  Partial data population (${populationRate}%)`);
      testResults.summary.warnings++;
    } else {
      console.log(`  ❌ Poor data population (${populationRate}%)`);
      testResults.summary.failed++;
    }
    
  } catch (error) {
    console.error('❌ Error testing data population:', error);
    testResults.errors.push({ context: 'dataPopulation', error: error.message });
    testResults.summary.failed++;
  }
}

async function checkConsoleErrors(page) {
  console.log('\n🔍 Checking for Console Errors...');
  
  const consoleMessages = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error' || type === 'warning') {
      consoleMessages.push({ type, text, location: msg.location() });
    }
  });
  
  page.on('pageerror', error => {
    consoleMessages.push({ type: 'pageerror', text: error.message, stack: error.stack });
  });
  
  // Give time for any errors to appear
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  testResults.performance.consoleErrors = consoleMessages;
  
  if (consoleMessages.length === 0) {
    console.log('  ✅ No console errors detected');
  } else {
    console.log(`  ⚠️  ${consoleMessages.length} console errors/warnings detected`);
    consoleMessages.slice(0, 5).forEach(msg => {
      console.log(`     - ${msg.type}: ${msg.text.substring(0, 100)}...`);
    });
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📊 TEST SUMMARY:');
  console.log(`  Total Tests: ${testResults.summary.totalTests}`);
  console.log(`  ✅ Passed: ${testResults.summary.passed}`);
  console.log(`  ❌ Failed: ${testResults.summary.failed}`);
  console.log(`  ⚠️  Warnings: ${testResults.summary.warnings}`);
  
  const successRate = testResults.summary.totalTests > 0 
    ? (testResults.summary.passed / testResults.summary.totalTests * 100).toFixed(1)
    : 0;
  console.log(`  Success Rate: ${successRate}%`);
  
  console.log('\n🔐 AUTHENTICATION:');
  console.log(`  Status: ${testResults.authentication.status || 'Unknown'}`);
  console.log(`  URL: ${testResults.authentication.currentUrl || 'N/A'}`);
  
  console.log('\n📑 TAB FUNCTIONALITY:');
  Object.entries(testResults.tabs).forEach(([tabName, data]) => {
    const status = data.found && data.clickable && data.contentLoaded ? '✅' : 
                   data.found ? '⚠️' : '❌';
    console.log(`  ${status} ${tabName}: Found=${data.found}, Clickable=${data.clickable}, Content=${data.contentLoaded}`);
    if (data.data?.visibleDataPoints) {
      console.log(`     Data points: ${data.data.visibleDataPoints}`);
    }
  });
  
  console.log('\n🚀 CORE WEB VITALS:');
  if (testResults.dataValidation.coreWebVitals) {
    Object.entries(testResults.dataValidation.coreWebVitals).forEach(([metric, data]) => {
      if (data.found) {
        console.log(`  ✅ ${metric}: ${data.value} (${data.status || 'no status'})`);
      } else {
        console.log(`  ❌ ${metric}: Not found`);
      }
    });
  } else {
    console.log('  No Core Web Vitals data collected');
  }
  
  console.log('\n⚡ PAGESPEED:');
  if (testResults.dataValidation.pageSpeed) {
    const ps = testResults.dataValidation.pageSpeed;
    if (ps.found) {
      console.log(`  ✅ Score: ${ps.score}`);
      console.log(`  Metrics found: ${Object.keys(ps.metrics).length}`);
    } else {
      console.log('  ❌ PageSpeed data not found');
    }
  }
  
  console.log('\n📊 DATA POPULATION:');
  if (testResults.dataValidation.overallDataPopulation) {
    const dp = testResults.dataValidation.overallDataPopulation;
    const total = dp.populatedValues + dp.emptyValues + dp.nullValues;
    const rate = total > 0 ? (dp.populatedValues / total * 100).toFixed(1) : 0;
    console.log(`  Population Rate: ${rate}%`);
    console.log(`  Populated: ${dp.populatedValues}, Empty: ${dp.emptyValues}, Null: ${dp.nullValues}`);
    if (dp.errorMessages > 0) {
      console.log(`  ⚠️  Error messages found: ${dp.errorMessages}`);
    }
  }
  
  console.log('\n📸 SCREENSHOTS:');
  console.log(`  Total screenshots captured: ${testResults.screenshots.length}`);
  console.log(`  Location: ${CONFIG.screenshotDir}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    testResults.errors.forEach(err => {
      console.log(`  - ${err.context}: ${err.error}`);
    });
  }
  
  console.log('\n🎯 KEY FINDINGS:');
  
  // Analyze and provide recommendations
  const findings = [];
  
  if (!testResults.authentication.isLoggedIn) {
    findings.push('⚠️  Authentication may be required - consider implementing login flow');
  }
  
  const tabsWorking = Object.values(testResults.tabs).filter(t => t.found && t.clickable).length;
  if (tabsWorking < 6) {
    findings.push(`⚠️  Only ${tabsWorking}/6 tabs are fully functional`);
  }
  
  if (testResults.dataValidation.coreWebVitals) {
    const vitalsFound = Object.values(testResults.dataValidation.coreWebVitals).filter(v => v.found).length;
    if (vitalsFound < 3) {
      findings.push('❌ Core Web Vitals data is incomplete or missing');
    }
  }
  
  if (testResults.dataValidation.overallDataPopulation) {
    const dp = testResults.dataValidation.overallDataPopulation;
    const total = dp.populatedValues + dp.emptyValues + dp.nullValues;
    const rate = total > 0 ? (dp.populatedValues / total * 100).toFixed(1) : 0;
    if (rate < 50) {
      findings.push(`❌ Low data population rate (${rate}%) - API integration may have issues`);
    }
  }
  
  if (testResults.performance.consoleErrors?.length > 0) {
    findings.push(`⚠️  ${testResults.performance.consoleErrors.length} console errors detected`);
  }
  
  if (findings.length === 0) {
    findings.push('✅ All major components appear to be working correctly');
  }
  
  findings.forEach(finding => console.log(`  ${finding}`));
  
  console.log('\n' + '='.repeat(80));
  
  // Save report to file
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Main execution
async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Dashboard Test Suite');
  console.log(`📍 Target URL: ${CONFIG.baseUrl}`);
  console.log(`⏱️  Timeout: ${CONFIG.timeout}ms`);
  console.log('');
  
  let browser;
  let page;
  
  try {
    // Ensure screenshot directory exists
    await ensureScreenshotDir();
    
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      defaultViewport: CONFIG.viewport
    });
    
    page = await browser.newPage();
    
    // Set up console error monitoring
    await checkConsoleErrors(page);
    
    // Set timeout
    page.setDefaultTimeout(CONFIG.timeout);
    
    // Run test sequence
    const isAuthenticated = await testAuthentication(page);
    
    if (isAuthenticated || page.url().includes('/dashboard') || page.url().includes('/report')) {
      await testNavigation(page);
      
      const reportFound = await findAndNavigateToReport(page);
      
      if (reportFound) {
        await testReportTabs(page);
        await testCoreWebVitals(page);
        await testPageSpeedData(page);
        await testExecutiveSummary(page);
        await testDataPopulation(page);
      } else {
        console.log('\n⚠️  Could not access report page - some tests skipped');
      }
    } else {
      console.log('\n⚠️  Not authenticated - skipping authenticated tests');
    }
    
    // Generate final report
    await generateReport();
    
  } catch (error) {
    console.error('\n❌ Fatal error during test execution:', error);
    testResults.errors.push({ context: 'fatal', error: error.message, stack: error.stack });
  } finally {
    if (browser) {
      console.log('\n🔒 Closing browser...');
      await browser.close();
    }
  }
  
  console.log('\n✅ Test suite completed!');
  
  // Return exit code based on results
  const exitCode = testResults.summary.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run the test
runComprehensiveTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});