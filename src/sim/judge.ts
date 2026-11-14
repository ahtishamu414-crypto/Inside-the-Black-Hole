import { SimulationState, PhysResults } from '../types/simulation';
import { SCEN } from './constants';

export function judge(s: SimulationState, P: PhysResults): string | null {
  const opPct = (P.op / P.ext) * 100;
  if (!s.cfg.sandbox && P.budgetLeft < 0) {
    return 'Budget exhausted — the mission ran out of money before the data came home.';
  }
  if (s.res.comm < 15) {
    return 'Comms signal dropped below 15% due to extreme gravitational redshift and a weak link to the anchors.';
  }
  if (s.res.battery <= 0) {
    return 'Battery depleted — the swarm power bus collapsed.';
  }
  if (s.res.chassis <= 0) {
    return 'Structural failure — modeled tidal stress exceeded chassis tolerance.';
  }
  if (s.res.shield <= 0) {
    return 'Shield failure — radiation exposure exceeded protection capacity.';
  }
  if (opPct < 40) {
    return 'Swarm attrition — only ' + opPct.toFixed(0) + '% of exterior nodes remain operational.';
  }
  if (s.res.fuel <= 0 && s.p.r < 3) {
    return 'Propellant exhausted inside 3 Rs — station-keeping impossible without stable orbits.';
  }
  return null;
}

export function evaluateMissionCompletion(
  ns: SimulationState,
  P2: PhysResults
): { success: boolean; reason: string | null } {
  let reason = judge(ns, P2);
  let success = false;

  if (!reason && ns.res.data >= 100) {
    const mr = Math.min(...ns.history.map(h => h.r));
    const S = SCEN[ns.cfg.scen];
    if (mr > S.maxR) {
      reason =
        'Data is 100% complete, but the goal "' +
        S.goal +
        '" was not met (closest approach ' +
        mr.toFixed(1) +
        ' Rs).';
    } else if (ns.cfg.scen === 'tidal' && ns.res.chassis < 25) {
      reason =
        'Data complete, but probe body health fell to ' +
        ns.res.chassis.toFixed(0) +
        '% (needs 25%+) for the stress test.';
    } else if (ns.cfg.scen === 'clock' && ns.res.comm < 30) {
      reason =
        'Data complete, but the signal home was only ' +
        ns.res.comm.toFixed(0) +
        '% (needs 30%+) to compare clocks.';
    } else {
      success = true;
    }
  } else if (!reason && ns.step >= ns.p.duration) {
    reason =
      'Observation window closed with only ' +
      ns.res.data.toFixed(1) +
      '% of the required dataset.';
  }

  return { success, reason };
}

