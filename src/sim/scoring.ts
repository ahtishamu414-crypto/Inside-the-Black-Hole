import { SimulationState, PhysResults, Outcome, RoleKey, PriorityKey } from '../types/simulation';
import { DIFF, ROLES, VEH, PARTS, PK, SCEN, CC } from './constants';
import { clamp, setupCost } from './physics';

export interface ScoreBreakdown {
  base: number;
  team: number;
  cons: number;
  score: number;
}

export function scoreOf(s: SimulationState, P: PhysResults, success: boolean): ScoreBreakdown {
  const c = s.cfg;
  const D = DIFF[c.diff];
  const opPct = (P.op / P.ext) * 100;
  const budPct = isFinite(P.budgetLeft) ? clamp((P.budgetLeft / D.budget) * 100, 0, 100) : 0;
  const base =
    s.res.data * 4 +
    s.res.fuel * 1.5 +
    s.res.chassis * 1.5 +
    s.res.shield +
    opPct * 2 +
    budPct;

  let team = 0;
  let cons = 0;

  if (c.team) {
    const act = (Object.keys(ROLES) as RoleKey[]).filter(k => c.crew[k]);
    const n = act.length || 1;
    const cnt: Record<PriorityKey, number> = { data: 0, safety: 0, budget: 0, comms: 0 };
    act.forEach(k => cnt[c.votes[k]]++);
    const met = {
      data: s.res.data,
      safety: (s.res.shield + s.res.chassis) / 2,
      budget: budPct,
      comms: s.res.comm
    };
    (Object.keys(cnt) as PriorityKey[]).forEach(k => {
      team += (cnt[k] / n) * met[k] * 3;
    });
    cons = n > 1 ? (Math.max(...Object.values(cnt)) / n >= 0.5 ? 50 : -50) : 0;
    team += cons + s.consensus * 25;
  }

  return {
    base: Math.round(base),
    team: Math.round(team),
    cons,
    score: Math.max(0, Math.round((base + team) * D.score * (success ? 1 : 0.5)))
  };
}

