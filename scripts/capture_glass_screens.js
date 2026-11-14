import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = 'e:\\Black Hole\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('bh5000_guide_seen', '1');
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  const screens = [
    { id: 'overview', name: 'glass_overview.png' },
    { id: 'swarm', name: 'glass_swarm.png' },
    { id: 'td', name: 'glass_td.png' },
    { id: 'env', name: 'glass_env.png' },
    { id: 'grrt', name: 'glass_grrt.png' },
    { id: 'sim', name: 'glass_sim.png' },
    { id: 'analytics', name: 'glass_analytics.png' }
  ];

  for (const s of screens) {
    await page.evaluate((sid) => {
      window.useMissionStore.getState().setScreen(sid);
    }, s.id);
    await new Promise(r => setTimeout(r, 600));

    const p = path.join(SCREENSHOTS_DIR, s.name);
    await page.screenshot({ path: p });
    fs.copyFileSync(p, path.join(ARTIFACT_DIR, s.name));
    console.log(`Captured ${s.name}`);
  }

  // Also capture the drawer open on overview screen
  await page.evaluate(() => {
    const st = window.useMissionStore.getState();
    st.setScreen('overview');
    if (!st.setupOpen) st.toggleSetup();
  });
  await new Promise(r => setTimeout(r, 600));
  const drawerPath = path.join(SCREENSHOTS_DIR, 'glass_drawer.png');
  await page.screenshot({ path: drawerPath });
  fs.copyFileSync(drawerPath, path.join(ARTIFACT_DIR, 'glass_drawer.png'));
  console.log('Captured glass_drawer.png');

  await browser.close();
}

capture().catch(console.error);
