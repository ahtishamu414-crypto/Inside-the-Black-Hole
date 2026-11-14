import { create } from 'zustand';
import {
  SimulationState,
  SimParams,
  MissionConfig,
  RoleKey,
  PriorityKey
} from '../types/simulation';
import { ScreenId, ToastItem, SavedRun, GrrtRunHistory } from '../types/ui';
import { NodeCategory, GrrtParams, SwarmOut } from '../types/viz';
import {
  createFreshState,
  advance,
  phys,
  snap,
  applyDecision,
  scoreOf,
  DIFF,
  SCEN,
  ORBITS,
  VEH,
  PARTS,
  BEN,
  PK,
  ROLES,
  setupCost,
  clamp
} from '../sim';

let timerId: any = null;
const toastTimers: Record<string, any> = {};

export interface MissionStore {
  // State
  sim: SimulationState;
  screen: ScreenId;
  speed: 1 | 2 | 5 | 10;
  zoom: number;
  filters: Record<NodeCategory, boolean>;
  layers: {
    disk: boolean;
    orbits: boolean;
    links: boolean;
    traj: boolean;
    grid: boolean;
  };
  sel: number | null;
  search: string;
  searchMsg: string;
  split: number;
  g: GrrtParams & { rays: number };
  gr: {
    status: 'IDLE' | 'MODIFIED' | 'TRACING' | 'COMPLETE';
    runs: GrrtRunHistory[];
  };
  grTick: number;
  grProgress: number;
  refT: number;
  toasts: ToastItem[];
  guide: boolean;
  gstep: number;
  sources: boolean;
  voteOpen: false | 'launch' | 'edit';
  setupOpen: boolean;
  info: boolean;
  runs: SavedRun[];
  cmp: number[];
  saveMsg: string;
  vt: number;
  swarmOut: SwarmOut;

  // Actions
  setScreen: (screen: ScreenId) => void;
  setSpeed: (speed: 1 | 2 | 5 | 10) => void;
  start: () => void;
  launch: () => void;
  pause: () => void;
  resume: () => void;
  stepOnce: () => void;
  reset: () => void;
  resetTo: (no: number, screen?: ScreenId) => void;
  setP: (key: keyof SimParams, value: any) => void;
  setCfg: (key: string, value: any, part?: string) => void;
  setTeam: (team: boolean) => void;
  toggleCrew: (k: RoleKey) => void;
  castVote: (role: RoleKey, priority: PriorityKey) => void;
  decide: (choiceIndex: number) => void;
  setZoom: (fn: (z: number) => number) => void;
  toggleFilter: (k: NodeCategory) => void;
  toggleLayer: (k: keyof MissionStore['layers']) => void;
  setSearch: (s: string) => void;
  doSearch: () => void;
  selectNode: (id: number | null) => void;
  setG: (key: keyof GrrtParams | 'rays', value: number) => void;
  runViz: () => void;
  finishGrrtRun: () => void;
  updateGrProgress: (dt: number) => void;
  setSplit: (split: number) => void;
  setRefT: (refT: number) => void;
  updateVt: (deltaVt: number) => void;
  setSwarmOut: (out: SwarmOut) => void;

  toast: (key: string, text: string) => void;
  removeToast: (id: number) => void;
  openGuide: () => void;
  closeGuide: () => void;
  setGuideStep: (step: number) => void;
  openSources: () => void;
  closeSources: () => void;
  openVote: (mode: 'launch' | 'edit') => void;
  closeVote: () => void;
  confirmVote: () => void;
  toggleSetup: () => void;
  setInfo: (info: boolean) => void;
  saveRun: () => void;
  toggleCompare: (id: number) => void;
  exportCSV: () => void;
  exportReport: () => void;
}

