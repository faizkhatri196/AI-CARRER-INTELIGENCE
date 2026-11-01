import { chromium } from 'playwright';

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

async function runResponsiveAudit() {
  console.log('🚀 Launching automated Playwright responsive audit across 15 viewports...\n');
  const browser = await chromium.launch({ headless: true });
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failureDetails = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    try {
      // 1. Audit Landing Page
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      const overflowLanding = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });

      totalTests++;
      if (overflowLanding.overflow) {
        failedTests++;
        failureDetails.push(`[${vp.name}] Landing Page horizontal overflow: scrollWidth ${overflowLanding.scrollWidth} > innerWidth ${overflowLanding.innerWidth}`);
        console.error(`❌ [${vp.name}] Landing Page OVERFLOW: ${overflowLanding.scrollWidth}px vs ${overflowLanding.innerWidth}px`);
      } else {
        passedTests++;
        console.log(`✅ [${vp.name}] Landing Page OK (${overflowLanding.scrollWidth}px <= ${overflowLanding.innerWidth}px)`);
      }

      // 2. Audit Candidate Dashboard (Injecting session)
      await page.evaluate(() => {
        localStorage.setItem('careerUser', JSON.stringify({
          user_id: 'test-audit-user',
          name: 'Alex Rivera',
          role: 'candidate',
          organization: 'Personal'
        }));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      const overflowCandidate = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });

      totalTests++;
      if (overflowCandidate.overflow) {
        failedTests++;
        failureDetails.push(`[${vp.name}] Candidate Dashboard horizontal overflow: scrollWidth ${overflowCandidate.scrollWidth} > innerWidth ${overflowCandidate.innerWidth}`);
        console.error(`❌ [${vp.name}] Candidate Dashboard OVERFLOW: ${overflowCandidate.scrollWidth}px vs ${overflowCandidate.innerWidth}px`);
      } else {
        passedTests++;
        console.log(`✅ [${vp.name}] Candidate Dashboard OK`);
      }

      // 3. Audit Recruiter Dashboard
      await page.evaluate(() => {
        localStorage.setItem('careerUser', JSON.stringify({
          user_id: 'recruiter-audit-user',
          name: 'Sarah Chen',
          role: 'recruiter',
          organization: 'Apex Talent'
        }));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      const overflowRecruiter = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });

      totalTests++;
      if (overflowRecruiter.overflow) {
        failedTests++;
        failureDetails.push(`[${vp.name}] Recruiter Dashboard horizontal overflow: scrollWidth ${overflowRecruiter.scrollWidth} > innerWidth ${overflowRecruiter.innerWidth}`);
        console.error(`❌ [${vp.name}] Recruiter Dashboard OVERFLOW: ${overflowRecruiter.scrollWidth}px vs ${overflowRecruiter.innerWidth}px`);
      } else {
        passedTests++;
        console.log(`✅ [${vp.name}] Recruiter Dashboard OK`);
      }

    } catch (err) {
      console.error(`💥 Error in ${vp.name}:`, err.message);
      failedTests++;
      failureDetails.push(`[${vp.name}] Execution error: ${err.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n=============================================');
  console.log(`📊 RESPONSIVE AUDIT RESULTS:`);
  console.log(`Total Checks: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('=============================================\n');

  if (failedTests > 0) {
    console.error('Violations detected:');
    failureDetails.forEach(f => console.error(' -', f));
    process.exit(1);
  } else {
    console.log('🎉 100% RESPONSIVE DESIGN VERIFIED ACROSS ALL 15 VIEWPORT SIZES!');
    process.exit(0);
  }
}

runResponsiveAudit();
