import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

async function testAstroFailure() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Dismiss guide
  await page.evaluate(() => {
    try { localStorage.setItem('bh5000_guide_seen', '1'); } catch(e){}
    const btns = Array.from(document.querySelectorAll('button'));
    const sp = btns.find(b => b.textContent.includes('START PLAYING'));
    if (sp) sp.click();
    else {
      btns.filter(b => b.textContent.includes('NEXT')).forEach(b => b.click());
      const sp2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START PLAYING'));
      if (sp2) sp2.click();
    }
  });
  await new Promise(r => setTimeout(r, 200));

  // Reset
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const r = btns.find(b => b.textContent.trim() === 'RESET');
    if (r) r.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Select ASTROPHYSICIST
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aBtn = btns.find(b => b.textContent.trim() === 'ASTROPHYSICIST');
    if (aBtn) aBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Select Close orbit
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent.includes('Close-Approach') || b.textContent.includes('Close'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Navigate to Time Dilation (03) and reposition to 1.5 Rs
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="td"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  await page.evaluate(() => {
    const range = document.querySelector('input[type="range"]');
    if (range) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(range, '1.5');
      range.dispatchEvent(new Event('input', { bubbles: true }));
      range.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 300));

  // Verify r was updated
  const currentR = await page.evaluate(() => {
    return document.body.innerText;
  });
  console.log('Includes 1.50 Rs:', currentR.includes('1.50') || currentR.includes('1.5'));

  // Go to Sim (06), set 10x, START
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="sim"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const s10 = btns.find(b => b.textContent.trim() === '10x');
    if (s10) s10.click();
    const s = btns.find(b => b.textContent.trim() === 'START');
    if (s) s.click();
  });

  let failureResult = null;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 200));
    // Resolve event if open
    await page.evaluate(() => {
      const modal = document.querySelector('[data-event-modal]');
      if (modal) {
        const choiceBtn = modal.querySelector('button[data-choice="0"]');
        if (choiceBtn) choiceBtn.click();
      }
    });

    failureResult = await page.evaluate(() => {
      const outcome = document.querySelector('[data-screen-label="08 Mission Outcome"]');
      if (outcome && outcome.innerText.includes('MISSION FAILED')) {
        return outcome.innerText;
      }
      return null;
    });
    if (failureResult) break;
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'astrophysicist_actual_failure.png') });
  console.log('ASTROPHYSICIST FAILURE DEBRIEF:\n', failureResult);

  await browser.close();
}

testAstroFailure().catch(console.error);

