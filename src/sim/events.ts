import { EventDef, SimulationState } from '../types/simulation';
import { ORBL, EVX, ROLES } from './constants';
import { phys, clamp } from './physics';

export const EV: Record<string, EventDef> = {
  E01: {
    title: 'RADIATION SPIKE',
    affected: 'Radiation shield · node electronics · battery',
    test: (_s, P) => P.rad > P.lim,
    sev: (_s, P) => (P.excess > 20 ? 'CRITICAL' : 'WARNING'),
    cause: (_s, P) =>
      'Radiation hitting the probe (' +
      P.rad.toFixed(0) +
      ') is stronger than your shielding can handle (' +
      P.lim +
      ').',
    choices: [
      {
        label: 'Increase protection',
        fx: 'Protection +20 · battery −5%',
        apply: s => {
          s.p.shieldLvl = Math.min(100, s.p.shieldLvl + 20);
          s.res.battery -= 5;
        }
      },
      {
        label: 'Move to a safer observation distance',
        fx: 'r +2.0 Rs · fuel −6%',
        apply: s => {
          s.p.r = Math.min(20, s.p.r + 2);
          s.res.fuel -= 6;
        }
      },
      {
        label: 'Continue observation with increased risk',
        fx: 'Shield −8% · data +2%',
        apply: s => {
          s.res.shield -= 8;
          s.res.data += 2;
        }
      }
    ]
  },
  E02: {
    title: 'FUEL DEPLETION',
    affected: 'Propulsion · orbit correction · station-keeping',
    test: s => s.res.fuel < 25,
    sev: s => (s.res.fuel < 10 ? 'CRITICAL' : 'WARNING'),
    cause: (s, P) =>
      'Fuel is down to ' +
      s.res.fuel.toFixed(0) +
      '%. Moves and orbit corrections burn about ' +
      Math.abs(P.fuelR).toFixed(2) +
      '% every hour.',
    choices: [
      {
        label: 'Reduce orbit correction frequency',
        fx: 'Orbit correction −1 level',
        apply: s => {
          const idx = ORBL.indexOf(s.p.orb as any);
          s.p.orb = ORBL[Math.max(0, idx - 1)];
        }
      },
      {
        label: 'Reduce observation duration',
        fx: 'Window −25%',
        apply: s => {
          s.p.duration = Math.max(s.step + 12, Math.round(s.p.duration * 0.75));
        }
      },
      {
        label: 'Abandon damaged nodes',
        fx: 'Damaged → lost · fuel +8%',
        apply: s => {
          s.nodes.lost += s.nodes.damaged;
          s.nodes.damaged = 0;
          s.res.fuel += 8;
        }
      }
    ]
  },
  E03: {
    title: 'TIDAL STRESS WARNING',
    affected: 'Chassis · structural joints · deployables',
    test: (s, P) => P.stress > 45 || s.res.chassis < 60,
    sev: (s, P) => (P.stress > 60 || s.res.chassis < 40 ? 'CRITICAL' : 'WARNING'),
    cause: (s, P) =>
      'The stretching force (' +
      P.stress.toFixed(0) +
      ') is above what the probe body can take (25). Body health: ' +
      s.res.chassis.toFixed(0) +
      '%.',
    choices: [
      {
        label: 'Increase observation distance',
        fx: 'r +1.5 Rs · fuel −5%',
        apply: s => {
          s.p.r = Math.min(20, s.p.r + 1.5);
          s.res.fuel -= 5;
        }
      },
      {
        label: 'Reduce mission exposure duration',
        fx: 'Window −20%',
        apply: s => {
          s.p.duration = Math.max(s.step + 12, Math.round(s.p.duration * 0.8));
        }
      },
      {
        label: 'Sacrifice affected nodes',
        fx: '−6% operational nodes · chassis +10%',
        apply: (s, P) => {
          s.nodes.lost += P.op * 0.06;
          s.res.chassis += 10;
        }
      }
    ]
  },
  E04: {
    title: 'COMMUNICATION DEGRADATION',
    affected: 'External anchors · downlink · data return',
    test: s => s.res.comm < 50,
    sev: s => (s.res.comm < 35 ? 'CRITICAL' : 'WARNING'),
    cause: s =>
      'The signal home is weak (' +
      s.res.comm.toFixed(0) +
      '%). Gravity near the black hole stretches radio waves (redshift), making them harder to read.',
    choices: [
      {
        label: 'Reposition external anchors',
        fx: 'Comm baseline +15 · fuel −7%',
        apply: s => {
          s.mods.anchor += 15;
          s.res.fuel -= 7;
        }
      },
      {
        label: 'Reduce data transmission rate',
        fx: 'Comm +15 · data rate ×0.85',
        apply: s => {
          s.mods.tx = 0.7;
        }
      },
      {
        label: 'Prioritize critical scientific data',
        fx: 'Comm factor floor 0.8 · data ×0.9',
        apply: s => {
          s.mods.critical = true;
        }
      }
    ]
  }
};

