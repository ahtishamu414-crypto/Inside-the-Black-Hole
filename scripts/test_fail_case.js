import { createFreshState, advance, snap, phys } from './src/sim/index.js';

let s = createFreshState(1);
s.cfg.diff = 'ASTROPHYSICIST';
s.cfg.orbit = 'close';
s.p.r = 3.4;
// If shield level is lower or no heavy shield or tidal stress scenario:
s.status = 'RUNNING';

for (let i = 0; i < 150; i++) {
  const ns = advance(s);
  if (!ns) break;
  s = ns;
  if (s.outcome) {
    console.log('Ended at step', i, 'Success:', s.outcome.success, 'Reason:', s.outcome.reason, 'Score:', s.outcome.score);
    break;
  }
}

