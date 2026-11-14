import { SimulationState } from '../types/simulation';
import { ORBITS } from './constants';
import { snap } from './physics';

export function createFreshState(no: number = 1): SimulationState {
  const s: SimulationState = {
    status: 'READY',
    step: 0,
    mission: no,
    p: {
      mass: 4.3e6,
      r: ORBITS.ell.r,
      shieldLvl: 60,
      radI: 40 + no * 10,
      temp: 50,
      tidalMult: 1,
      split: 60,
      prio: 'Balanced',
      orb: 'Standard',
      duration: 120,
      markers: 24,
      random: false
    },
    res: {
      fuel: 100,
      battery: 100,
      shield: 100,
      chassis: 100,
      data: 0,
      comm: 80
    },
    nodes: {
      damaged: 0,
      lost: 0,
      inactive: 0
    },
    mods: {
      anchor: 0,
      tx: 1,
      critical: false
    },
    probeT: 0,
    history: [],
    log: [
      {
        step: 0,
        type: 'info',
        text: 'Mission BH-5000 · run ' + no + ' initialised. 5,000 nodes on approach.'
      }
    ],
    events: [],
    active: null,
    fired: {},
    outcome: null,
    spike: 0,
    seed: 20261105 + no,
    wasRunning: false,
    milestone: 0,
    spent: 0,
    consensus: 0,
    voteDone: false,
    cfg: {
      diff: 'COMMANDER',
      sandbox: false,
      team: false,
      crew: {
        planner: true,
        engineer: true,
        science: true,
        comms: true
      },
      scen: 'photon',
      orbit: 'ell',
      veh: 'm',
      parts: {
        shield: 'a',
        antenna: 'a',
        sensor: 'a'
      },
      votes: {
        planner: 'budget',
        engineer: 'safety',
        science: 'data',
        comms: 'comms'
      }
    }
  };

  s.history = [snap(s)];
  return s;
}

