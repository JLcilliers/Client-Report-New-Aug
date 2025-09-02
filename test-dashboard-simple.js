const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDashboard() {
  console.log('🚀 Starting simplified dashboard test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });

    // First, let's check what's available at the root
    console.log('📍 Checking main page...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    await delay(2000);
    
    // Take screenshot of main page
    await page.screenshot({ 
      path: 'test-main-page.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: test-main-page.png');
    
    // Check current URL
    console.log('Current URL:', page.url());
    
    // Look for links to reports or dashboard
    const links = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'));
      return allLinks.map(link => ({
        href: link.href,
        text: link.textContent.trim()
      })).filter(link => link.href);
    });
    
    console.log('\n📋 Found links:');
    links.forEach(link => {
      if (link.href.includes('report') || link.href.includes('admin') || link.href.includes('dashboard')) {
        console.log(`  - ${link.text}: ${link.href}`);
      }
    });
    
    // Try to find a report link
    const reportLink = links.find(link => 
      link.href.includes('/report/') || 
      link.href.includes('/admin/reports')
    );
    
    if (reportLink) {
      console.log(`\n🔗 Navigating to: ${reportLink.href}`);
      await page.goto(reportLink.href, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await delay(3000);
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-report-page.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: test-report-page.png');
      
      // Check for data on the page
      const pageContent = await page.evaluate(() => {
        const body = document.body;
        return {
          hasCharts: document.querySelectorAll('canvas, svg, .chart').length > 0,
          hasMetrics: document.querySelectorAll('[class*="metric"], [class*="number"], [class*="stat"]').length > 0,
          hasTabs: document.querySelectorAll('[role="tab"], [class*="tab"], a[href*="#"]').length > 0,
          textLength: body.textContent.length,
          title: document.title
        };
      });
      
      console.log('\n📊 Page Analysis:');
      console.log('  Title:', pageContent.title);
      console.log('  Has Charts:', pageContent.hasCharts ? '✅' : '❌');
      console.log('  Has Metrics:', pageContent.hasMetrics ? '✅' : '❌');
      console.log('  Has Tabs:', pageContent.hasTabs ? '✅' : '❌');
      console.log('  Content Length:', pageContent.textLength, 'characters');
      
      // Look for specific elements
      const elements = await page.evaluate(() => {
        const findElements = (selectors) => {
          for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) return { found: true, selector, text: el.textContent.substring(0, 100) };
          }
          return { found: false };
        };
        
        return {
          searchData: findElements([
            '[class*="search"]',
            '[class*="query"]',
            '[class*="keyword"]',
            '[id*="search"]'
          ]),
          trafficData: findElements([
            '[class*="traffic"]',
            '[class*="users"]',
            '[class*="sessions"]',
            '[id*="traffic"]'
          ]),
          technicalData: findElements([
            '[class*="core-web-vitals"]',
            '[class*="pagespeed"]',
            '[class*="lcp"]',
            '[class*="technical"]'
          ]),
          engagementData: findElements([
            '[class*="engagement"]',
            '[class*="bounce"]',
            '[class*="duration"]',
            '[id*="engagement"]'
          ])
        };
      });
      
      console.log('\n🔍 Element Detection:');
      console.log('  Search Data:', elements.searchData.found ? '✅' : '❌');
      console.log('  Traffic Data:', elements.trafficData.found ? '✅' : '❌');
      console.log('  Technical Data:', elements.technicalData.found ? '✅' : '❌');
      console.log('  Engagement Data:', elements.engagementData.found ? '✅' : '❌');
      
    } else {
      console.log('\n⚠️ No report links found on the main page');
      
      // Try direct navigation to known routes
      console.log('\n🔄 Trying direct navigation to /admin/reports...');
      await page.goto('http://localhost:3000/admin/reports', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      
      await delay(2000);
      
      await page.screenshot({ 
        path: 'test-admin-reports.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: test-admin-reports.png');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    console.log('\n⏸️ Browser will close in 5 seconds...');
    await delay(5000);
    await browser.close();
    console.log('✅ Test completed!');
  }
}

// Run the test
testDashboard().catch(console.error);