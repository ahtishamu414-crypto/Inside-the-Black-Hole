import React, { useEffect, useRef } from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { generateStarfield, Star } from '../../sim/starfield';

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  alpha: number;
  maxLife: number;
  life: number;
}

export const SpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number | null = null;
    let lastTime = performance.now();

    // Screen dimensions
    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Starfield data (seeded for identical field on every load)
    let starfield = generateStarfield(42, w, h);

    // Shooting star state (rare: every 12 to 25s, 1 at a time)
    let nextShootingStarTime = performance.now() + 12000 + Math.random() * 8000;
    let activeShootingStar: ShootingStar | null = null;

    // Haze tint interpolation (fade over 1s)
    // 0 = neutral, 1 = red (FAILED), 2 = green (COMPLETED)
    let currentRedTint = 0;
    let currentGreenTint = 0;

    // Offscreen Canvas for Galaxy Haze
    let offscreenHaze: HTMLCanvasElement | null = null;
    let hazeOffsetX = 0;
    let hazeOffsetY = 0;

    // Cached Vignette Gradient (updated on resize, zero per-frame allocation)
    let cachedVignette: CanvasGradient | null = null;

    const buildHaze = () => {
      offscreenHaze = document.createElement('canvas');
      const pad = 300;
      offscreenHaze.width = (w + pad * 2) * dpr;
      offscreenHaze.height = (h + pad * 2) * dpr;
      const hctx = offscreenHaze.getContext('2d');
      if (!hctx) return;

      hctx.scale(dpr, dpr);

      // Galaxy haze: soft radial-gradient blobs with rich vibrant nebula colors
      // Blob 1: Teal #55DDE0
      const b1 = hctx.createRadialGradient(
        w * 0.35 + pad, h * 0.4 + pad, 60,
        w * 0.35 + pad, h * 0.4 + pad, w * 0.60
      );
      b1.addColorStop(0, 'rgba(85, 221, 224, 0.22)');
      b1.addColorStop(0.45, 'rgba(85, 221, 224, 0.10)');
      b1.addColorStop(1, 'rgba(85, 221, 224, 0)');
      hctx.fillStyle = b1;
      hctx.beginPath();
      hctx.arc(w * 0.35 + pad, h * 0.4 + pad, w * 0.60, 0, Math.PI * 2);
      hctx.fill();

      // Blob 2: Deep blue
      const b2 = hctx.createRadialGradient(
        w * 0.72 + pad, h * 0.65 + pad, 50,
        w * 0.72 + pad, h * 0.65 + pad, w * 0.65
      );
      b2.addColorStop(0, 'rgba(40, 110, 220, 0.22)');
      b2.addColorStop(0.5, 'rgba(25, 70, 160, 0.09)');
      b2.addColorStop(1, 'rgba(16, 40, 85, 0)');
      hctx.fillStyle = b2;
      hctx.beginPath();
      hctx.arc(w * 0.72 + pad, h * 0.65 + pad, w * 0.65, 0, Math.PI * 2);
      hctx.fill();

      // Blob 3: Hint of violet
      const b3 = hctx.createRadialGradient(
        w * 0.5 + pad, h * 0.2 + pad, 40,
        w * 0.5 + pad, h * 0.2 + pad, w * 0.50
      );
      b3.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
      b3.addColorStop(0.55, 'rgba(139, 92, 246, 0.08)');
      b3.addColorStop(1, 'rgba(109, 40, 217, 0)');
      hctx.fillStyle = b3;
      hctx.beginPath();
      hctx.arc(w * 0.5 + pad, h * 0.2 + pad, w * 0.50, 0, Math.PI * 2);
      hctx.fill();

      // Luminous diagonal Milky Way band
      hctx.save();
      hctx.translate(w * 0.5 + pad, h * 0.5 + pad);
      hctx.rotate(-Math.PI / 6); // 30 deg diagonal
      const bandGrad = hctx.createLinearGradient(0, -220, 0, 220);
      bandGrad.addColorStop(0, 'rgba(232, 240, 250, 0)');
      bandGrad.addColorStop(0.3, 'rgba(232, 240, 250, 0.08)');
      bandGrad.addColorStop(0.5, 'rgba(85, 221, 224, 0.14)');
      bandGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.08)');
      bandGrad.addColorStop(1, 'rgba(232, 240, 250, 0)');
      hctx.fillStyle = bandGrad;
      hctx.fillRect(-w * 1.5, -220, w * 3.0, 440);
      hctx.restore();

      // Build cached vignette - soft so edges show cosmic background
      cachedVignette = ctx.createRadialGradient(
        w * 0.5, h * 0.5, Math.min(w, h) * 0.40,
        w * 0.5, h * 0.5, Math.max(w, h) * 0.85
      );
      cachedVignette.addColorStop(0, 'rgba(8, 13, 23, 0)');
      cachedVignette.addColorStop(0.7, 'rgba(6, 10, 18, 0.18)');
      cachedVignette.addColorStop(1, 'rgba(3, 5, 10, 0.38)');
    };

    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      starfield = generateStarfield(42, w, h);
      buildHaze();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Draw single frame function
    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Read store state cleanly without triggering React component re-renders
      const state = useMissionStore.getState();
      const bgEnabled = state.bgEnabled;
      const simStatus = state.sim.status;
      const simSpeed = state.speed;

      // Base background color #080D17
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#080D17';
      ctx.fillRect(0, 0, w, h);

      // If background is toggled OFF, keep flat #080D17 and return
      if (!bgEnabled) {
        ctx.restore();
        return;
      }

      // Reduced motion: draw static frame
      if (prefersReducedMotion) {
        if (offscreenHaze) {
          ctx.drawImage(offscreenHaze, 0, 0, w, h);
        }
        // Static stars
        starfield.farStars.forEach(s => {
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.baseAlpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });
        starfield.midStars.forEach(s => {
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.baseAlpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });
        starfield.nearStars.forEach(s => {
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.baseAlpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        // Vignette
        const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
        vig.addColorStop(0, 'rgba(8, 13, 23, 0)');
        vig.addColorStop(1, 'rgba(4, 7, 13, 0.7)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
        return;
      }

      // Drift calculation tied to simulation
      // Stars drift only while status is RUNNING; PAUSED and READY drift at 15% speed
      const isRunning = simStatus === 'RUNNING' && !state.sim.active;
      const statusFactor = isRunning ? 1.0 : 0.15;
      const speedFactor = 1 + 0.15 * simSpeed;
      const moveFactor = statusFactor * speedFactor * dt;

      // Base drift velocities in px/sec
      const farDrift = 3.0 * moveFactor;
      const midDrift = 7.5 * moveFactor; // 2.5x parallax
      const nearDrift = 18.0 * moveFactor; // 6.0x parallax

      // 1. LAYER 1: GALAXY HAZE (pre-rendered offscreen, translated slowly)
      hazeOffsetX = (hazeOffsetX + 1.2 * moveFactor) % (w * 0.3);
      hazeOffsetY = (hazeOffsetY + 0.4 * moveFactor) % (h * 0.2);

      if (offscreenHaze) {
        ctx.drawImage(offscreenHaze, -150 - hazeOffsetX, -150 - hazeOffsetY, w + 300, h + 300);
      }

      // Haze dynamic tint: FAILED -> 10% red (#FF5C64), COMPLETED -> 10% green (#38D996)
      const targetRed = simStatus === 'FAILED' ? 0.10 : 0;
      const targetGreen = simStatus === 'COMPLETED' ? 0.10 : 0;
      currentRedTint += (targetRed - currentRedTint) * Math.min(dt * 2.0, 1.0); // 1s fade
      currentGreenTint += (targetGreen - currentGreenTint) * Math.min(dt * 2.0, 1.0);

      if (currentRedTint > 0.005) {
        ctx.fillStyle = `rgba(255, 92, 100, ${currentRedTint.toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
      }
      if (currentGreenTint > 0.005) {
        ctx.fillStyle = `rgba(56, 217, 150, ${currentGreenTint.toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
      }

      // 2. LAYER 2: FAR STARS (~220 tiny dots, almost still)
      for (let i = 0; i < starfield.farStars.length; i++) {
        const s = starfield.farStars[i];
        s.x = (s.x + farDrift) % w;
        if (s.x < 0) s.x += w;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.baseAlpha;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      // 3. LAYER 3: MID STARS (~90 dots at 1 px, slow drift, gentle twinkle)
      for (let i = 0; i < starfield.midStars.length; i++) {
        const s = starfield.midStars[i];
        s.x = (s.x + midDrift) % w;
        if (s.x < 0) s.x += w;
        const twinkle = 0.72 + 0.28 * Math.sin(now * 0.002 * s.twinkleSpeed + s.twinklePhase);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1.0, s.baseAlpha * twinkle));
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      // 4. LAYER 4: NEAR STARS (~25 dots at 1.5 - 2 px, faster drift, a few soft glows)
      for (let i = 0; i < starfield.nearStars.length; i++) {
        const s = starfield.nearStars[i];
        s.x = (s.x + nearDrift) % w;
        if (s.x < 0) s.x += w;
        const twinkle = 0.8 + 0.2 * Math.sin(now * 0.003 * s.twinkleSpeed + s.twinklePhase);

        if (s.glow) {
          ctx.fillStyle = s.color;
          ctx.globalAlpha = Math.max(0.25, Math.min(0.65, s.baseAlpha * twinkle * 0.5));
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.4, Math.min(1.0, s.baseAlpha * twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. LAYER 5: RARE SHOOTING STAR (every 8 to 16s, 1 at a time)
      if (!activeShootingStar && now >= nextShootingStarTime) {
        const startX = Math.random() * w * 0.75;
        const startY = Math.random() * h * 0.45;
        const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35; // ~45 deg downward
        const speed = 800 + Math.random() * 400; // px/s
        activeShootingStar = {
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          len: 100 + Math.random() * 70,
          alpha: 0.95,
          maxLife: 0.70,
          life: 0
        };
      }

      if (activeShootingStar) {
        activeShootingStar.life += dt;
        activeShootingStar.x += activeShootingStar.vx * dt;
        activeShootingStar.y += activeShootingStar.vy * dt;

        const progress = activeShootingStar.life / activeShootingStar.maxLife;
        if (progress >= 1.0) {
          activeShootingStar = null;
          nextShootingStarTime = now + 8000 + Math.random() * 8000; // next in 8-16s
        } else {
          const fade = Math.sin(progress * Math.PI);
          const tailX = activeShootingStar.x - (activeShootingStar.vx / 900) * activeShootingStar.len;
          const tailY = activeShootingStar.y - (activeShootingStar.vy / 900) * activeShootingStar.len;

          const streakGrad = ctx.createLinearGradient(tailX, tailY, activeShootingStar.x, activeShootingStar.y);
          streakGrad.addColorStop(0, 'rgba(232, 240, 250, 0)');
          streakGrad.addColorStop(0.7, `rgba(85, 221, 224, ${(0.45 * fade).toFixed(3)})`);
          streakGrad.addColorStop(1, `rgba(255, 255, 255, ${(0.95 * fade).toFixed(3)})`);

          ctx.strokeStyle = streakGrad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(activeShootingStar.x, activeShootingStar.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1.0;

      // SUBTLE VIGNETTE (Cached gradient for text readability & 4.5:1 contrast)
      if (cachedVignette) {
        ctx.fillStyle = cachedVignette;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();
    };

    // 60 FPS capped animation loop with document.hidden pause
    let lastFrameTime = 0;
    const targetInterval = 1000 / 60;

    const loop = (timestamp: number) => {
      if (!document.hidden) {
        const elapsed = timestamp - lastFrameTime;
        if (elapsed >= targetInterval) {
          lastFrameTime = timestamp - (elapsed % targetInterval);
          render(timestamp);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        lastTime = performance.now();
        lastFrameTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};
