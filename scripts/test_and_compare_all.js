import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const pageProto = await browser.newPage();
  await pageProto.setViewport({ width: 1440, height: 900 });
  const protoUrl = 'file:///' + path.resolve('Mission Control.dc.html').replace(/\\/g, '/');
  await pageProto.goto(protoUrl, { waitUntil: 'networkidle0' });
  // Dismiss guide on proto if present
  await pageProto.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('START PLAYING') || b.textContent.includes('NEXT'));
    if (btn) btn.click();
    const btn2 = btns.find(b => b.textContent.includes('START PLAYING'));
    if (btn2) btn2.click();
  });

  const pageReact = await browser.newPage();
  await pageReact.setViewport({ width: 1440, height: 900 });
  await pageReact.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  // Dismiss guide on react
  await pageReact.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('START PLAYING') || b.textContent.includes('NEXT'));
    if (btn) btn.click();
    const btn2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START PLAYING'));
    if (btn2) btn2.click();
  });

  const navs = [
    { id: 'overview', n: 1 },
    { id: 'swarm', n: 2 },
    { id: 'td', n: 3 },
    { id: 'env', n: 4 },
    { id: 'grrt', n: 5 },
    { id: 'sim', n: 6 },
    { id: 'analytics', n: 7 }
  ];

  console.log('Capturing screens 01 to 07 on prototype and react...');

  for (const s of navs) {
    // Switch screen in proto
    await pageProto.evaluate((idx) => {
      // Find sidebar items: operations has 6 items, then post-mission has 1
      const divs = Array.from(document.querySelectorAll('div[onClick]'));
      // Find the one with text matching
      const target = divs.find(d => d.textContent && d.textContent.trim().startsWith('0' + idx));
      if (target) target.click();
    }, s.n);
    await new Promise(r => setTimeout(r, 400));
    await pageProto.screenshot({ path: path.join(ARTIFACT_DIR, `proto_0${s.n}_${s.id}.png`) });

    // Switch screen in react
    await pageReact.evaluate((id) => {
      const el = document.querySelector(`[data-nav="${id}"]`);
      if (el) el.click();
    }, s.id);
    await new Promise(r => setTimeout(r, 400));
    await pageReact.screenshot({ path: path.join(ARTIFACT_DIR, `react_0${s.n}_${s.id}.png`) });
    console.log(`Captured 0${s.n} ${s.id}`);
  }

  await browser.close();
  console.log('Screens 01-07 captured successfully!');
}

run().catch(console.error);

