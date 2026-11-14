/**
 * Pure Timeline Engine for Rocket Launch Sequence
 *
 * Sequence duration: 14 seconds
 * - 0 to 5 s: Countdown 5 -> 0, checklist lines ticking green, camera shake starts at 4s.
 * - 5 to 8 s: Ignition, 3-layer flame, smoke billows sideways, rocket rises with easing, sky shifts to black.
 * - 8 to 10 s: Max-Q flare, fairing separates, stage 1 separates with flame puff, telemetry readouts.
 * - 10 to 12 s: Orbit insertion, curve of Earth at bottom, probe swarm released as cyan dots.
 * - 12 to 14 s: Camera pans up, black hole with accretion disk appears on horizon, brief white flash, done.
 */

export interface LaunchTimelineState {
  t: number;
  phaseName: 'COUNTDOWN' | 'IGNITION_ASCENT' | 'STAGE_SEPARATION' | 'ORBIT_INSERTION' | 'BLACK_HOLE_TRANSIT' | 'COMPLETE';
  countdownNumber: number | null;
  activeChecklistCount: number;
  rocketY: number;
  cameraOffsetY: number;
  flameIntensity: number;
  skyTopColor: string;
  skyBottomColor: string;
  starsAlpha: number;
  padLightsAmber: boolean;
  cameraShake: number;
  stageSeparated: boolean;
  fairingSeparated: boolean;
  swarmReleased: boolean;
  earthAlpha: number;
  blackHoleAlpha: number;
  blackHoleScale: number;
  flashAlpha: number;
  telemetry: {
    alt: string;
    speed: string;
    status: string;
  };
}

export const CHECKLIST_ITEMS = [
  'Fuel loaded',
  'Shielding checked',
  'Comms link',
  'Swarm deployed',
  'Go for launch'
] as const;

