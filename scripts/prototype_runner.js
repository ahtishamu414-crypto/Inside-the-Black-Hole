const fs = require('fs');
const path = require('path');

const htmlPath = fs.existsSync(path.join(__dirname, 'Mission Control.dc.html')) 
  ? path.join(__dirname, 'Mission Control.dc.html')
  : fs.existsSync(path.join(__dirname, '..', 'Mission Control.dc.html'))
  ? path.join(__dirname, '..', 'Mission Control.dc.html')
  : path.resolve('Mission Control.dc.html');
const dcHtml = fs.readFileSync(htmlPath, 'utf8');

// Extract the script body
const startMarker = '<script type="text/x-dc" data-dc-script>';
const endMarker = '</script>';
const startIdx = dcHtml.indexOf(startMarker);
const endIdx = dcHtml.indexOf(endMarker, startIdx);
const rawScript = dcHtml.substring(startIdx + startMarker.length, endIdx);

// We need to evaluate the script definitions in an environment
const vm = require('vm');
const sandbox = {
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  requestAnimationFrame: () => {},
  cancelAnimationFrame: () => {},
  localStorage: { getItem: () => null, setItem: () => {} },
  window: {},
  document: {
    createElement: () => ({ getContext: () => ({}) })
  },
  classDCLogic: class {}
};

// Make DCLogic available
const prepScript = `
class DCLogic {
  setState(upd) {
    if (typeof upd === 'function') {
      upd = upd(this.state);
    }
    this.state = { ...this.state, ...upd };
  }
}
${rawScript}
globalThis.Component = Component;
globalThis.fresh = fresh;
globalThis.phys = phys;
globalThis.snap = snap;
globalThis.EV = EV;
globalThis.EVX = EVX;
globalThis.judge = judge;
globalThis.SCEN = SCEN;
globalThis.DIFF = DIFF;
globalThis.ORBITS = ORBITS;
globalThis.VEH = VEH;
globalThis.PARTS = PARTS;
globalThis.ROLES = ROLES;
globalThis.PRIS = PRIS;
globalThis.ORB = ORB;
globalThis.ORBL = ORBL;
globalThis.PRIO = PRIO;
globalThis.PPWR = PPWR;
`;

const context = vm.createContext(sandbox);
sandbox.globalThis = sandbox;
vm.runInContext(prepScript, context);

const { fresh, phys, snap, EV, EVX, judge, Component, SCEN, DIFF, ORBITS, VEH, PARTS, ROLES, PRIS, ORB, ORBL, PRIO, PPWR } = sandbox;

function runScenario(name, setupFn, maxSteps = 120, choiceStrategy = 0) {
  const comp = new Component();
  comp.tm = {};
  comp.vt = 0;
  // Initialize state like componentDidMount
  let s = { ...comp.state };
  s = setupFn(s, comp);
  // launch
  s.status = 'RUNNING';
  s.log.push({ step: 0, type: 'info', text: 'Launch' });
  comp.state = s;

  console.log(`Starting scenario: ${name}`);
  const history = [s.history[0]];

  for (let i = 0; i < maxSteps; i++) {
    if (comp.state.status !== 'RUNNING' && comp.state.status !== 'PAUSED') {
      console.log(`  Finished at step ${comp.state.step} with status ${comp.state.status}`);
      break;
    }
    
    // If active event is waiting
    if (comp.state.active) {
      console.log(`  Event ${comp.state.active.code} at step ${comp.state.step}, applying choice ${choiceStrategy}`);
      comp.decide(choiceStrategy);
    }

    const nextState = comp.advance(comp.state);
    if (!nextState) {
      console.log(`  Advance returned null at step ${comp.state.step}`);
      break;
    }
    comp.state = nextState;
    history.push(nextState.history[nextState.history.length - 1]);

    if (comp.state.outcome) {
      console.log(`  Outcome reached at step ${comp.state.step}: success=${comp.state.outcome.success}, reason=${comp.state.outcome.reason}, score=${comp.state.outcome.score}`);
      break;
    }
  }

  return {
    name,
    steps: comp.state.step,
    status: comp.state.status,
    outcome: comp.state.outcome,
    history
  };
}

// Scenario 1: default COMMANDER photon run (ell orbit 4.5 Rs, medium veh, basic parts, solo, duration 120)
const sc1 = runScenario('scenario_1_commander_photon', (s, comp) => {
  s.mission = 1;
  return s;
});

// Scenario 2: ASTROPHYSICIST close orbit with heavy shield
const sc2 = runScenario('scenario_2_astrophysicist_close_heavy', (s, comp) => {
  s.mission = 2;
  s.cfg.diff = 'ASTROPHYSICIST';
  s.cfg.orbit = 'close';
  s.p.r = ORBITS.close.r;
  s.cfg.veh = 'm';
  s.cfg.parts.shield = 'b'; // heavy
  s.history = [snap(s)];
  return s;
}, 120, 0);

// Scenario 3: sandbox with team votes
const sc3 = runScenario('scenario_3_sandbox_team', (s, comp) => {
  s.mission = 3;
  s.cfg.sandbox = true;
  s.cfg.team = true;
  s.cfg.votes = {
    planner: 'data',
    engineer: 'safety',
    science: 'data',
    comms: 'comms'
  };
  s.history = [snap(s)];
  return s;
});

fs.mkdirSync(path.join(__dirname, '../tests/fixtures'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../tests/fixtures/scenario_1.json'), JSON.stringify(sc1, null, 2));
fs.writeFileSync(path.join(__dirname, '../tests/fixtures/scenario_2.json'), JSON.stringify(sc2, null, 2));
fs.writeFileSync(path.join(__dirname, '../tests/fixtures/scenario_3.json'), JSON.stringify(sc3, null, 2));

console.log('Fixtures generated successfully!');
