import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// Start in-process static server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

const PORT = 3055;
server.listen(PORT, '127.0.0.1', async () => {
  console.log(`📡 In-process test server active at http://127.0.0.1:${PORT}`);
  await runAudit();
});

const VIEWPORTS = [
  // Mobile
  { name: 'Mobile 320x640 (Smallest Mobile)', width: 320, height: 640 },
  { name: 'Mobile 360x800', width: 360, height: 800 },
  { name: 'Mobile 375x812 (iPhone X/11)', width: 375, height: 812 },
  { name: 'Mobile 390x844 (iPhone 12/13/14)', width: 390, height: 844 },
  { name: 'Mobile 430x932 (iPhone 14/15 Pro Max)', width: 430, height: 932 },
  // Tablet
  { name: 'Tablet 600x900 (Small Tablet)', width: 600, height: 900 },
  { name: 'Tablet 768x1024 (iPad Portrait)', width: 768, height: 1024 },
  { name: 'Tablet 820x1180 (iPad Air)', width: 820, height: 1180 },
  { name: 'Tablet 1024x768 (iPad Landscape)', width: 1024, height: 768 },
  // Laptop
  { name: 'Laptop 1280x720', width: 1280, height: 720 },
  { name: 'Laptop 1366x768 (Standard HD Laptop)', width: 1366, height: 768 },
  { name: 'Laptop 1440x900 (MacBook Pro)', width: 1440, height: 900 },
  // Desktop
  { name: 'Desktop 1600x900', width: 1600, height: 900 },
  { name: 'Desktop 1920x1080 (FHD Monitor)', width: 1920, height: 1080 },
  { name: 'Desktop 2560x1440 (2K QHD Display)', width: 2560, height: 1440 }
];

async function runAudit() {
  console.log('🚀 Executing Playwright responsive viewport validation (15 device profiles)...\n');
  const browser = await chromium.launch({ headless: true });
  let totalChecks = 0;
  let passed = 0;
  let failed = 0;
  const violations = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    try {
      // 1. Landing Page
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
      await page.waitForTimeout(300);

      const checkLanding = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });

      totalChecks++;
      if (checkLanding.overflow) {
        failed++;
        violations.push(`[${vp.name}] Landing Page OVERFLOW: scrollWidth ${checkLanding.scrollWidth} > innerWidth ${checkLanding.innerWidth}`);
        console.error(`❌ [${vp.name}] Landing Page OVERFLOW: ${checkLanding.scrollWidth}px vs ${checkLanding.innerWidth}px`);
      } else {
        passed++;
        console.log(`✅ [${vp.name}] Landing Page: NO OVERFLOW (${checkLanding.scrollWidth}px <= ${checkLanding.innerWidth}px)`);
      }

      // 2. Candidate Dashboard
      await page.evaluate(() => {
        localStorage.setItem('careerUser', JSON.stringify({
          user_id: 'test-user-id',
          name: 'Jane Candidate',
          role: 'candidate',
          organization: 'Personal Workspace'
        }));
      });
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
      await page.waitForTimeout(300);

      const checkCandidate = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });

      totalChecks++;
      if (checkCandidate.overflow) {
        failed++;
        violations.push(`[${vp.name}] Candidate Dashboard OVERFLOW: scrollWidth ${checkCandidate.scrollWidth} > innerWidth ${checkCandidate.innerWidth}`);
        console.error(`❌ [${vp.name}] Candidate Dashboard OVERFLOW: ${checkCandidate.scrollWidth}px vs ${checkCandidate.innerWidth}px`);
      } else {
        passed++;
        console.log(`✅ [${vp.name}] Candidate Dashboard: NO OVERFLOW`);
      }

      // 3. Recruiter Dashboard
      await page.evaluate(() => {
        localStorage.setItem('careerUser', JSON.stringify({
          user_id: 'recruiter-user-id',
          name: 'Apex Recruiting',
          role: 'recruiter',
          organization: 'Apex Global'
        }));
      });
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
      await page.waitForTimeout(300);

      const checkRecruiter = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });

      totalChecks++;
      if (checkRecruiter.overflow) {
        failed++;
        violations.push(`[${vp.name}] Recruiter Dashboard OVERFLOW: scrollWidth ${checkRecruiter.scrollWidth} > innerWidth ${checkRecruiter.innerWidth}`);
        console.error(`❌ [${vp.name}] Recruiter Dashboard OVERFLOW: ${checkRecruiter.scrollWidth}px vs ${checkRecruiter.innerWidth}px`);
      } else {
        passed++;
        console.log(`✅ [${vp.name}] Recruiter Dashboard: NO OVERFLOW`);
      }

    } catch (err) {
      console.error(`💥 [${vp.name}] Error:`, err.message);
      failed++;
      violations.push(`[${vp.name}] Exception: ${err.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  server.close();

  console.log('\n=============================================');
  console.log(`📊 RESPONSIVE AUDIT SUMMARY:`);
  console.log(`Total Breakpoints Tested: ${VIEWPORTS.length}`);
  console.log(`Total Page Surface Checks: ${totalChecks}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('=============================================\n');

  if (failed > 0) {
    console.error('Violations detected:');
    violations.forEach(v => console.error(' -', v));
    process.exit(1);
  } else {
    console.log('🎉 100% RESPONSIVE DESIGN VERIFIED ACROSS ALL 15 VIEWPORTS!');
    process.exit(0);
  }
}

