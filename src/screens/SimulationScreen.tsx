import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { CanvasView } from '../components/common/CanvasView';

import { phys, CC, VEH, DIFF, ORB, ORBL, PRIO, TIPS, OPS_COST, clamp } from '../sim';
import { ChartSpec } from '../types/viz';

const sgn = (x: number, d: number = 2) =>
  (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d);
const lvl = (v: number) => (v > 50 ? CC.green : v > 25 ? CC.amber : CC.red);

export const SimulationScreen: React.FC = () => {
  const sim = useMissionStore(s => s.sim);
  const speed = useMissionStore(s => s.speed);
  const start = useMissionStore(s => s.start);
  const pause = useMissionStore(s => s.pause);
  const resume = useMissionStore(s => s.resume);
  const stepOnce = useMissionStore(s => s.stepOnce);
  const reset = useMissionStore(s => s.reset);
  const setSpeed = useMissionStore(s => s.setSpeed);
  const setP = useMissionStore(s => s.setP);

  const P = phys(sim);
  const p = sim.p;
  const res = sim.res;
  const cf = sim.cfg;
  const DF = DIFF[cf.diff];
  const veh = VEH[cf.veh];
  const started = sim.status !== 'READY';

  const f1 = (x: number) => x.toFixed(1);
  const f2 = (x: number) => x.toFixed(2);
  const N = (x: number) => Math.round(x).toLocaleString('en-US');
  const pctW = (v: number) => clamp(v, 0, 100).toFixed(1) + '%';
  const opPct = (P.op / P.ext) * 100;

  const rate = (v: number, u?: string) => sgn(v) + ' ' + (u || '%/step');

  // The 9 Resource Bars with Rates
  const massRow = {
    label: 'Total mass',
    txt: P.mass + ' kg',
    w: pctW((P.mass / veh.lim) * 100),
    c: !cf.sandbox && P.mass > veh.lim ? CC.red : CC.cyan,
    rate: 'Rocket limit ' + (cf.sandbox ? '∞' : veh.lim + ' kg')
  };

  const budRow = {
    label: 'Mission budget',
    txt: cf.sandbox ? '∞' : '$' + f1(P.budgetLeft) + 'M',
    w: cf.sandbox ? '100%' : pctW((P.budgetLeft / DF.budget) * 100),
    c: cf.sandbox
      ? CC.cyan
      : P.budgetLeft / DF.budget > 0.3
      ? CC.green
      : P.budgetLeft / DF.budget > 0.12
      ? CC.amber
      : CC.red,
    rate: cf.sandbox
      ? 'Sandbox: unlimited'
      : '−$' + f2(OPS_COST + ORB[P.orb] * 0.6) + 'M per step'
  };

  const resList = [
    {
      label: 'Fuel remaining',
      txt: f1(res.fuel) + '%',
      w: pctW(res.fuel),
      c: lvl(res.fuel),
      rate: rate(P.fuelR)
    },
    {
      label: 'Battery power',
      txt: f1(res.battery) + '%',
      w: pctW(res.battery),
      c: lvl(res.battery),
      rate: rate(P.batR)
    },
    {
      label: 'Shield integrity',
      txt: f1(res.shield) + '%',
      w: pctW(res.shield),
      c: lvl(res.shield),
      rate: rate(P.shR)
    },
    {
      label: 'Chassis integrity',
      txt: f1(res.chassis) + '%',
      w: pctW(res.chassis),
      c: lvl(res.chassis),
      rate: rate(P.chR)
    },
    {
      label: 'Operational nodes',
      txt: N(P.op),
      w: pctW(opPct),
      c: opPct > 70 ? CC.green : opPct > 50 ? CC.amber : CC.red,
      rate: '−' + f1(P.dmgR + P.lostR) + ' nodes/step'
    },
    {
      label: 'Data collected',
      txt: f1(res.data) + '%',
      w: pctW(res.data),
      c: CC.cyan,
      rate: rate(P.dataR)
    },
    {
      label: 'Communication quality',
      txt: f1(res.comm) + '%',
      w: pctW(res.comm),
      c: lvl(res.comm + 10),
      rate: '→ target ' + f1(P.commT) + '%'
    },
    massRow,
    budRow
  ];

  // Why values change
  const why = [
    {
      k: 'FUEL',
      v:
        '−' +
        f2(-P.fuelR) +
        ' = orbit corr. ' +
        P.orb +
        ' ' +
        f2(ORB[P.orb]) +
        ' + station-keeping ' +
        f2(P.orb === 'Off' ? 0 : P.keep)
    },
    {
      k: 'BATTERY',
      v:
        sgn(P.batR) +
        ' = RTG +0.28 − (bus 0.12 + instr ' +
        f2(P.dInst) +
        ' + comms ' +
        f2(P.dComm) +
        ' + shield ' +
        f2(P.dSh) +
        ' + priority ' +
        f2(P.dPr) +
        (P.dTh ? ' + thermal 0.10' : '') +
        ')'
    },
    {
      k: 'SHIELD',
      v:
        '−' +
        f2(-P.shR) +
        ' = 0.03 + E×0.002 (' +
        f2(P.rad * 0.002) +
        ') + excess×0.04 (' +
        f2(P.excess * 0.04) +
        ')' +
        (P.thX ? ' + thermal ' + f2(P.thX) : '')
    },
    {
      k: 'CHASSIS',
      v: '−' + f2(-P.chR) + ' = 0.02 + max(0, S−25)×0.03'
    },
    {
      k: 'DATA',
      v:
        '+' +
        f2(P.dataR) +
        ' = 1.25 × power ' +
        f2(p.split / 60) +
        ' × priority ' +
        PRIO[p.prio] +
        ' × √(6/r) ' +
        f2(P.prox) +
        ' × nodes ' +
        f2(P.opFrac) +
        ' × comms ' +
        f2(P.commF)
    }
  ];

  const repoNote = started
    ? res.fuel <= 0
      ? 'Propellant exhausted: repositioning unavailable.'
      : 'Repositioning costs 1.2% fuel per Rs during the mission.'
    : 'Free to set before mission start.';

  const simSliders = [
    {
      label: 'OBSERVATION DISTANCE',
      txt: f2(p.r) + ' Rs',
      min: 1.05,
      max: 20,
      step: 0.05,
      v: p.r,
      key: 'r',
      note: repoNote,
      tip: TIPS['OBSERVATION DISTANCE']
    },
    {
      label: 'RADIATION PROTECTION LEVEL',
      txt: String(p.shieldLvl),
      min: 0,
      max: 100,
      step: 1,
      v: p.shieldLvl,
      key: 'shieldLvl',
      note: 'Exposure ' + f1(P.rad) + ' · higher protection draws ' + f2(P.dSh) + '%/step power',
      tip: TIPS['RADIATION PROTECTION LEVEL']
    },
    {
      label: 'POWER ALLOCATION · INSTRUMENTS / COMMS',
      txt: p.split + ' / ' + (100 - p.split),
      min: 10,
      max: 90,
      step: 1,
      v: p.split,
      key: 'split',
      note: 'Instruments drive data rate; comms drive link quality',
      tip: TIPS['POWER ALLOCATION · INSTRUMENTS / COMMS']
    },
    {
      label: 'OBSERVATION DURATION',
      txt: p.duration + ' h',
      min: 24,
      max: 240,
      step: 6,
      v: p.duration,
      key: 'duration',
      note: 'Window ends at T+' + p.duration + 'h · must exceed elapsed time',
      tip: TIPS['OBSERVATION DURATION']
    }
  ];

  const prioOpts = ['Low', 'Balanced', 'High'] as const;
  const orbOpts = ORBL;
  const orbNote =
    p.orb === 'Off'
      ? p.r < 3
        ? 'No correction below 3 Rs: rapid node loss to orbital decay.'
        : 'No correction: slow drift damages nodes and degrades links.'
      : 'Burns ' +
        f2(ORB[p.orb]) +
        '%/step' +
        (p.r < 3 ? ' + ' + f2(P.keep) + ' station-keeping' : '');

  // ETA projection
  const stepsNeeded = P.dataR > 0 ? (100 - res.data) / P.dataR : Infinity;
  const etaT = sim.step + stepsNeeded;
  const eta =
    res.data >= 100
      ? { text: 'Dataset complete.', c: CC.green }
      : !isFinite(stepsNeeded)
      ? { text: 'No data being collected.', c: CC.red }
      : {
          text:
            'Projected completion T+' +
            Math.ceil(etaT) +
            'h · window T+' +
            p.duration +
            'h · ' +
            (etaT <= p.duration
              ? 'ON TRACK'
              : 'SHORTFALL ' + f1(100 - res.data - P.dataR * (p.duration - sim.step)) + '%'),
          c: etaT <= p.duration ? CC.green : CC.amber
        };

  // Alerts
  const alerts: { sev: string; text: string; c: string; b: string }[] = [];
  if (P.excess > 0)
    alerts.push({
      sev: 'RADIATION',
      text: 'Exposure above protection limit by ' + f1(P.excess),
      c: P.excess > 20 ? CC.red : CC.amber,
      b: P.excess > 20 ? 'rgba(255,92,100,0.45)' : 'rgba(255,181,71,0.4)'
    });
  if (P.stress > 25)
    alerts.push({
      sev: 'STRUCTURAL',
      text: 'Stress index ' + f1(P.stress) + ' over tolerance',
      c: P.stress > 45 ? CC.red : CC.amber,
      b: P.stress > 45 ? 'rgba(255,92,100,0.45)' : 'rgba(255,181,71,0.4)'
    });
  if (p.r < 3)
    alerts.push({
      sev: 'ORBIT',
      text: 'Inside 3 Rs · station-keeping required',
      c: CC.amber,
      b: 'rgba(255,181,71,0.4)'
    });
  if (res.fuel < 25)
    alerts.push({
      sev: 'FUEL',
      text: 'Propellant ' + f1(res.fuel) + '%',
      c: res.fuel < 10 ? CC.red : CC.amber,
      b: res.fuel < 10 ? 'rgba(255,92,100,0.45)' : 'rgba(255,181,71,0.4)'
    });
  if (res.battery < 25)
    alerts.push({
      sev: 'POWER',
      text:
        'Battery ' +
        f1(res.battery) +
        '%' +
        (res.battery < 15 ? ' · nodes entering standby' : ''),
      c: res.battery < 15 ? CC.red : CC.amber,
      b: res.battery < 15 ? 'rgba(255,92,100,0.45)' : 'rgba(255,181,71,0.4)'
    });
  if (res.comm < 50)
    alerts.push({
      sev: 'COMMS',
      text: 'Link quality ' + f1(res.comm) + '%',
      c: CC.amber,
      b: 'rgba(255,181,71,0.4)'
    });
  if (eta.c !== CC.green && res.data < 100 && started)
    alerts.push({
      sev: 'SCIENCE',
      text: eta.text,
      c: CC.amber,
      b: 'rgba(255,181,71,0.4)'
    });
  if (!alerts.length)
    alerts.push({
      sev: 'NOMINAL',
      text: 'All systems within modeled limits.',
      c: CC.green,
      b: 'rgba(56,217,150,0.35)'
    });

  const progressText = sim.outcome
    ? sim.outcome.success
      ? 'Mission accomplished'
      : 'Mission failed'
    : `T+${sim.step}h of ${p.duration}h window · data ${f1(res.data)}%`;

  const can = {
    start: sim.status === 'READY',
    pause: sim.status === 'RUNNING',
    resume: sim.status === 'PAUSED' && !sim.active,
    step: (sim.status === 'READY' || sim.status === 'PAUSED') && !sim.active,
    reset: started || sim.step > 0
  };
  const o = (b: boolean) => (b ? 1 : 0.35);

  // Charts specs
  const H = sim.history;
  const xm = Math.max(p.duration, H.length - 1);
  const chartRes: ChartSpec = {
    xmax: xm,
    series: [
      { d: H.map(h => h.fuel), c: CC.amber },
      { d: H.map(h => h.battery), c: CC.cyan },
      { d: H.map(h => h.shield), c: CC.green },
      { d: H.map(h => h.chassis), c: '#B7C3D1' }
    ]
  };

  const chartNodes: ChartSpec = {
    xmax: xm,
    series: [
      { d: H.map(h => h.op), c: CC.cyan },
      { d: H.map(h => h.dmg), c: CC.amber },
      { d: H.map(h => h.lost), c: CC.red }
    ]
  };

  const chartData: ChartSpec = {
    xmax: xm,
    th: [{ v: 100, c: 'rgba(56,217,150,0.6)' }],
    series: [
      { d: H.map(h => h.data), c: CC.cyan, fill: 'rgba(85,221,224,0.08)' }
    ]
  };

  const logC = { info: CC.muted, warn: CC.amber, crit: CC.red, decision: CC.cyan, ok: CC.green };
  const logLong = sim.log.slice(-40).reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '.03em' }}>
            Mission Simulation Control
          </div>
          <div style={{ fontSize: 13, color: '#8FA3B8' }}>
            Objective: collect 100% of the science dataset within the observation window while keeping the swarm alive.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setP('random', !p.random)}
            disabled={started}
            style={{
              height: 28,
              padding: '0 10px',
              border: `1px solid ${p.random ? 'rgba(255,181,71,0.6)' : '#2A3B52'}`,
              background: 'transparent',
              color: p.random ? CC.amber : CC.muted,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10.5,
              borderRadius: 2,
              cursor: started ? 'default' : 'pointer',
              opacity: started ? 0.35 : 1
            }}
          >
            {p.random
              ? 'RANDOM EVENT MODE · ON (SEEDED)'
              : 'RANDOM EVENT MODE · OFF (DETERMINISTIC)'}
          </button>
        </div>
      </div>

      {/* 3-column top grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px minmax(0,1fr) 300px', gap: 12 }}>
        {/* Left: 9 Resource Bars + Why Values Change */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 9 Resource Bars */}
          <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              RESOURCES
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {resList.map((b, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: '#8FA3B8' }}>{b.label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: b.c }}>
                      {b.txt}
                    </span>
                  </div>
                  <div style={{ height: 4, background: '#1B283B' }}>
                    <div style={{ height: '100%', width: b.w, background: b.c }} />
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#4E6177', textAlign: 'right' }}>
                    {b.rate}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Values Change */}
          <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              WHY VALUES CHANGE
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {why.map((w, idx) => (
                <div key={idx} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, lineHeight: 1.5, color: '#C9D4E0' }}>
                  <span style={{ color: '#55DDE0' }}>{w.k}</span> {w.v}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Live Swarm & Simulation Control Buttons */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #1B283B', flexWrap: 'wrap' }}>
            <button
              onClick={start}
              style={{
                height: 30,
                padding: '0 14px',
                border: '1px solid #55DDE0',
                background: '#55DDE0',
                color: '#080D17',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 2,
                cursor: can.start ? 'pointer' : 'default',
                opacity: o(can.start)
              }}
            >
              START
            </button>
            <button
              onClick={pause}
              style={{
                height: 30,
                padding: '0 12px',
                border: '1px solid #2A3B52',
                background: '#0B1220',
                color: '#E8F0FA',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                borderRadius: 2,
                cursor: can.pause ? 'pointer' : 'default',
                opacity: o(can.pause)
              }}
            >
              PAUSE
            </button>
            <button
              onClick={resume}
              style={{
                height: 30,
                padding: '0 12px',
                border: '1px solid #2A3B52',
                background: '#0B1220',
                color: '#E8F0FA',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                borderRadius: 2,
                cursor: can.resume ? 'pointer' : 'default',
                opacity: o(can.resume)
              }}
            >
              RESUME
            </button>
            <button
              onClick={stepOnce}
              style={{
                height: 30,
                padding: '0 12px',
                border: '1px solid #2A3B52',
                background: '#0B1220',
                color: '#E8F0FA',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                borderRadius: 2,
                cursor: can.step ? 'pointer' : 'default',
                opacity: o(can.step)
              }}
            >
              ADVANCE ONE STEP
            </button>
            <button
              onClick={reset}
              style={{
                height: 30,
                padding: '0 12px',
                border: '1px solid #2A3B52',
                background: '#0B1220',
                color: '#E8F0FA',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                borderRadius: 2,
                cursor: can.reset ? 'pointer' : 'default',
                opacity: o(can.reset)
              }}
            >
              RESET
            </button>

            <div style={{ display: 'flex', border: '1px solid #2A3B52', borderRadius: 2 }}>
              {([1, 2, 5, 10] as const).map(n => {
                const on = speed === n;
                return (
                  <button
                    key={n}
                    onClick={() => setSpeed(n)}
                    style={{
                      height: 28,
                      width: 36,
                      border: 'none',
                      background: on ? '#55DDE0' : 'transparent',
                      color: on ? '#080D17' : '#8FA3B8',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    {n}x
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#8FA3B8' }}>
              {progressText}
            </span>
          </div>

          <div style={{ position: 'relative', flex: 1, minHeight: 540 }}>
            <CanvasView
              kind="bh"
              mode="sim"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: 10,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: '#8FA3B8',
                lineHeight: 1.6
              }}
            >
              LIVE SWARM · ILLUSTRATIVE RENDER
              <br />
              Overlays to scale in Rs
            </div>
            <div
              style={{
                position: 'absolute',
                left: 12,
                bottom: 10,
                display: 'flex',
                gap: 14,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: '#8FA3B8'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#55DDE0' }} />
                Active
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, background: '#38D996' }} />
                Anchor
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB547' }} />
                Damaged
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF5C64' }} />
                Lost
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5B6B7E' }} />
                Standby
              </span>
            </div>
          </div>
        </div>

        {/* Right: Mission Controls */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column', alignSelf: 'start' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            MISSION CONTROLS
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {simSliders.map(s => (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
                  <span title={s.tip} style={{ cursor: 'help' }}>
                    {s.label}
                  </span>
                  <span style={{ color: '#E8F0FA' }}>{s.txt}</span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={s.v}
                  onChange={e => setP(s.key as any, +e.target.value)}
                  style={{ width: '100%', accentColor: '#55DDE0' }}
                />
                <div style={{ fontSize: 10.5, color: '#4E6177' }}>{s.note}</div>
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
                DATA COLLECTION PRIORITY
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid #2A3B52', borderRadius: 2 }}>
                {prioOpts.map(v => {
                  const on = p.prio === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setP('prio', v)}
                      style={{
                        height: 28,
                        border: 'none',
                        background: on ? '#55DDE0' : 'transparent',
                        color: on ? '#080D17' : '#8FA3B8',
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10.5,
                        cursor: 'pointer'
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
                ORBIT CORRECTION
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid #2A3B52', borderRadius: 2 }}>
                {orbOpts.map(v => {
                  const on = p.orb === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setP('orb', v)}
                      style={{
                        height: 28,
                        border: 'none',
                        background: on ? '#55DDE0' : 'transparent',
                        color: on ? '#080D17' : '#8FA3B8',
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        cursor: 'pointer'
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 10.5, color: '#4E6177' }}>{orbNote}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 5 Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr) minmax(0,1fr)', gap: 12 }}>
        {/* Mission Event Log */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            MISSION EVENT LOG
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 200, overflow: 'auto' }}>
            {logLong.map((l, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 6, fontSize: 11, lineHeight: 1.4 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: logC[l.type] }}>
                  T+{l.step}h
                </span>
                <span style={{ color: '#C9D4E0' }}>{l.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Consumption Chart */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            RESOURCE CONSUMPTION
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ width: '100%', height: 140 }}>
              <CanvasView kind="chart" chartSpec={chartRes} style={{ width: '100%', height: 140 }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: '#8FA3B8' }}>
              <span style={{ color: '#FFB547' }}>— Fuel</span>
              <span style={{ color: '#55DDE0' }}>— Battery</span>
              <span style={{ color: '#38D996' }}>— Shield</span>
              <span style={{ color: '#B7C3D1' }}>— Chassis</span>
            </div>
          </div>
        </div>

        {/* Satellite Status Chart */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            SATELLITE STATUS
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ width: '100%', height: 140 }}>
              <CanvasView kind="chart" chartSpec={chartNodes} style={{ width: '100%', height: 140 }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: '#8FA3B8' }}>
              <span style={{ color: '#55DDE0' }}>— Operational %</span>
              <span style={{ color: '#FFB547' }}>— Damaged %</span>
              <span style={{ color: '#FF5C64' }}>— Lost %</span>
            </div>
          </div>
        </div>

        {/* Data Collection */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            DATA COLLECTION
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, color: '#55DDE0' }}>
              {f1(res.data)}%
            </div>
            <div style={{ height: 6, background: '#1B283B' }}>
              <div style={{ height: '100%', width: pctW(res.data), background: '#55DDE0' }} />
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: eta.c, lineHeight: 1.5 }}>
              {eta.text}
            </div>
            <div style={{ width: '100%', height: 80 }}>
              <CanvasView kind="chart" chartSpec={chartData} style={{ width: '100%', height: 80 }} />
            </div>
          </div>
        </div>

        {/* Mission Alerts */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            MISSION ALERTS
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {alerts.map((a, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '7px 9px',
                  border: `1px solid ${a.b}`,
                  borderRadius: 2
                }}
              >
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: '.06em', color: a.c }}>
                  {a.sev}
                </span>
                <span style={{ fontSize: 11.5, color: '#E8F0FA', lineHeight: 1.4 }}>
                  {a.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