export const useMissionStore = create<MissionStore>((set, get) => {
  // Read localStorage initial values
  let initialRuns: SavedRun[] = [];
  let guideSeen = false;
  if (typeof window !== 'undefined') {
    try {
      initialRuns = JSON.parse(localStorage.getItem('bh5000_runs') || '[]');
      guideSeen = !!localStorage.getItem('bh5000_guide_seen');
    } catch (e) {}
  }

  const initialSim = createFreshState(1);

  const startTimerLoop = () => {
    if (timerId) clearInterval(timerId);
    const speed = get().speed;
    timerId = setInterval(() => {
      const state = get();
      if (state.sim.status === 'RUNNING' && !state.sim.active) {
        const next = advance(state.sim);
        if (next) {
          const finished = next.status === 'COMPLETED' || next.status === 'FAILED';
          set({
            sim: next,
            screen: finished ? 'outcome' : state.screen
          });
        }
      }
    }, 700 / speed);
  };

  return {
    sim: initialSim,
    screen: 'overview',
    speed: 1,
    zoom: 1,
    filters: {
      active: true,
      anchor: true,
      damaged: true,
      lost: true,
      inactive: true,
      marker: true
    },
    layers: {
      disk: true,
      orbits: true,
      links: true,
      traj: true,
      grid: true
    },
    sel: 1207,
    search: '',
    searchMsg: '',
    split: 0.5,
    g: {
      mass: 6.63,
      cam: 0,
      dist: 40,
      inc: 76,
      res: 3,
      rays: 24
    },
    gr: {
      status: 'IDLE',
      runs: []
    },
    grTick: 0,
    grProgress: 1,
    refT: 24,
    toasts: [],
    guide: !guideSeen,
    gstep: 0,
    sources: false,
    voteOpen: false,
    setupOpen: true,
    info: false,
    runs: initialRuns,
    cmp: [],
    saveMsg: '',
    vt: 0,
    swarmOut: { pts: [] },

    setScreen: (screen: ScreenId) => set({ screen }),

    setSpeed: (speed: 1 | 2 | 5 | 10) => {
      set({ speed });
      startTimerLoop();
    },

    start: () => {
      const { sim, toast } = get();
      if (sim.status !== 'READY') return;
      const P = phys(sim);
      const c = sim.cfg;

      if (!c.sandbox && P.mass > VEH[c.veh].lim) {
        toast(
          'payload',
          'Cannot launch: your probe weighs ' +
            P.mass +
            ' kg but the ' +
            VEH[c.veh].name +
            ' rocket can only lift ' +
            VEH[c.veh].lim +
            ' kg. Pick a bigger rocket or lighter parts.'
        );
        set({ screen: 'overview', setupOpen: true });
        return;
      }

      if (!c.sandbox && P.budgetLeft < 5) {
        toast(
          'budget',
          'Cannot launch: setup costs $' +
            setupCost(c) +
            'M and your budget is $' +
            DIFF[c.diff].budget +
            'M, leaving too little to run the mission. Choose cheaper options.'
        );
        set({ screen: 'overview', setupOpen: true });
        return;
      }

      if (c.team && !sim.voteDone) {
        set({ voteOpen: 'launch' });
        return;
      }

      get().launch();
    },

    launch: () => {
      set(s => ({
        sim: {
          ...s.sim,
          status: 'RUNNING',
          voteDone: true,
          log: [
            ...s.sim.log,
            {
              step: 0,
              type: 'info',
              text:
                'Launch: ' +
                SCEN[s.sim.cfg.scen].title +
                ' · ' +
                DIFF[s.sim.cfg.diff].label +
                (s.sim.cfg.sandbox ? ' · SANDBOX' : '') +
                (s.sim.cfg.team ? ' · TEAM' : '') +
                '.'
            }
          ]
        },
        voteOpen: false
      }));
      startTimerLoop();
    },

    pause: () => {
      set(s => ({
        sim: { ...s.sim, status: 'PAUSED' }
      }));
    },

    resume: () => {
      const { sim } = get();
      if (sim.status === 'PAUSED' && !sim.active) {
        set(s => ({
          sim: { ...s.sim, status: 'RUNNING' }
        }));
        startTimerLoop();
      }
    },

    stepOnce: () => {
      const { sim } = get();
      if (sim.active || sim.outcome || (sim.status !== 'READY' && sim.status !== 'PAUSED')) {
        return;
      }
      const next = advance({ ...sim, status: 'PAUSED' });
      if (next) {
        set({ sim: next });
      }
    },

    reset: () => {
      get().resetTo(get().sim.mission);
    },

    resetTo: (no: number, targetScreen?: ScreenId) => {
      if (timerId) clearInterval(timerId);
      const currentCfg = get().sim.cfg;
      const f = createFreshState(no);
      f.cfg = currentCfg;
      f.p.r = ORBITS[currentCfg.orbit].r;
      f.history = [snap(f)];
      set({
        sim: f,
        screen: targetScreen || get().screen,
        vt: 0
      });
    },

    setP: (k: keyof SimParams, v: any) => {
      const { sim } = get();
      if ((k === 'mass' || k === 'markers' || k === 'random') && sim.status !== 'READY') return;
      if (sim.outcome) return;

      const updP = { ...sim.p, [k]: v };
      const updRes = { ...sim.res };

      if (k === 'r' && sim.status !== 'READY') {
        if (sim.res.fuel <= 0) return;
        const cost = Math.abs(v - sim.p.r) * 1.2;
        updRes.fuel = clamp(sim.res.fuel - cost, 0, 100);
      }
      if (k === 'duration') {
        updP.duration = Math.max(sim.step + 1, v);
      }

      const nextSim: SimulationState = {
        ...sim,
        p: updP,
        res: updRes
      };
      if (sim.status === 'READY') {
        nextSim.history = [snap(nextSim)];
      }

      set({ sim: nextSim });

      // Why This Matters Toast
      const Pa = phys(sim);
      const Pb = phys(nextSim);
      const f = (x: number, d: number = 0) => x.toFixed(d);
      let t: string | null = null;

      if (k === 'r')
        t =
          (nextSim.p.r < sim.p.r ? 'Moving closer' : 'Moving farther') +
          ' to ' +
          f(nextSim.p.r, 2) +
          ' Rs: clocks run at ' +
          f(Pb.dil, 2) +
          'x Earth speed, radiation goes ' +
          f(Pa.rad) +
          ' → ' +
          f(Pb.rad) +
          ' and body stretching ' +
          f(Pa.stress) +
          ' → ' +
          f(Pb.stress) +
          ' (safe below 25). Closer gives more data but more wear.';
      else if (k === 'shieldLvl')
        t =
          'Protection ' +
          sim.p.shieldLvl +
          ' → ' +
          nextSim.p.shieldLvl +
          ': shield wear drops from ' +
          f(-Pa.shR, 2) +
          '% to ' +
          f(-Pb.shR, 2) +
          '% per hour, but battery use changes ' +
          f(Pa.dSh, 2) +
          ' → ' +
          f(Pb.dSh, 2) +
          '% per hour.';
      else if (k === 'split')
        t =
          'More power to ' +
          (nextSim.p.split > sim.p.split ? 'instruments' : 'the radio') +
          ': data rate ' +
          f(Pa.dataR, 2) +
          ' → ' +
          f(Pb.dataR, 2) +
          '% per hour, signal target ' +
          f(Pa.commT) +
          ' → ' +
          f(Pb.commT) +
          '%.';
      else if (k === 'duration')
        t =
          'Window set to ' +
          nextSim.p.duration +
          ' h. More time helps you finish the data, but you spend more money and stay exposed longer.';
      else if (k === 'radI')
        t =
          'Stronger radiation (simulated): exposure ' +
          f(Pa.rad) +
          ' → ' +
          f(Pb.rad) +
          ' against your protection limit of ' +
          Pb.lim +
          '.';
      else if (k === 'temp')
        t =
          'Hotter environment: modeled temperature ' +
          f(Pa.tempK) +
          ' → ' +
          f(Pb.tempK) +
          ' K. Above 450 K the shield wears faster.';
      else if (k === 'tidalMult')
        t =
          'Stronger stretching: stress index ' +
          f(Pa.stress) +
          ' → ' +
          f(Pb.stress) +
          '. Above 25 the probe body starts to wear.';
      else if (k === 'prio')
        t =
          'Data priority ' +
          nextSim.p.prio +
          ': data rate ' +
          f(Pa.dataR, 2) +
          ' → ' +
          f(Pb.dataR, 2) +
          '% per hour, battery use ' +
          f(Pa.drain, 2) +
          ' → ' +
          f(Pb.drain, 2) +
          '% per hour.';
      else if (k === 'orb')
        t =
          'Orbit correction ' +
          nextSim.p.orb +
          ': fuel burn ' +
          f(-Pa.fuelR, 2) +
          ' → ' +
          f(-Pb.fuelR, 2) +
          '% per hour. Corrections keep nodes in place; skipping them saves fuel but nodes drift.';
      else if (k === 'mass')
        t =
          'Heavier black hole: its edge (Rs) grows, so the same distance in Rs is farther away in km. Tidal stretching at a given Rs gets weaker.';
      else if (k === 'markers')
        t =
          'Inside-horizon markers are only scenario markers. They do not send data or change resources.';
      else if (k === 'random')
        t = nextSim.p.random
          ? 'Random events are on. A seeded radiation surge may appear and is logged.'
          : 'Random events are off, so runs repeat exactly.';

      if (t) get().toast('p-' + k, t);
    },

    setCfg: (k: string, v: any, part?: string) => {
      const { sim } = get();
      if (sim.status !== 'READY' || sim.outcome) return;

      let cfg: MissionConfig = { ...sim.cfg };
      const updP = { ...sim.p };

      if (k === 'part' && part) {
        cfg = { ...cfg, parts: { ...cfg.parts, [part]: v } };
      } else if (k === 'orbit') {
        cfg = { ...cfg, orbit: v };
        updP.r = ORBITS[v as keyof typeof ORBITS].r;
      } else {
        (cfg as any)[k] = v;
      }

      const nextSim: SimulationState = {
        ...sim,
        cfg,
        p: updP
      };
      nextSim.history = [snap(nextSim)];

      set({ sim: nextSim });

      // Toast feedback
      const Pa = phys(sim);
      const Pb = phys(nextSim);
      const f = (x: number, d: number = 0) => x.toFixed(d);
      const fl =
        Pb.mass > VEH[cfg.veh].lim && !cfg.sandbox
          ? ' Warning: too heavy for your rocket (' + VEH[cfg.veh].lim + ' kg).'
          : '';
      let t = '';

      if (k === 'part' && part) {
        const pr = (PARTS as any)[part];
        const nw = pr[v];
        const od = pr[(sim.cfg.parts as any)[part]];
        const dm = Pb.mass - Pa.mass;
        const dc = nw.cost - od.cost;
        t =
          nw.n +
          ' ' +
          pr.label.toLowerCase() +
          ': ' +
          (v === 'b' ? (BEN as any)[part] : 'back to the lighter, cheaper option') +
          '. Cost: ' +
          (dm >= 0 ? '+' : '') +
          dm +
          ' kg (total ' +
          Pb.mass +
          ' kg), ' +
          (Pb.dParts - Pa.dParts >= 0 ? '+' : '') +
          f(Pb.dParts - Pa.dParts, 2) +
          ' power per hour, ' +
          (dc >= 0 ? '+$' : '−$') +
          Math.abs(dc) +
          'M. Fuel burn changes by ' +
          f((Pb.mf / Pa.mf - 1) * 100, 1) +
          '% because of the weight.' +
          fl;
      } else if (k === 'veh') {
        t =
          VEH[v as keyof typeof VEH].name +
          ' rocket lifts up to ' +
          VEH[v as keyof typeof VEH].lim +
          ' kg and costs $' +
          VEH[v as keyof typeof VEH].cost +
          'M. Your probe weighs ' +
          Pb.mass +
          ' kg.' +
          (fl || ' It fits.');
      } else if (k === 'orbit') {
        const orb = ORBITS[v as keyof typeof ORBITS];
        t =
          orb.label +
          ' orbit at ' +
          orb.r +
          ' Rs ($' +
          orb.cost +
          'M): radiation ' +
          f(Pa.rad) +
          ' → ' +
          f(Pb.rad) +
          ', stretching ' +
          f(Pa.stress) +
          ' → ' +
          f(Pb.stress) +
          ', clocks at ' +
          f(Pb.dil, 2) +
          'x. Closer orbits give more data and more danger.';
      } else if (k === 'scen') {
        const sc = SCEN[v as keyof typeof SCEN];
        t = sc.title + '. ' + sc.goal + ' Pick the orbit and parts that fit this goal.';
      } else if (k === 'diff') {
        const df = DIFF[v as keyof typeof DIFF];
        t =
          df.label +
          ': wear ×' +
          df.wear +
          ', budget $' +
          df.budget +
          'M, data ×' +
          df.data +
          ', score ×' +
          df.score +
          '.';
      } else if (k === 'sandbox') {
        t = v
          ? 'Sandbox on: unlimited budget, fuel and rocket weight. Use it to experiment. Scores are not ranked.'
          : 'Sandbox off: budget, fuel and rocket limits apply again.';
      }

      if (t) get().toast('c-' + k + (part || ''), t);
    },

    setTeam: (team: boolean) => {
      const { sim } = get();
      if (sim.status !== 'READY' || sim.outcome) return;
      set({
        sim: { ...sim, cfg: { ...sim.cfg, team } }
      });
      get().toast(
        'c-team',
        team
          ? 'Team mode: choose crew roles. Each role favours a different priority, so you vote before launch and during events. Agreement earns bonus points; a split costs points.'
          : 'Solo mode: you make every decision alone.'
      );
    },

    toggleCrew: (k: RoleKey) => {
      const { sim } = get();
      if (sim.status !== 'READY' || sim.outcome) return;
      const crew = { ...sim.cfg.crew, [k]: !sim.cfg.crew[k] };
      if (!Object.values(crew).some(Boolean)) return;
      set({ sim: { ...sim, cfg: { ...sim.cfg, crew } } });
    },

    castVote: (role: RoleKey, priority: PriorityKey) => {
      const { sim } = get();
      set({
        sim: {
          ...sim,
          cfg: { ...sim.cfg, votes: { ...sim.cfg.votes, [role]: priority } }
        }
      });
    },

    decide: (choiceIndex: number) => {
      const { sim } = get();
      const res = applyDecision(sim, choiceIndex);
      if (res) {
        set({ sim: res.nextState });
        get().toast('decision', res.toastText);
        if (res.nextState.status === 'RUNNING') {
          startTimerLoop();
        }
      }
    },

    setZoom: fn => set(s => ({ zoom: clamp(fn(s.zoom), 0.6, 6) })),

    toggleFilter: (k: NodeCategory) =>
      set(s => ({
        filters: { ...s.filters, [k]: !s.filters[k] }
      })),

    toggleLayer: k =>
      set(s => ({
        layers: { ...s.layers, [k]: !s.layers[k] }
      })),

    setSearch: search => set({ search }),

    doSearch: () => {
      const { search } = get();
      const m = String(search).match(/\d+/);
      if (!m) {
        set({ searchMsg: 'Enter an ID, e.g. BH-1207' });
        return;
      }
      const id = parseInt(m[0], 10);
      if (id < 1 || id > 5000) {
        set({ searchMsg: 'IDs range BH-0001 to BH-5000' });
        return;
      }
      set({
        sel: id,
        searchMsg: 'Located BH-' + String(id).padStart(4, '0')
      });
    },

    selectNode: (id: number | null) => set({ sel: id, searchMsg: '' }),

    setG: (key, value) => {
      set(s => ({
        g: { ...s.g, [key]: value },
        gr: {
          ...s.gr,
          status: s.gr.status === 'TRACING' ? 'TRACING' : 'MODIFIED'
        }
      }));
    },

    runViz: () => {
      const { gr } = get();
      if (gr.status === 'TRACING') return;
      set({
        grProgress: 0,
        gr: { ...gr, status: 'TRACING' }
      });
    },

    finishGrrtRun: () => {
      const { g, gr } = get();
      const newRun: GrrtRunHistory = {
        title:
          'RUN ' +
          String(gr.runs.length + 1).padStart(2, '0') +
          ' · ' +
          new Date().toISOString().slice(11, 19) +
          ' UTC',
        desc:
          'i ' +
          g.inc +
          '° · cam ' +
          g.cam +
          '° · d ' +
          g.dist +
          ' Rs · ' +
          g.rays +
          ' rays · res L' +
          g.res +
          ' · illustrative'
      };
      set({
        grProgress: 1,
        gr: {
          status: 'COMPLETE',
          runs: [newRun, ...gr.runs].slice(0, 5)
        }
      });
    },

    updateGrProgress: (dt: number) => {
      const { gr, grProgress, grTick } = get();
      if (gr.status === 'TRACING') {
        const nextProgress = Math.min(1, grProgress + dt / 1.6);
        const nextTick = Math.floor(nextProgress * 20);
        if (nextProgress >= 1) {
          get().finishGrrtRun();
        } else if (nextTick !== grTick) {
          set({ grProgress: nextProgress, grTick: nextTick });
        } else {
          set({ grProgress: nextProgress });
        }
      }
    },

    setSplit: split => set({ split }),

    setRefT: refT => set({ refT }),

    updateVt: deltaVt => set(s => ({ vt: s.vt + deltaVt })),

    setSwarmOut: swarmOut => set({ swarmOut }),

    toast: (key, text) => {
      const id = Date.now() + Math.random();
      set(s => ({
        toasts: [...s.toasts.filter(t => t.key !== key), { id, key, text }].slice(-3)
      }));
      clearTimeout(toastTimers[key]);
      toastTimers[key] = setTimeout(() => {
        set(s => ({
          toasts: s.toasts.filter(t => t.key !== key)
        }));
      }, 8000);
    },

    removeToast: id =>
      set(s => ({
        toasts: s.toasts.filter(t => t.id !== id)
      })),

    openGuide: () => set({ guide: true, gstep: 0 }),

    closeGuide: () => {
      try {
        localStorage.setItem('bh5000_guide_seen', '1');
      } catch (e) {}
      set({ guide: false });
    },

    setGuideStep: step => set({ gstep: step }),

    openSources: () => set({ sources: true }),

    closeSources: () => set({ sources: false }),

    openVote: mode => set({ voteOpen: mode }),

    closeVote: () => set({ voteOpen: false }),

    confirmVote: () => {
      const { voteOpen } = get();
      if (voteOpen === 'launch') {
        get().launch();
      } else {
        set({ voteOpen: false });
      }
    },

    toggleSetup: () => set(s => ({ setupOpen: !s.setupOpen })),

    setInfo: info => set({ info }),

    saveRun: () => {
      const { sim } = get();
      const P = phys(sim);
      const c = sim.cfg;
      const run: SavedRun = {
        id: Date.now(),
        name: 'Design ' + (get().runs.length + 1),
        diff: DIFF[c.diff].label,
        sandbox: c.sandbox,
        team: c.team,
        scen: SCEN[c.scen].title,
        veh: VEH[c.veh].name,
        orbit: ORBITS[c.orbit].label,
        budget: +(setupCost(c) + sim.spent).toFixed(0),
        mass: P.mass,
        data: +sim.res.data.toFixed(1),
        score: sim.outcome ? sim.outcome.score : scoreOf(sim, P, false).score,
        result: sim.outcome
          ? sim.outcome.success
            ? 'SUCCESS'
            : 'FAILURE'
          : 'IN PROGRESS',
        step: sim.step
      };
      const updatedRuns = [...get().runs, run];
      try {
        localStorage.setItem('bh5000_runs', JSON.stringify(updatedRuns));
      } catch (e) {}
      set({
        runs: updatedRuns,
        saveMsg: 'Saved as ' + run.name + '. Select it under COMPARE.'
      });
    },

    toggleCompare: (id: number) => {
      set(s => ({
        cmp: s.cmp.includes(id)
          ? s.cmp.filter(x => x !== id)
          : [...s.cmp, id].slice(-3)
      }));
    },

    exportCSV: () => {
      const { sim } = get();
      const cols = [
        't',
        'fuel',
        'battery',
        'shield',
        'chassis',
        'data',
        'comm',
        'op',
        'dmg',
        'lost',
        'r',
        'dil',
        'rad',
        'stress',
        'temp',
        'lvl'
      ];
      const rows = [cols.join(',')].concat(
        sim.history.map(h =>
          cols
            .map(c =>
              typeof (h as any)[c] === 'number'
                ? +(h as any)[c].toFixed(6)
                : (h as any)[c]
            )
            .join(',')
        )
      );
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = `BH-5000_run${sim.mission}_telemetry.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    },

    exportReport: () => {
      const { sim } = get();
      const P = phys(sim);
      const f1 = (x: number) => x.toFixed(1);
      const N = (x: number) => Math.round(x).toLocaleString('en-US');

      const lines = [
        'BLACK HOLE MISSION CONTROL · MISSION REPORT',
        'Mission BH-5000 · run ' + sim.mission,
        'Result: ' +
          (sim.outcome
            ? sim.outcome.success
              ? 'SUCCESS'
              : 'FAILURE — ' + sim.outcome.reason
            : 'IN PROGRESS'),
        'Duration: ' + sim.step + ' h',
        'Data collected: ' + f1(sim.res.data) + '%',
        'Fuel: ' +
          f1(sim.res.fuel) +
          '% · Battery: ' +
          f1(sim.res.battery) +
          '% · Shield: ' +
          f1(sim.res.shield) +
          '% · Chassis: ' +
          f1(sim.res.chassis) +
          '%',
        'Operational nodes: ' + N(P.op) + ' / ' + N(P.ext),
        'Score: ' + (sim.outcome ? sim.outcome.score : '—'),
        '',
        'PARAMETERS',
        JSON.stringify(sim.p),
        '',
        'EVENT LOG'
      ].concat(
        sim.log.map(
          l => 'T+' + l.step + 'h [' + l.type.toUpperCase() + '] ' + l.text
        )
      );

      lines.push(
        '',
        'Educational simulation. Environmental values are simulated assumptions.'
      );

      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = `BH-5000_run${sim.mission}_report.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    }
  };
});