export function makeOutcome(
  s: SimulationState,
  P: PhysResults,
  success: boolean,
  reason: string
): Outcome {
  const c = s.cfg;
  const D = DIFF[c.diff];
  const opPct = (P.op / P.ext) * 100;
  const H = s.history;
  const sc = scoreOf(s, P, success);
  const score = sc.score;

  const mn = (fn: (h: any) => number) => Math.min(...H.map(fn));
  const pk = (fn: (h: any) => number) => Math.max(...H.map(fn));
  const veh = VEH[c.veh];

  const rating =
    score >= 1000
      ? 'A+ · EXCEPTIONAL'
      : score >= 800
      ? 'A · STRONG'
      : score >= 600
      ? 'B · ADEQUATE'
      : 'C · MARGINAL';

  const crit = s.log
    .filter(l => l.type === 'crit' || l.type === 'warn')
    .slice(-6)
    .map(l => ({ t: 'T+' + l.step + 'h', text: l.text }));

  const tip = success
    ? 'Try a harder difficulty or a cheaper rocket to raise your score.'
    : /Comms/i.test(reason)
    ? 'Add the High-gain antenna, give comms more power, or observe from farther out.'
    : /Shield|radiation/i.test(reason)
    ? 'Switch to Heavy shielding or raise the protection level.'
    : /Structural|tidal/i.test(reason)
    ? 'Observe from farther out (above 4 Rs) or lower the tidal multiplier.'
    : /Battery/i.test(reason)
    ? 'Lower the protection level, or keep optional upgrades off to save power.'
    : /Budget/i.test(reason)
    ? 'Pick a lighter rocket or skip costly upgrades.'
    : /window/i.test(reason)
    ? 'Use Quantum sensors, give instruments more power, or fly closer.'
    : /goal|Data complete/i.test(reason)
    ? 'Choose a closer orbit that matches the scenario goal.'
    : 'Review the event log and try a different balance of power and distance.';

  const an = [
    {
      k: success ? 'WHY IT WORKED' : 'WHY IT FAILED',
      c: success ? CC.green : CC.red,
      v: success
        ? 'You collected the full dataset by T+' +
          s.step +
          'h and kept ' +
          opPct.toFixed(0) +
          '% of the swarm working.'
        : reason
    },
    {
      k: 'CLOSEST APPROACH',
      c: CC.cyan,
      v:
        'Your probe got as close as ' +
        mn(h => h.r).toFixed(1) +
        ' Rs, where clocks ran at ' +
        mn(h => h.dil).toFixed(2) +
        'x Earth speed. Closer means more data, but stronger radiation and stretching.'
    },
    {
      k: 'BIGGEST STRAIN',
      c: CC.amber,
      v:
        'Peak radiation ' +
        pk(h => h.rad).toFixed(0) +
        ' against protection ' +
        P.lim +
        '. Peak stretching ' +
        pk(h => h.stress).toFixed(0) +
        ' (safe below 25). Weakest signal ' +
        mn(h => h.comm).toFixed(0) +
        '%.'
    },
    {
      k: 'PARTS & BUDGET',
      c: CC.cyan,
      v:
        (c.sandbox ? 'Sandbox: no budget limit. ' : 'Spent $' + (setupCost(c) + s.spent).toFixed(0) + 'M of $' + D.budget + 'M. ') +
        'Probe weight ' +
        P.mass +
        ' kg on the ' +
        veh.name +
        ' rocket. Parts: ' +
        PK.map(k => PARTS[k][c.parts[k]].n).join(', ') +
        '.'
    },
    {
      k: 'TRY NEXT',
      c: CC.muted,
      v: tip
    }
  ];

  if (c.team) {
    an.splice(4, 0, {
      k: 'TEAM EFFECT',
      c: CC.cyan,
      v:
        'The crew vote ' +
        (sc.cons > 0 ? 'was aligned (+50)' : sc.cons < 0 ? 'was split (−50)' : 'had no conflict') +
        ' and added ' +
        sc.team +
        ' points in total.'
    });
  }

  return {
    success,
    failure: !success,
    reason: success
      ? 'Full science dataset returned at T+' +
        s.step +
        'h with ' +
        P.op.toLocaleString('en-US', { maximumFractionDigits: 0 }) +
        ' nodes operational.'
      : reason,
    step: s.step,
    score,
    rating,
    analysis: an,
    breakdown:
      'Score = (base ' +
      sc.base +
      (c.team ? ' + team ' + sc.team : '') +
      ') × difficulty ' +
      D.score +
      (success ? '' : ' × 0.5 for a failed mission') +
      (c.sandbox ? ' · sandbox runs are not ranked' : ''),
    stats: success
      ? [
          { k: 'DATA COLLECTED', v: s.res.data.toFixed(1) + '%' },
          { k: 'FUEL REMAINING', v: s.res.fuel.toFixed(1) + '%' },
          { k: 'OPERATIONAL NODES', v: Math.round(P.op).toLocaleString() },
          { k: 'STRUCTURAL INTEGRITY', v: s.res.chassis.toFixed(1) + '%' }
        ]
      : [
          { k: 'DATA COLLECTED', v: s.res.data.toFixed(1) + '%' },
          { k: 'FUEL REMAINING', v: s.res.fuel.toFixed(1) + '%' },
          { k: 'LOST NODES', v: Math.round(s.nodes.lost).toLocaleString() },
          { k: 'STRUCTURAL INTEGRITY', v: s.res.chassis.toFixed(1) + '%' }
        ],
    objectives: [
      { mark: '✓', c: CC.green, text: 'Science dataset 100% returned' },
      { mark: opPct >= 80 ? '✓' : '○', c: opPct >= 80 ? CC.green : CC.muted, text: 'Swarm ≥ 80% operational (' + opPct.toFixed(0) + '%)' },
      { mark: s.res.chassis >= 50 ? '✓' : '○', c: s.res.chassis >= 50 ? CC.green : CC.muted, text: 'Chassis ≥ 50% (' + s.res.chassis.toFixed(0) + '%)' },
      { mark: mn(h => h.r) <= SCEN[c.scen].maxR ? '✓' : '○', c: mn(h => h.r) <= SCEN[c.scen].maxR ? CC.green : CC.muted, text: SCEN[c.scen].goal }
    ],
    critical: crit.length ? crit : [{ t: '—', text: 'No warnings recorded before failure.' }]
  };
}

