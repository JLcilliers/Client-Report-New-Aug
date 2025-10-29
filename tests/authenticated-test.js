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
    
    return filepath;
  } catch (error) {
    
    return null;
  }
}

async function authenticate(page) {
  
  
  try {
    // Navigate to homepage
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await takeScreenshot(page, 'login-page');
    
    // Check if already authenticated
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      
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
      
      results.authentication.status = 'google_auth_available';
    }
    
    
    results.authentication.status = 'not_authenticated';
    return false;
    
  } catch (error) {
    
    results.authentication.error = error.message;
    results.errors.push({ context: 'authentication', error: error.message });
    return false;
  }
}

async function testNavigation(page) {
  
  
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
        
        await takeScreenshot(page, `nav-${item.name}`);
      } else {
        
      }
      
    } catch (error) {
      
      results.navigation.items[item.name] = {
        accessible: false,
        error: error.message
      };
    }
  }
}

async function findAndTestReport(page) {
  
  
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
    
    
    results.reports.foundReport = false;
    return false;
    
  } catch (error) {
    
    results.reports.error = error.message;
    return false;
  }
}

async function testReportTabs(page) {
  
  
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
          
        } else {
          
        }
        
        // Special handling for Technical tab - Core Web Vitals
        if (tab.name === 'Technical') {
          await testCoreWebVitals(page);
        }
        
      } else {
        
        results.tabs[tab.name] = { found: false };
      }
      
    } catch (error) {
      
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
      
      foundVitals.forEach(([metric, data]) => {
        ` : ''}`);
      });
    } else {
      
    }
    
  } catch (error) {
    
    results.coreWebVitals.error = error.message;
  }
}

async function testDataPopulation(page) {
  
  
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
    
    
    
    `);
    
    
    
    
    if (populationRate > 60) {
      
    } else if (populationRate > 30) {
      
    } else {
      
    }
    
  } catch (error) {
    
    results.dataValidation.error = error.message;
  }
}

async function generateFinalReport() {
  );
  
  );
  
  
  
  if (results.authentication.url) {
    
  }
  
  
  if (results.navigation.items) {
    Object.entries(results.navigation.items).forEach(([name, data]) => {
      const icon = data.accessible ? '✅' : '❌';
      
    });
  }
  
  
  
  if (results.reports.reportId) {
    
  }
  
  
  if (results.tabs) {
    Object.entries(results.tabs).forEach(([name, data]) => {
      if (data.found && data.clicked && data.contentFound) {
        
        if (data.data?.metrics && Object.keys(data.data.metrics).length > 0) {
          }`);
        }
      } else if (data.found && data.clicked) {
        
      } else {
        
      }
    });
  }
  
  
  if (results.coreWebVitals && Object.keys(results.coreWebVitals).length > 0) {
    Object.entries(results.coreWebVitals).forEach(([metric, data]) => {
      if (data.found) {
        ` : ''}`);
      } else if (!data.error) {
        
      }
    });
  } else {
    
  }
  
  
  if (results.dataValidation && !results.dataValidation.error) {
    const dv = results.dataValidation;
    const rate = dv.totalDataElements > 0 
      ? ((dv.populatedElements / dv.totalDataElements) * 100).toFixed(1)
      : 0;
    
    
    
    
  }
  
  
  
  
  
  if (results.errors.length > 0) {
    
    results.errors.forEach(err => {
      
    });
  }
  
  
  
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
  
  findings.forEach(finding => );
  
  );
  
  // Save detailed report
  const reportPath = path.join(__dirname, `auth-test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  
}

// Main execution
async function runAuthenticatedTest() {
  
  
  
  
  
  let browser;
  
  try {
    await ensureScreenshotDir();
    
    // Launch browser
    
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
      
    }
    
    // Generate final report
    await generateFinalReport();
    
  } catch (error) {
    
    results.errors.push({ context: 'fatal', error: error.message });
  } finally {
    if (browser) {
      
      await browser.close();
    }
  }
  
  
  
  // Return appropriate exit code
  const hasErrors = results.errors.length > 0;
  const hasCriticalIssues = !results.authentication.status || 
                           !results.reports.foundReport ||
                           (results.dataValidation && results.dataValidation.populatedElements === 0);
  
  process.exit(hasErrors || hasCriticalIssues ? 1 : 0);
}

// Run the test
runAuthenticatedTest().catch(error => {
  
  process.exit(1);
});