const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 60000,
  viewport: { width: 1920, height: 1080 },
  screenshotDir: path.join(__dirname, 'screenshots-auth'),
  headless: false, // Show browser for debugging
  slowMo: 100 // Slow down for visibility
};

// Test results
const results = {
  timestamp: new Date().toISOString(),
  authentication: {},
  navigation: {},
  reports: {},
  tabs: {},
  coreWebVitals: {},
  pageSpeed: {},
  dataValidation: {},
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
    const safeName = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const filename = `${safeName}-${timestamp}.png`;
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

async function authenticate(page) {
  console.log('\n🔐 Authenticating...');
  
  try {
    // Navigate to homepage
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await takeScreenshot(page, 'login-page');
    
    // Check if already authenticated
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('  ✅ Already authenticated');
      results.authentication.status = 'already_authenticated';
      return true;
    }
    
    // Look for Quick Admin Access button
    const demoButtonSelector = 'button:has-text("Quick Admin Access")';
    const hasDemoButton = await page.evaluate((selector) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.innerText.includes('Quick Admin Access'));
    });
    
    if (hasDemoButton) {
      console.log('  🔍 Found Quick Admin Access button');
      
      // Click the demo access button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const demoBtn = buttons.find(btn => btn.innerText.includes('Quick Admin Access'));
        if (demoBtn) demoBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await takeScreenshot(page, 'after-demo-login');
      
      const newUrl = page.url();
      if (newUrl.includes('/dashboard') || newUrl !== currentUrl) {
        console.log('  ✅ Demo authentication successful');
        results.authentication.status = 'demo_auth_success';
        results.authentication.url = newUrl;
        return true;
      }
    }
    
    // Try Google Sign-in button as fallback
    const googleButtonExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.innerText.includes('Sign in with Google'));
    });
    
    if (googleButtonExists) {
      console.log('  ℹ️  Google Sign-in available but requires real authentication');
      results.authentication.status = 'google_auth_available';
    }
    
    console.log('  ⚠️  Could not authenticate automatically');
    results.authentication.status = 'not_authenticated';
    return false;
    
  } catch (error) {
    console.error('  ❌ Authentication error:', error.message);
    results.authentication.error = error.message;
    results.errors.push({ context: 'authentication', error: error.message });
    return false;
  }
}

