const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDashboard() {
  
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      );
    });

    // First, let's check what's available at the root
    
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
    
    
    // Check current URL
    );
    
    // Look for links to reports or dashboard
    const links = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'));
      return allLinks.map(link => ({
        href: link.href,
        text: link.textContent.trim()
      })).filter(link => link.href);
    });
    
    
    links.forEach(link => {
      if (link.href.includes('report') || link.href.includes('admin') || link.href.includes('dashboard')) {
        
      }
    });
    
    // Try to find a report link
    const reportLink = links.find(link => 
      link.href.includes('/report/') || 
      link.href.includes('/admin/reports')
    );
    
    if (reportLink) {
      
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
      
      
      
      
      
      
      
    } else {
      
      
      // Try direct navigation to known routes
      
      await page.goto('http://localhost:3000/admin/reports', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      
      await delay(2000);
      
      await page.screenshot({ 
        path: 'test-admin-reports.png',
        fullPage: true 
      });
      
    }
    
  } catch (error) {
    
  } finally {
    
    await delay(5000);
    await browser.close();
    
  }
}

// Run the test
testDashboard().catch(console.error);