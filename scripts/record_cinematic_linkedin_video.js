import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const FRAMES_DIR = 'e:\\Black Hole\\cinematic_frames';
const OUTPUT_VIDEO = 'e:\\Black Hole\\Beyond_The_Black_Hole_Cinematic_LinkedIn.mp4';
const ARTIFACT_VIDEO = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\Beyond_The_Black_Hole_Cinematic_LinkedIn.mp4';

if (fs.existsSync(FRAMES_DIR)) {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}
fs.mkdirSync(FRAMES_DIR, { recursive: true });

async function createCinematicVideo() {
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

  // Inject cinematic overlay element helper
  await page.evaluate(() => {
    const overlay = document.createElement('div');
    overlay.id = 'cinematic-hud';
    overlay.style.position = 'fixed';
    overlay.style.bottom = '38px';
    overlay.style.left = '50%';
    overlay.style.transform = 'translateX(-50%)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'none';
    overlay.style.alignItems = 'center';
    overlay.style.gap = '14px';
    overlay.style.padding = '10px 22px';
    overlay.style.background = 'rgba(11, 18, 32, 0.92)';
    overlay.style.border = '1px solid #55DDE0';
    overlay.style.borderLeft = '4px solid #55DDE0';
    overlay.style.borderRadius = '4px';
    overlay.style.boxShadow = '0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(85,221,224,0.2)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.fontFamily = "'IBM Plex Mono', monospace";
    overlay.style.color = '#E8F0FA';
    overlay.style.transition = 'all 0.3s ease';

    overlay.innerHTML = `
      <div id="hud-badge" style="background:#55DDE0;color:#080D17;font-weight:700;font-size:10px;padding:3px 8px;border-radius:2px;letter-spacing:0.08em;text-transform:uppercase;">NASA SPACE APPS</div>
      <div style="display:flex;flex-direction:column;gap:1px;">
        <div id="hud-title" style="font-size:13px;font-weight:600;letter-spacing:0.06em;color:#E8F0FA;">TITLE</div>
        <div id="hud-sub" style="font-size:10.5px;color:#8FA3B8;letter-spacing:0.04em;">SUBTITLE</div>
      </div>
    `;
    document.body.appendChild(overlay);

    window.setHud = (badge, title, sub, visible = true) => {
      const el = document.getElementById('cinematic-hud');
      if (!el) return;
      if (!visible) {
        el.style.display = 'none';
        return;
      }
      el.style.display = 'flex';
      document.getElementById('hud-badge').innerText = badge;
      document.getElementById('hud-title').innerText = title;
      document.getElementById('hud-sub').innerText = sub;
    };
  });

  let frameIndex = 0;
  const FPS = 20;

  async function captureFrame() {
    frameIndex++;
    const frameFile = path.join(FRAMES_DIR, `frame_${String(frameIndex).padStart(5, '0')}.jpg`);
    await page.screenshot({ path: frameFile, quality: 90 });
  }

  async function holdScene(seconds) {
    const total = Math.round(seconds * FPS);
    for (let i = 0; i < total; i++) {
      await captureFrame();
      await new Promise(r => setTimeout(r, 1000 / FPS));
    }
  }

  console.log('=== ACT 1: The Cinematic Hook — Relativistic Black Hole (0s - 7s) ===');
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('overview');
    window.setHud(
      'MISSION OVERVIEW',
      'BLACK HOLE MISSION CONTROL · BH-5000',
      'Target: Sagittarius A* (4.30 × 10⁶ M☉) · Schwarzschild Radius: 1.27 × 10⁷ km',
      true
    );
  });
  await holdScene(3.5);

  // Focus on setup drawer trade-offs
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.toggleSetup(); // Open drawer
    s.setCfg('diff', 'ASTROPHYSICIST');
    window.setHud(
      'SYSTEMS ENGINEERING',
      'MULTI-OBJECTIVE TRADE-OFFS & PAYLOAD LIMITS',
      'Balancing 6 Gauges: Fuel, Power Bus, Science Data, DSN Comms, Mass & Budget',
      true
    );
  });
  await holdScene(3.5);

  console.log('=== ACT 2: The 5,000-Node Swarm Network (7s - 14s) ===');
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('swarm');
    window.setHud(
      'SWARM VISUALIZER',
      '5,000 MICRO-SATELLITES ORBITING THE EVENT HORIZON',
      'Real-time orbital tracking, nearest-neighbor links, anchor relays & node telemetry',
      true
    );
  });
  await holdScene(4.0);

  // Zoom into swarm and select a node
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setZoom(z => 1.8);
    s.selectNode(2410);
    window.setHud(
      'NODE TELEMETRY',
      'SELECTED: BH-2410 (ORBITAL SPEED: 0.47c)',
      'Subsystem Health: 99.4% · Accelerometer: 1.48g · Laser Anchor Link: Lock',
      true
    );
  });
  await holdScene(3.0);

  console.log('=== ACT 3: General Relativity & Time Dilation (14s - 21s) ===');
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('td');
    window.setHud(
      'GENERAL RELATIVITY',
      'SCHWARZSCHILD TIME DILATION: dτ/dt = √(1 - Rs/r)',
      'Direct comparison of Earth Coordinate Time against Probe Proper Clocks',
      true
    );
  });
  await holdScene(3.5);

  // Move probe closer into strong gravity
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setP('r', 3.5);
    window.setHud(
      'RELATIVISTIC DRIFT',
      'APPROACHING PHOTON SPHERE: r = 3.50 Rs',
      'Gravitational Redshift: 0.845x Earth Speed · Clock Drift: -3.72 hours / day',
      true
    );
  });
  await holdScene(3.5);

  console.log('=== ACT 4: Mission Simulation Control & Anomaly Resolution (21s - 30s) ===');
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('sim');
    s.start();
    window.setHud(
      'MISSION OPERATIONS',
      '9-CHANNEL LIVE TELEMETRY DASHBOARD',
      'Real-time rates: fuel burn, power drain, radiation wear & station-keeping',
      true
    );
  });
  await holdScene(2.5);

  // Step simulation up to 35% data
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    const res = { ...s.sim.res, data: 42.5, fuel: 91.2, battery: 88.4, shield: 82.0, chassis: 97.5 };
    window.useMissionStore.setState({
      sim: { ...s.sim, step: 24, res }
    });
  });
  await holdScene(1.5);

  // Trigger Radiation Spike Event Popup
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    const ev = {
      code: 'E01',
      title: 'RADIATION SPIKE DETECTED',
      severity: 'WARNING',
      cause: 'Accretion flare modeled along line-of-sight',
      affected: 'Exterior node shields wearing at +0.35%/hr',
      step: 25,
      status: 'ACTIVE',
      decision: null,
      delta: ''
    };
    window.useMissionStore.setState({
      sim: {
        ...s.sim,
        active: ev,
        status: 'PAUSED',
        events: [ev]
      }
    });
    window.setHud(
      'ANOMALY EVENT',
      'E01: RADIATION SPIKE — DECISION REQUIRED',
      'Evaluating crew consensus trade-offs: Reroute Power vs Purge vs Heavy Shielding',
      true
    );
  });
  await holdScene(2.5);

  // Resolve event
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.decide(0);
    window.setHud(
      'TACTICAL DECISION',
      'POWER REROUTED TO SHIELDS · STATUS NOMINAL',
      'Radiation mitigated by 30% · Simulation resuming at 10x speed',
      true
    );
  });
  await holdScene(2.5);

  console.log('=== ACT 5: Mission Accomplished (Score: 919) & Analytics (30s - 39s) ===');
  // Trigger Outcome screen with 919
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

    window.setHud(
      'MISSION DEBRIEF',
      'MISSION ACCOMPLISHED · SCORE: 919 (RATING: A · STRONG)',
      '100% relativistic science data returned · Swarm attrition under 4%',
      true
    );
  });
  await holdScene(4.5);

  // Switch to Analytics
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('analytics');
    window.setHud(
      'MISSION ANALYTICS',
      '8 TELEMETRY TREND CHARTS & SYSTEM LEADERBOARD',
      'Dilation, distance, radiation, tidal stress, chassis wear, and side-by-side design comparison',
      true
    );
  });
  await holdScene(4.5);

  console.log('=== ACT 6: Outro & Tech Stack (39s - 42s) ===');
  await page.evaluate(() => {
    window.setHud(
      'BUILT WITH',
      'REACT 19 · TYPESCRIPT · VITE · PURE PHYSICS ENGINE',
      'Open Source on GitHub: github.com/ahtishamu414-crypto/Beyond-the-Black-Hole',
      true
    );
  });
  await holdScene(3.0);

  await browser.close();
  console.log(`Captured ${frameIndex} frames. Synthesizing audio and encoding cinematic MP4...`);

  // Generate a multi-layered cinematic space drone audio track with FFmpeg
  // Layer 1: 55Hz deep sub-bass drone
  // Layer 2: 110Hz harmonic pad with chorus/flanger
  // Layer 3: High-frequency 880Hz subtle ping accents
  const duration = (frameIndex / FPS).toFixed(2);
  const audioFilter = `
    aevalsrc=exprs='0.25*sin(2*PI*55*t)+0.12*sin(2*PI*110*t)+0.06*sin(2*PI*220*t+sin(2*PI*0.2*t))+0.02*sin(2*PI*880*t)*gt(mod(t\\,3)\\,2.9)':s=44100:d=${duration},
    lowpass=f=400,
    afade=t=in:ss=0:d=2.0,
    afade=t=out:st=${duration - 2}:d=2.0
  `.replace(/\s+/g, '');

  const ffmpegCmd = `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}\\frame_%05d.jpg" -f lavfi -i "${audioFilter}" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${OUTPUT_VIDEO}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  fs.copyFileSync(OUTPUT_VIDEO, ARTIFACT_VIDEO);
  console.log(`Cinematic video generated: ${OUTPUT_VIDEO}`);
  console.log(`Artifact video saved: ${ARTIFACT_VIDEO}`);
}

createCinematicVideo().catch(console.error);

