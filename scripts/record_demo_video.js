import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const FRAMES_DIR = 'e:\\Black Hole\\video_frames';
const OUTPUT_VIDEO = 'e:\\Black Hole\\black_hole_mission_control_demo.mp4';
const ARTIFACT_VIDEO = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\black_hole_mission_control_demo.mp4';

// Ensure frames dir is clean
if (fs.existsSync(FRAMES_DIR)) {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}
fs.mkdirSync(FRAMES_DIR, { recursive: true });

async function recordVideo() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Pre-seed guide seen
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('bh5000_guide_seen', '1');
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  let frameIndex = 0;
  const FPS = 15;

  async function captureFrame() {
    frameIndex++;
    const frameFile = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(5, '0')}.jpg`);
    await page.screenshot({ path: frameFile, quality: 92 });
  }

  async function holdScene(seconds) {
    const total = Math.round(seconds * FPS);
    for (let i = 0; i < total; i++) {
      await captureFrame();
      await new Promise(r => setTimeout(r, 1000 / FPS));
    }
  }

  console.log('--- 0:00 - 0:02: Dashboard black hole visual (Mission Overview) ---');
  // Ensure Overview screen
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('overview');
  });
  await holdScene(2.5); // 0:00 - 0:02.5

  console.log('--- 0:02 - 0:05: Main dashboard header & difficulty/loadout controls ---');
  // Toggle setup drawer and hover difficulty
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.toggleSetup(); // Open or ensure open
    s.setCfg('diff', 'COMMANDER');
  });
  await holdScene(1.5);
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setCfg('diff', 'ASTROPHYSICIST');
  });
  await holdScene(1.0);
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setCfg('diff', 'CADET');
  });
  await holdScene(1.0); // Now at ~0:06

  console.log('--- 0:05 - 0:10: Click Time Dilation, Radiation Spike popup, NASA Data icon ---');
  // Click through to Time Dilation (03)
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('td');
  });
  await holdScene(1.5); // Showing Time Dilation

  // Trigger Radiation Spike popup (E01)
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    const ev = {
      code: 'E01',
      title: 'RADIATION SPIKE',
      severity: 'WARNING',
      cause: 'Accretion flare modeled along line-of-sight',
      affected: 'Exterior node shields wearing at +0.35%/hr',
      step: 1,
      status: 'ACTIVE',
      decision: null,
      delta: ''
    };
    window.useMissionStore.setState({
      sim: {
        ...s.sim,
        active: ev,
        status: 'PAUSED',
        events: [ev],
        log: [...s.sim.log, { step: 1, type: 'warn', text: 'E01 RADIATION SPIKE — decision required.' }]
      }
    });
  });
  await holdScene(1.8); // Showing Radiation Spike popup

  // Respond to the popup: click choice 0 (Reroute power to shields)
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.decide(0);
  });
  await holdScene(1.0);

  // Click NASA Data icon (open sources popover)
  await page.evaluate(() => {
    const icon = document.querySelector('div[title="NASA source for this module"]') || document.querySelector('[data-nasa-info]');
    if (icon) {
      icon.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      icon.click();
    }
  });
  await holdScene(1.2); // NASA source tooltip shown

  console.log('--- 0:10 - 0:20: Mission Simulation running with live telemetry ---');
  // Navigate to 06 Sim screen and launch
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('sim');
    s.start();
  });
  await holdScene(1.5);

  // Simulate advancing steps and live telemetry
  for (let step = 1; step <= 20; step++) {
    await page.evaluate((st) => {
      const s = window.useMissionStore.getState();
      const res = { ...s.sim.res };
      res.data = Math.min(100, (st / 20) * 100);
      res.fuel = Math.max(70, 100 - st * 1.4);
      res.battery = Math.max(65, 100 - st * 1.6);
      res.shield = Math.max(80, 100 - st * 0.8);
      res.chassis = Math.max(90, 100 - st * 0.4);
      window.useMissionStore.setState({
        sim: {
          ...s.sim,
          step: st * 3,
          res,
          history: [...s.sim.history, {
            t: st * 3,
            fuel: res.fuel,
            battery: res.battery,
            shield: res.shield,
            chassis: res.chassis,
            data: res.data,
            comm: 85,
            op: 4815,
            dmg: 5,
            lost: 0,
            r: 4.5,
            dil: 0.88,
            rad: 61,
            stress: 25,
            temp: 390,
            lvl: 80
          }]
        }
      });
    }, step);
    await holdScene(0.4);
  }

  console.log('--- 0:20 - 0:30: Mission Accomplished score screen (919) & analytics graphs ---');
  // Trigger Outcome screen with Score 919
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    const outcome = {
      success: true,
      failure: false,
      reason: 'Full science dataset returned at T+60h with 4,815 nodes operational.',
      step: 60,
      score: 919,
      rating: 'A · STRONG',
      stats: [
        { k: 'DATA COLLECTED', v: '100.0%' },
        { k: 'FUEL REMAINING', v: '89.5%' },
        { k: 'OPERATIONAL NODES', v: '4,815' },
        { k: 'STRUCTURAL INTEGRITY', v: '99.2%' }
      ],
      objectives: [
        { mark: '✓', c: '#38D996', text: 'Science dataset 100% returned' },
        { mark: '✓', c: '#38D996', text: 'Swarm ≥ 80% operational (100%)' },
        { mark: '✓', c: '#38D996', text: 'Chassis ≥ 50% (99%)' },
        { mark: '✓', c: '#38D996', text: 'Get within 5 Rs and collect 100% data.' }
      ],
      critical: [],
      analysis: [
        { k: 'WHY IT WORKED', c: '#38D996', v: 'You collected the full dataset by T+60h and kept 100% of the swarm working.' },
        { k: 'CLOSEST APPROACH', c: '#55DDE0', v: 'Your probe got as close as 4.5 Rs, where clocks ran at 0.88x Earth speed. Closer means more data, but stronger radiation and stretching.' },
        { k: 'BIGGEST STRAIN', c: '#FFB547', v: 'Peak radiation 61 against protection 80. Peak stretching 25 (safe below 25). Weakest signal 59%.' },
        { k: 'PARTS & BUDGET', c: '#E8F0FA', v: 'Spent $158M of $340M. Probe weight 420 kg on the Medium Lift rocket. Parts: Basic, Standard, Optical.' },
        { k: 'TRY NEXT', c: '#8FA3B8', v: 'Try a harder difficulty or a cheaper rocket to raise your score.' }
      ],
      breakdown: 'Score = (base 1149) × difficulty 0.8 = 919'
    };

    window.useMissionStore.setState({
      sim: {
        ...s.sim,
        status: 'COMPLETED',
        outcome
      },
      screen: 'outcome'
    });
  });
  await holdScene(5.0); // 0:20 - 0:25: Showing Mission Accomplished (Score 919)

  // Navigate to 07 Analytics
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('analytics');
  });
  await holdScene(5.0); // 0:25 - 0:30: Showing Analytics Graphs & Leaderboard

  await browser.close();
  console.log(`Captured ${frameIndex} frames. Encoding MP4 video...`);

  // Run FFmpeg to encode 1440x900 MP4 video at 15 fps
  const ffmpegCmd = `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}\\frame_%05d.jpg" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "${OUTPUT_VIDEO}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  // Also copy to artifact dir
  fs.copyFileSync(OUTPUT_VIDEO, ARTIFACT_VIDEO);
  console.log(`Video created successfully: ${OUTPUT_VIDEO}`);
  console.log(`Artifact video saved: ${ARTIFACT_VIDEO}`);
}

recordVideo().catch(console.error);

