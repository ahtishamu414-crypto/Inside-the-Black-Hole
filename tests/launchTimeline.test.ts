import { describe, it, expect } from 'vitest';
import { getLaunchTimeline, CHECKLIST_ITEMS } from '../src/sim/launchTimeline';

describe('Launch Timeline Pure Function', () => {
  const H = 1080;

  it('evaluates correctly at t = 0 (countdown start, pad idle)', () => {
    const s = getLaunchTimeline(0, H);
    expect(s.phaseName).toBe('COUNTDOWN');
    expect(s.countdownNumber).toBe(5);
    expect(s.activeChecklistCount).toBe(0);
    expect(s.flameIntensity).toBe(0);
    expect(s.rocketY).toBe(H * 0.72);
    expect(s.stageSeparated).toBe(false);
    expect(s.swarmReleased).toBe(false);
    expect(s.skyBottomColor).toContain('rgb');
  });

  it('evaluates correctly at t = 4.9 (terminal countdown, checklist ready)', () => {
    const s = getLaunchTimeline(4.9, H);
    expect(s.phaseName).toBe('COUNTDOWN');
    expect(s.countdownNumber).toBe(1);
    expect(s.activeChecklistCount).toBe(4);
    expect(s.flameIntensity).toBe(0);
    expect(s.rocketY).toBe(H * 0.72);
    expect(s.cameraShake).toBeGreaterThan(0);
  });

  it('evaluates correctly at t = 5.1 (engine ignition, liftoff starts)', () => {
    const s = getLaunchTimeline(5.1, H);
    expect(s.phaseName).toBe('IGNITION_ASCENT');
    expect(s.countdownNumber).toBeNull();
    expect(s.activeChecklistCount).toBe(5);
    expect(s.flameIntensity).toBeGreaterThan(0);
    expect(s.rocketY).toBeLessThan(H * 0.72); // has started rising
    expect(s.telemetry.status).toBe('Liftoff');
  });

  it('evaluates correctly at t = 8.0 (stage separation)', () => {
    const s = getLaunchTimeline(8.0, H);
    expect(s.phaseName).toBe('STAGE_SEPARATION');
    expect(s.stageSeparated).toBe(true);
    expect(s.flameIntensity).toBeGreaterThan(0);
    expect(s.telemetry.status).toBe('Stage separation');
    expect(s.starsAlpha).toBeGreaterThan(0.5);
  });

  it('evaluates correctly at t = 10.0 (orbit insertion and swarm release)', () => {
    const s = getLaunchTimeline(10.0, H);
    expect(s.phaseName).toBe('ORBIT_INSERTION');
    expect(s.swarmReleased).toBe(true);
    expect(s.earthAlpha).toBeGreaterThan(0);
    expect(s.telemetry.status).toBe('Swarm released');
  });

  it('evaluates correctly at t = 12.0 (black hole transit on horizon)', () => {
    const s = getLaunchTimeline(12.0, H);
    expect(s.phaseName).toBe('BLACK_HOLE_TRANSIT');
    expect(s.blackHoleAlpha).toBeGreaterThanOrEqual(0);
    expect(s.telemetry.status).toBe('Target: supermassive black hole');
  });

  it('evaluates correctly at t = 14.0 (sequence complete, ready for handoff)', () => {
    const s = getLaunchTimeline(14.0, H);
    expect(s.phaseName).toBe('COMPLETE');
    expect(s.blackHoleAlpha).toBe(1.0);
  });

  it('verifies checklist items definition', () => {
    expect(CHECKLIST_ITEMS).toHaveLength(5);
    expect(CHECKLIST_ITEMS[0]).toBe('Fuel loaded');
    expect(CHECKLIST_ITEMS[4]).toBe('Go for launch');
  });

  it('verifies that store setLandingDone sets landingDone exactly once', async () => {
    const { useMissionStore } = await import('../src/store/useMissionStore');
    
    // Reset state
    useMissionStore.getState().setLandingDone(false);
    expect(useMissionStore.getState().landingDone).toBe(false);

    // Call setLandingDone(true)
    useMissionStore.getState().setLandingDone(true);
    expect(useMissionStore.getState().landingDone).toBe(true);

    // Multiple calls remain true idempotent
    useMissionStore.getState().setLandingDone(true);
    expect(useMissionStore.getState().landingDone).toBe(true);
  });
});
