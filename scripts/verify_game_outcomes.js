import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

async function runVerification() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. CADET SUCCESS RUN
  console.log('=== RUN 1: CADET Photon Sphere Success Run ===');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  // Close guide
  await page.evaluate(() => {
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

  // Ensure CADET difficulty is selected
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cadetBtn = btns.find(b => b.textContent.trim() === 'CADET');
    if (cadetBtn) cadetBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Navigate to Simulation screen (06)
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="sim"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Set speed to 10x
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const speed10 = btns.find(b => b.textContent.trim() === '10x');
    if (speed10) speed10.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Click START
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find(b => b.textContent.trim() === 'START');
    if (startBtn) startBtn.click();
  });

  // Loop until outcome screen appears
  let cadetSuccess = false;
  let cadetScore = null;
  let cadetAnalysis = null;
  let cadetReason = null;

  for (let poll = 0; poll < 150; poll++) {
    await new Promise(r => setTimeout(r, 300));
    // If event modal is open, click the first decision option
    await page.evaluate(() => {
      const modal = document.querySelector('[data-event-modal]');
      if (modal) {
        const choiceBtn = modal.querySelector('button[data-choice="0"]') || Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Reroute') || b.textContent.includes('Purge') || b.textContent.includes('Accept') || b.textContent.includes('Deploy') || b.textContent.includes('Reboot'));
        if (choiceBtn) choiceBtn.click();
      }
    });

    const info = await page.evaluate(() => {
      const outcomeScreen = document.querySelector('[data-screen-label="08 Mission Outcome"]');
      if (!outcomeScreen) return null;
      const text = outcomeScreen.innerText;
      return {
        isSuccess: text.includes('MISSION ACCOMPLISHED'),
        text: text
      };
    });

    if (info && info.isSuccess) {
      cadetSuccess = true;
      console.log('CADET run finished with MISSION ACCOMPLISHED at poll', poll);
      break;
    }
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cadet_success_outcome.png') });

  cadetAnalysis = await page.evaluate(() => {
    const el = document.querySelector('[data-screen-label="08 Mission Outcome"]');
    return el ? el.innerText : '';
  });
  console.log('CADET Analysis Text:\n', cadetAnalysis);

  // 2. ASTROPHYSICIST CLOSE-ORBIT RUN TO FAILURE
  console.log('=== RUN 2: ASTROPHYSICIST Close-Orbit Run to Failure ===');
  // Reset mission
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const r = btns.find(b => b.textContent.includes('RETURN TO MAIN MENU') || b.textContent.trim() === 'RESET');
    if (r) r.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Overview screen (01)
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="overview"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Select ASTROPHYSICIST
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const astroBtn = btns.find(b => b.textContent.trim() === 'ASTROPHYSICIST');
    if (astroBtn) astroBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Select Close-Approach Orbit
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent.includes('Close-Approach') || b.textContent.includes('Close'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Navigate to Sim screen (06)
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="sim"]');
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Set speed 10x and START
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const speed10 = btns.find(b => b.textContent.trim() === '10x');
    if (speed10) speed10.click();
    const startBtn = btns.find(b => b.textContent.trim() === 'START');
    if (startBtn) startBtn.click();
  });

  let astroFailed = false;
  let astroAnalysis = null;

  for (let poll = 0; poll < 150; poll++) {
    await new Promise(r => setTimeout(r, 300));
    // If event modal is open, click the first decision option
    await page.evaluate(() => {
      const modal = document.querySelector('[data-event-modal]');
      if (modal) {
        const choiceBtn = modal.querySelector('button[data-choice="0"]') || Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Reroute') || b.textContent.includes('Purge') || b.textContent.includes('Accept') || b.textContent.includes('Deploy') || b.textContent.includes('Reboot'));
        if (choiceBtn) choiceBtn.click();
      }
    });

    const info = await page.evaluate(() => {
      const outcomeScreen = document.querySelector('[data-screen-label="08 Mission Outcome"]');
      if (!outcomeScreen) return null;
      const text = outcomeScreen.innerText;
      return {
        isFailed: text.includes('MISSION FAILED'),
        text: text
      };
    });

    if (info && info.isFailed) {
      astroFailed = true;
      console.log('ASTROPHYSICIST run failed with MISSION FAILED at poll', poll);
      break;
    }
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'astrophysicist_failed_outcome.png') });

  astroAnalysis = await page.evaluate(() => {
    const el = document.querySelector('[data-screen-label="08 Mission Outcome"]');
    return el ? el.innerText : '';
  });
  console.log('ASTROPHYSICIST Analysis Text:\n', astroAnalysis);

  await browser.close();
}

runVerification().catch(console.error);

