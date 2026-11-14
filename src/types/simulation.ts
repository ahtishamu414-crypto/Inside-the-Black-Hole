export interface SimParams {
  mass: number;         // Black hole mass in M_sun (default 4.3e6)
  r: number;            // Observation distance in Rs (1.05 to 20)
  shieldLvl: number;    // Shielding level (0 to 100)
  radI: number;         // Radiation intensity I (0 to 100)
  temp: number;         // Temperature parameter (0 to 100)
  tidalMult: number;    // Tidal stress multiplier k (0.25 to 3.0)
  split: number;        // Power allocation: instruments % / comms %
  prio: 'Low' | 'Balanced' | 'High'; // Data priority
  orb: 'Off' | 'Minimal' | 'Standard' | 'Aggressive'; // Orbit correction mode
  duration: number;     // Observation window duration in hours
  markers: number;      // Hypothetical inside-horizon markers count
  random: boolean;      // Deterministic (false) or seeded random surge (true)
}

export interface Resources {
  fuel: number;
  battery: number;
  shield: number;
  chassis: number;
  data: number;
  comm: number;
}

export interface NodeCounts {
  damaged: number;
  lost: number;
  inactive: number;
}

export interface Mods {
  anchor: number;
  tx: number;
  critical: boolean;
}

export type DifficultyKey = 'CADET' | 'COMMANDER' | 'ASTROPHYSICIST';
export type ScenarioKey = 'photon' | 'tidal' | 'clock';
export type OrbitKey = 'low' | 'ell' | 'close';
export type VehicleKey = 's' | 'm' | 'h';
export type RoleKey = 'planner' | 'engineer' | 'science' | 'comms';
export type PriorityKey = 'data' | 'safety' | 'budget' | 'comms';

export interface MissionConfig {
  diff: DifficultyKey;
  sandbox: boolean;
  team: boolean;
  crew: Record<RoleKey, boolean>;
  scen: ScenarioKey;
  orbit: OrbitKey;
  veh: VehicleKey;
  parts: {
    shield: 'a' | 'b';
    antenna: 'a' | 'b';
    sensor: 'a' | 'b';
  };
  votes: Record<RoleKey, PriorityKey>;
}

export interface LogEntry {
  step: number;
  type: 'info' | 'warn' | 'crit' | 'decision' | 'ok';
  text: string;
}

export interface Snapshot {
  t: number;
  fuel: number;
  battery: number;
  shield: number;
  chassis: number;
  data: number;
  comm: number;
  op: number;
  dmg: number;
  lost: number;
  r: number;
  dil: number;
  rad: number;
  stress: number;
  temp: number;
  lvl: number;
  budget: number;
  mass: number;
}

export interface EventChoice {
  label: string;
  fx: string;
  apply: (s: SimulationState, P: PhysResults) => void;
}

export interface EventDef {
  title: string;
  affected: string;
  test: (s: SimulationState, P: PhysResults) => boolean;
  sev: (s: SimulationState, P: PhysResults) => 'WARNING' | 'CRITICAL';
  cause: (s: SimulationState, P: PhysResults) => string;
  choices: EventChoice[];
}

export interface ActiveEvent {
  code: string;
  title: string;
  severity: 'WARNING' | 'CRITICAL';
  cause: string;
  affected: string;
  step: number;
  status: 'ACTIVE' | 'RESOLVED';
  decision: string | null;
  delta: string;
}

export interface OutcomeAnalysisItem {
  k: string;
  c: string;
  v: string;
}

export interface OutcomeObjective {
  mark: string;
  c: string;
  text: string;
}

export interface OutcomeCriticalItem {
  t: string;
  text: string;
}

export interface OutcomeStat {
  k: string;
  v: string;
}

export interface Outcome {
  success: boolean;
  failure: boolean;
  reason: string;
  step: number;
  score: number;
  rating: string;
  analysis: OutcomeAnalysisItem[];
  breakdown: string;
  stats: OutcomeStat[];
  objectives: OutcomeObjective[];
  critical: OutcomeCriticalItem[];
}

export interface SimulationState {
  status: 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  step: number;
  mission: number;
  p: SimParams;
  res: Resources;
  nodes: NodeCounts;
  mods: Mods;
  probeT: number;
  history: Snapshot[];
  log: LogEntry[];
  events: ActiveEvent[];
  active: ActiveEvent | null;
  fired: Record<string, number>;
  outcome: Outcome | null;
  spike: number;
  seed: number;
  wasRunning: boolean;
  milestone: number;
  spent: number;
  consensus: number;
  voteDone: boolean;
  cfg: MissionConfig;
}

export interface PhysResults {
  budgetLeft: number;
  lim: number;
  mass: number;
  mf: number;
  dParts: number;
  D: {
    label: string;
    tip: string;
    wear: number;
    data: number;
    budget: number;
    score: number;
  };
  heavy: boolean;
  hg: boolean;
  qs: boolean;
  r: number;
  dil: number;
  RsM: number;
  RsKm: number;
  rad: number;
  tempK: number;
  stress: number;
  tidal: number;
  ext: number;
  op: number;
  opFrac: number;
  orb: string;
  keep: number;
  fuelR: number;
  batR: number;
  drain: number;
  dInst: number;
  dComm: number;
  dSh: number;
  dPr: number;
  dTh: number;
  excess: number;
  thX: number;
  shR: number;
  chR: number;
  commT: number;
  commF: number;
  prox: number;
  dataR: number;
  dmgR: number;
  lostR: number;
  drift: number;
}

