import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function testScreens() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const pageProto = await browser.newPage();
    await pageProto.setViewport({ width: 1440, height: 900 });
    const protoUrl = 'file:///' + path.resolve('Mission Control.dc.html').replace(/\\/g, '/');
    console.log('Loading prototype:', protoUrl);
    await pageProto.goto(protoUrl, { waitUntil: 'networkidle0', timeout: 15000 });
    await pageProto.screenshot({ path: path.join(ARTIFACT_DIR, 'proto_01.png') });
    console.log('Prototype 01 captured');

    const pageReact = await browser.newPage();
    await pageReact.setViewport({ width: 1440, height: 900 });
    console.log('Loading React app: http://localhost:5173/');
    await pageReact.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });
    await pageReact.screenshot({ path: path.join(ARTIFACT_DIR, 'react_01.png') });
    console.log('React 01 captured');
  } catch (err) {
    console.error('Error during screen test:', err);
  } finally {
    await browser.close();
  }
}

testScreens();

