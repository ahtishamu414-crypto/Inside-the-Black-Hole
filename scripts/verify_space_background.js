import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = 'e:\\Black Hole\\screenshots';
const ARTIFACT_DIR = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function verify() {
  console.log('Launching browser for SpaceBackground verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-accelerated-2d-canvas',
      '--enable-gpu-rasterization',
      '--window-size=1440,900'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('bh5000_guide_seen', '1');
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // 1. Measure FPS with background OFF
  await page.evaluate(() => {
    window.useMissionStore.setState({ bgEnabled: false });
  });
  const fpsOff = await measureFps(page, 1000);
  console.log(`FPS with Background OFF: ${fpsOff.toFixed(1)} fps`);

  // 2. Measure FPS with background ON
  await page.evaluate(() => {
    window.useMissionStore.setState({ bgEnabled: true });
  });
  const fpsOn = await measureFps(page, 1500);
  console.log(`FPS with Background ON: ${fpsOn.toFixed(1)} fps`);

  // 3. Test PAUSED vs RUNNING drift on Overview screen
  console.log('Testing Overview Screen (PAUSED)...');
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('overview');
    s.pause();
  });
  await new Promise(r => setTimeout(r, 400));
  const overviewPausedPath = path.join(SCREENSHOTS_DIR, 'overview_paused.png');
  await page.screenshot({ path: overviewPausedPath });
  fs.copyFileSync(overviewPausedPath, path.join(ARTIFACT_DIR, 'overview_paused.png'));

  console.log('Testing Overview Screen (RUNNING)...');
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.launch();
  });
  await new Promise(r => setTimeout(r, 600));
  const overviewRunningPath = path.join(SCREENSHOTS_DIR, 'overview_running.png');
  await page.screenshot({ path: overviewRunningPath });
  fs.copyFileSync(overviewRunningPath, path.join(ARTIFACT_DIR, 'overview_running.png'));

  // 4. Test PAUSED vs RUNNING drift on Simulation screen
  console.log('Testing Simulation Screen (RUNNING)...');
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('sim');
    s.resume();
  });
  await new Promise(r => setTimeout(r, 600));
  const simRunningPath = path.join(SCREENSHOTS_DIR, 'simulation_running.png');
  await page.screenshot({ path: simRunningPath });
  fs.copyFileSync(simRunningPath, path.join(ARTIFACT_DIR, 'simulation_running.png'));

  console.log('Testing Simulation Screen (PAUSED)...');
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.pause();
  });
  await new Promise(r => setTimeout(r, 400));
  const simPausedPath = path.join(SCREENSHOTS_DIR, 'simulation_paused.png');
  await page.screenshot({ path: simPausedPath });
  fs.copyFileSync(simPausedPath, path.join(ARTIFACT_DIR, 'simulation_paused.png'));

  // 5. Test Background toggle button in GameBar
  const toggleResult = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const bgBtn = btns.find(b => b.innerText.includes('BG:'));
    if (!bgBtn) return { error: 'BG button not found in GameBar' };

    const initialText = bgBtn.innerText;
    bgBtn.click();
    const afterClickText = bgBtn.innerText;
    const storeState = window.useMissionStore.getState().bgEnabled;
    const localStoreVal = localStorage.getItem('bh5000_bg');

    // Toggle back on
    bgBtn.click();

    return {
      initialText,
      afterClickText,
      storeState,
      localStoreVal
    };
  });
  console.log('GameBar BG Toggle Test:', JSON.stringify(toggleResult, null, 2));

  await browser.close();
  console.log('Verification complete!');

  return { fpsOff, fpsOn, toggleResult };
}

async function measureFps(page, durationMs) {
  return await page.evaluate(async (ms) => {
    return new Promise((resolve) => {
      let frames = 0;
      let start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start < ms) {
          requestAnimationFrame(count);
        } else {
          const elapsed = (performance.now() - start) / 1000;
          resolve(frames / elapsed);
        }
      }
      requestAnimationFrame(count);
    });
  }, durationMs);
}

verify().catch(console.error);
