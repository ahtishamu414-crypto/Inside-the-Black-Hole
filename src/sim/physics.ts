import { SimulationState, MissionConfig, PhysResults, Snapshot } from '../types/simulation';
import {
  BUS_MASS,
  PROBE_COST,
  PK,
  PARTS,
  VEH,
  ORBITS,
  DIFF,
  GG,
  MSUN,
  CL,
  NT,
  NA,
  ORB,
  PPWR,
  PRIO
} from './constants';

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const massOf = (c: MissionConfig): number => {
  return BUS_MASS + PK.reduce((a, k) => a + PARTS[k][c.parts[k]].mass, 0);
};

export const setupCost = (c: MissionConfig): number => {
  return (
    PROBE_COST +
    VEH[c.veh].cost +
    ORBITS[c.orbit].cost +
    PK.reduce((a, k) => a + PARTS[k][c.parts[k]].cost, 0)
  );
};

export const partPw = (c: MissionConfig): number => {
  return PK.reduce((a, k) => a + PARTS[k][c.parts[k]].pw, 0);
};

export function phys(st: SimulationState): PhysResults {
  const { p, res, nodes, mods } = st;
  const r = p.r;
  const dil = Math.sqrt(Math.max(0, 1 - 1 / r));
  const c = st.cfg;
  const D = DIFF[c.diff];
  const heavy = c.parts.shield === 'b';
  const hg = c.parts.antenna === 'b';
  const qs = c.parts.sensor === 'b';
  const lim = p.shieldLvl + (heavy ? 20 : 0);
  const mass = massOf(c);
  const mf = 1 + (mass - 420) / 1000;

  const RsM = (2 * GG * p.mass * MSUN) / (CL * CL);
  const rad = p.radI * 2 * Math.pow(3 / r, 1.2) * (st.spike > 0 ? 1.8 : 1);
  const tempK = 150 + p.temp * 5 * Math.pow(6 / r, 0.75);
  const stress = p.tidalMult * 35 * Math.pow(4 / r, 3) * Math.pow(4.3e6 / p.mass, 0.25);
  const tidal = (2 * GG * p.mass * MSUN) / Math.pow(r * RsM, 3);

  const ext = NT - NA - p.markers;
  const op = Math.max(0, ext - nodes.damaged - nodes.lost - nodes.inactive);
  const opFrac = op / ext;

  const orb = res.fuel <= 0 ? 'Off' : p.orb;
  const keep = r < 3 ? 0.5 * (3.2 - r) : 0;
  const fuelR = c.sandbox ? 0 : -(ORB[orb] + (orb === 'Off' ? 0 : keep)) * D.wear * mf;

  const dInst = p.split * 0.0035;
  const dComm = (100 - p.split) * 0.0025 * mods.tx;
  const dSh = p.shieldLvl * 0.0015;
  const dPr = PPWR[p.prio];
  const dTh = tempK > 450 ? 0.1 : 0;
  const dParts = partPw(c);
  const drain = 0.12 + dInst + dComm + dSh + dPr + dTh + dParts;
  const batR = 0.28 - drain;

  const excess = Math.max(0, rad - lim);
  const thX = Math.max(0, tempK - 450) * 0.002;
  const shR = -(0.03 + rad * 0.002 * (heavy ? 0.7 : 1) + excess * 0.04 + thX) * D.wear;
  const chR = -(0.02 + Math.max(0, stress - 25) * 0.03) * D.wear;

  const commT = clamp(
    40 +
      (100 - p.split) * 0.6 +
      mods.anchor +
      (hg ? 12 : 0) -
      (1 - dil) * 40 -
      (orb === 'Off' ? 10 : 0) +
      (mods.tx < 1 ? 15 : 0),
    0,
    100
  );
  const commF = Math.max(mods.critical ? 0.8 : 0.3, Math.min(1.15, res.comm / 60));
  const prox = Math.pow(6 / r, 0.5);
  const dataR =
    res.battery > 2
      ? 1.25 *
        D.data *
        (qs ? 1.35 : 1) *
        (c.scen === 'tidal'
          ? 1 + Math.min(0.5, stress / 100)
          : c.scen === 'clock'
          ? 1 + (1 - dil) * 2
          : 1) *
        (p.split / 60) *
        PRIO[p.prio] *
        prox *
        opFrac *
        commF *
        (mods.critical ? 0.9 : 1) *
        (mods.tx < 1 ? 0.85 : 1)
      : 0;

  const dmgR = Math.max(0, 50 - res.shield) * 0.8 + excess * 0.5;
  const drift = r < 3 && orb === 'Off' ? 40 * (3.2 - r) : orb === 'Off' ? 2 : 0;
  const lostR = Math.max(0, 50 - res.chassis) * 0.6 + nodes.damaged * 0.02 + drift;
  const budgetLeft = c.sandbox ? Infinity : D.budget - setupCost(c) - st.spent;

  return {
    budgetLeft,
    lim,
    mass,
    mf,
    dParts,
    D,
    heavy,
    hg,
    qs,
    r,
    dil,
    RsM,
    RsKm: RsM / 1000,
    rad,
    tempK,
    stress,
    tidal,
    ext,
    op,
    opFrac,
    orb,
    keep,
    fuelR,
    batR,
    drain,
    dInst,
    dComm,
    dSh,
    dPr,
    dTh,
    excess,
    thX,
    shR,
    chR,
    commT,
    commF,
    prox,
    dataR,
    dmgR,
    lostR,
    drift
  };
}

export function snap(st: SimulationState): Snapshot {
  const P = phys(st);
  return {
    t: st.step,
    fuel: st.res.fuel,
    battery: st.res.battery,
    shield: st.res.shield,
    chassis: st.res.chassis,
    data: st.res.data,
    comm: st.res.comm,
    op: (P.op / P.ext) * 100,
    dmg: (st.nodes.damaged / P.ext) * 100,
    lost: (st.nodes.lost / P.ext) * 100,
    r: st.p.r,
    dil: P.dil,
    rad: P.rad,
    stress: P.stress,
    temp: P.tempK,
    lvl: P.lim,
    budget: isFinite(P.budgetLeft) ? P.budgetLeft : 0,
    mass: P.mass
  };
}

