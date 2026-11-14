import { describe, it } from 'vitest';
import { createFreshState, advance, snap, phys, applyDecision } from '../src/sim';

describe('Find failure scenario', () => {
  it('runs various ASTROPHYSICIST configurations', () => {
    // Test 1: close orbit, default parts (no heavy shield, shield = 50)
    const testWith = (opts: any) => {
      let s = createFreshState(1);
      s.cfg.diff = 'ASTROPHYSICIST';
      s.cfg.orbit = 'close';
      s.p.r = opts.r ?? 3.4;
      s.p.shieldLvl = opts.shieldLvl ?? 50;
      if (opts.scen) s.cfg.scen = opts.scen;
      if (opts.parts) s.cfg.parts = { ...s.cfg.parts, ...opts.parts };
      s.status = 'RUNNING';
      for (let i = 0; i < 150; i++) {
        if (s.active) {
          const res = applyDecision(s, 0);
          if (res) s = res.nextState;
        }
        const ns = advance(s);
        if (!ns) break;
        s = ns;
        if (s.outcome) {
          return { steps: i, success: s.outcome.success, reason: s.outcome.reason, score: s.outcome.score };
        }
      }
      return { steps: s.step, status: s.status, reason: 'did not end' };
    };

    console.log('ASTROPHYSICIST r=3.4 default:', testWith({ r: 3.4 }));
    console.log('ASTROPHYSICIST r=3.4 low shield 30:', testWith({ r: 3.4, shieldLvl: 30 }));
    console.log('ASTROPHYSICIST r=2.5:', testWith({ r: 2.5 }));
    console.log('ASTROPHYSICIST r=2.0:', testWith({ r: 2.0 }));
    console.log('ASTROPHYSICIST tidal scen r=3.4:', testWith({ scen: 'tidal', r: 3.4 }));
    console.log('ASTROPHYSICIST r=1.5:', testWith({ r: 1.5 }));
    console.log('ASTROPHYSICIST r=1.2:', testWith({ r: 1.2 }));
    console.log('ASTROPHYSICIST r=2.2 radI=2:', testWith({ r: 2.2, radI: 2.0, shieldLvl: 10 }));
  });
});

