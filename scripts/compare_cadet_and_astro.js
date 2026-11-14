import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

async function playCadetAndAstro(targetUrl, label) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(targetUrl, { waitUntil: 'networkidle0' });

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

  // --- RUN 1: CADET SUCCESS ---
  console.log(`[${label}] Starting CADET Success Run...`);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cadetBtn = btns.find(b => b.textContent.trim() === 'CADET');
    if (cadetBtn) cadetBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Navigate to Sim screen
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="sim"]') || Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('06'));
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Set speed 10x
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const s10 = btns.find(b => b.textContent.trim() === '10x');
    if (s10) s10.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // START
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const s = btns.find(b => b.textContent.trim() === 'START');
    if (s) s.click();
  });

  let cadetRes = null;
  for (let i = 0; i < 150; i++) {
    await new Promise(r => setTimeout(r, 200));
    // Resolve event if open
    await page.evaluate(() => {
      const modal = document.querySelector('[data-event-modal]') || Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('DECISION REQUIRED'));
      if (modal) {
        const choiceBtn = modal.querySelector('button[data-choice="0"]') || Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Reroute') || b.textContent.includes('Purge') || b.textContent.includes('Accept') || b.textContent.includes('Deploy') || b.textContent.includes('Reboot'));
        if (choiceBtn) choiceBtn.click();
      }
    });

    cadetRes = await page.evaluate(() => {
      const outcome = document.querySelector('[data-screen-label="08 Mission Outcome"]');
      if (outcome && (outcome.innerText.includes('MISSION ACCOMPLISHED') || outcome.innerText.includes('MISSION FAILED'))) {
        return outcome.innerText;
      }
      return null;
    });
    if (cadetRes) break;
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `${label}_cadet_outcome.png`) });

  // --- RUN 2: ASTROPHYSICIST CLOSE-ORBIT FAILURE ---
  console.log(`[${label}] Starting ASTROPHYSICIST Close-Orbit Failure Run...`);
  // Reset
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const r = btns.find(b => b.textContent.includes('RETURN TO MAIN MENU') || b.textContent.trim() === 'RESET');
    if (r) r.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Overview screen (01)
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="overview"]') || Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('01'));
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

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

  // Set close repositioning to r = 1.5 in Time Dilation (03) or slider
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="td"]') || Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('03'));
    if (nav) nav.click();
  });
  await new Promise(r => setTimeout(r, 200));

  await page.evaluate(() => {
    const range = document.querySelector('input[type="range"][min="1.1"]') || document.querySelector('input[type="range"]');
    if (range) {
      range.value = 1.5;
      range.dispatchEvent(new Event('input', { bubbles: true }));
      range.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 200));

  // Go to Sim (06), set 10x, START
  await page.evaluate(() => {
    const nav = document.querySelector('[data-nav="sim"]') || Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('06'));
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

  let astroRes = null;
  for (let i = 0; i < 150; i++) {
    await new Promise(r => setTimeout(r, 200));
    // Resolve event if open
    await page.evaluate(() => {
      const modal = document.querySelector('[data-event-modal]') || Array.from(document.querySelectorAll('div')).find(d => d.textContent && d.textContent.includes('DECISION REQUIRED'));
      if (modal) {
        const choiceBtn = modal.querySelector('button[data-choice="0"]') || Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Reroute') || b.textContent.includes('Purge') || b.textContent.includes('Accept') || b.textContent.includes('Deploy') || b.textContent.includes('Reboot'));
        if (choiceBtn) choiceBtn.click();
      }
    });

    astroRes = await page.evaluate(() => {
      const outcome = document.querySelector('[data-screen-label="08 Mission Outcome"]');
      if (outcome && (outcome.innerText.includes('MISSION ACCOMPLISHED') || outcome.innerText.includes('MISSION FAILED'))) {
        return outcome.innerText;
      }
      return null;
    });
    if (astroRes) break;
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `${label}_astro_failure_outcome.png`) });

  await browser.close();

  return { cadet: cadetRes, astro: astroRes };
}

async function main() {
  const reactUrl = 'http://localhost:5173/';
  const protoUrl = 'file:///' + path.resolve('Mission Control.dc.html').replace(/\\/g, '/');

  const reactRes = await playCadetAndAstro(reactUrl, 'react');
  const protoRes = await playCadetAndAstro(protoUrl, 'proto');

  console.log('=== RESULTS COMPARISON ===');
  console.log('--- REACT CADET ---\n', reactRes.cadet);
  console.log('--- PROTO CADET ---\n', protoRes.cadet);
  console.log('--- REACT ASTRO FAILURE ---\n', reactRes.astro);
  console.log('--- PROTO ASTRO FAILURE ---\n', protoRes.astro);

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'cadet_and_astro_results.json'),
    JSON.stringify({ react: reactRes, proto: protoRes }, null, 2)
  );
}

main().catch(console.error);

