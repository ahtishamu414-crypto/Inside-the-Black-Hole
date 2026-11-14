import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const FRAMES_DIR = 'e:\\Black Hole\\trailer_frames';
const OUTPUT_VIDEO = 'e:\\Black Hole\\NASA_Space_Apps_Hollywood_Trailer.mp4';
const ARTIFACT_VIDEO = 'C:\\Users\\BN Com\\.gemini\\antigravity\\brain\\bd45780c-9542-4e4e-8923-f37efe4d395e\\NASA_Space_Apps_Hollywood_Trailer.mp4';
const NARRATOR_1 = 'e:\\Black Hole\\trailer_narrator_line1.wav';
const NARRATOR_2 = 'e:\\Black Hole\\trailer_narrator_line2.wav';

// Clean frames dir
if (fs.existsSync(FRAMES_DIR)) {
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}
fs.mkdirSync(FRAMES_DIR, { recursive: true });

// Read dashboard screenshots as base64 for zero-latency instant rendering in canvas
function getBase64Img(file) {
  const p = path.join('e:\\Black Hole\\trailer_assets', file);
  if (fs.existsSync(p)) {
    return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  }
  return '';
}

const imagesData = {
  sim: getBase64Img('react_sim.png'),
  analytics: getBase64Img('react_analytics.png'),
  swarm: getBase64Img('react_swarm.png'),
  td: getBase64Img('react_td.png'),
  grrt: getBase64Img('react_grrt.png')
};

