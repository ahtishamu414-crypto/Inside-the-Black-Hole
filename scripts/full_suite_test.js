import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('=== TEST 1: Guide opens on first visit only ===');
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  // Check if guide is visible
  let guideVisible = await page.evaluate(() => {
    return !!document.querySelector('[data-guide-modal]');
  });
  console.log('Guide visible on fresh visit without key:', guideVisible);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '00_guide_modal_first_visit.png') });

  // Click Next twice and then Start Playing
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent.includes('NEXT'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent.includes('NEXT'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find(b => b.textContent.includes('START PLAYING'));
    if (startBtn) startBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const seenInStorage = await page.evaluate(() => localStorage.getItem('bh5000_guide_seen'));
  console.log('bh5000_guide_seen in localStorage:', seenInStorage);

  // Reload and check if guide does NOT open
  await page.reload({ waitUntil: 'networkidle0' });
  guideVisible = await page.evaluate(() => {
    return !!document.querySelector('[data-guide-modal]');
  });
  console.log('Guide visible on second visit (should be false):', guideVisible);

  console.log('=== TEST 2: Capture all 7 initial screens in React ===');
  const screens = [
    { id: 'overview', name: '01_overview' },
    { id: 'swarm', name: '02_swarm' },
    { id: 'td', name: '03_td' },
    { id: 'env', name: '04_env' },
    { id: 'grrt', name: '05_grrt' },
    { id: 'sim', name: '06_sim' },
    { id: 'analytics', name: '07_analytics' }
  ];

  for (const s of screens) {
    await page.evaluate((sid) => {
      const items = Array.from(document.querySelectorAll('div'));
      // Find sidebar navigation item
      const item = items.find(el => el.textContent && el.textContent.includes(sid.toUpperCase()) || (el.onclick && el.onclick.toString().includes(sid)));
      // Or find button or text
    }, s.id);
  }

  await browser.close();
}

run().catch(console.error);

