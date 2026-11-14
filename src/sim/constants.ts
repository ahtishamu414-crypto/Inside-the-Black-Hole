import { DifficultyKey, ScenarioKey, OrbitKey, VehicleKey, RoleKey, PriorityKey } from '../types/simulation';

export const NT = 5000;
export const NA = 160;

export const ORB: Record<string, number> = {
  Off: 0,
  Minimal: 0.12,
  Standard: 0.25,
  Aggressive: 0.45
};

export const ORBL = ['Off', 'Minimal', 'Standard', 'Aggressive'] as const;

export const PRIO: Record<string, number> = {
  Low: 0.7,
  Balanced: 1,
  High: 1.35
};

export const PPWR: Record<string, number> = {
  Low: -0.05,
  Balanced: 0,
  High: 0.12
};

export const CC = {
  cyan: '#55DDE0',
  green: '#38D996',
  amber: '#FFB547',
  red: '#FF5C64',
  text: '#E8F0FA',
  muted: '#8FA3B8'
} as const;

export const GG = 6.674e-11;
export const MSUN = 1.989e30;
export const CL = 2.998e8;

export const DIFF: Record<DifficultyKey, { label: string; tip: string; wear: number; data: number; budget: number; score: number }> = {
  CADET: {
    label: 'CADET',
    tip: 'Easy: gentle wear, bigger budget, a little extra data.',
    wear: 0.7,
    data: 1.15,
    budget: 340,
    score: 0.8
  },
  COMMANDER: {
    label: 'COMMANDER',
    tip: 'Medium: balanced wear and budget.',
    wear: 1,
    data: 1,
    budget: 260,
    score: 1
  },
  ASTROPHYSICIST: {
    label: 'ASTROPHYSICIST',
    tip: 'Hard: faster wear, tight budget, less data per hour.',
    wear: 1.4,
    data: 0.9,
    budget: 200,
    score: 1.3
  }
};

export const SCEN: Record<ScenarioKey, { title: string; desc: string; goal: string; maxR: number }> = {
  photon: {
    title: 'Event Horizon Photon Mapping',
    desc: 'Photograph light bending around the black hole.',
    goal: 'Get within 5 Rs and collect 100% data.',
    maxR: 5
  },
  tidal: {
    title: 'Tidal Shear Stress Test',
    desc: 'Find out how much stretching your probe survives.',
    goal: 'Get within 4 Rs, finish with body health 25%+.',
    maxR: 4
  },
  clock: {
    title: 'Relativistic Clock Sync',
    desc: 'Compare a probe clock with Earth time.',
    goal: 'Get within 6 Rs, finish with signal 30%+.',
    maxR: 6
  }
};

export const ORBITS: Record<OrbitKey, { label: string; r: number; cost: number; tip: string }> = {
  low: {
    label: 'Low',
    r: 9,
    cost: 0,
    tip: 'Far and safe. Slow data, little wear. Rs is the black hole edge size.'
  },
  ell: {
    label: 'Elliptical',
    r: 4.5,
    cost: 8,
    tip: 'A middle path: good data, moderate danger.'
  },
  close: {
    label: 'Close-Approach',
    r: 3.4,
    cost: 15,
    tip: 'Very close. Lots of data, but strong radiation and stretching.'
  }
};

export const VEH: Record<VehicleKey, { name: string; lim: number; cost: number }> = {
  s: { name: 'Light Lift', lim: 500, cost: 35 },
  m: { name: 'Medium Lift', lim: 700, cost: 60 },
  h: { name: 'Heavy Lift', lim: 1200, cost: 110 }
};

export const PARTS = {
  shield: {
    label: 'Radiation shielding',
    tip: 'Heavy shielding protects better but weighs more and uses more power.',
    a: { n: 'Basic', mass: 60, cost: 0, pw: 0 },
    b: { n: 'Heavy', mass: 210, cost: 18, pw: 0.04 }
  },
  antenna: {
    label: 'Antenna',
    tip: 'A high-gain antenna keeps the signal to Earth stronger.',
    a: { n: 'Standard', mass: 30, cost: 0, pw: 0 },
    b: { n: 'High-gain', mass: 70, cost: 12, pw: 0.05 }
  },
  sensor: {
    label: 'Science sensors',
    tip: 'Quantum sensors collect more data per hour.',
    a: { n: 'Optical', mass: 35, cost: 0, pw: 0 },
    b: { n: 'Quantum', mass: 60, cost: 25, pw: 0.08 }
  }
} as const;