async function renderTrailer() {
  console.log('Launching Puppeteer for Hollywood Cinematic Trailer (1920x1080 @ 30 FPS)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-file-access-from-files',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // HTML page with high-performance 2D canvas & preloaded dashboard images
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600;700&family=Montserrat:wght@300;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
    canvas { display: block; width: 1920px; height: 1080px; }
  </style>
</head>
<body>
  <canvas id="c" width="1920" height="1080"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const W = 1920;
    const H = 1080;

    const imgs = {};
    const imgSources = ${JSON.stringify(imagesData)};
    let loadedCount = 0;
    const totalImgs = Object.keys(imgSources).length;

    window.assetsReady = false;
    for (let k in imgSources) {
      imgs[k] = new Image();
      imgs[k].onload = () => {
        loadedCount++;
        if (loadedCount >= totalImgs) window.assetsReady = true;
      };
      imgs[k].src = imgSources[k];
    }

    // Pre-generate 3D starfield
    const STARS = [];
    for (let i = 0; i < 900; i++) {
      STARS.push({
        x: (Math.random() - 0.5) * 4000,
        y: (Math.random() - 0.5) * 3000,
        z: Math.random() * 3000 + 100,
        size: Math.random() * 1.8 + 0.4,
        hue: Math.random() > 0.8 ? 210 : Math.random() > 0.6 ? 30 : 0,
        brightness: Math.random() * 0.7 + 0.3
      });
    }

    // Helper: Draw Photorealistic Relativistic Black Hole with Gravitational Lensing
    function drawRelativisticBlackHole(cx, cy, radius, pitch, yaw, roll, intensity, lensed) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(roll);

      // Deep space background gravitational distortion glow
      const bgGrad = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius * 5.5);
      bgGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      bgGrad.addColorStop(0.18, 'rgba(255, 110, 20, ' + (0.35 * intensity) + ')');
      bgGrad.addColorStop(0.4, 'rgba(139, 92, 246, ' + (0.15 * intensity) + ')');
      bgGrad.addColorStop(0.7, 'rgba(11, 18, 32, ' + (0.08 * intensity) + ')');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 5.5, 0, Math.PI * 2);
      ctx.fill();

      // UPPER GRAVITATIONALLY LENSED ACCRETION ARC (Light bent over the black hole)
      ctx.save();
      ctx.scale(1.0, 0.45);
      const upperGrad = ctx.createRadialGradient(-radius * 0.4, -radius * 0.2, radius * 0.9, 0, 0, radius * 2.8);
      // Relativistic Doppler boosting: Approaching side (left) is hot cyan-white, receding (right) is deep amber
      upperGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      upperGrad.addColorStop(0.42, 'rgba(255, 255, 255, ' + (0.95 * intensity) + ')');
      upperGrad.addColorStop(0.55, 'rgba(255, 170, 40, ' + (0.85 * intensity) + ')');
      upperGrad.addColorStop(0.75, 'rgba(255, 75, 10, ' + (0.5 * intensity) + ')');
      upperGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = upperGrad;

      ctx.beginPath();
      ctx.arc(0, 0, radius * 2.8, Math.PI, 0, false); // top half
      ctx.fill();
      ctx.restore();

      // MAIN HORIZONTAL ACCRETION DISK (Tilted plane)
      ctx.save();
      ctx.scale(1.0, 0.24);
      const diskGrad = ctx.createRadialGradient(-radius * 0.8, 0, radius * 0.8, 0, 0, radius * 4.2);
      diskGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      diskGrad.addColorStop(0.28, 'rgba(255, 255, 255, ' + (0.98 * intensity) + ')'); // Photon sphere boundary
      diskGrad.addColorStop(0.38, 'rgba(85, 221, 224, ' + (0.85 * intensity) + ')'); // Blue-shifted relativistic beam
      diskGrad.addColorStop(0.52, 'rgba(255, 180, 50, ' + (0.80 * intensity) + ')');
      diskGrad.addColorStop(0.75, 'rgba(235, 60, 20, ' + (0.45 * intensity) + ')');
      diskGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // LOWER LENSED ARC (Light curved under the event horizon)
      ctx.save();
      ctx.scale(1.0, 0.38);
      const lowerGrad = ctx.createRadialGradient(-radius * 0.3, radius * 0.2, radius * 0.9, 0, 0, radius * 2.2);
      lowerGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
      lowerGrad.addColorStop(0.48, 'rgba(255, 140, 20, ' + (0.75 * intensity) + ')');
      lowerGrad.addColorStop(0.72, 'rgba(180, 40, 10, ' + (0.35 * intensity) + ')');
      lowerGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lowerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 2.2, 0, Math.PI, false); // bottom half
      ctx.fill();
      ctx.restore();

      // THE SHADOW & PHOTON RING (Pure Event Horizon)
      // Brilliant thin caustic photon ring at 1.5 Rs
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.95 * intensity) + ')';
      ctx.lineWidth = Math.max(2, radius * 0.045);
      ctx.shadowColor = '#FF9500';
      ctx.shadowBlur = radius * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pitch black shadow (No light escapes)
      ctx.fillStyle = '#020408';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner shadow edge gradient
      const shadowGrad = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius);
      shadowGrad.addColorStop(0, '#000000');
      shadowGrad.addColorStop(0.9, '#02050B');
      shadowGrad.addColorStop(1, 'rgba(255, 180, 50, 0.25)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Helper: Draw Highly Realistic Scientific Micro-Satellite (CubeSat Deep-Space Probe)
    function drawMicroSatellite(x, y, scale, angle, laserTarget = null) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // Deployable Solar Panels (Deep space photovoltaic blue with grid lines)
      ctx.fillStyle = '#0D1E3A';
      ctx.strokeStyle = '#55DDE0';
      ctx.lineWidth = 1;

      // Left Solar Wing
      ctx.fillRect(-52, -14, 38, 28);
      ctx.strokeRect(-52, -14, 38, 28);
      // Grid lines
      ctx.strokeStyle = 'rgba(85, 221, 224, 0.4)';
      for (let gx = -45; gx <= -20; gx += 7) {
        ctx.beginPath(); ctx.moveTo(gx, -14); ctx.lineTo(gx, 14); ctx.stroke();
      }

      // Right Solar Wing
      ctx.fillStyle = '#0D1E3A';
      ctx.strokeStyle = '#55DDE0';
      ctx.fillRect(14, -14, 38, 28);
      ctx.strokeRect(14, -14, 38, 28);
      // Grid lines
      for (let gx = 21; gx <= 46; gx += 7) {
        ctx.beginPath(); ctx.moveTo(gx, -14); ctx.lineTo(gx, 14); ctx.stroke();
      }

      // Central Satellite Bus (Gold Kapton Multi-Layer Insulation MLI)
      const busGrad = ctx.createLinearGradient(-14, -18, 14, 18);
      busGrad.addColorStop(0, '#FFE082');
      busGrad.addColorStop(0.35, '#FFB300');
      busGrad.addColorStop(0.7, '#FFA000');
      busGrad.addColorStop(1, '#FF6F00');
      ctx.fillStyle = busGrad;
      ctx.strokeStyle = '#FFE57F';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-14, -18, 28, 36);
      ctx.strokeRect(-14, -18, 28, 36);

      // High-gain optical communications gimbal / lens
      ctx.fillStyle = '#080D17';
      ctx.strokeStyle = '#55DDE0';
      ctx.beginPath();
      ctx.arc(0, -18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Optical aperture glowing lens
      ctx.fillStyle = '#38D996';
      ctx.shadowColor = '#55DDE0';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, -18, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cold gas thruster plume
      ctx.strokeStyle = 'rgba(85, 221, 224, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(0, 26);
      ctx.stroke();

      ctx.restore();

      // Laser Communication Crosslink Beam to Neighbor
      if (laserTarget) {
        ctx.save();
        ctx.strokeStyle = 'rgba(85, 221, 224, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#55DDE0';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(laserTarget.x, laserTarget.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // Main 30-Second Hollywood Cinematic Trailer Renderer
    window.renderTrailerFrame = function(timeSec) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000206';
      ctx.fillRect(0, 0, W, H);

      // Render 3D Starfield with camera z-movement
      const camZ = timeSec * 80;
      ctx.save();
      STARS.forEach(st => {
        let relZ = (st.z - camZ) % 3000;
        if (relZ <= 0) relZ += 3000;
        const k = 600 / relZ;
        const px = W / 2 + st.x * k;
        const py = H / 2 + st.y * k;
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const alpha = Math.min(1, (3000 - relZ) / 1000) * st.brightness;
          ctx.fillStyle = st.hue === 210 ? 'rgba(180, 220, 255, ' + alpha + ')' :
                          st.hue === 30 ? 'rgba(255, 200, 150, ' + alpha + ')' :
                          'rgba(255, 255, 255, ' + alpha + ')';
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.6, st.size * k * 0.8), 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();

      // -------------------------------------------------------------
      // SCENE 1: THE UNKNOWN (0.0s – 5.0s)
      // -------------------------------------------------------------
      if (timeSec >= 0 && timeSec < 5.0) {
        const sceneT = timeSec; // 0 to 5
        const reveal = Math.max(0, Math.min(1, (sceneT - 0.8) / 2.2));
        const camDist = 1.0 + sceneT * 0.12;

        const bhRadius = 140 * camDist;
        const bhY = H / 2;
        const bhX = W / 2 + (1 - reveal) * 150;

        drawRelativisticBlackHole(bhX, bhY, bhRadius, 0.45, 0, sceneT * 0.08, reveal);

        // Cinematic Typography
        if (sceneT >= 1.2 && sceneT <= 4.8) {
          const titleAlpha = sceneT < 2.0 ? (sceneT - 1.2) / 0.8 :
                             sceneT > 4.0 ? (4.8 - sceneT) / 0.8 : 1.0;
          ctx.save();
          ctx.font = '700 36px "Montserrat", sans-serif';
          ctx.fillStyle = 'rgba(232, 240, 250, ' + titleAlpha + ')';
          ctx.textAlign = 'center';
          ctx.letterSpacing = '14px';
          ctx.shadowColor = 'rgba(85, 221, 224, 0.8)';
          ctx.shadowBlur = 24;
          ctx.fillText('THE UNIVERSE HOLDS SECRETS...', W / 2, H * 0.84);
          ctx.restore();
        }

        // Sub-bass impact flash at 0.5s
        if (sceneT >= 0.4 && sceneT <= 1.0) {
          const flash = Math.sin((sceneT - 0.4) / 0.6 * Math.PI) * 0.25;
          ctx.fillStyle = 'rgba(255, 149, 0, ' + flash + ')';
          ctx.fillRect(0, 0, W, H);
        }
      }

      // -------------------------------------------------------------
      // SCENE 2: THE MISSION (5.0s – 10.0s)
      // -------------------------------------------------------------
      else if (timeSec >= 5.0 && timeSec < 10.0) {
        const sceneT = timeSec - 5.0; // 0 to 5
        const fade = Math.min(1, sceneT / 0.8);

        // Futuristic NASA Mission Control Holographic Environment
        ctx.save();
        // Background black hole in perspective
        drawRelativisticBlackHole(W * 0.72, H * 0.48, 120, 0.4, 0, sceneT * 0.06, 0.65);

        // Holographic Wireframe Coordinate Grid
        ctx.strokeStyle = 'rgba(85, 221, 224, ' + (0.18 * fade) + ')';
        ctx.lineWidth = 1;
        for (let gy = 120; gy < H; gy += 60) {
          ctx.beginPath(); ctx.moveTo(80, gy); ctx.lineTo(W - 80, gy); ctx.stroke();
        }
        for (let gx = 80; gx < W; gx += 120) {
          ctx.beginPath(); ctx.moveTo(gx, 120); ctx.lineTo(gx, H - 80); ctx.stroke();
        }

        // Orbital Trajectory Ellipses
        ctx.save();
        ctx.translate(W * 0.72, H * 0.48);
        ctx.scale(1.0, 0.35);
        ctx.strokeStyle = 'rgba(85, 221, 224, ' + (0.75 * fade) + ')';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.arc(0, 0, 360, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 181, 71, ' + (0.85 * fade) + ')';
        ctx.beginPath(); ctx.arc(0, 0, 240, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        // Holographic Glass Panels & Telemetry Readouts
        ctx.fillStyle = 'rgba(11, 18, 32, ' + (0.85 * fade) + ')';
        ctx.strokeStyle = 'rgba(85, 221, 224, ' + (0.8 * fade) + ')';
        ctx.lineWidth = 1.5;

        // Left Telemetry Box
        ctx.fillRect(100, 180, 520, 460);
        ctx.strokeRect(100, 180, 520, 460);

        ctx.font = '700 13px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(85, 221, 224, ' + fade + ')';
        ctx.fillText('NASA SPACE APPS · MISSION TELEMETRY HUD', 125, 220);

        ctx.font = '600 22px "Montserrat", sans-serif';
        ctx.fillStyle = 'rgba(232, 240, 250, ' + fade + ')';
        ctx.fillText('TARGET: SAGITTARIUS A*', 125, 260);

        ctx.font = '400 15px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(143, 163, 184, ' + fade + ')';
        ctx.fillText('BLACK HOLE MASS: 4.30 × 10⁶ M☉', 125, 305);
        ctx.fillText('SCHWARZSCHILD RADIUS (Rs): 1.27 × 10⁷ km', 125, 335);
        ctx.fillText('ORBITAL INSERTION: 3.50 Rs PHOTON BOUNDARY', 125, 365);
        ctx.fillText('AUTONOMOUS SWARM: 5,000 MICRO-PROBES', 125, 395);
        ctx.fillText('DSN TELEMETRY CARRIER: 8.41 GHz X-BAND [LOCKED]', 125, 425);
        ctx.fillText('GRAVITATIONAL REDSHIFT FACTOR: 0.845x', 125, 455);
        ctx.fillText('SPACETIME DRIFT: -3.72 HOURS / DAY', 125, 485);

        // Status pill
        ctx.fillStyle = 'rgba(56, 217, 150, 0.2)';
        ctx.strokeStyle = '#38D996';
        ctx.fillRect(125, 530, 240, 42);
        ctx.strokeRect(125, 530, 240, 42);
        ctx.fillStyle = '#38D996';
        ctx.font = '700 14px "IBM Plex Mono", monospace';
        ctx.fillText('MISSION STATUS: FLIGHT READY', 140, 556);

        // On-screen Cinematic Typography
        const textAlpha = Math.min(1, Math.max(0, (sceneT - 0.4) / 0.6));
        ctx.font = '800 42px "Montserrat", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, ' + textAlpha + ')';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '8px';
        ctx.shadowColor = '#55DDE0';
        ctx.shadowBlur = 20;
        ctx.fillText('ONE MISSION. 5,000 AUTONOMOUS PROBES.', W / 2, H * 0.88);
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // -------------------------------------------------------------
      // SCENE 3: SWARM DEPLOYMENT (10.0s – 15.0s)
      // -------------------------------------------------------------
      else if (timeSec >= 10.0 && timeSec < 15.0) {
        const sceneT = timeSec - 10.0; // 0 to 5

        // Background black hole looming large
        const bhScale = 1.0 + sceneT * 0.08;
        drawRelativisticBlackHole(W * 0.80, H * 0.50, 180 * bhScale, 0.45, 0, sceneT * 0.05, 0.9);

        // Render Swarm of 5,000 Autonomous Probes flying in coordinated formation
        const swarmNodes = [];
        const numNodes = 70; // 70 prominent detailed hero probes with hundreds of field particles
        for (let i = 0; i < numNodes; i++) {
          const angle = (i / numNodes) * Math.PI * 2 + sceneT * 0.15;
          const rBase = 220 + (i % 6) * 75;
          const px = W * 0.42 + Math.cos(angle) * rBase * 1.6;
          const py = H * 0.52 + Math.sin(angle) * rBase * 0.62;
          swarmNodes.push({ x: px, y: py, id: i + 1000, scale: 0.45 + (i % 3) * 0.22, angle: angle + Math.PI / 2 });
        }

        // Draw laser communication links between nearest neighbors
        for (let i = 0; i < swarmNodes.length; i++) {
          const next = swarmNodes[(i + 1) % swarmNodes.length];
          const cross = swarmNodes[(i + 7) % swarmNodes.length];
          drawMicroSatellite(swarmNodes[i].x, swarmNodes[i].y, swarmNodes[i].scale, swarmNodes[i].angle, next);
          if (i % 4 === 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(85, 221, 224, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(swarmNodes[i].x, swarmNodes[i].y);
            ctx.lineTo(cross.x, cross.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // 2 Hero close-up micro-satellites swooping in foreground
        const hero1X = 260 + sceneT * 70;
        const hero1Y = 320 + Math.sin(sceneT * 1.5) * 30;
        drawMicroSatellite(hero1X, hero1Y, 1.6, 0.35 + sceneT * 0.05);

        const hero2X = 520 + sceneT * 55;
        const hero2Y = 640 - Math.cos(sceneT * 1.4) * 25;
        drawMicroSatellite(hero2X, hero2Y, 1.25, -0.25 - sceneT * 0.04);

        // HUD Reticle over Hero 1
        ctx.save();
        ctx.strokeStyle = '#55DDE0';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hero1X - 70, hero1Y - 50, 140, 100);
        ctx.font = '600 12px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#55DDE0';
        ctx.fillText('NODE: BH-1207 · ORBIT: 3.50 Rs', hero1X - 65, hero1Y - 60);
        ctx.fillText('SPEED: 0.47c · STATUS: NOMINAL', hero1X - 65, hero1Y + 70);
        ctx.restore();

        // On-screen Cinematic Typography
        ctx.save();
        ctx.font = '900 44px "Montserrat", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '10px';
        ctx.shadowColor = '#55DDE0';
        ctx.shadowBlur = 24;
        ctx.fillText('MICRO-SATELLITE SWARM DEPLOYED', W / 2, H * 0.88);

        ctx.font = '600 16px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#55DDE0';
        ctx.letterSpacing = '4px';
        ctx.fillText('5,000 AUTONOMOUS SENSORS IN SYNCHRONIZED ORBIT', W / 2, H * 0.93);
        ctx.restore();
      }

      // -------------------------------------------------------------
      // SCENE 4: BEYOND THE EVENT HORIZON & TIME DILATION (15.0s – 21.0s)
      // -------------------------------------------------------------
      else if (timeSec >= 15.0 && timeSec < 21.0) {
        const sceneT = timeSec - 15.0; // 0 to 6

        // Split-Screen Scientific Visualization
        const splitX = W / 2;

        // LEFT PANE: EARTH STANDARD TIME (Coordinate Time t)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, H);
        ctx.clip();

        // Deep blue starry grid
        ctx.fillStyle = '#050D1A';
        ctx.fillRect(0, 0, splitX, H);

        ctx.strokeStyle = 'rgba(85, 221, 224, 0.15)';
        ctx.lineWidth = 1;
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(splitX, y); ctx.stroke(); }
        for (let x = 0; x < splitX; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }

        // Earth Hologram
        ctx.save();
        ctx.translate(splitX * 0.5, H * 0.45);
        const earthGrad = ctx.createRadialGradient(-30, -30, 20, 0, 0, 110);
        earthGrad.addColorStop(0, '#55DDE0');
        earthGrad.addColorStop(0.6, '#1B4D89');
        earthGrad.addColorStop(1, '#08172E');
        ctx.fillStyle = earthGrad;
        ctx.beginPath(); ctx.arc(0, 0, 110, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(85, 221, 224, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Left Pane Headings & Clock
        ctx.font = '700 28px "Montserrat", sans-serif';
        ctx.fillStyle = '#55DDE0';
        ctx.letterSpacing = '4px';
        ctx.textAlign = 'center';
        ctx.fillText('EARTH STANDARD TIME', splitX * 0.5, 140);

        ctx.font = '600 15px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#8FA3B8';
        ctx.fillText('COORDINATE REFERENCE (UNWARPED SPACETIME)', splitX * 0.5, 175);

        // Digital Clock (Advancing at 1.00x)
        const earthHours = 24.0 + sceneT * 1.0;
        const eHH = Math.floor(earthHours);
        const eMM = Math.floor((earthHours % 1) * 60);
        const eSS = Math.floor(((earthHours * 60) % 1) * 60);
        const earthStr = 'T+ ' + String(eHH).padStart(2, '0') + ':' + String(eMM).padStart(2, '0') + ':' + String(eSS).padStart(2, '0');

        ctx.font = '700 54px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#E8F0FA';
        ctx.shadowColor = '#55DDE0';
        ctx.shadowBlur = 18;
        ctx.fillText(earthStr + ' UTC', splitX * 0.5, H * 0.72);
        ctx.shadowBlur = 0;

        ctx.font = '600 16px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#38D996';
        ctx.fillText('RATE: 1.000x BASELINE REFERENCE', splitX * 0.5, H * 0.78);
        ctx.restore();

        // RIGHT PANE: PROBE INTERNAL TIME (Proper Time tau)
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, W - splitX, H);
        ctx.clip();

        // Warped violet/orange deep space
        ctx.fillStyle = '#10081C';
        ctx.fillRect(splitX, 0, W - splitX, H);

        // Relativistic black hole at the edge
        drawRelativisticBlackHole(splitX + (W - splitX) * 0.5, H * 0.45, 115, 0.45, 0, sceneT * 0.1, 1.0);

        // Probe swooping near horizon
        drawMicroSatellite(splitX + (W - splitX) * 0.5 - 130, H * 0.45 + 50, 1.3, -0.4);

        // Right Pane Headings & Clock
        ctx.font = '700 28px "Montserrat", sans-serif';
        ctx.fillStyle = '#FFB547';
        ctx.letterSpacing = '4px';
        ctx.textAlign = 'center';
        ctx.fillText('PROBE INTERNAL TIME', splitX + (W - splitX) * 0.5, 140);

        ctx.font = '600 15px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#C4A1E0';
        ctx.fillText('PROPER TIME: dτ = dt √(1 - Rs/r)  [r = 3.50 Rs]', splitX + (W - splitX) * 0.5, 175);

        // Relativistic Slower Clock (0.845x dilation)
        const probeHours = 20.28 + sceneT * 0.845;
        const pHH = Math.floor(probeHours);
        const pMM = Math.floor((probeHours % 1) * 60);
        const pSS = Math.floor(((probeHours * 60) % 1) * 60);
        const probeStr = 'T+ ' + String(pHH).padStart(2, '0') + ':' + String(pMM).padStart(2, '0') + ':' + String(pSS).padStart(2, '0');

        ctx.font = '700 54px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#FFB547';
        ctx.shadowColor = '#FF9500';
        ctx.shadowBlur = 18;
        ctx.fillText(probeStr + ' LOCAL', splitX + (W - splitX) * 0.5, H * 0.72);
        ctx.shadowBlur = 0;

        ctx.font = '600 16px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#FF5C64';
        ctx.fillText('DILATION: 0.845x · TIME LOST: -3.72 HRS / DAY', splitX + (W - splitX) * 0.5, H * 0.78);
        ctx.restore();

        // Glowing divider line between Earth and Probe time
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#55DDE0';
        ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(splitX, 80); ctx.lineTo(splitX, H - 80); ctx.stroke();
        ctx.restore();

        // Bottom Subtitle
        ctx.save();
        ctx.font = '800 32px "Montserrat", sans-serif';
        ctx.fillStyle = '#E8F0FA';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '6px';
        ctx.fillText('WHERE GRAVITY BENDS SPACE... AND TIME ITSELF SLOWS DOWN', W / 2, H * 0.92);
        ctx.restore();
      }

      // -------------------------------------------------------------
      // SCENE 5: MISSION CONTROL MONTAGE (21.0s – 26.0s)
      // -------------------------------------------------------------
      else if (timeSec >= 21.0 && timeSec < 26.0) {
        const sceneT = timeSec - 21.0; // 0 to 5 seconds
        // 5 Rapid cuts (1 second each)
        // 0s-1s: Probe Status & 9 Resource Bars (sim)
        // 1s-2s: Orbit & Gravity Gauges (analytics)
        // 2s-3s: Swarm Network Map (swarm)
        // 3s-4s: Earth vs Probe Time (td)
        // 4s-5s: Black Hole Image Processing Display (grrt)
        const cutIndex = Math.floor(sceneT);
        const subT = sceneT - cutIndex; // 0 to 1 within current cut

        let currentImgKey = 'sim';
        let cutTitle = 'PROBE STATUS & 9-CHANNEL TELEMETRY';
        let cutSub = 'Real-time wear rates: Fuel, Battery, Shield, Chassis, Nodes & Budget';

        if (cutIndex === 1) {
          currentImgKey = 'analytics';
          cutTitle = 'ORBIT & GRAVITATIONAL TELEMETRY GAUGES';
          cutSub = 'Tidal stretching index, radiation exposure limits & orbital decay tracking';
        } else if (cutIndex === 2) {
          currentImgKey = 'swarm';
          cutTitle = '5,000-NODE SWARM TOPOLOGY VISUALIZER';
          cutSub = 'Laser anchor crosslinks, orbital velocities & nearest-neighbor routing';
        } else if (cutIndex === 3) {
          currentImgKey = 'td';
          cutTitle = 'SCHWARZSCHILD TIME DILATION & REDSHIFT';
          cutSub = 'Metric progression comparing Earth Coordinate Time against Probe Proper Clocks';
        } else if (cutIndex === 4) {
          currentImgKey = 'grrt';
          cutTitle = 'RELATIVISTIC RAY TRACING & GEODESIC OPTICS';
          cutSub = '4th-Order Runge-Kutta photon deflection & lensed accretion disk imaging';
        }

        const img = imgs[currentImgKey];
        if (img && img.complete) {
          ctx.save();
          // Dynamic camera zoom punch-in
          const zoom = 1.0 + subT * 0.08;
          ctx.translate(W / 2, H / 2);
          ctx.scale(zoom, zoom);
          ctx.drawImage(img, -W / 2, -H / 2, W, H);
          ctx.restore();
        }

        // Tactical HUD Glass Frame
        ctx.save();
        ctx.fillStyle = 'rgba(8, 13, 23, 0.75)';
        ctx.fillRect(80, 50, W - 160, 90);
        ctx.strokeStyle = '#55DDE0';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(80, 50, W - 160, 90);

        ctx.font = '900 24px "Montserrat", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.letterSpacing = '4px';
        ctx.fillText(cutTitle, 110, 92);

        ctx.font = '600 14px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#55DDE0';
        ctx.fillText(cutSub, 110, 122);

        // Flash transition at cut boundaries
        if (subT < 0.12) {
          const flashAlpha = (0.12 - subT) / 0.12 * 0.45;
          ctx.fillStyle = 'rgba(85, 221, 224, ' + flashAlpha + ')';
          ctx.fillRect(0, 0, W, H);
        }

        ctx.restore();
      }

      // -------------------------------------------------------------
      // SCENE 6: FINAL REVEAL (26.0s – 30.0s)
      // -------------------------------------------------------------
      else if (timeSec >= 26.0) {
        const sceneT = timeSec - 26.0; // 0 to 4 seconds
        const fadeOut = sceneT > 2.5 ? Math.max(0, (4.0 - sceneT) / 1.5) : 1.0;

        // Camera slowly pulling back into deep space
        const pullBack = 1.0 - sceneT * 0.06;
        drawRelativisticBlackHole(W / 2, H * 0.44, 160 * pullBack, 0.42, 0, sceneT * 0.04, fadeOut);

        // Monumental Hollywood Title Reveal
        const titleAlpha = Math.min(1, sceneT / 0.6) * fadeOut;

        ctx.save();
        ctx.textAlign = 'center';

        // Anamorphic horizontal lens flare line
        const flareWidth = Math.min(1, sceneT / 0.8) * W * 0.85;
        const flareGrad = ctx.createLinearGradient(W / 2 - flareWidth / 2, 0, W / 2 + flareWidth / 2, 0);
        flareGrad.addColorStop(0, 'rgba(85, 221, 224, 0)');
        flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, ' + (0.85 * fadeOut) + ')');
        flareGrad.addColorStop(1, 'rgba(85, 221, 224, 0)');
        ctx.fillStyle = flareGrad;
        ctx.fillRect(W / 2 - flareWidth / 2, H * 0.73, flareWidth, 2);

        // MAIN TITLE
        ctx.font = '900 62px "Montserrat", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, ' + titleAlpha + ')';
        ctx.letterSpacing = '12px';
        ctx.shadowColor = '#55DDE0';
        ctx.shadowBlur = 30;
        ctx.fillText('MICRO-SATELLITE MISSION CONTROL', W / 2, H * 0.70);

        // SUBTITLE
        ctx.font = '800 32px "Montserrat", sans-serif';
        ctx.fillStyle = 'rgba(255, 181, 71, ' + titleAlpha + ')';
        ctx.letterSpacing = '16px';
        ctx.shadowColor = '#FF9500';
        ctx.shadowBlur = 20;
        ctx.fillText('BEYOND THE EVENT HORIZON', W / 2, H * 0.78);

        // PRESTIGE SPONSOR CREDIT
        ctx.font = '700 20px "IBM Plex Mono", monospace';
        ctx.fillStyle = 'rgba(85, 221, 224, ' + titleAlpha + ')';
        ctx.letterSpacing = '8px';
        ctx.shadowBlur = 0;
        ctx.fillText('NASA SPACE APPS CHALLENGE', W / 2, H * 0.86);

        // Fade to black at the end
        if (sceneT >= 2.5) {
          const blackAlpha = (sceneT - 2.5) / 1.5;
          ctx.fillStyle = 'rgba(0, 0, 0, ' + blackAlpha + ')';
          ctx.fillRect(0, 0, W, H);
        }

        ctx.restore();
      }
    };
  </script>
</body>
</html>
  `;

  await page.setContent(htmlContent);

  // Wait for images to load
  await page.waitForFunction(() => window.assetsReady === true, { timeout: 15000 });
  console.log('All canvas assets and dashboard textures loaded successfully!');

  // Capture exactly 30 seconds at 30 FPS = 900 frames
  const FPS = 30;
  const TOTAL_DURATION = 30.0;
  const TOTAL_FRAMES = FPS * TOTAL_DURATION; // 900 frames

  console.log(`Starting high-resolution frame capture (1920x1080 @ 30 FPS, ${TOTAL_FRAMES} frames)...`);

  const startTime = Date.now();

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const timeSec = f / FPS;
    await page.evaluate((t) => window.renderTrailerFrame(t), timeSec);

    const frameName = `frame_${String(f + 1).padStart(5, '0')}.jpg`;
    const framePath = path.join(FRAMES_DIR, frameName);
    await page.screenshot({ path: framePath, quality: 92 });

    if ((f + 1) % 150 === 0 || f === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const progress = (((f + 1) / TOTAL_FRAMES) * 100).toFixed(0);
      console.log(`Frame ${f + 1}/${TOTAL_FRAMES} (${progress}%) - Time: ${timeSec.toFixed(2)}s [${elapsed}s elapsed]`);
    }
  }

  await browser.close();
  console.log(`All ${TOTAL_FRAMES} frames captured. Synthesizing Hollywood orchestral soundtrack and encoding 4K-quality trailer...`);

  // FFmpeg Multi-Track Audio Pipeline:
  // Track 1: Epic Orchestral Sci-Fi Soundtrack with rising tension and sub-bass braams
  // Track 2: Narrator Line 1 at 5.5s ("What if humanity could explore the edge of a black hole?")
  // Track 3: Narrator Line 2 at 15.5s ("Where gravity bends space... and time itself slows down.")
  // Track 4: Sound Design: Bass drop impact at 0.5s, swarm deployment pulse at 10s, montage drive at 21s, and thunderous final braam impact at 26s with reverb tail

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

  // Copy to artifact directory
  fs.copyFileSync(OUTPUT_VIDEO, ARTIFACT_VIDEO);
  console.log(`Trailer successfully rendered: ${OUTPUT_VIDEO}`);
  console.log(`Artifact saved: ${ARTIFACT_VIDEO}`);
}

renderTrailer().catch(console.error);
