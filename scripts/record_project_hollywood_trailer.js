import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const FRAMES_DIR = 'e:\\Black Hole\\project_trailer_frames';
const OUTPUT_VIDEO = 'e:\\Black Hole\\NASA_Space_Apps_Hollywood_Trailer.mp4';
const ARTIFACT_VIDEO = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\NASA_Space_Apps_Hollywood_Trailer.mp4';
const NARRATOR_1 = 'e:\\Black Hole\\trailer_narrator_line1.wav';
const NARRATOR_2 = 'e:\\Black Hole\\trailer_narrator_line2.wav';

if (fs.existsSync(FRAMES_DIR)) {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}
fs.mkdirSync(FRAMES_DIR, { recursive: true });

async function createProjectTrailer() {
  console.log('Launching Chrome for NASA Space Apps Trailer on LIVE PROJECT APP (1920x1080 @ 25 FPS)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('bh5000_guide_seen', '1');
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Inject cinematic typography and HUD overlay elements onto the actual project app
  await page.evaluate(() => {
    // 1. Cinematic Blackout Curtain for Scene 1 start and Scene 6 outro
    const curtain = document.createElement('div');
    curtain.id = 'cinematic-curtain';
    curtain.style.position = 'fixed';
    curtain.style.top = '0';
    curtain.style.left = '0';
    curtain.style.width = '100vw';
    curtain.style.height = '100vh';
    curtain.style.background = '#000000';
    curtain.style.opacity = '1';
    curtain.style.zIndex = '99998';
    curtain.style.pointerEvents = 'none';
    curtain.style.transition = 'opacity 0.6s ease';
    document.body.appendChild(curtain);

    // 2. Cinematic Hollywood Title Banner Overlay
    const titleOverlay = document.createElement('div');
    titleOverlay.id = 'cinematic-titles';
    titleOverlay.style.position = 'fixed';
    titleOverlay.style.top = '0';
    titleOverlay.style.left = '0';
    titleOverlay.style.width = '100vw';
    titleOverlay.style.height = '100vh';
    titleOverlay.style.display = 'none';
    titleOverlay.style.flexDirection = 'column';
    titleOverlay.style.alignItems = 'center';
    titleOverlay.style.justifyContent = 'center';
    titleOverlay.style.zIndex = '99999';
    titleOverlay.style.pointerEvents = 'none';
    titleOverlay.style.background = 'radial-gradient(circle at center, rgba(8,13,23,0.4) 0%, rgba(2,4,8,0.85) 100%)';
    titleOverlay.innerHTML = `
      <div id="ct-badge" style="font-family:'IBM Plex Mono',monospace;font-size:16px;color:#55DDE0;letter-spacing:0.35em;text-transform:uppercase;margin-bottom:18px;">NASA SPACE APPS CHALLENGE</div>
      <div id="ct-main" style="font-family:'Montserrat',sans-serif;font-weight:900;font-size:54px;color:#FFFFFF;letter-spacing:0.18em;text-shadow:0 0 40px rgba(85,221,224,0.7);text-align:center;">MICRO-SATELLITE MISSION CONTROL</div>
      <div id="ct-sub" style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:28px;color:#FFB547;letter-spacing:0.25em;text-shadow:0 0 25px rgba(255,149,0,0.6);margin-top:14px;text-align:center;">BEYOND THE EVENT HORIZON</div>
    `;
    document.body.appendChild(titleOverlay);

    // 3. Lower-Third Cinematic HUD Banner
    const hud = document.createElement('div');
    hud.id = 'project-trailer-hud';
    hud.style.position = 'fixed';
    hud.style.bottom = '46px';
    hud.style.left = '50%';
    hud.style.transform = 'translateX(-50%)';
    hud.style.zIndex = '99990';
    hud.style.display = 'none';
    hud.style.alignItems = 'center';
    hud.style.gap = '16px';
    hud.style.padding = '12px 28px';
    hud.style.background = 'rgba(8, 13, 23, 0.94)';
    hud.style.border = '1px solid #55DDE0';
    hud.style.borderLeft = '5px solid #55DDE0';
    hud.style.borderRadius = '3px';
    hud.style.boxShadow = '0 12px 40px rgba(0,0,0,0.8), 0 0 25px rgba(85,221,224,0.25)';
    hud.style.backdropFilter = 'blur(12px)';
    hud.style.fontFamily = "'IBM Plex Mono', monospace";
    hud.style.color = '#E8F0FA';

    hud.innerHTML = `
      <div id="hud-badge" style="background:#55DDE0;color:#080D17;font-weight:800;font-size:11px;padding:4px 10px;border-radius:2px;letter-spacing:0.12em;text-transform:uppercase;">NASA SPACE APPS</div>
      <div style="display:flex;flex-direction:column;gap:2px;">
        <div id="hud-title" style="font-size:15px;font-weight:700;letter-spacing:0.08em;color:#FFFFFF;text-transform:uppercase;">TITLE</div>
        <div id="hud-sub" style="font-size:12px;color:#8FA3B8;letter-spacing:0.05em;">SUBTITLE</div>
      </div>
    `;
    document.body.appendChild(hud);

    window.setCurtain = (opacity) => {
      const el = document.getElementById('cinematic-curtain');
      if (el) el.style.opacity = String(opacity);
    };

    window.setHud = (badge, title, sub, visible = true) => {
      const el = document.getElementById('project-trailer-hud');
      if (!el) return;
      if (!visible) { el.style.display = 'none'; return; }
      el.style.display = 'flex';
      document.getElementById('hud-badge').innerText = badge;
      document.getElementById('hud-title').innerText = title;
      document.getElementById('hud-sub').innerText = sub;
    };

    window.setTitles = (badge, main, sub, visible = true) => {
      const el = document.getElementById('cinematic-titles');
      if (!el) return;
      if (!visible) { el.style.display = 'none'; return; }
      el.style.display = 'flex';
      document.getElementById('ct-badge').innerText = badge;
      document.getElementById('ct-main').innerText = main;
      document.getElementById('ct-sub').innerText = sub;
    };
  });

  const FPS = 25;
  const TOTAL_SECONDS = 30;
  const TOTAL_FRAMES = FPS * TOTAL_SECONDS; // 750 frames
  let frameCount = 0;

  async function captureSceneFrames(durationSec) {
    const numFrames = Math.round(durationSec * FPS);
    for (let i = 0; i < numFrames; i++) {
      frameCount++;
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameCount).padStart(5, '0')}.jpg`);
      await page.screenshot({ path: framePath, quality: 92 });
      await new Promise(r => setTimeout(r, 1000 / FPS));
    }
  }

  console.log('=== SCENE 1: THE UNKNOWN (0.0s – 5.0s) ===');
  // Starts with complete darkness. Slowly reveals our project's black hole visual.
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('overview');
    window.setCurtain(1.0); // Full darkness
    window.setTitles('', '', '', false);
    window.setHud('', '', '', false);
  });
  await captureSceneFrames(1.0); // 1.0s darkness with deep bass boom

  // Fade curtain up to reveal our real black hole canvas
  await page.evaluate(() => {
    window.setCurtain(0.0);
    window.setTitles(
      'DEEP SPACE EXPLORATION',
      'THE UNIVERSE HOLDS SECRETS...',
      'Target: Sagittarius A* · Mass: 4.30 × 10⁶ M☉ · Event Horizon',
      true
    );
  });
  await captureSceneFrames(4.0);

  console.log('=== SCENE 2: THE MISSION (5.0s – 10.0s) ===');
  // Transition into Mission Overview & Setup Drawer with the 6 circular gauges
  await page.evaluate(() => {
    window.setTitles('', '', '', false);
    const s = window.useMissionStore.getState();
    s.toggleSetup(); // Open drawer
    s.setCfg('diff', 'ASTROPHYSICIST');
    window.setHud(
      'THE MISSION',
      'ONE MISSION. 5,000 AUTONOMOUS PROBES.',
      'Balancing 6 Gauges: Fuel, Battery, Science Data, Comms, Mass & Budget',
      true
    );
  });
  await captureSceneFrames(5.0);

  console.log('=== SCENE 3: SWARM DEPLOYMENT (10.0s – 15.0s) ===');
  // Transition into Screen 02 Swarm Visualizer with 5,000 nodes and laser crosslinks
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('swarm');
    s.setZoom(z => 1.4);
    s.selectNode(1207);
    window.setHud(
      'SWARM DEPLOYMENT',
      'MICRO-SATELLITE SWARM DEPLOYED',
      '5,000 autonomous probes locked in synchronized orbital mesh topology',
      true
    );
  });
  await captureSceneFrames(2.5);

  // Zoom closer to selected probe node
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setZoom(z => 2.4);
    s.selectNode(2410);
    window.setHud(
      'NODE TELEMETRY',
      'ORBITAL SPEED: 0.47c · LASER CROSSLINKS LOCKED',
      'Subsystem Health: 99.4% · Optical Gyro: 1.48g · Nearest-Neighbor Relays Active',
      true
    );
  });
  await captureSceneFrames(2.5);

  console.log('=== SCENE 4: BEYOND THE EVENT HORIZON & TIME DILATION (15.0s – 21.0s) ===');
  // Transition to Screen 03 Time Dilation screen
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('td');
    s.setP('r', 3.50);
    window.setHud(
      'GENERAL RELATIVITY',
      'WHERE GRAVITY BENDS SPACE... AND TIME ITSELF SLOWS DOWN',
      'Earth Standard Time vs Probe Proper Clock: dτ = dt √(1 - Rs/r)  [Dilation: 0.845x]',
      true
    );
  });
  await captureSceneFrames(6.0);

  console.log('=== SCENE 5: MISSION CONTROL MONTAGE (21.0s – 26.0s) ===');
  // Rapid cinematic montage through actual project screens
  // 1. Simulation Screen with 9 live resource bars
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('sim');
    s.start();
    window.setHud(
      'MISSION TELEMETRY',
      '9-CHANNEL REAL-TIME TELEMETRY DASHBOARD',
      'Monitoring fuel burn, battery drain, radiation wear, and swarm integrity',
      true
    );
  });
  await captureSceneFrames(1.2);

  // 2. Radiation Spike Anomaly Event Popup
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
      sim: { ...s.sim, active: ev, status: 'PAUSED', events: [ev] }
    });
    window.setHud(
      'ANOMALY EVENT',
      'E01: RADIATION SPIKE — DECISION REQUIRED',
      'Evaluating crew consensus trade-offs: Reroute Power vs Purge vs Heavy Shielding',
      true
    );
  });
  await captureSceneFrames(1.3);

  // 3. Resolve decision & jump to GRRT Ray Tracing
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.decide(0);
    s.setScreen('grrt');
    s.runViz();
    window.setHud(
      'RELATIVISTIC RAY TRACING',
      '4TH-ORDER RUNGE-KUTTA PHOTON DEFLECTION',
      'Tracing light geodesic curves around the Schwarzschild photon sphere',
      true
    );
  });
  await captureSceneFrames(1.2);

  // 4. Analytics screen with trend graphs
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('analytics');
    window.setHud(
      'MISSION ANALYTICS',
      '8 TELEMETRY TREND CHARTS & SYSTEM LEADERBOARD',
      'Post-flight trend analysis, tidal stress, radiation wear, and design comparison',
      true
    );
  });
  await captureSceneFrames(1.3);

  console.log('=== SCENE 6: FINAL REVEAL (26.0s – 30.0s) ===');
  // Transition to Outcome screen with Score 919 and then majestic Black Hole pull-back
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
        { k: 'WHY IT WORKED', c: '#38D996', v: 'Full science dataset collected by T+60h.' }
      ],
      breakdown: 'Score = 919'
    };

    window.useMissionStore.setState({
      sim: { ...s.sim, status: 'COMPLETED', outcome },
      screen: 'outcome'
    });
    window.setHud(
      'MISSION ACCOMPLISHED',
      'MISSION ACCOMPLISHED · SCORE: 919 (A · STRONG)',
      '100% relativistic science data returned · Sub-4% swarm attrition',
      true
    );
  });
  await captureSceneFrames(1.8);

  // Return to Overview Black Hole with Hollywood Title Cards Reveal
  await page.evaluate(() => {
    const s = window.useMissionStore.getState();
    s.setScreen('overview');
    window.setHud('', '', '', false);
    window.setTitles(
      'NASA SPACE APPS CHALLENGE',
      'MICRO-SATELLITE MISSION CONTROL',
      'BEYOND THE EVENT HORIZON',
      true
    );
  });
  await captureSceneFrames(1.4);

  // Fade to black
  await page.evaluate(() => {
    window.setCurtain(1.0);
  });
  await captureSceneFrames(0.8);

  await browser.close();
  console.log(`Captured all ${frameCount} frames from actual project!`);

  // FFmpeg multi-track audio multiplexing:
  // - Epic Orchestral Sci-Fi soundtrack with Hans Zimmer-style braams at 0.5s, 10s, 21s, 26s
  // - Narrator Line 1 at 5.5s ("What if humanity could explore the edge of a black hole?")
  // - Narrator Line 2 at 15.5s ("Where gravity bends space... and time itself slows down.")
  // - Laser comms beeps, telemetry pulses, and thunderous final sub-bass impact

  const audioExpr = [
    // Sub-bass foundation: 45Hz & 55Hz cinematic drone
    '0.24*sin(2*PI*45*t) + 0.14*sin(2*PI*55*t)',
    // Brass / Braam cinematic hits at 0.5s, 10.0s, 21.0s, 26.0s
    '+ 0.28*sin(2*PI*65.4*t)*exp(-2.2*(t-0.5))*between(t, 0.5, 3.5)',
    '+ 0.32*sin(2*PI*73.4*t)*exp(-2.0*(t-10.0))*between(t, 10.0, 13.5)',
    '+ 0.30*sin(2*PI*82.4*t)*exp(-2.5*(t-21.0))*between(t, 21.0, 23.5)',
    '+ 0.40*(sin(2*PI*55.0*t)+sin(2*PI*110.0*t))*exp(-1.4*(t-26.0))*between(t, 26.0, 30.0)',
    // Rising orchestral string tension & crescendo (building 10s to 26s)
    '+ 0.08*(sin(2*PI*220*t)+sin(2*PI*277*t)+sin(2*PI*330*t))*(0.2 + 0.8*(t-10)/16.0)*between(t, 10.0, 26.0)',
    // High-tech holographic telemetry pulses and pings (5s - 15s)
    '+ 0.03*sin(2*PI*880*t)*gt(mod(t, 0.4), 0.36)*between(t, 5.0, 15.0)',
    // High-tempo montage pulse drive (21s - 26s)
    '+ 0.10*sin(2*PI*110*t)*gt(mod(t, 0.25), 0.2)*between(t, 21.0, 26.0)'
  ].join('');

  const audioFilterBed = `aevalsrc=exprs='${audioExpr}':s=44100:d=30,lowpass=f=1200,afade=t=in:ss=0:d=1.0,afade=t=out:st=28.5:d=1.5`.replace(/\s+/g, '');

  const ffmpegCmd = `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}\\frame_%05d.jpg" -f lavfi -i "${audioFilterBed}" -i "${NARRATOR_1}" -i "${NARRATOR_2}" -filter_complex "[2:a]adelay=5500|5500,volume=1.65[n1]; [3:a]adelay=15500|15500,volume=1.65[n2]; [1:a]volume=0.9[bed]; [bed][n1][n2]amix=inputs=3:duration=first:dropout_transition=2[aout]" -map 0:v -map "[aout]" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest "${OUTPUT_VIDEO}"`;

  console.log('Running FFmpeg multiplexing and video rendering...');
  execSync(ffmpegCmd, { stdio: 'inherit' });

  fs.copyFileSync(OUTPUT_VIDEO, ARTIFACT_VIDEO);
  console.log(`Trailer successfully rendered from real project: ${OUTPUT_VIDEO}`);
  console.log(`Artifact saved: ${ARTIFACT_VIDEO}`);
}

createProjectTrailer().catch(console.error);
