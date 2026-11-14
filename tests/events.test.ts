import { describe, it, expect } from 'vitest';
import { createFreshState, phys, EV, applyDecision, scoreOf } from '../src/sim';

describe('Event System & Team Consensus', () => {
  it('triggers E01 when radiation exposure exceeds protection limit', () => {
    const s = createFreshState();
    s.p.radI = 80;
    s.p.r = 2.0;
    s.p.shieldLvl = 50;
    const P = phys(s);
    expect(P.rad).toBeGreaterThan(P.lim);
    expect(EV.E01.test(s, P)).toBe(true);
  });

  it('triggers E02 when fuel drops below 25%', () => {
    const s = createFreshState();
    s.res.fuel = 24;
    expect(EV.E02.test(s, phys(s))).toBe(true);
  });

  it('triggers E03 when stress > 45 or chassis < 60%', () => {
    const s = createFreshState();
    s.res.chassis = 55;
    expect(EV.E03.test(s, phys(s))).toBe(true);
  });

  it('triggers E04 when comms drops below 50%', () => {
    const s = createFreshState();
    s.res.comm = 48;
    expect(EV.E04.test(s, phys(s))).toBe(true);
  });

  it('applies decision choice and calculates crew backing in team mode', () => {
    const s = createFreshState();
    s.cfg.team = true;
    s.active = {
      code: 'E01',
      title: 'RADIATION SPIKE',
      severity: 'WARNING',
      cause: 'Test cause',
      affected: 'Shield',
      step: 5,
      status: 'ACTIVE',
      decision: null,
      delta: ''
    };
    s.events = [s.active];

    // Choice 0: Increase protection (+20 protection, -5% battery)
    // E01.by[0] = ['engineer'] -> 1 of 4 crew members backs it
    const initialBat = s.res.battery;
    const initialShieldLvl = s.p.shieldLvl;
    const res = applyDecision(s, 0);

    expect(res).not.toBeNull();
    const next = res!.nextState;
    expect(next.p.shieldLvl).toBe(initialShieldLvl + 20);
    expect(next.res.battery).toBe(initialBat - 5);
    expect(next.active).toBeNull();
    expect(next.events[0].status).toBe('RESOLVED');
    // consensus change: (1/4 * 2 - 1) = -0.5
    expect(next.consensus).toBe(-0.5);
  });

  it('scores team bonus +50 when crew vote is aligned and -50 when split', () => {
    const s = createFreshState();
    s.cfg.team = true;
    s.res.data = 100;

    // Aligned crew: 3 out of 4 vote for data (share >= 0.5)
    s.cfg.votes = {
      planner: 'data',
      engineer: 'data',
      science: 'data',
      comms: 'comms'
    };
    const scAligned = scoreOf(s, phys(s), true);
    expect(scAligned.cons).toBe(50);

    // Split crew: 4 different votes
    s.cfg.votes = {
      planner: 'data',
      engineer: 'safety',
      science: 'budget',
      comms: 'comms'
    };
    const scSplit = scoreOf(s, phys(s), true);
    expect(scSplit.cons).toBe(-50);
  });
});

