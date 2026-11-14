import { describe, it, expect } from 'vitest';
import { createFreshState, phys, evaluateMissionCompletion, judge } from '../src/sim';

describe('Mission Judge and Failure Rules', () => {
  it('triggers failure when budget is exhausted in non-sandbox mode', () => {
    const s = createFreshState();
    s.spent = 300; // DIFF.COMMANDER budget is 260
    const P = phys(s);
    expect(P.budgetLeft).toBeLessThan(0);
    const reason = judge(s, P);
    expect(reason).toContain('Budget exhausted');
  });

  it('allows negative budget without failure in sandbox mode', () => {
    const s = createFreshState();
    s.cfg.sandbox = true;
    s.spent = 500;
    const P = phys(s);
    expect(judge(s, P)).toBeNull();
  });

  it('triggers failure when comms falls below 15%', () => {
    const s = createFreshState();
    s.res.comm = 14;
    const P = phys(s);
    expect(judge(s, P)).toContain('Comms signal dropped below 15%');
  });

  it('triggers failure when battery, chassis, or shield reach 0', () => {
    const s = createFreshState();
    s.res.battery = 0;
    expect(judge(s, phys(s))).toContain('Battery depleted');

    s.res.battery = 100;
    s.res.chassis = 0;
    expect(judge(s, phys(s))).toContain('Structural failure');

    s.res.chassis = 100;
    s.res.shield = 0;
    expect(judge(s, phys(s))).toContain('Shield failure');
  });

  it('triggers failure when swarm operational nodes drop below 40%', () => {
    const s = createFreshState();
    const P = phys(s);
    s.nodes.lost = P.ext * 0.65; // leaves 35%
    expect(judge(s, phys(s))).toContain('Swarm attrition — only 35%');
  });

  it('triggers failure when fuel is exhausted inside 3 Rs', () => {
    const s = createFreshState();
    s.p.r = 2.5;
    s.res.fuel = 0;
    expect(judge(s, phys(s))).toContain('Propellant exhausted inside 3 Rs');
  });

  it('verifies Photon Mapping distance goal: closest approach <= 5 Rs', () => {
    const s = createFreshState();
    s.cfg.scen = 'photon';
    s.res.data = 100;
    s.history = [{ r: 6.0 } as any]; // closest approach 6.0 Rs > 5.0 Rs
    const P = phys(s);
    const evalResult = evaluateMissionCompletion(s, P);
    expect(evalResult.success).toBe(false);
    expect(evalResult.reason).toContain('Get within 5 Rs and collect 100% data');
  });

  it('verifies Tidal Stress goal: closest approach <= 4 Rs and chassis >= 25%', () => {
    const s = createFreshState();
    s.cfg.scen = 'tidal';
    s.res.data = 100;
    s.history = [{ r: 3.5 } as any];
    s.res.chassis = 20; // < 25%
    const P = phys(s);
    const evalResult = evaluateMissionCompletion(s, P);
    expect(evalResult.success).toBe(false);
    expect(evalResult.reason).toContain('probe body health fell to 20%');
  });

  it('verifies Clock Sync goal: closest approach <= 6 Rs and comms >= 30%', () => {
    const s = createFreshState();
    s.cfg.scen = 'clock';
    s.res.data = 100;
    s.history = [{ r: 4.5 } as any];
    s.res.comm = 25; // < 30%
    const P = phys(s);
    const evalResult = evaluateMissionCompletion(s, P);
    expect(evalResult.success).toBe(false);
    expect(evalResult.reason).toContain('signal home was only 25%');
  });
});

