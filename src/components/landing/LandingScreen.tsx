import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { getLaunchTimeline, CHECKLIST_ITEMS } from '../../sim/launchTimeline';
import { launchAudio } from './launchAudio';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export const LandingScreen: React.FC = () => {
  const landingDone = useMissionStore(s => s.landingDone);
  const setLandingDone = useMissionStore(s => s.setLandingDone);
  const openGuide = useMissionStore(s => s.openGuide);

  const [landingState, setLandingState] = useState<'idle' | 'countdown' | 'launch' | 'done'>('idle');
  const [soundOn, setSoundOn] = useState(() => launchAudio.isEnabled());
  const [countdownAria, setCountdownAria] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const finishSequence = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setFadingOut(true);
    launchAudio.stopAll();

    setTimeout(() => {
      setLandingDone(true);
      setLandingState('done');
    }, 450);
  }, [setLandingDone]);

  const handleSkip = useCallback(() => {
    finishSequence();
  }, [finishSequence]);

  const handleStartLaunch = useCallback(() => {
    if (landingState !== 'idle') return;
    if (reducedMotion) {
      finishSequence();
      return;
    }
    setLandingState('countdown');
    startTimeRef.current = performance.now();
  }, [landingState, reducedMotion, finishSequence]);

  // Space / Enter keyboard triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (landingState === 'idle') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartLaunch();
        }
      } else if (landingState !== 'done') {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleSkip();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [landingState, handleStartLaunch, handleSkip]);

  const toggleSound = () => {
    const next = !soundOn;
    launchAudio.setEnabled(next);
    setSoundOn(next);
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    if (landingDone) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle pool (capped at 400, reused)
    const MAX_PARTICLES = 400;
    const particles: Particle[] = [];
    const createParticle = (x: number, y: number, vx: number, vy: number, radius: number, maxLife: number, color: string): Particle => ({
      x, y, vx, vy, radius, alpha: 0.75, life: 0, maxLife, color
    });

    // Swarm particles pool for orbit stage (10-12s)
    const swarmDots: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 90; i++) {
      const angle = (Math.PI / 2) + (Math.random() - 0.5) * 1.6;
      const spd = 40 + Math.random() * 85;
      swarmDots.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * spd,
        vy: -Math.abs(Math.sin(angle) * spd),
        r: 1.0 + Math.random() * 1.4,
        alpha: 0.8
      });
    }

    // Audio cue markers
    let lastCountdown = -1;
    let rumbleStarted = false;
    let whooshPlayed = false;

    // Helper: Draw simple flat vector Rocket in code
    const drawRocket = (rx: number, ry: number, scale: number = 1.0, fairingOpen: boolean = false, stage1Detached: boolean = false) => {
      ctx.save();
      ctx.translate(rx, ry);
      ctx.scale(scale, scale);

      const rw = 28;
      const rh = 120;
      const hx = -rw / 2;

      // 1. Stage 1 Booster (if detached at t >= 8s, draw tumbling down separately)
      if (!stage1Detached) {
        // Booster tube with subtle metallic sheen
        const bGrad = ctx.createLinearGradient(hx, 0, hx + rw, 0);
        bGrad.addColorStop(0, '#101A2A');
        bGrad.addColorStop(0.35, '#1E2D42');
        bGrad.addColorStop(0.7, '#1E2D42');
        bGrad.addColorStop(1, '#0B1220');
        ctx.fillStyle = bGrad;
        ctx.fillRect(hx, 35, rw, 85);
        ctx.strokeStyle = '#1B283B';
        ctx.lineWidth = 1;
        ctx.strokeRect(hx, 35, rw, 85);

        // Cyan vertical accent stripe
        ctx.fillStyle = '#55DDE0';
        ctx.fillRect(hx + 3, 45, 2.5, 65);
        ctx.fillRect(hx + rw - 5.5, 45, 2.5, 65);

        // Grid fins
        ctx.fillStyle = '#1A283B';
        ctx.fillRect(hx - 6, 45, 6, 10);
        ctx.fillRect(hx + rw, 45, 6, 10);
        ctx.strokeStyle = '#55DDE0';
        ctx.strokeRect(hx - 6, 45, 6, 10);
        ctx.strokeRect(hx + rw, 45, 6, 10);

        // Engine Bell
        ctx.fillStyle = '#060B12';
        ctx.beginPath();
        ctx.moveTo(hx + 3, 120);
        ctx.lineTo(hx + rw - 3, 120);
        ctx.lineTo(hx + rw + 2, 132);
        ctx.lineTo(hx - 2, 132);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FFB547';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. Stage 2 Interstage & Swarm Section
      const s2Grad = ctx.createLinearGradient(hx, 0, hx + rw, 0);
      s2Grad.addColorStop(0, '#0E1726');
      s2Grad.addColorStop(0.5, '#1B2A3E');
      s2Grad.addColorStop(1, '#0A111C');
      ctx.fillStyle = s2Grad;
      ctx.fillRect(hx, 0, rw, 35);
      ctx.strokeStyle = '#1B283B';
      ctx.strokeRect(hx, 0, rw, 35);

      // Observation window (flat cyan circle with glint)
      ctx.fillStyle = '#55DDE0';
      ctx.beginPath();
      ctx.arc(0, 16, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Payload Fairing / Nose Cone
      if (!fairingOpen) {
        // Conical nose fairing
        ctx.fillStyle = '#18273D';
        ctx.beginPath();
        ctx.moveTo(hx, 0);
        ctx.lineTo(hx + rw, 0);
        ctx.lineTo(0, -32);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1B283B';
        ctx.stroke();

        ctx.strokeStyle = '#55DDE0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(0, 0);
        ctx.stroke();
      } else {
        // Fairing Jettisoned: Swarm payload bus core exposed
        ctx.fillStyle = '#070D18';
        ctx.fillRect(hx + 3, -24, rw - 6, 24);
        ctx.strokeStyle = '#55DDE0';
        ctx.strokeRect(hx + 3, -24, rw - 6, 24);

        // Miniature glowing probe nodes
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#55DDE0' : '#FFB547';
            ctx.beginPath();
            ctx.arc(hx + 7 + c * 7, -18 + r * 7, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    };

    // Helper: Draw 3-layer engine flame
    const drawFlame = (fx: number, fy: number, intensity: number) => {
      if (intensity <= 0.01) return;
      ctx.save();
      const flicker = 0.9 + Math.random() * 0.2;
      const flameLen = (70 + intensity * 60) * flicker;

      // Layer 1: Soft orange outer boundary (#FF7A38)
      ctx.fillStyle = 'rgba(255, 122, 56, 0.45)';
      ctx.beginPath();
      ctx.moveTo(fx - 15, fy);
      ctx.quadraticCurveTo(fx - 24, fy + flameLen * 0.4, fx, fy + flameLen);
      ctx.quadraticCurveTo(fx + 24, fy + flameLen * 0.4, fx + 15, fy);
      ctx.closePath();
      ctx.fill();

      // Layer 2: Amber jet (#FFB547)
      ctx.fillStyle = 'rgba(255, 181, 71, 0.85)';
      ctx.beginPath();
      ctx.moveTo(fx - 10, fy);
      ctx.quadraticCurveTo(fx - 16, fy + flameLen * 0.35, fx, fy + flameLen * 0.75);
      ctx.quadraticCurveTo(fx + 16, fy + flameLen * 0.35, fx + 10, fy);
      ctx.closePath();
      ctx.fill();

      // Layer 3: Blinding White Core
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(fx - 5, fy);
      ctx.quadraticCurveTo(fx - 7, fy + flameLen * 0.2, fx, fy + flameLen * 0.45);
      ctx.quadraticCurveTo(fx + 7, fy + flameLen * 0.2, fx + 5, fy);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const render = (now: number) => {
      if (document.hidden) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Determine timeline seconds
      let t = 0;
      if (startTimeRef.current !== null) {
        t = (now - startTimeRef.current) / 1000;
      }

      const timeline = getLaunchTimeline(t, h);

      // Audio sync
      if (startTimeRef.current !== null) {
        if (timeline.countdownNumber !== null && timeline.countdownNumber !== lastCountdown) {
          lastCountdown = timeline.countdownNumber;
          launchAudio.playCountdownTick(timeline.countdownNumber === 1);
          setCountdownAria(`Countdown ${timeline.countdownNumber}`);
        }
        if (t >= 5.0 && !rumbleStarted) {
          launchAudio.startRumble();
          rumbleStarted = true;
        }
        if (rumbleStarted) {
          launchAudio.setThrottle(timeline.flameIntensity);
        }
        if (t >= 5.2 && !whooshPlayed) {
          launchAudio.playWhoosh();
          whooshPlayed = true;
        }
      }

      // Check completion
      if (t >= 14.0 && !completedRef.current) {
        finishSequence();
        ctx.restore();
        return;
      }

      // Camera shake
      let shakeX = 0;
      let shakeY = 0;
      if (timeline.cameraShake > 0) {
        const amp = timeline.cameraShake * 5.0;
        shakeX = (Math.random() - 0.5) * amp;
        shakeY = (Math.random() - 0.5) * amp;
      }
      ctx.translate(shakeX, shakeY);

      // ====================================================================
      // 1. SKY GRADIENT (Shifts from deep blue near horizon to space black)
      // ====================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, timeline.skyTopColor);
      skyGrad.addColorStop(1, timeline.skyBottomColor);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // ====================================================================
      // 2. STARS FADE IN (Upper atmosphere & space)
      // ====================================================================
      if (timeline.starsAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = timeline.starsAlpha;
        // Distant space stars
        ctx.fillStyle = '#E8F0FA';
        for (let i = 0; i < 80; i++) {
          const sx = (i * 127) % w;
          const sy = (i * 97) % h;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.7 + (i % 3) * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ====================================================================
      // 3. DISTANT PLANET CURVE AT BOTTOM EDGE (Landing screen idle state)
      // ====================================================================
      const planetCurveY = h * 0.94 + timeline.cameraOffsetY * 0.3;
      if (planetCurveY < h + 200) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 1.5 + timeline.cameraOffsetY * 0.3, w * 0.85, h * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#060E1A';
        ctx.fill();
        ctx.strokeStyle = 'rgba(85, 221, 224, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // ====================================================================
      // 4. PAD & GANTRY AT BOTTOM CENTRE
      // ====================================================================
      const rocketX = w * 0.5;
      const padY = h * 0.76 + timeline.cameraOffsetY;

      if (padY > -100) {
        ctx.save();
        // Ground pad light glow
        const lightGrad = ctx.createRadialGradient(rocketX, padY + 15, 10, rocketX, padY + 15, 180);
        const lightColor = timeline.padLightsAmber ? 'rgba(255, 181, 71, 0.22)' : 'rgba(85, 221, 224, 0.15)';
        lightGrad.addColorStop(0, lightColor);
        lightGrad.addColorStop(1, 'rgba(8, 13, 23, 0)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(rocketX - 200, padY - 80, 400, 160);

        // Concrete pad base
        ctx.fillStyle = '#101A2A';
        ctx.fillRect(rocketX - 90, padY + 10, 180, 30);
        ctx.strokeStyle = '#1B283B';
        ctx.lineWidth = 1;
        ctx.strokeRect(rocketX - 90, padY + 10, 180, 30);

        // Steel Gantry service tower (left)
        const gantryX = rocketX - 70;
        const gantryW = 24;
        const gantryH = 150;
        ctx.strokeStyle = '#2A3B52';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(gantryX, padY + 10 - gantryH, gantryW, gantryH);

        for (let gy = padY + 10 - gantryH; gy < padY + 10; gy += 18) {
          ctx.beginPath();
          ctx.moveTo(gantryX, gy);
          ctx.lineTo(gantryX + gantryW, gy + 18);
          ctx.stroke();
        }

        // Faint pad light / beacon on tower
        ctx.fillStyle = timeline.padLightsAmber ? '#FFB547' : '#55DDE0';
        ctx.beginPath();
        ctx.arc(gantryX + gantryW / 2, padY + 10 - gantryH - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ====================================================================
      // 5. SMOKE PARTICLES BILLOWING SIDEWAYS (Grey, fading along ground)
      // ====================================================================
      if (t >= 5.0 && t < 8.2) {
        // Spawn smoke billows
        if (particles.length < MAX_PARTICLES) {
          for (let k = 0; k < 4; k++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            particles.push(
              createParticle(
                rocketX + (Math.random() - 0.5) * 20,
                padY + 15,
                side * (60 + Math.random() * 90),
                (Math.random() - 0.5) * 15,
                14 + Math.random() * 12,
                1.6 + Math.random() * 0.8,
                'rgba(140, 160, 185,'
              )
            );
          }
        }
      }

      // Update & render smoke particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 0.016;
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.radius += 0.55;
        const prog = p.life / p.maxLife;
        if (prog >= 1.0) {
          particles.splice(i, 1);
          continue;
        }

        const a = (1.0 - prog) * 0.45;
        ctx.fillStyle = `${p.color} ${a.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y + timeline.cameraOffsetY * 0.2, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ====================================================================
      // 6. ROCKET & ENGINE FLAME
      // ====================================================================
      const currentRocketY = timeline.rocketY + timeline.cameraOffsetY;

      // Soft idle glow on engine bell when idle
      if (startTimeRef.current === null || t < 5.0) {
        ctx.save();
        const bellGlow = ctx.createRadialGradient(rocketX, currentRocketY + 130, 2, rocketX, currentRocketY + 130, 24);
        bellGlow.addColorStop(0, 'rgba(85, 221, 224, 0.45)');
        bellGlow.addColorStop(1, 'rgba(85, 221, 224, 0)');
        ctx.fillStyle = bellGlow;
        ctx.beginPath();
        ctx.arc(rocketX, currentRocketY + 130, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Active engine flame during liftoff & ascent
      if (timeline.flameIntensity > 0) {
        drawFlame(rocketX, currentRocketY + 132, timeline.flameIntensity);
      }

      // Draw the rocket body
      drawRocket(rocketX, currentRocketY, 1.0, timeline.fairingSeparated, timeline.stageSeparated);

      // Tumbling stage 1 booster separation puff (t: 8 to 10s)
      if (timeline.stageSeparated && t < 10.5) {
        const dt = t - 8.0;
        const s1Y = currentRocketY + 90 + dt * 40;
        const s1Rot = dt * 0.35;
        ctx.save();
        ctx.translate(rocketX + dt * 15, s1Y);
        ctx.rotate(s1Rot);
        ctx.fillStyle = '#101A2A';
        ctx.fillRect(-14, 0, 28, 70);
        ctx.strokeStyle = '#1B283B';
        ctx.strokeRect(-14, 0, 28, 70);
        // Small puff
        ctx.fillStyle = 'rgba(255, 181, 71, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 6 + dt * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ====================================================================
      // 7. ORBIT: CURVE OF EARTH & PROBE SWARM SCATTER (10 to 12s)
      // ====================================================================
      if (timeline.earthAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = timeline.earthAlpha;

        // Curve of Earth at bottom
        const eCenterX = w * 0.5;
        const eCenterY = h * 1.55;
        const eRadius = h * 0.95;

        // Cyan atmospheric limb glow
        const limbGrad = ctx.createRadialGradient(eCenterX, eCenterY, eRadius * 0.95, eCenterX, eCenterY, eRadius * 1.06);
        limbGrad.addColorStop(0, 'rgba(85, 221, 224, 0.45)');
        limbGrad.addColorStop(0.5, 'rgba(40, 110, 220, 0.25)');
        limbGrad.addColorStop(1, 'rgba(8, 13, 23, 0)');
        ctx.fillStyle = limbGrad;
        ctx.beginPath();
        ctx.arc(eCenterX, eCenterY, eRadius * 1.06, 0, Math.PI * 2);
        ctx.fill();

        // Planet dark curve
        ctx.fillStyle = '#050E1C';
        ctx.beginPath();
        ctx.arc(eCenterX, eCenterY, eRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Probe swarm released as scatter of small cyan dots fanning out (t: 10 to 12s)
      if (timeline.swarmReleased) {
        ctx.save();
        const swarmDt = t - 10.0;
        swarmDots.forEach(sd => {
          const px = rocketX + sd.vx * swarmDt;
          const py = currentRocketY + sd.vy * swarmDt;
          ctx.fillStyle = '#55DDE0';
          ctx.globalAlpha = Math.max(0.2, 1.0 - swarmDt * 0.35);
          ctx.beginPath();
          ctx.arc(px, py, sd.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // ====================================================================
      // 8. BLACK HOLE WITH THIN ACCRETION DISK & GLOW (12 to 14s)
      // ====================================================================
      if (timeline.blackHoleAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = timeline.blackHoleAlpha;

        const bhX = w * 0.5;
        const bhY = h * 0.38;
        const bhR = 48 * timeline.blackHoleScale;

        // Thin glowing accretion disk & relativistic glow
        const bhGlow = ctx.createRadialGradient(bhX, bhY, bhR * 0.85, bhX, bhY, bhR * 2.8);
        bhGlow.addColorStop(0, '#000000');
        bhGlow.addColorStop(0.28, 'rgba(255, 181, 71, 0.95)'); // Amber accretion disk
        bhGlow.addColorStop(0.55, 'rgba(85, 221, 224, 0.6)');  // Cyan Doppler beaming
        bhGlow.addColorStop(1, 'rgba(8, 13, 23, 0)');
        ctx.fillStyle = bhGlow;
        ctx.beginPath();
        ctx.arc(bhX, bhY, bhR * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Black Hole event horizon disc
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(bhX, bhY, bhR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#55DDE0';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Target Text
        ctx.font = '13px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#E8F0FA';
        ctx.textAlign = 'center';
        ctx.fillText('Target: supermassive black hole', bhX, bhY + bhR * 2.2);

        ctx.restore();
      }

      // ====================================================================
      // 9. COUNTDOWN NUMBER & CHECKLIST (0 to 5s)
      // ====================================================================
      if (startTimeRef.current !== null && t < 5.0 && timeline.countdownNumber !== null) {
        ctx.save();
        // Centred large countdown number above rocket
        ctx.font = '600 84px "IBM Plex Mono", monospace';
        ctx.fillStyle = timeline.countdownNumber <= 2 ? '#FFB547' : '#55DDE0';
        ctx.textAlign = 'center';
        ctx.fillText(String(timeline.countdownNumber), w * 0.5, h * 0.35);

        // Checklist on the left
        const clX = 48;
        let clY = h * 0.35;
        ctx.font = '14px "IBM Plex Mono", monospace';
        ctx.textAlign = 'left';

        CHECKLIST_ITEMS.forEach((item, idx) => {
          const isDone = idx < timeline.activeChecklistCount;
          ctx.fillStyle = isDone ? '#38D996' : '#4E6177';
          const symbol = isDone ? '✓ ' : '○ ';
          ctx.fillText(symbol + item, clX, clY);
          clY += 28;
        });

        ctx.restore();
      }

      // ====================================================================
      // 10. TELEMETRY READOUTS IN CORNER (8 to 14s)
      // ====================================================================
      if (t >= 8.0) {
        ctx.save();
        ctx.font = '12px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#8FA3B8';
        ctx.fillText(timeline.telemetry.alt, 40, h - 70);
        ctx.fillText(timeline.telemetry.speed, 40, h - 50);
        ctx.fillStyle = '#55DDE0';
        ctx.fillText(timeline.telemetry.status, 40, h - 30);
        ctx.restore();
      }

      // ====================================================================
      // 11. BRIEF WHITE FLASH TO DARK TRANSITION (13.4 to 14s)
      // ====================================================================
      if (timeline.flashAlpha > 0.01) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${timeline.flashAlpha.toFixed(2)})`;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      launchAudio.stopAll();
    };
  }, [landingDone, finishSequence]);

  if (landingDone) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#080D17',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.45s ease-out',
        pointerEvents: fadingOut ? 'none' : 'auto',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Screen Reader Aria-Live Announcement */}
      <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {countdownAria}
      </div>

      {/* Main Single Animation Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />

      {/* Top Bar Controls: Speaker Sound Toggle (left) & Skip Button (right) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 32px'
        }}
      >
        {/* Sound Toggle (Off by default per spec) */}
        <button
          onClick={toggleSound}
          title={soundOn ? 'Mute Launch Sound' : 'Enable Launch Sound (WebAudio)'}
          style={{
            background: 'rgba(16, 26, 42, 0.45)',
            border: `1px solid ${soundOn ? '#55DDE0' : '#1B283B'}`,
            borderRadius: 3,
            color: soundOn ? '#55DDE0' : '#8FA3B8',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.06em',
            padding: '7px 14px',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>{soundOn ? '🔊 SOUND ON' : '🔇 SOUND OFF'}</span>
        </button>

        {/* Skip Button (Visible whole time, focusable and labelled) */}
        <button
          onClick={handleSkip}
          aria-label="Skip launch animation and go to mission control dashboard"
          style={{
            background: 'rgba(16, 26, 42, 0.45)',
            border: '1px solid #1B283B',
            borderRadius: 3,
            color: '#55DDE0',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            padding: '7px 16px',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#55DDE0';
            e.currentTarget.style.color = '#E8F0FA';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#1B283B';
            e.currentTarget.style.color = '#55DDE0';
          }}
        >
          <span>SKIP</span>
          <span style={{ fontSize: 13 }}>⏭</span>
        </button>
      </div>

      {/* IDLE STATE: Title Card, Value Cards, Buttons (shown only before launch) */}
      {landingState === 'idle' && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 'auto',
            textAlign: 'center',
            maxWidth: 780,
            padding: '0 20px'
          }}
        >
          {/* Main Title: INSIDE THE BLACK HOLE in IBM Plex Sans, wide tracking */}
          <h1
            style={{
              margin: '0 0 10px 0',
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 600,
              letterSpacing: '0.16em',
              color: '#E8F0FA',
              textTransform: 'uppercase'
            }}
          >
            INSIDE THE BLACK HOLE
          </h1>

          {/* Subtitle */}
          <div
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 15,
              color: '#8FA3B8',
              letterSpacing: '0.05em',
              marginBottom: 32
            }}
          >
            Micro-Satellite Swarm Mission · BH-5000
          </div>

          {/* Three Beginner-Friendly Value Cards under Title */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              width: '100%',
              marginBottom: 38
            }}
          >
            {[
              { num: '01', text: 'Design a probe swarm' },
              { num: '02', text: 'Fly close to a black hole' },
              { num: '03', text: 'Bring the data home' }
            ].map(c => (
              <div
                key={c.num}
                style={{
                  background: 'rgba(16, 26, 42, 0.40)',
                  border: '1px solid #1B283B',
                  borderRadius: 4,
                  padding: '16px 18px',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left'
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    color: '#55DDE0',
                    fontWeight: 600
                  }}
                >
                  {c.num}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 14.5,
                    color: '#E8F0FA',
                    lineHeight: 1.3
                  }}
                >
                  {c.text}
                </span>
              </div>
            ))}
          </div>

          {/* Primary Action Button: LAUNCH MISSION (or ENTER MISSION CONTROL if reduced motion) */}
          <button
            onClick={handleStartLaunch}
            style={{
              height: 48,
              padding: '0 36px',
              border: 'none',
              borderRadius: 3,
              background: '#55DDE0',
              color: '#080D17',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(85, 221, 224, 0.35)',
              transition: 'transform 0.15s ease, background 0.15s ease',
              marginBottom: 16
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.background = '#6DF0F3';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#55DDE0';
            }}
          >
            {reducedMotion ? 'ENTER MISSION CONTROL' : 'LAUNCH MISSION'}
          </button>

          {/* Secondary Link: "How to play" */}
          <button
            onClick={openGuide}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#55DDE0',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12.5,
              letterSpacing: '0.04em',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 6
            }}
          >
            How to play
          </button>
        </div>
      )}

      {/* Footer Line */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          marginTop: 'auto',
          padding: '16px 24px',
          textAlign: 'center',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 13,
          color: '#8FA3B8',
          letterSpacing: '0.02em'
        }}
      >
        Educational simulation. Not a real spacecraft control system.
      </div>
    </div>
  );
};