export function applyDecision(
  st: SimulationState,
  choiceIndex: number
): { nextState: SimulationState; delta: string; toastText: string } | null {
  const ev = st.active;
  if (!ev) return null;
  const d = EV[ev.code];
  const ch = d.choices[choiceIndex];
  const P = phys(st);

  const s: SimulationState = {
    ...st,
    p: { ...st.p },
    res: { ...st.res },
    nodes: { ...st.nodes },
    mods: { ...st.mods }
  };
  ch.apply(s, P);
  for (const k of Object.keys(s.res) as (keyof typeof s.res)[]) {
    s.res[k] = clamp(s.res[k], 0, 100);
  }

  const parts: string[] = [];
  const sgn = (x: number, dec: number = 2) =>
    (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(dec);

  (
    [
      ['fuel', 'Fuel'],
      ['battery', 'Battery'],
      ['shield', 'Shield'],
      ['chassis', 'Chassis'],
      ['data', 'Data']
    ] as const
  ).forEach(([k, l]) => {
    const dd = s.res[k] - st.res[k];
    if (Math.abs(dd) > 0.05) parts.push(l + ' ' + sgn(dd, 1) + '%');
  });

  if (s.p.r !== st.p.r) parts.push('r ' + sgn(s.p.r - st.p.r, 1) + ' Rs');
  if (s.p.shieldLvl !== st.p.shieldLvl)
    parts.push('Protection → ' + s.p.shieldLvl);
  if (s.p.duration !== st.p.duration)
    parts.push('Window → ' + s.p.duration + 'h');
  if (s.p.orb !== st.p.orb) parts.push('Orbit corr. → ' + s.p.orb);

  const dl = s.nodes.lost - st.nodes.lost;
  if (dl > 0.5) parts.push('Nodes lost +' + Math.round(dl));
  if (s.mods.anchor !== st.mods.anchor) parts.push('Anchor baseline +15');
  if (s.mods.tx !== st.mods.tx) parts.push('Tx rate ×0.7');
  if (s.mods.critical !== st.mods.critical) parts.push('Critical-data mode');

  const delta = parts.join(' · ') || 'No immediate change';
  s.events = st.events.map(e =>
    e === ev ? { ...e, status: 'RESOLVED', decision: ch.label, delta } : e
  );
  s.active = null;
  s.status = st.wasRunning ? 'RUNNING' : 'PAUSED';
  s.log = [
    ...st.log,
    {
      step: st.step,
      type: 'decision',
      text: ev.code + ' → ' + ch.label + '. ' + delta + '.'
    }
  ];

  const X = (EVX as any)[ev.code];
  let crewTxt = '';
  if (st.cfg.team) {
    const act = (Object.keys(ROLES) as (keyof typeof ROLES)[]).filter(
      k => st.cfg.crew[k]
    );
    const fav = act.filter(k => X.by[choiceIndex].includes(k)).length;
    s.consensus = st.consensus + ((fav / act.length) * 2 - 1);
    crewTxt = ' Crew backing: ' + fav + ' of ' + act.length + '.';
  }

  const toastText =
    '"' +
    ch.label +
    '": ' +
    X.why[choiceIndex] +
    ' Result: ' +
    delta +
    '.' +
    crewTxt;

  return { nextState: s, delta, toastText };
}
