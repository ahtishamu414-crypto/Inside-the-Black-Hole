import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const FRAMES_DIR = 'e:\\Black Hole\\temp_frames';

if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

async function testFrames() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Capture 10 test frames
  for (let i = 0; i < 10; i++) {
    await page.screenshot({ path: path.join(FRAMES_DIR, `frame_${String(i).padStart(5, '0')}.jpg`), quality: 90 });
    await new Promise(r => setTimeout(r, 50));
  }

  await browser.close();
  console.log('10 frames captured successfully');
}

testFrames().catch(console.error);

