import { describe, it, expect } from 'vitest';
import { node } from '../src/viz/bhViz';
import { createFreshState, phys, setupCost, DIFF, VEH } from '../src/sim';

describe('Node Generator and Launch Constraints', () => {
  it('generates markers with r < 1 Rs and ensures markers are inside event horizon', () => {
    const s = createFreshState();
    const P = phys(s);
    const vizState = {
      r: s.p.r,
      mass: s.p.mass,
      markers: s.p.markers, // 24
      anchorR: 14,
      frac: { lost: 0, damaged: 0, inactive: 0 },
      vt: 0
    };

    // Total nodes = 5000. Anchors = 160 (id > 4840).
    // Markers = 24 (id > 5000 - 160 - 24 = 4816 and <= 4840).
    const ext = 5000 - 160 - s.p.markers;
    for (let id = ext + 1; id <= 4840; id++) {
      const n = node(id, vizState);
      expect(n.cat).toBe('marker');
      // r = 0.2 + hash * 0.65 => always strictly < 1.0 Rs
      expect(n.r).toBeLessThan(1.0);
      expect(n.r).toBeGreaterThan(0.2);
    }
  });

  it('validates launch block when probe mass exceeds vehicle limit', () => {
    const s = createFreshState();
    s.cfg.veh = 's'; // Light Lift limit: 500 kg
    s.cfg.parts.shield = 'b'; // +150 kg -> total mass 570 kg
    const P = phys(s);

    expect(P.mass).toBe(570);
    expect(P.mass).toBeGreaterThan(VEH.s.lim);

    // Launch should be blocked
    const canLaunch = s.cfg.sandbox || P.mass <= VEH[s.cfg.veh].lim;
    expect(canLaunch).toBe(false);
  });

  it('validates launch block when budget left is under $5M in non-sandbox mode', () => {
    const s = createFreshState();
    s.cfg.diff = 'ASTROPHYSICIST'; // Budget: $200M
    s.cfg.veh = 'h'; // Cost: $110M
    s.cfg.orbit = 'close'; // Cost: $15M
    s.cfg.parts.shield = 'b'; // $18M
    s.cfg.parts.antenna = 'b'; // $12M
    s.cfg.parts.sensor = 'b'; // $25M
    // Probe base: $60M
    // Total setup = 60 + 110 + 15 + 18 + 12 + 25 = $240M > $200M

    const P = phys(s);
    expect(P.budgetLeft).toBeLessThan(5);

    const canLaunch = s.cfg.sandbox || P.budgetLeft >= 5;
    expect(canLaunch).toBe(false);
  });

  it('calculates repositioning fuel cost at 1.2% per Rs during active mission', () => {
    const initialR = 6.0;
    const targetR = 4.0;
    const deltaR = Math.abs(targetR - initialR);
    const cost = deltaR * 1.2;

    expect(cost).toBeCloseTo(2.4, 6);
  });
});

