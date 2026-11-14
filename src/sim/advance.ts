import { SimulationState, ActiveEvent } from '../types/simulation';
import { phys, snap, clamp } from './physics';
import { evaluateMissionCompletion } from './judge';
import { makeOutcome } from './scoring';
import { EV } from './events';
import { OPS_COST, ORB } from './constants';

export function advance(st: SimulationState): SimulationState | null {
  if (st.active || st.outcome) return null;
  const P = phys(st);

  let seed = st.seed;
  let spike = Math.max(0, st.spike - 1);
  const log = [...st.log];
  const step = st.step + 1;

  if (st.p.random) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    if (seed / 4294967296 < 0.035 && spike === 0) {
      spike = 3;
      log.push({
        step,
        type: 'warn',
        text: 'RANDOM EVENT: radiation surge ×1.8 for 3 steps (seeded).'
      });
    }
  }

  const res = { ...st.res };
  res.fuel = clamp(res.fuel + P.fuelR, 0, 100);
  res.battery = clamp(res.battery + P.batR, 0, 100);
  res.shield = clamp(res.shield + P.shR, 0, 100);
  res.chassis = clamp(res.chassis + P.chR, 0, 100);
  res.comm = clamp(res.comm + (P.commT - res.comm) * 0.2, 0, 100);
  res.data = clamp(res.data + P.dataR, 0, 100);

  const nodes = { ...st.nodes };
  nodes.damaged = Math.max(0, nodes.damaged + P.dmgR - nodes.damaged * 0.02);
  nodes.lost = Math.min(P.ext, nodes.lost + P.lostR);
  nodes.inactive =
    res.battery < 15 ? (P.ext * 0.3 * (15 - res.battery)) / 15 : 0;
  if (nodes.damaged + nodes.lost + nodes.inactive > P.ext) {
    nodes.damaged = Math.max(0, P.ext - nodes.lost - nodes.inactive);
  }

  let milestone = st.milestone;
  const ms = Math.floor(nodes.lost / 250);
  if (ms > milestone) {
    milestone = ms;
    log.push({
      step,
      type: 'crit',
      text:
        'SYSTEM FAILURE: cumulative node losses passed ' +
        (ms * 250).toLocaleString() +
        '.'
    });
  }

  if (st.res.fuel > 0 && res.fuel <= 0) {
    log.push({
      step,
      type: 'crit',
      text: 'Propellant exhausted. Orbit correction disabled.'
    });
  }

  if (P.r < 3 && st.step === 0) {
    log.push({
      step,
      type: 'warn',
      text:
        'Swarm below 3 Rs: no stable circular orbit, continuous station-keeping required.'
    });
  }

  const ns: SimulationState = {
    ...st,
    step,
    res,
    nodes,
    seed,
    spike,
    log,
    milestone,
    probeT: st.probeT + P.dil,
    spent: st.spent + OPS_COST + ORB[P.orb] * 0.6
  };
  ns.history = [...st.history, snap(ns)];

  const P2 = phys(ns);
  const { success, reason } = evaluateMissionCompletion(ns, P2);

  if (success || reason) {
    const o = makeOutcome(ns, P2, success, reason || '');
    log.push({
      step,
      type: success ? 'ok' : 'crit',
      text: success
        ? 'MISSION ACCOMPLISHED. Dataset complete.'
        : 'MISSION FAILED: ' + reason
    });
    return {
      ...ns,
      status: success ? 'COMPLETED' : 'FAILED',
      outcome: o
    };
  }

  for (const code of Object.keys(EV)) {
    const d = EV[code];
    const last = st.fired[code];
    if (last != null && step - last < 30) continue;
    if (d.test(ns, P2)) {
      const ev: ActiveEvent = {
        code,
        title: d.title,
        severity: d.sev(ns, P2),
        cause: d.cause(ns, P2),
        affected: d.affected,
        step,
        status: 'ACTIVE',
        decision: null,
        delta: ''
      };
      log.push({
        step,
        type: ev.severity === 'CRITICAL' ? 'crit' : 'warn',
        text: code + ' ' + d.title + ' — decision required.'
      });
      return {
        ...ns,
        active: ev,
        events: [...st.events, ev],
        fired: { ...st.fired, [code]: step },
        wasRunning: st.status === 'RUNNING',
        status: 'PAUSED'
      };
    }
  }

  return ns;
}

