import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

const screens = [
  { id: 'overview', n: 1, label: '01 Mission Overview' },
  { id: 'swarm', n: 2, label: '02 Swarm Network' },
  { id: 'td', n: 3, label: '03 Time Dilation Monitoring' },
  { id: 'env', n: 4, label: '04 Environmental Analysis' },
  { id: 'grrt', n: 5, label: '05 GRRT Imaging Laboratory' },
  { id: 'sim', n: 6, label: '06 Mission Simulation' },
  { id: 'analytics', n: 7, label: '07 Mission Analytics' }
];

async function captureScreenSideBySide() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-web-security', '--window-size=1440,900']
  });

  const pageProto = await browser.newPage();
  await pageProto.setViewport({ width: 1440, height: 900 });
  const protoUrl = 'file:///' + path.resolve('Mission Control.dc.html').replace(/\\/g, '/');
  await pageProto.goto(protoUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Dismiss guide in proto
  await pageProto.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sp = btns.find(b => b.textContent.includes('START PLAYING'));
    if (sp) sp.click();
    else {
      btns.filter(b => b.textContent.includes('NEXT')).forEach(b => b.click());
      const sp2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START PLAYING'));
      if (sp2) sp2.click();
    }
  });

  const pageReact = await browser.newPage();
  await pageReact.setViewport({ width: 1440, height: 900 });
  await pageReact.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Dismiss guide in react
  await pageReact.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sp = btns.find(b => b.textContent.includes('START PLAYING'));
    if (sp) sp.click();
    else {
      btns.filter(b => b.textContent.includes('NEXT')).forEach(b => b.click());
      const sp2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START PLAYING'));
      if (sp2) sp2.click();
    }
  });

  console.log('Capturing screens 01 to 07...');

  for (const s of screens) {
    // Navigate in proto: click sidebar item
    await pageProto.evaluate((lbl) => {
      const items = Array.from(document.querySelectorAll('div'));
      const target = items.find(el => el.textContent && el.textContent.trim().startsWith(lbl.slice(0, 2)));
      if (target) target.click();
    }, s.label);
    await new Promise(r => setTimeout(r, 500));
    await pageProto.screenshot({ path: path.join(ARTIFACT_DIR, `proto_${s.id}.png`) });

    // Navigate in react: click data-nav
    await pageReact.evaluate((id) => {
      const target = document.querySelector(`[data-nav="${id}"]`);
      if (target) target.click();
    }, s.id);
    await new Promise(r => setTimeout(r, 500));
    await pageReact.screenshot({ path: path.join(ARTIFACT_DIR, `react_${s.id}.png`) });
    console.log(`Captured ${s.id}`);
  }

  await browser.close();
  console.log('Done capturing side by side screens!');
}

captureScreenSideBySide().catch(console.error);

