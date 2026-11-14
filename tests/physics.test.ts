import { describe, it, expect } from 'vitest';
import {
  createFreshState,
  phys,
  massOf,
  setupCost,
  DIFF,
  VEH,
  ORBITS,
  PARTS
} from '../src/sim';

describe('Physics Engine Verification', () => {
  it('calculates Schwarzschild radius Rs and time dilation dtau/dt = sqrt(1 - 1/r)', () => {
    const s = createFreshState();
    s.p.mass = 4.3e6; // Sgr A*
    s.p.r = 4.5;
    const P = phys(s);

    // Rs = 2GM/c^2
    // 2 * 6.674e-11 * 4.3e6 * 1.989e30 / (2.998e8)^2 ≈ 12,701,534 km
    expect(P.RsKm).toBeCloseTo(12701534.13, 0);

    // dtau/dt = sqrt(1 - 1/4.5) = sqrt(7/9) ≈ 0.881917
    expect(P.dil).toBeCloseTo(Math.sqrt(1 - 1 / 4.5), 6);
  });

  it('calculates probe mass and fuel mass factor mf = 1 + (mass - 420) / 1000', () => {
    const s = createFreshState();
    // Default parts: basic shield (60kg), standard antenna (30kg), optical sensor (35kg) + bus (295kg) = 420kg
    expect(massOf(s.cfg)).toBe(420);
    const P1 = phys(s);
    expect(P1.mass).toBe(420);
    expect(P1.mf).toBe(1.0);

    // Heavy shield (+150kg) -> total 570kg -> mf = 1 + 150/1000 = 1.15
    s.cfg.parts.shield = 'b';
    const P2 = phys(s);
    expect(P2.mass).toBe(570);
    expect(P2.mf).toBeCloseTo(1.15, 6);
  });

  it('enforces radiation limit lim = shieldLvl + (heavy ? 20 : 0)', () => {
    const s = createFreshState();
    s.p.shieldLvl = 60;
    s.cfg.parts.shield = 'a'; // basic
    expect(phys(s).lim).toBe(60);

    s.cfg.parts.shield = 'b'; // heavy
    expect(phys(s).lim).toBe(80);
  });

  it('verifies difficulty scaling factors: wear, data, budget', () => {
    expect(DIFF.CADET.wear).toBe(0.7);
    expect(DIFF.CADET.data).toBe(1.15);
    expect(DIFF.CADET.budget).toBe(340);

    expect(DIFF.COMMANDER.wear).toBe(1.0);
    expect(DIFF.COMMANDER.data).toBe(1.0);
    expect(DIFF.COMMANDER.budget).toBe(260);

    expect(DIFF.ASTROPHYSICIST.wear).toBe(1.4);
    expect(DIFF.ASTROPHYSICIST.data).toBe(0.9);
    expect(DIFF.ASTROPHYSICIST.budget).toBe(200);

    const s = createFreshState();
    s.cfg.diff = 'CADET';
    const pCadet = phys(s);

    s.cfg.diff = 'COMMANDER';
    const pCmd = phys(s);

    s.cfg.diff = 'ASTROPHYSICIST';
    const pAstro = phys(s);

    // Wear scaling on chassis wear
    expect(pCadet.chR).toBeCloseTo(pCmd.chR * 0.7, 6);
    expect(pAstro.chR).toBeCloseTo(pCmd.chR * 1.4, 6);
  });

  it('imposes powered station-keeping fuel burn inside 3 Rs (ISCO boundary)', () => {
    const s = createFreshState();
    s.p.r = 2.5; // inside 3 Rs
    s.p.orb = 'Standard'; // 0.25
    const P = phys(s);

    // keep = 0.5 * (3.2 - 2.5) = 0.35
    expect(P.keep).toBeCloseTo(0.35, 6);
    // fuel burn = -(0.25 + 0.35) * D.wear * mf = -0.60
    expect(P.fuelR).toBeCloseTo(-0.6, 6);
  });

  it('sets fuel burn to 0 and budget to Infinity in Sandbox mode', () => {
    const s = createFreshState();
    s.cfg.sandbox = true;
    s.p.r = 2.0;
    const P = phys(s);

    expect(P.fuelR).toBe(0);
    expect(P.budgetLeft).toBe(Infinity);
  });
});