async function testNavigation(page) {
  console.log('\n🧭 Testing Navigation...');
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Reports', path: '/reports' },
    { name: 'Properties', path: '/properties' },
    { name: 'Connections', path: '/connections' },
    { name: 'Settings', path: '/settings' }
  ];
  
  results.navigation.items = {};
  
  for (const item of navItems) {
    try {
      console.log(`  Testing ${item.name}...`);
      await page.goto(`${CONFIG.baseUrl}${item.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await page.evaluate(() => {
        return {
          title: document.title,
          hasContent: document.body.innerText.length > 50,
          url: window.location.href,
          statusCode: window.performance.getEntriesByType('navigation')[0]?.responseStatus || 200
        };
      });
      
      results.navigation.items[item.name] = {
        accessible: response.statusCode !== 404,
        hasContent: response.hasContent,
        url: response.url
      };
      
      if (response.statusCode !== 404) {
        console.log(`    ✅ ${item.name} accessible`);
        await takeScreenshot(page, `nav-${item.name}`);
      } else {
        console.log(`    ⚠️  ${item.name} returned 404`);
      }
      
    } catch (error) {
      console.log(`    ❌ ${item.name} error: ${error.message}`);
      results.navigation.items[item.name] = {
        accessible: false,
        error: error.message
      };
    }
  }
}

async function findAndTestReport(page) {
  console.log('\n📊 Finding and Testing Reports...');
  
  try {
    // First, try to navigate to reports page
    await page.goto(`${CONFIG.baseUrl}/reports`, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're on a valid reports page
    const hasReportsContent = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('report') || text.includes('client');
    });
    
    if (!hasReportsContent) {
      // Try to create a demo report or find existing one
      console.log('  🔍 Looking for existing reports...');
      
      // Try direct report URLs
      const testReportIds = ['1', '2', 'demo', 'test', 'sample'];
      
      for (const id of testReportIds) {
        try {
          await page.goto(`${CONFIG.baseUrl}/report/${id}`, { waitUntil: 'domcontentloaded' });
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const isValidReport = await page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            const hasError = text.includes('error') || text.includes('not found');
            const hasReportContent = text.includes('insights') || text.includes('traffic') || 
                                    text.includes('search') || text.includes('technical');
            return !hasError && hasReportContent;
          });
          
          if (isValidReport) {
            console.log(`  ✅ Found valid report: ${id}`);
            results.reports.foundReport = true;
            results.reports.reportId = id;
            await takeScreenshot(page, `report-${id}`);
            return true;
          }
        } catch (error) {
          // Continue to next ID
        }
      }
    }
    
    console.log('  ⚠️  No valid reports found');
    results.reports.foundReport = false;
    return false;
    
  } catch (error) {
    console.error('  ❌ Error finding reports:', error.message);
    results.reports.error = error.message;
    return false;
  }
}

async function testReportTabs(page) {
  console.log('\n📑 Testing Report Tabs...');
  
  const tabs = [
    { name: 'Insights', expectedContent: ['summary', 'overview', 'performance', 'metrics'] },
    { name: 'Search', expectedContent: ['queries', 'impressions', 'clicks', 'ctr', 'position'] },
    { name: 'Traffic', expectedContent: ['sessions', 'users', 'pageviews', 'sources'] },
    { name: 'Engagement', expectedContent: ['bounce', 'duration', 'pages per session'] },
    { name: 'Technical', expectedContent: ['core web vitals', 'pagespeed', 'lcp', 'fid', 'cls'] },
    { name: 'Visualize', expectedContent: ['chart', 'graph', 'visualization'] }
  ];
  
  results.tabs = {};
  
  for (const tab of tabs) {
    console.log(`  Testing ${tab.name} tab...`);
    
    try {
      // Try to click the tab
      const tabClicked = await page.evaluate((tabName) => {
        const elements = Array.from(document.querySelectorAll('button, a, [role="tab"], .tab'));
        const tabElement = elements.find(el => {
          const text = el.innerText || el.textContent || '';
          return text.toLowerCase().includes(tabName.toLowerCase());
        });
        
        if (tabElement) {
          tabElement.click();
          return true;
        }
        return false;
      }, tab.name);
      
      if (tabClicked) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for expected content
        const contentFound = await page.evaluate((expectedWords) => {
          const pageText = document.body.innerText.toLowerCase();
          return expectedWords.some(word => pageText.includes(word));
        }, tab.expectedContent);
        
        // Extract specific data for the tab
        const tabData = await extractTabData(page, tab.name);
        
        results.tabs[tab.name] = {
          found: true,
          clicked: true,
          contentFound,
          data: tabData
        };
        
        await takeScreenshot(page, `tab-${tab.name}`);
        
        if (contentFound) {
          console.log(`    ✅ ${tab.name} tab working with content`);
        } else {
          console.log(`    ⚠️  ${tab.name} tab clicked but content unclear`);
        }
        
        // Special handling for Technical tab - Core Web Vitals
        if (tab.name === 'Technical') {
          await testCoreWebVitals(page);
        }
        
      } else {
        console.log(`    ❌ ${tab.name} tab not found`);
        results.tabs[tab.name] = { found: false };
      }
      
    } catch (error) {
      console.log(`    ❌ Error with ${tab.name} tab: ${error.message}`);
      results.tabs[tab.name] = { found: false, error: error.message };
    }
  }
}

async function extractTabData(page, tabName) {
  try {
    const data = await page.evaluate((tab) => {
      const result = {
        dataPoints: 0,
        metrics: {},
        hasData: false
      };
      
      // Count data elements
      const dataElements = document.querySelectorAll('[data-value], .metric-value, .stat-value, .data-point');
      result.dataPoints = dataElements.length;
      
      // Extract specific metrics based on tab
      const bodyText = document.body.innerText;
      
      if (tab === 'Technical') {
        // Look for Core Web Vitals
        ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].forEach(metric => {
          const regex = new RegExp(`${metric}[:\\s]+([0-9.]+\\s*[ms]*)`);
          const match = bodyText.match(regex);
          if (match) {
            result.metrics[metric] = match[1];
          }
        });
        
        // Look for PageSpeed score
        const pageSpeedMatch = bodyText.match(/(?:PageSpeed|Performance)[:\\s]+([0-9]+)/i);
        if (pageSpeedMatch) {
          result.metrics.PageSpeed = pageSpeedMatch[1];
        }
      } else if (tab === 'Search') {
        // Look for search metrics
        const impressionsMatch = bodyText.match(/Impressions[:\\s]+([0-9,]+)/i);
        const clicksMatch = bodyText.match(/Clicks[:\\s]+([0-9,]+)/i);
        const ctrMatch = bodyText.match(/CTR[:\\s]+([0-9.]+%?)/i);
        
        if (impressionsMatch) result.metrics.impressions = impressionsMatch[1];
        if (clicksMatch) result.metrics.clicks = clicksMatch[1];
        if (ctrMatch) result.metrics.ctr = ctrMatch[1];
      } else if (tab === 'Traffic') {
        // Look for traffic metrics
        const sessionsMatch = bodyText.match(/Sessions[:\\s]+([0-9,]+)/i);
        const usersMatch = bodyText.match(/Users[:\\s]+([0-9,]+)/i);
        
        if (sessionsMatch) result.metrics.sessions = sessionsMatch[1];
        if (usersMatch) result.metrics.users = usersMatch[1];
      }
      
      result.hasData = result.dataPoints > 0 || Object.keys(result.metrics).length > 0;
      
      return result;
    }, tabName);
    
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

async function testCoreWebVitals(page) {
  console.log('\n    🚀 Testing Core Web Vitals specifically...');
  
  try {
    const vitals = await page.evaluate(() => {
      const result = {};
      const bodyText = document.body.innerText;
      
      // Define metrics to look for
      const metrics = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
      
      metrics.forEach(metric => {
        // Try multiple patterns
        const patterns = [
          new RegExp(`${metric}[:\\s]+([0-9.]+\\s*[ms]*)`),
          new RegExp(`${metric}\\s*\\n\\s*([0-9.]+)`),
          new RegExp(`"${metric}"[:\\s]+([0-9.]+)`)
        ];
        
        for (const pattern of patterns) {
          const match = bodyText.match(pattern);
          if (match) {
            result[metric] = {
              found: true,
              value: match[1].trim()
            };
            
            // Check for status (good/needs improvement/poor)
            const contextText = bodyText.substring(
              Math.max(0, bodyText.indexOf(metric) - 50),
              Math.min(bodyText.length, bodyText.indexOf(metric) + 100)
            );
            
            if (contextText.toLowerCase().includes('good')) {
              result[metric].status = 'good';
            } else if (contextText.toLowerCase().includes('needs improvement')) {
              result[metric].status = 'needs improvement';
            } else if (contextText.toLowerCase().includes('poor')) {
              result[metric].status = 'poor';
            }
            
            break;
          }
        }
        
        if (!result[metric]) {
          result[metric] = { found: false };
        }
      });
      
      return result;
    });
    
    results.coreWebVitals = vitals;
    
    // Report findings
    const foundVitals = Object.entries(vitals).filter(([_, data]) => data.found);
    if (foundVitals.length > 0) {
      console.log(`      ✅ Found ${foundVitals.length} Core Web Vitals:`);
      foundVitals.forEach(([metric, data]) => {
        console.log(`        ${metric}: ${data.value} ${data.status ? `(${data.status})` : ''}`);
      });
    } else {
      console.log('      ⚠️  No Core Web Vitals metrics found');
    }
    
  } catch (error) {
    console.error('      ❌ Error testing Core Web Vitals:', error.message);
    results.coreWebVitals.error = error.message;
  }
}

async function testDataPopulation(page) {
  console.log('\n📊 Testing Overall Data Population...');
  
  try {
    const dataAnalysis = await page.evaluate(() => {
      const analysis = {
        totalDataElements: 0,
        populatedElements: 0,
        emptyElements: 0,
        loadingElements: 0,
        errorElements: 0,
        tables: 0,
        charts: 0,
        forms: 0
      };
      
      // Check all data containers
      const dataSelectors = [
        '[data-value]',
        '.metric-value',
        '.stat-value',
        '.data-point',
        'td',
        '.number',
        '.count'
      ];
      
      dataSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          analysis.totalDataElements++;
          const text = (el.innerText || el.textContent || '').trim();
          
          if (!text || text === '-' || text === 'N/A') {
            analysis.emptyElements++;
          } else if (text.toLowerCase().includes('loading')) {
            analysis.loadingElements++;
          } else if (text.toLowerCase().includes('error')) {
            analysis.errorElements++;
          } else {
            analysis.populatedElements++;
          }
        });
      });
      
      // Count other elements
      analysis.tables = document.querySelectorAll('table').length;
      analysis.charts = document.querySelectorAll('canvas, svg.chart, .chart-container').length;
      analysis.forms = document.querySelectorAll('form').length;
      
      return analysis;
    });
    
    results.dataValidation = dataAnalysis;
    
    const populationRate = dataAnalysis.totalDataElements > 0 
      ? ((dataAnalysis.populatedElements / dataAnalysis.totalDataElements) * 100).toFixed(1)
      : 0;
    
    console.log(`  📊 Data Analysis:`);
    console.log(`     Total elements: ${dataAnalysis.totalDataElements}`);
    console.log(`     Populated: ${dataAnalysis.populatedElements} (${populationRate}%)`);
    console.log(`     Empty: ${dataAnalysis.emptyElements}`);
    console.log(`     Tables: ${dataAnalysis.tables}`);
    console.log(`     Charts: ${dataAnalysis.charts}`);
    
    if (populationRate > 60) {
      console.log(`  ✅ Good data population rate`);
    } else if (populationRate > 30) {
      console.log(`  ⚠️  Moderate data population rate`);
    } else {
      console.log(`  ❌ Low data population rate`);
    }
    
  } catch (error) {
    console.error('  ❌ Error analyzing data:', error.message);
    results.dataValidation.error = error.message;
  }
}

async function generateFinalReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE TEST REPORT - SEARCH INSIGHTS HUB');
  console.log('='.repeat(80));
  
  console.log('\n🔐 AUTHENTICATION:');
  console.log(`  Status: ${results.authentication.status || 'Unknown'}`);
  if (results.authentication.url) {
    console.log(`  URL: ${results.authentication.url}`);
  }
  
  console.log('\n🧭 NAVIGATION:');
  if (results.navigation.items) {
    Object.entries(results.navigation.items).forEach(([name, data]) => {
      const icon = data.accessible ? '✅' : '❌';
      console.log(`  ${icon} ${name}: ${data.accessible ? 'Accessible' : 'Not accessible'}`);
    });
  }
  
  console.log('\n📊 REPORTS:');
  console.log(`  Report found: ${results.reports.foundReport ? 'Yes' : 'No'}`);
  if (results.reports.reportId) {
    console.log(`  Report ID: ${results.reports.reportId}`);
  }
  
  console.log('\n📑 TAB FUNCTIONALITY:');
  if (results.tabs) {
    Object.entries(results.tabs).forEach(([name, data]) => {
      if (data.found && data.clicked && data.contentFound) {
        console.log(`  ✅ ${name}: Fully functional`);
        if (data.data?.metrics && Object.keys(data.data.metrics).length > 0) {
          console.log(`     Metrics: ${JSON.stringify(data.data.metrics)}`);
        }
      } else if (data.found && data.clicked) {
        console.log(`  ⚠️  ${name}: Clickable but content unclear`);
      } else {
        console.log(`  ❌ ${name}: Not found`);
      }
    });
  }
  
  console.log('\n🚀 CORE WEB VITALS:');
  if (results.coreWebVitals && Object.keys(results.coreWebVitals).length > 0) {
    Object.entries(results.coreWebVitals).forEach(([metric, data]) => {
      if (data.found) {
        console.log(`  ✅ ${metric}: ${data.value} ${data.status ? `(${data.status})` : ''}`);
      } else if (!data.error) {
        console.log(`  ❌ ${metric}: Not found`);
      }
    });
  } else {
    console.log('  ⚠️  No Core Web Vitals data collected');
  }
  
  console.log('\n📊 DATA VALIDATION:');
  if (results.dataValidation && !results.dataValidation.error) {
    const dv = results.dataValidation;
    const rate = dv.totalDataElements > 0 
      ? ((dv.populatedElements / dv.totalDataElements) * 100).toFixed(1)
      : 0;
    console.log(`  Population rate: ${rate}%`);
    console.log(`  Total elements: ${dv.totalDataElements}`);
    console.log(`  Populated: ${dv.populatedElements}`);
    console.log(`  Charts: ${dv.charts}, Tables: ${dv.tables}`);
  }
  
  console.log('\n📸 SCREENSHOTS:');
  console.log(`  Total captured: ${results.screenshots.length}`);
  console.log(`  Location: ${CONFIG.screenshotDir}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    results.errors.forEach(err => {
      console.log(`  - ${err.context}: ${err.error}`);
    });
  }
  
  console.log('\n🎯 KEY FINDINGS & RECOMMENDATIONS:');
  
  const findings = [];
  
  // Authentication findings
  if (results.authentication.status === 'not_authenticated') {
    findings.push('❌ Authentication required - implement login flow or use demo access');
  } else if (results.authentication.status === 'demo_auth_success') {
    findings.push('✅ Demo authentication working correctly');
  }
  
  // Navigation findings
  if (results.navigation.items) {
    const notAccessible = Object.entries(results.navigation.items)
      .filter(([_, data]) => !data.accessible)
      .map(([name]) => name);
    if (notAccessible.length > 0) {
      findings.push(`⚠️  Pages not accessible: ${notAccessible.join(', ')}`);
    }
  }
  
  // Report findings
  if (!results.reports.foundReport) {
    findings.push('❌ No reports found - need to create sample reports or fix report loading');
  }
  
  // Tab findings
  if (results.tabs) {
    const workingTabs = Object.values(results.tabs).filter(t => t.found && t.clicked && t.contentFound).length;
    if (workingTabs < 6) {
      findings.push(`⚠️  Only ${workingTabs}/6 tabs fully functional`);
    } else {
      findings.push('✅ All report tabs functional');
    }
  }
  
  // Core Web Vitals findings
  if (results.coreWebVitals) {
    const foundVitals = Object.values(results.coreWebVitals).filter(v => v.found).length;
    if (foundVitals === 0) {
      findings.push('❌ Core Web Vitals not displaying - check API integration');
    } else if (foundVitals < 3) {
      findings.push(`⚠️  Only ${foundVitals} Core Web Vitals metrics found`);
    } else {
      findings.push(`✅ Core Web Vitals displaying correctly (${foundVitals} metrics)`);
    }
  }
  
  // Data population findings
  if (results.dataValidation && results.dataValidation.totalDataElements > 0) {
    const rate = ((results.dataValidation.populatedElements / results.dataValidation.totalDataElements) * 100).toFixed(1);
    if (rate < 30) {
      findings.push(`❌ Very low data population (${rate}%) - check API connections`);
    } else if (rate < 60) {
      findings.push(`⚠️  Moderate data population (${rate}%) - some data missing`);
    } else {
      findings.push(`✅ Good data population (${rate}%)`);
    }
  }
  
  if (findings.length === 0) {
    findings.push('✅ All systems functioning normally');
  }
  
  findings.forEach(finding => console.log(`  ${finding}`));
  
  console.log('\n' + '='.repeat(80));
  
  // Save detailed report
  const reportPath = path.join(__dirname, `auth-test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed JSON report saved to: ${reportPath}`);
}

// Main execution
async function runAuthenticatedTest() {
  console.log('🚀 Starting Authenticated Dashboard Test');
  console.log(`📍 URL: ${CONFIG.baseUrl}`);
  console.log(`🔧 Mode: ${CONFIG.headless ? 'Headless' : 'Browser Visible'}`);
  console.log('');
  
  let browser;
  
  try {
    await ensureScreenshotDir();
    
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      defaultViewport: CONFIG.viewport
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(CONFIG.timeout);
    
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.errors.push({ 
          context: 'console', 
          error: msg.text().substring(0, 200) 
        });
      }
    });
    
    // Authenticate
    const isAuthenticated = await authenticate(page);
    
    if (isAuthenticated) {
      // Test navigation
      await testNavigation(page);
      
      // Find and test reports
      const reportFound = await findAndTestReport(page);
      
      if (reportFound) {
        // Test report tabs
        await testReportTabs(page);
        
        // Test data population
        await testDataPopulation(page);
      }
    } else {
      console.log('\n⚠️  Skipping authenticated tests due to authentication failure');
    }
    
    // Generate final report
    await generateFinalReport();
    
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
  
  // Return appropriate exit code
  const hasErrors = results.errors.length > 0;
  const hasCriticalIssues = !results.authentication.status || 
                           !results.reports.foundReport ||
                           (results.dataValidation && results.dataValidation.populatedElements === 0);
  
  process.exit(hasErrors || hasCriticalIssues ? 1 : 0);
}

// Run the test
runAuthenticatedTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});