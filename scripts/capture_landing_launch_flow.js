import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
];
const chromePath = chromePaths.find(p => fs.existsSync(p));

const outDir = 'e:/Black Hole/screenshots/landing';
const brainDir = 'C:/Users/BN Com/.gemini/antigravity/brain/bd45780c-9542-4e4e-8923-f37efe4d395e/screenshots/landing';
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(brainDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--window-size=1920,1080', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Screenshot idle state
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '01_idle.png') });
  await page.screenshot({ path: path.join(brainDir, '01_idle.png') });
  console.log('Captured 01_idle.png');

  // 2. Click LAUNCH MISSION button
  console.log('Triggering LAUNCH MISSION...');
  await page.keyboard.press('Enter');

  // 3. Screenshot T-3 (wait 2500ms -> t ~ 2.5s, countdown number 3)
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outDir, '02_countdown_t3.png') });
  await page.screenshot({ path: path.join(brainDir, '02_countdown_t3.png') });
  console.log('Captured 02_countdown_t3.png');

  // 4. Screenshot Liftoff (wait 4000ms -> t ~ 6.5s)
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(outDir, '03_liftoff.png') });
  await page.screenshot({ path: path.join(brainDir, '03_liftoff.png') });
  console.log('Captured 03_liftoff.png');

  // 5. Screenshot Stage Separation (wait 2500ms -> t ~ 9.0s)
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outDir, '04_stage_separation.png') });
  await page.screenshot({ path: path.join(brainDir, '04_stage_separation.png') });
  console.log('Captured 04_stage_separation.png');

  // 6. Screenshot Orbit (wait 2000ms -> t ~ 11.0s)
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '05_orbit.png') });
  await page.screenshot({ path: path.join(brainDir, '05_orbit.png') });
  console.log('Captured 05_orbit.png');

  // 7. Screenshot Black Hole Reveal (wait 2000ms -> t ~ 13.0s)
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '06_black_hole_reveal.png') });
  await page.screenshot({ path: path.join(brainDir, '06_black_hole_reveal.png') });
  console.log('Captured 06_black_hole_reveal.png');

  // 8. Screenshot Dashboard Handoff (wait 2000ms -> t ~ 15.0s)
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '07_dashboard_handoff.png') });
  await page.screenshot({ path: path.join(brainDir, '07_dashboard_handoff.png') });
  console.log('Captured 07_dashboard_handoff.png');

  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console errors encountered:', consoleErrors);
  }

  await browser.close();
  console.log('All landing and launch frames captured successfully!');
}

run().catch(console.error);
