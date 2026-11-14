import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createFreshState, advance, snap, ORBITS, applyDecision } from '../src/sim';
import { SimulationState, Snapshot } from '../src/types/simulation';

function runScenarioSim(
  setupFn: (s: SimulationState) => SimulationState,
  maxSteps: number = 120,
  choiceStrategy: number = 0
) {
  let s = createFreshState(1);
  s = setupFn(s);
  s.status = 'RUNNING';
  s.log.push({ step: 0, type: 'info', text: 'Launch' });

  const history = [s.history[0]];

  for (let i = 0; i < maxSteps; i++) {
    if (s.status !== 'RUNNING' && s.status !== 'PAUSED') {
      break;
    }

    if (s.active) {
      const res = applyDecision(s, choiceStrategy);
      if (res) {
        s = res.nextState;
      }
    }

    const nextState = advance(s);
    if (!nextState) break;
    s = nextState;
    history.push(nextState.history[nextState.history.length - 1]);

    if (s.outcome) {
      break;
    }
  }

  return {
    steps: s.step,
    status: s.status,
    outcome: s.outcome,
    history
  };
}

describe('Golden Master Parity Tests', () => {
  it('matches Scenario 1 (default COMMANDER photon run) within 1e-9', () => {
    const fixturePath = path.join(__dirname, 'fixtures/scenario_1.json');
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    const result = runScenarioSim(s => {
      s.mission = 1;
      return s;
    }, 120, 0);

    expect(result.steps).toBe(fixture.steps);
    expect(result.status).toBe(fixture.status);
    expect(result.outcome?.success).toBe(fixture.outcome.success);
    expect(result.outcome?.score).toBe(fixture.outcome.score);

    // Verify all history snapshots
    expect(result.history.length).toBe(fixture.history.length);
    for (let i = 0; i < fixture.history.length; i++) {
      const actual = result.history[i];
      const expected = fixture.history[i];
      for (const key of Object.keys(expected) as (keyof Snapshot)[]) {
        expect(actual[key]).toBeCloseTo(expected[key], 8);
      }
    }
  });

  it('matches Scenario 2 (ASTROPHYSICIST close orbit with heavy shield) within 1e-9', () => {
    const fixturePath = path.join(__dirname, 'fixtures/scenario_2.json');
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    const result = runScenarioSim(s => {
      s.mission = 2;
      s.cfg.diff = 'ASTROPHYSICIST';
      s.cfg.orbit = 'close';
      s.p.r = ORBITS.close.r;
      s.cfg.veh = 'm';
      s.cfg.parts.shield = 'b';
      s.history = [snap(s)];
      return s;
    }, 120, 0);

    expect(result.steps).toBe(fixture.steps);
    expect(result.status).toBe(fixture.status);
    expect(result.outcome?.success).toBe(fixture.outcome.success);
    expect(result.outcome?.score).toBe(fixture.outcome.score);

    expect(result.history.length).toBe(fixture.history.length);
    for (let i = 0; i < fixture.history.length; i++) {
      const actual = result.history[i];
      const expected = fixture.history[i];
      for (const key of Object.keys(expected) as (keyof Snapshot)[]) {
        expect(actual[key]).toBeCloseTo(expected[key], 8);
      }
    }
  });

  it('matches Scenario 3 (sandbox with team votes) within 1e-9', () => {
    const fixturePath = path.join(__dirname, 'fixtures/scenario_3.json');
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    const result = runScenarioSim(s => {
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
    }, 120, 0);

    expect(result.steps).toBe(fixture.steps);
    expect(result.status).toBe(fixture.status);
    expect(result.outcome?.success).toBe(fixture.outcome.success);
    expect(result.outcome?.score).toBe(fixture.outcome.score);

    expect(result.history.length).toBe(fixture.history.length);
    for (let i = 0; i < fixture.history.length; i++) {
      const actual = result.history[i];
      const expected = fixture.history[i];
      for (const key of Object.keys(expected) as (keyof Snapshot)[]) {
        expect(actual[key]).toBeCloseTo(expected[key], 8);
      }
    }
  });
});
