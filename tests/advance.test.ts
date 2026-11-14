import { describe, it, expect } from 'vitest';
import { createFreshState, advance, ORB, OPS_COST, applyDecision } from '../src/sim';

describe('Simulation Advance and Stepper Rules', () => {
  it('accumulates operating cost per step: spent += 0.35 + orbitRate * 0.6', () => {
    let s = createFreshState();
    s.status = 'RUNNING';
    s.p.orb = 'Standard'; // 0.25
    const expectedStepCost = OPS_COST + ORB.Standard * 0.6; // 0.35 + 0.15 = 0.50

    expect(s.spent).toBe(0);
    let s1 = advance(s)!;
    expect(s1.spent).toBeCloseTo(expectedStepCost, 6);

    if (s1.active) {
      s1 = applyDecision(s1, 0)!.nextState;
    }
    const s2 = advance(s1)!;
    expect(s2.spent).toBeCloseTo(expectedStepCost * 2, 6);
  });

  it('handles seeded PRNG radiation surge when random mode is on', () => {
    let s = createFreshState();
    s.p.random = true;
    s.status = 'RUNNING';

    let triggered = false;
    for (let step = 0; step < 50; step++) {
      if (s.active) {
        s = applyDecision(s, 0)!.nextState;
      }
      const next = advance(s);
      if (!next) break;
      s = next;
      if (s.spike > 0) {
        triggered = true;
        expect(s.spike).toBeGreaterThanOrEqual(1);
        expect(s.spike).toBeLessThanOrEqual(3);
        break;
      }
    }
    expect(triggered).toBe(true);
  });

  it('runs deterministically without random surges when random mode is off', () => {
    let s1 = createFreshState();
    let s2 = createFreshState();
    s1.status = 'RUNNING';
    s2.status = 'RUNNING';

    for (let i = 0; i < 20; i++) {
      if (s1.active) {
        s1 = applyDecision(s1, 0)!.nextState;
      }
      if (s2.active) {
        s2 = applyDecision(s2, 0)!.nextState;
      }
      const n1 = advance(s1)!;
      const n2 = advance(s2)!;
      expect(n1.spike).toBe(0);
      expect(n2.spike).toBe(0);
      expect(n1.res.data).toBe(n2.res.data);
      expect(n1.res.fuel).toBe(n2.res.fuel);
      s1 = n1;
      s2 = n2;
    }
  });
});