export const BEN = {
  shield: 'Protection +20 and radiation wear −30%',
  antenna: 'Signal +12 points',
  sensor: 'Science data ×1.35'
} as const;

export const PK = ['shield', 'antenna', 'sensor'] as const;
export const BUS_MASS = 295;
export const PROBE_COST = 60;
export const OPS_COST = 0.35;

export const ROLES: Record<RoleKey, { name: string; short: string }> = {
  planner: { name: 'Mission Planner', short: 'Planner' },
  engineer: { name: 'Spacecraft Engineer', short: 'Engineer' },
  science: { name: 'Science Lead', short: 'Science' },
  comms: { name: 'Comms Officer', short: 'Comms' }
};

export const PRIS: Record<PriorityKey, string> = {
  data: 'Max science data',
  safety: 'Protect probe',
  budget: 'Save money',
  comms: 'Strong signal'
};

export const EVX = {
  E01: {
    plain: 'Harmful radiation is stronger than your shielding can block, so electronics start to break.',
    by: [['engineer'], ['planner', 'comms'], ['science']],
    why: [
      'More protection keeps the shield healthier but drains the battery a bit faster.',
      'Farther away means weaker radiation, but moving costs fuel and slows data.',
      'You gain a little data now, but the shield takes damage.'
    ]
  },
  E02: {
    plain: 'The tank is almost empty. Without fuel the swarm cannot hold its position.',
    by: [['planner', 'engineer'], ['comms'], ['science']],
    why: [
      'Fewer corrections save fuel, but nodes may drift out of place.',
      'A shorter window ends the mission sooner, so there is less time to collect data.',
      'Dropping damaged nodes frees fuel, but you lose their data.'
    ]
  },
  E03: {
    plain: 'Gravity pulls harder on the near side of the probe than the far side, stretching its body.',
    by: [['engineer', 'comms'], ['planner'], ['science']],
    why: [
      'Moving out weakens the stretching, but gives less data and burns fuel.',
      'A shorter window means less time under stress.',
      'Sacrificing nodes lowers strain on the main body but shrinks the swarm.'
    ]
  },
  E04: {
    plain: 'The radio signal home is getting weak, so collected data cannot be sent back.',
    by: [['comms', 'engineer'], ['planner'], ['science']],
    why: [
      'Moving anchors improves the signal for good, but uses fuel.',
      'Sending data slower makes the link more reliable but collects less.',
      'Sending only the key data keeps the link usable, with a small cut in total data.'
    ]
  }
};

export const TIPS: Record<string, string> = {
  'OBSERVATION DISTANCE': 'How close the probe sits to the black hole. Closer gives more data but more danger.',
  'RADIATION PROTECTION LEVEL': 'How much radiation your shielding blocks. Higher uses more battery.',
  'POWER ALLOCATION · INSTRUMENTS / COMMS': 'Split battery power between science instruments and the radio link.',
  'OBSERVATION DURATION': 'How many hours you have to finish collecting data.',
  'RADIATION INTENSITY I': 'How strong the simulated radiation is.',
  'TEMPERATURE PARAMETER': 'How hot the simulated environment is.',
  'TIDAL STRESS MULTIPLIER k': 'Scales how hard gravity stretches the probe.',
  'SHIELDING LEVEL': 'How much radiation your shielding blocks.',
  'BLACK HOLE MASS': 'Heavier black holes are bigger and glow in a different colour.',
  'CAMERA ANGLE': 'Rotates the picture.',
  'OBSERVER DISTANCE': 'How far the camera is from the black hole.',
  'INCLINATION': 'Viewing angle. 0° looks from above, 89° looks edge-on.',
  'RAY TRACING RESOLUTION': 'Higher is sharper but slower.',
  'VISUALIZATION RAYS': 'How many light paths to draw.'
};

export const GUIDE = [
  ['1. Design your mission', 'Open Mission Overview and pick a goal, a rocket and your probe parts. Better parts help your science but add weight, power use and cost. The rocket can only lift so much, and your budget is limited.'],
  ['2. Launch and watch', 'Press START at the top. Each step is one hour of mission time. Watch fuel, battery, data and the signal back to Earth. Flying closer to the black hole gives more data but more danger.'],
  ['3. Decide and learn', 'When something goes wrong the game pauses and asks you to choose. A short Why This Matters note explains what your choice did. Collect 100% of the data to win. Run out of power, health or signal and the mission fails.']
];