export function getLaunchTimeline(t: number, height: number = 1080): LaunchTimelineState {
  const clampedT = Math.max(0, Math.min(14, t));
  const basePadY = height * 0.72;

  // 1. Phase Determination
  let phaseName: LaunchTimelineState['phaseName'] = 'COUNTDOWN';
  if (clampedT >= 14) {
    phaseName = 'COMPLETE';
  } else if (clampedT >= 12) {
    phaseName = 'BLACK_HOLE_TRANSIT';
  } else if (clampedT >= 10) {
    phaseName = 'ORBIT_INSERTION';
  } else if (clampedT >= 8) {
    phaseName = 'STAGE_SEPARATION';
  } else if (clampedT >= 5) {
    phaseName = 'IGNITION_ASCENT';
  } else {
    phaseName = 'COUNTDOWN';
  }

  // 2. Countdown Number (5 down to 1 during 0 to 5s)
  let countdownNumber: number | null = null;
  if (clampedT < 5) {
    countdownNumber = 5 - Math.floor(clampedT);
  }

  // 3. Active Checklist Count: 1 at 1s, 2 at 2s, 3 at 3s, 4 at 4s, 5 at >= 5s
  const activeChecklistCount = Math.min(5, Math.floor(clampedT));

  // 4. Pad Lights amber flicker at t >= 3s
  const padLightsAmber = clampedT >= 3 && clampedT < 6;

  // 5. Camera Shake: begins at 4s, builds to peak at liftoff + 1s (6s), fades by 7.5s
  let cameraShake = 0;
  if (clampedT >= 4 && clampedT < 7.5) {
    if (clampedT < 6) {
      cameraShake = (clampedT - 4) / 2.0; // 0 to 1
    } else {
      cameraShake = Math.max(0, 1.0 - (clampedT - 6) / 1.5); // 1 to 0
    }
  }

  // 6. Rocket Y & Camera Offset
  let rocketY = basePadY;
  let cameraOffsetY = 0;
  let flameIntensity = 0;

  if (clampedT < 5) {
    // Resting on pad
    rocketY = basePadY;
    cameraOffsetY = 0;
    flameIntensity = 0;
  } else if (clampedT < 8) {
    // 5 to 8s: Ignition & Ascent with quadratic easing (slow start, then accelerate)
    const dt = clampedT - 5; // 0 to 3s
    flameIntensity = Math.min(1.0, dt * 2.5); // quick ignition flame buildup
    const riseDist = 35 * dt * dt; // slow start -> accelerating climb
    rocketY = basePadY - riseDist;
    cameraOffsetY = riseDist * 0.75; // ground slides down
  } else if (clampedT < 10) {
    // 8 to 10s: Stage separation & high-speed stratospheric climb
    const dt = clampedT - 8; // 0 to 2s
    flameIntensity = 0.85;
    const riseDist = 35 * 9 + dt * 180 + dt * dt * 45;
    rocketY = basePadY - riseDist;
    cameraOffsetY = riseDist * 0.9;
  } else if (clampedT < 12) {
    // 10 to 12s: Orbit insertion
    const dt = clampedT - 10;
    flameIntensity = 0.5; // upper stage low thrust
    const riseDist = 35 * 9 + 360 + 180 + dt * 110;
    rocketY = basePadY - riseDist;
    cameraOffsetY = riseDist;
  } else {
    // 12 to 14s: Camera pull towards black hole on horizon
    flameIntensity = Math.max(0, 1.0 - (clampedT - 12) * 1.5);
    rocketY = height * 0.45 - (clampedT - 12) * 40;
    cameraOffsetY = 2000;
  }

  // 7. Sky Gradient
  // Shifts from deep blue near horizon at ground (#0C182E / #182C4E) to cosmic black (#04070E / #060B14)
  const altitudeProgress = Math.min(1.0, Math.max(0, (clampedT - 5.5) / 3.5));
  const rTop = Math.round(12 * (1 - altitudeProgress) + 4 * altitudeProgress);
  const gTop = Math.round(24 * (1 - altitudeProgress) + 7 * altitudeProgress);
  const bTop = Math.round(46 * (1 - altitudeProgress) + 14 * altitudeProgress);

  const rBot = Math.round(24 * (1 - altitudeProgress) + 6 * altitudeProgress);
  const gBot = Math.round(44 * (1 - altitudeProgress) + 11 * altitudeProgress);
  const bBot = Math.round(78 * (1 - altitudeProgress) + 20 * altitudeProgress);

  const skyTopColor = `rgb(${rTop}, ${gTop}, ${bTop})`;
  const skyBottomColor = `rgb(${rBot}, ${gBot}, ${bBot})`;

  // 8. Stars Alpha: fades in as altitude rises (5.8 to 8.5s)
  const starsAlpha = Math.min(1.0, Math.max(0, (clampedT - 5.8) / 2.7));

  // 9. Stage Separation & Fairing (8s / 8.5s)
  const stageSeparated = clampedT >= 8.0;
  const fairingSeparated = clampedT >= 8.5;

  // 10. Swarm Released (10s)
  const swarmReleased = clampedT >= 10.0;

  // 11. Earth Curve (appears at orbit 9.8s to 12s)
  const earthAlpha = clampedT >= 9.6 ? Math.min(1.0, (clampedT - 9.6) / 1.4) : 0;

  // 12. Black Hole reveal on horizon (12 to 14s)
  let blackHoleAlpha = 0;
  let blackHoleScale = 1.0;
  if (clampedT >= 12.0) {
    blackHoleAlpha = Math.min(1.0, (clampedT - 12.0) / 1.2);
    blackHoleScale = 1.0 + (clampedT - 12.0) * 0.25; // grows slowly
  }

  // 13. Brief White Flash to Dark Transition (13.5s to 14s)
  let flashAlpha = 0;
  if (clampedT >= 13.4) {
    const flashProgress = (clampedT - 13.4) / 0.6; // 0 to 1
    if (flashProgress < 0.4) {
      flashAlpha = flashProgress / 0.4; // ramp up to white flash
    } else {
      flashAlpha = 1.0 - (flashProgress - 0.4) / 0.6; // fade down to dark
    }
  }

  // 14. Telemetry Text Readouts
  let altStr = 'Altitude 0 km';
  let speedStr = 'Speed 0 km/s';
  let statusStr = 'Pad standby';

  if (clampedT >= 12) {
    altStr = 'Altitude 420 km';
    speedStr = 'Speed 9.4 km/s';
    statusStr = 'Target: supermassive black hole';
  } else if (clampedT >= 10) {
    const alt = Math.round(180 + (clampedT - 10) * 80);
    const spd = (7.8 + (clampedT - 10) * 0.4).toFixed(1);
    altStr = `Altitude ${alt} km`;
    speedStr = `Speed ${spd} km/s`;
    statusStr = 'Swarm released';
  } else if (clampedT >= 8) {
    const alt = Math.round(45 + (clampedT - 8) * 60);
    const spd = (3.2 + (clampedT - 8) * 2.1).toFixed(1);
    altStr = `Altitude ${alt} km`;
    speedStr = `Speed ${spd} km/s`;
    statusStr = 'Stage separation';
  } else if (clampedT >= 5) {
    const dt = clampedT - 5;
    const alt = Math.round(dt * 12);
    const spd = (dt * 0.9).toFixed(1);
    altStr = `Altitude ${alt} km`;
    speedStr = `Speed ${spd} km/s`;
    statusStr = 'Liftoff';
  }

  return {
    t: clampedT,
    phaseName,
    countdownNumber,
    activeChecklistCount,
    rocketY,
    cameraOffsetY,
    flameIntensity,
    skyTopColor,
    skyBottomColor,
    starsAlpha,
    padLightsAmber,
    cameraShake,
    stageSeparated,
    fairingSeparated,
    swarmReleased,
    earthAlpha,
    blackHoleAlpha,
    blackHoleScale,
    flashAlpha,
    telemetry: {
      alt: altStr,
      speed: speedStr,
      status: statusStr
    }
  };
}
