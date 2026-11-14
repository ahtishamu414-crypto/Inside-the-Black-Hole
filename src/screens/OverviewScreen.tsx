import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { CanvasView } from '../components/common/CanvasView';

import {
  phys,
  CC,
  SCEN,
  ORBITS,
  VEH,
  PARTS,
  BEN,
  PK,
  DIFF,
  setupCost,
  clamp
} from '../sim';
import { ChartSpec } from '../types/viz';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n: number) =>
  String(n)
    .split('')
    .map(c => (c === '-' ? '⁻' : SUP[+c]))
    .join('');

const fmtE = (x: number) => {
  if (!isFinite(x) || x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 5)
    return x.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return (x / Math.pow(10, e)).toFixed(2) + '×10' + sup(e);
};

const hms = (h: number) => {
  const s = Math.round(h * 3600);
  return (
    String(Math.floor(s / 3600)).padStart(3, '0') +
    ':' +
    String(Math.floor((s % 3600) / 60)).padStart(2, '0') +
    ':' +
    String(s % 60).padStart(2, '0')
  );
};

const lvl = (v: number) => (v > 50 ? CC.green : v > 25 ? CC.amber : CC.red);

export const OverviewScreen: React.FC = () => {
  const sim = useMissionStore(s => s.sim);
  const setupOpen = useMissionStore(s => s.setupOpen);
  const toggleSetup = useMissionStore(s => s.toggleSetup);
  const setScreen = useMissionStore(s => s.setScreen);
  const setP = useMissionStore(s => s.setP);
  const setCfg = useMissionStore(s => s.setCfg);

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

  const massText = fmtE(p.mass) + ' M☉';
  const rsText = fmtE(P.RsKm) + ' km';
  const rText = f2(p.r) + ' Rs';
  const extText = N(P.ext);
  const opText = N(P.op);

  const statusText = sim.active ? 'DECISION REQUIRED' : sim.status;
  const statusColor = sim.active
    ? CC.amber
    : {
        READY: CC.cyan,
        RUNNING: CC.green,
        PAUSED: CC.amber,
        COMPLETED: CC.green,
        FAILED: CC.red
      }[sim.status];

  const progressText = sim.outcome
    ? sim.outcome.success
      ? 'Mission accomplished'
      : 'Mission failed'
    : `T+${sim.step}h of ${p.duration}h window · data ${f1(res.data)}%`;

  const setupChip = started ? 'LOCKED AFTER LAUNCH' : 'EDITABLE';
  const setupChipC = started ? CC.amber : CC.green;
  const setupToggle = setupOpen ? 'HIDE ▲' : 'SHOW ▼';

  const over = !cf.sandbox && P.mass > veh.lim;
  const payPct = clamp((P.mass / veh.lim) * 100, 0, 100);
  const payC = over ? CC.red : payPct > 85 ? CC.amber : CC.green;
  const payTxt = `${P.mass} / ${cf.sandbox ? '∞' : veh.lim + ' kg'}`;
  const overText = `Too heavy: your probe weighs ${P.mass} kg but the ${veh.name} rocket lifts only ${veh.lim} kg. Pick a bigger rocket or choose lighter parts.`;

  const setupDone = setupCost(cf);
  const costLine = cf.sandbox
    ? 'Sandbox: budget, fuel and payload are unlimited.'
    : `Setup cost $${setupDone}M of $${DF.budget}M · running cost about $${f2(
        0.35 + (sim.res.fuel <= 0 ? 0 : [0, 0.12, 0.25, 0.45][['Off', 'Minimal', 'Standard', 'Aggressive'].indexOf(p.orb)]) * 0.6
      )}M per hour · left after setup $${DF.budget - setupDone}M`;

  // 6 Resource Gauges in Setup Drawer
  const lowA = P.budgetLeft / DF.budget;
  const resGauges: {
    key: string;
    label: string;
    v: string;
    unit: string;
    c: string;
    tip: string;
    frac: number;
    th?: number;
  }[] = [
    {
      key: 'g-fuel',
      label: 'FUEL',
      v: f1(res.fuel),
      unit: '%',
      c: lvl(res.fuel),
      tip: 'Fuel used for moving and keeping position.',
      frac: res.fuel / 100
    },
    {
      key: 'g-bat',
      label: 'BATTERY',
      v: f1(res.battery),
      unit: '%',
      c: lvl(res.battery),
      tip: 'Power for instruments, radio and shielding.',
      frac: res.battery / 100
    },
    {
      key: 'g-data',
      label: 'DATA',
      v: f1(res.data),
      unit: '% COLLECTED',
      c: CC.cyan,
      tip: 'Reach 100% to win.',
      frac: res.data / 100
    },
    {
      key: 'g-comm',
      label: 'COMMS',
      v: f1(res.comm),
      unit: '% SIGNAL',
      c: lvl(res.comm + 10),
      tip: 'Strength of the radio link back to Earth.',
      frac: res.comm / 100
    },
    {
      key: 'g-mass',
      label: 'TOTAL MASS',
      v: String(P.mass),
      unit: 'KG',
      c: over ? CC.red : CC.text,
      tip: 'Probe weight. It must fit under the rocket limit.',
      frac: clamp(P.mass / veh.lim, 0, 1)
    },
    {
      key: 'g-bud',
      label: 'BUDGET',
      v: cf.sandbox ? '∞' : '$' + Math.round(P.budgetLeft),
      unit: 'M LEFT',
      c: cf.sandbox ? CC.cyan : lowA > 0.3 ? CC.green : lowA > 0.12 ? CC.amber : CC.red,
      tip: 'Money left after setup and running costs.',
      frac: cf.sandbox ? 1 : clamp(P.budgetLeft / DF.budget, 0, 1)
    }
  ];

  // Quick Environment Bars
  const radC = P.excess > 20 ? CC.red : P.excess > 0 ? CC.amber : CC.green;
  const stC = P.stress > 45 ? CC.red : P.stress > 25 ? CC.amber : CC.green;
  const pctW = (v: number) => clamp(v, 0, 100).toFixed(1) + '%';
  const envBars = [
    { label: 'Radiation exposure', txt: f1(P.rad) + ' / ' + P.lim, w: pctW(P.rad / 1.5), c: radC },
    { label: 'Tidal stress', txt: f1(P.stress) + ' idx', w: pctW(P.stress), c: stC },
    { label: 'Thermal shield integrity', txt: f1(res.shield) + '%', w: pctW(res.shield), c: lvl(res.shield) },
    { label: 'Chassis integrity', txt: f1(res.chassis) + '%', w: pctW(res.chassis), c: lvl(res.chassis) },
    { label: 'Power level', txt: f1(res.battery) + '%', w: pctW(res.battery), c: lvl(res.battery) },
    { label: 'Fuel remaining', txt: f1(res.fuel) + '%', w: pctW(res.fuel), c: lvl(res.fuel) }
  ];

  // Swarm segment & counts
  const NT = 5000;
  const NA = 160;
  const swarmSeg = [
    { w: (P.op / NT) * 100 + '%', c: CC.cyan },
    { w: (NA / NT) * 100 + '%', c: CC.green },
    { w: (sim.nodes.damaged / NT) * 100 + '%', c: CC.amber },
    { w: (sim.nodes.lost / NT) * 100 + '%', c: CC.red },
    { w: (sim.nodes.inactive / NT) * 100 + '%', c: '#5B6B7E' }
  ];
  const swarmCounts = [
    { label: 'Active observation', v: N(P.op), c: CC.cyan },
    { label: 'Communication anchors', v: '160', c: CC.green },
    { label: 'Damaged', v: N(sim.nodes.damaged), c: CC.amber },
    { label: 'Lost', v: N(sim.nodes.lost), c: CC.red },
    { label: 'Inactive (standby)', v: N(sim.nodes.inactive), c: '#5B6B7E' },
    { label: 'Hypothetical markers', v: String(p.markers), c: '#B7C3D1' }
  ];

  // Event Log short
  const logC = { info: CC.muted, warn: CC.amber, crit: CC.red, decision: CC.cyan, ok: CC.green };
  const logShort = sim.log.slice(-6).reverse();

  // Telemetry chart spec
  const H = sim.history;
  const xm = Math.max(p.duration, H.length - 1);
  const telemetrySpec: ChartSpec = {
    xmax: xm,
    series: [
      { d: H.map(h => h.fuel), c: CC.amber },
      { d: H.map(h => h.battery), c: CC.cyan },
      { d: H.map(h => h.shield), c: CC.green },
      { d: H.map(h => h.chassis), c: '#B7C3D1' },
      { d: H.map(h => h.data), c: CC.text }
    ]
  };

  const repoNote = started
    ? res.fuel <= 0
      ? 'Propellant exhausted: repositioning unavailable.'
      : 'Repositioning costs 1.2% fuel per Rs during the mission.'
    : 'Free to set before mission start.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '.04em' }}>
            BLACK HOLE MISSION CONTROL
          </div>
          <div style={{ fontSize: 13, color: '#8FA3B8' }}>
            Micro-Satellite Swarm Monitoring System
          </div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#8FA3B8' }}>
          TARGET · M = {massText} · Rs = {rsText}
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <div
          style={{
            background: '#101A2A',
            border: '1px solid #1B283B',
            borderRadius: 4,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.07em', color: '#8FA3B8' }}>
            TOTAL SWARM NODES
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26 }}>5,000</div>
          <div style={{ fontSize: 11.5, color: '#8FA3B8' }}>160 external communication anchors</div>
        </div>

        <div
          style={{
            background: '#101A2A',
            border: '1px solid #1B283B',
            borderRadius: 4,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.07em', color: '#8FA3B8' }}>
            EXTERIOR OBSERVATION NODES
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, color: '#55DDE0' }}>
            {extText}
          </div>
          <div style={{ fontSize: 11.5, color: '#8FA3B8' }}>{opText} operational</div>
        </div>

        <div
          style={{
            background: '#101A2A',
            border: '1px solid #1B283B',
            borderRadius: 4,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.07em', color: '#8FA3B8' }}>
            HYPOTHETICAL INSIDE-HORIZON MARKERS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setP('markers', Math.max(0, p.markers - 4))}
              disabled={started}
              style={{
                width: 26,
                height: 26,
                border: '1px solid #2A3B52',
                background: '#0B1220',
                color: '#E8F0FA',
                borderRadius: 2,
                cursor: started ? 'default' : 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
                opacity: started ? 0.35 : 1
              }}
            >
              −
            </button>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, color: '#B7C3D1', minWidth: 44, textAlign: 'center' }}>
              {p.markers}
            </div>
            <button
              onClick={() => setP('markers', Math.min(60, p.markers + 4))}
              disabled={started}
              style={{
                width: 26,
                height: 26,
                border: '1px solid #2A3B52',
                background: '#0B1220',
                color: '#E8F0FA',
                borderRadius: 2,
                cursor: started ? 'default' : 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
                opacity: started ? 0.35 : 1
              }}
            >
              +
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: '#8FA3B8' }}>Scenario markers only · no telemetry</div>
        </div>

        <div
          style={{
            background: '#101A2A',
            border: '1px solid #1B283B',
            borderRadius: 4,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.07em', color: '#8FA3B8' }}>
            MISSION STATUS
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, color: statusColor }}>
            {statusText}
          </div>
          <div style={{ fontSize: 11.5, color: '#8FA3B8' }}>{progressText}</div>
        </div>
      </div>

      {/* Mission Setup & Trade-offs Drawer */}
      <div
        style={{
          background: '#101A2A',
          border: '1px solid #1B283B',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          onClick={toggleSetup}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            MISSION SETUP &amp; TRADE-OFFS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9.5,
                padding: '2px 6px',
                border: `1px solid ${setupChipC}`,
                color: setupChipC,
                borderRadius: 2
              }}
            >
              {setupChip}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
              {setupToggle}
            </span>
          </div>
        </div>

        {setupOpen && (
          <div
            style={{
              padding: '0 14px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              borderTop: '1px solid #1B283B',
              paddingTop: 14
            }}
          >
            {/* 6 Circular Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10 }}>
              {resGauges.map(g => (
                <div
                  key={g.key}
                  title={g.tip}
                  style={{
                    background: '#0B1220',
                    border: '1px solid #1B283B',
                    borderRadius: 3,
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9.5,
                      letterSpacing: '.06em',
                      color: '#8FA3B8',
                      alignSelf: 'flex-start'
                    }}
                  >
                    {g.label}
                  </div>
                  <div style={{ position: 'relative', width: 96, height: 84 }}>
                    <CanvasView
                      kind="gauge"
                      gaugeSpec={[g.frac, g.c, g.th]}
                      style={{ width: 96, height: 84 }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingTop: 6
                      }}
                    >
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, color: g.c }}>
                        {g.v}
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#8FA3B8' }}>
                        {g.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 3 Columns: 1. Scenario, 2. Orbit & Vehicle, 3. Parts */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr) minmax(0,1.25fr)',
                gap: 12,
                opacity: started ? 0.35 : 1
              }}
            >
              {/* 1. Scenarios */}
              <div
                style={{
                  background: '#0B1220',
                  border: '1px solid #1B283B',
                  borderRadius: 3,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9
                }}
              >
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.08em', color: '#8FA3B8' }}>
                  1 · MISSION SCENARIO
                </div>
                {(Object.keys(SCEN) as (keyof typeof SCEN)[]).map(k => {
                  const s = SCEN[k];
                  const on = cf.scen === k;
                  return (
                    <div
                      key={k}
                      onClick={() => !started && setCfg('scen', k)}
                      style={{
                        padding: '9px 11px',
                        border: `1px solid ${on ? CC.cyan : '#1B283B'}`,
                        background: on ? 'rgba(85,221,224,0.08)' : '#0B1220',
                        borderRadius: 3,
                        cursor: started ? 'default' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3
                      }}
                    >
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{s.title}</span>
                      <span style={{ fontSize: 11.5, color: '#8FA3B8' }}>{s.desc}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#55DDE0' }}>
                        Goal: {s.goal}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 2. Orbit & Launch Vehicle */}
              <div
                style={{
                  background: '#0B1220',
                  border: '1px solid #1B283B',
                  borderRadius: 3,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9
                }}
              >
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.08em', color: '#8FA3B8' }}>
                  2 · ORBIT &amp; LAUNCH VEHICLE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid #2A3B52', borderRadius: 2 }}>
                  {(Object.keys(ORBITS) as (keyof typeof ORBITS)[]).map(k => {
                    const o = ORBITS[k];
                    const on = cf.orbit === k;
                    return (
                      <button
                        key={k}
                        title={o.tip}
                        onClick={() => !started && setCfg('orbit', k)}
                        disabled={started}
                        style={{
                          padding: '6px 4px',
                          border: 'none',
                          background: on ? '#55DDE0' : 'transparent',
                          color: on ? '#080D17' : '#8FA3B8',
                          cursor: started ? 'default' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: 11.5 }}>{o.label}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5 }}>
                          {o.r} Rs · ${o.cost}M
                        </span>
                      </button>
                    );
                  })}
                </div>

                {(Object.keys(VEH) as (keyof typeof VEH)[]).map(k => {
                  const v = VEH[k];
                  const on = cf.veh === k;
                  return (
                    <div
                      key={k}
                      title="A bigger rocket lifts more weight but costs more."
                      onClick={() => !started && setCfg('veh', k)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 11px',
                        border: `1px solid ${on ? CC.cyan : '#1B283B'}`,
                        background: on ? 'rgba(85,221,224,0.08)' : '#0B1220',
                        borderRadius: 3,
                        cursor: started ? 'default' : 'pointer'
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{v.name}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#8FA3B8' }}>
                        Up to {v.lim} kg · ${v.cost}M
                      </span>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5 }}>
                    <span style={{ color: '#8FA3B8' }}>PROBE WEIGHT / ROCKET LIMIT</span>
                    <span style={{ color: payC }}>{payTxt}</span>
                  </div>
                  <div style={{ height: 5, background: '#1B283B' }}>
                    <div style={{ height: '100%', width: payPct + '%', background: payC }} />
                  </div>
                </div>

                {over && (
                  <div
                    style={{
                      padding: '8px 10px',
                      border: '1px solid rgba(255,92,100,0.6)',
                      background: 'rgba(255,92,100,0.07)',
                      borderRadius: 3,
                      fontSize: 11.5,
                      lineHeight: 1.45,
                      color: '#FF8A90'
                    }}
                  >
                    {overText}
                  </div>
                )}
              </div>

              {/* 3. Component Trade-offs */}
              <div
                style={{
                  background: '#0B1220',
                  border: '1px solid #1B283B',
                  borderRadius: 3,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9
                }}
              >
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.08em', color: '#8FA3B8' }}>
                  3 · COMPONENT TRADE-OFFS
                </div>
                {PK.map(k => {
                  const pr = PARTS[k];
                  const cur = cf.parts[k];
                  return (
                    <div key={k} title={pr.tip} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12 }}>{pr.label}</span>
                        <div style={{ display: 'flex', border: '1px solid #2A3B52', borderRadius: 2 }}>
                          <button
                            onClick={() => !started && setCfg('part', 'a', k)}
                            disabled={started}
                            style={{
                              height: 24,
                              padding: '0 10px',
                              border: 'none',
                              background: cur === 'a' ? '#55DDE0' : 'transparent',
                              color: cur === 'a' ? '#080D17' : '#8FA3B8',
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 10.5,
                              cursor: started ? 'default' : 'pointer'
                            }}
                          >
                            {pr.a.n}
                          </button>
                          <button
                            onClick={() => !started && setCfg('part', 'b', k)}
                            disabled={started}
                            style={{
                              height: 24,
                              padding: '0 10px',
                              border: 'none',
                              background: cur === 'b' ? '#55DDE0' : 'transparent',
                              color: cur === 'b' ? '#080D17' : '#8FA3B8',
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 10.5,
                              cursor: started ? 'default' : 'pointer'
                            }}
                          >
                            {pr.b.n}
                          </button>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#8FA3B8', lineHeight: 1.5 }}>
                        {pr.b.n}: {BEN[k]} · +{pr.b.mass - pr.a.mass} kg · +{pr.b.pw.toFixed(2)} power/hr · +${pr.b.cost}M
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10.5,
                color: '#8FA3B8'
              }}
            >
              <span>{costLine}</span>
              <span>
                Rs = size of the black hole's edge (event horizon). Heavier or fancier parts help science but cost mass, power and money.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Middle Row: Left: Time Dilation, Center: Black Hole, Right: Environment */}
      <div style={{ display: 'grid', gridTemplateColumns: '330px minmax(0,1fr) 300px', gap: 12 }}>
        {/* Left: Time Dilation */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid #1B283B',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '.08em',
              color: '#8FA3B8'
            }}
          >
            TIME DILATION MONITORING
            <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1px solid rgba(85,221,224,.5)', color: '#55DDE0', borderRadius: 2 }}>
              PHYSICS
            </span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#0B1220', border: '1px solid #1B283B', borderRadius: 3, padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: '#8FA3B8', letterSpacing: '.06em' }}>
                  REFERENCE CLOCK
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16 }}>{hms(sim.step)}</div>
              </div>
              <div style={{ background: '#0B1220', border: '1px solid #1B283B', borderRadius: 3, padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: '#8FA3B8', letterSpacing: '.06em' }}>
                  PROBE CLOCK
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, color: '#55DDE0' }}>
                  {hms(sim.probeT)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8FA3B8' }}>Schwarzschild radius Rs</span>
                <span>{rsText}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8FA3B8' }}>Probe distance r</span>
                <span>{rText}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8FA3B8' }}>Clock-rate dτ/dt</span>
                <span style={{ color: '#55DDE0' }}>{P.dil.toFixed(6)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8FA3B8' }}>Accumulated offset</span>
                <span>−{f2(sim.step - sim.probeT)} h</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
                <span>OBSERVATION DISTANCE</span>
                <span style={{ color: '#E8F0FA' }}>{rText}</span>
              </div>
              <input
                type="range"
                min="1.05"
                max="20"
                step="0.05"
                value={p.r}
                onChange={e => setP('r', +e.target.value)}
                style={{ width: '100%', accentColor: '#55DDE0' }}
              />
              <div style={{ fontSize: 10.5, color: '#8FA3B8' }}>{repoNote}</div>
            </div>

            <div style={{ width: '100%', height: 130 }}>
              <CanvasView kind="td" style={{ width: '100%', height: 130 }} />
            </div>

            <div style={{ background: '#0B1220', border: '1px solid #1B283B', borderRadius: 3, padding: 10, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
              <div style={{ fontSize: 14 }}>dτ/dt = √(1 − Rs/r)</div>
              <div style={{ fontSize: 11, color: '#8FA3B8' }}>
                √(1 − 1/{f2(p.r)}) = {P.dil.toFixed(5)}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Black Hole Canvas */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid #1B283B',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '.08em',
              color: '#8FA3B8'
            }}
          >
            BLACK HOLE VISUALIZATION
            <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1px solid rgba(255,181,71,.5)', color: '#FFB547', borderRadius: 2 }}>
              ILLUSTRATIVE RENDER
            </span>
          </div>
          <div style={{ position: 'relative', flex: 1, minHeight: 500 }}>
            <CanvasView
              kind="bh"
              mode="overview"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
            <div
              style={{
                position: 'absolute',
                left: 12,
                bottom: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: '#8FA3B8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, borderTop: '1px dashed #FF5C64' }} />
                Event horizon · Rs (to scale)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, borderTop: '1px dashed #C9D4E0' }} />
                Photon sphere · 1.5 Rs
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, borderTop: '1px dashed #8FA3B8' }} />
                Orbital references · 3 Rs ISCO and beyond
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, background: '#55DDE0', transform: 'rotate(45deg)' }} />
                Probe · <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#55DDE0' }} /> observation nodes
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                right: 12,
                bottom: 10,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: '#8FA3B8',
                textAlign: 'right',
                lineHeight: 1.6
              }}
            >
              1 Rs = {rsText}
              <br />
              Disk palette from illustrative T ∝ M^−¼
            </div>
          </div>
        </div>

        {/* Right: Environment quick overview */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid #1B283B',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '.08em',
              color: '#8FA3B8'
            }}
          >
            ENVIRONMENT
            <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1px solid rgba(255,181,71,.5)', color: '#FFB547', borderRadius: 2 }}>
              SIMULATED
            </span>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {envBars.map((b, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#8FA3B8' }}>{b.label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: b.c }}>
                    {b.txt}
                  </span>
                </div>
                <div style={{ height: 4, background: '#1B283B', borderRadius: 1 }}>
                  <div style={{ height: '100%', width: b.w, background: b.c, borderRadius: 1 }} />
                </div>
              </div>
            ))}
            <div
              onClick={() => setScreen('env')}
              style={{
                marginTop: 4,
                paddingTop: 12,
                borderTop: '1px solid #1B283B',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10.5,
                color: '#55DDE0',
                cursor: 'pointer',
                letterSpacing: '.05em'
              }}
            >
              OPEN ENVIRONMENTAL ANALYSIS →
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 4 Columns: Swarm, Timeline, GRRT Preview, Telemetry Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr) minmax(0,0.9fr) minmax(0,1.4fr)', gap: 12 }}>
        {/* Swarm Network summary */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            SWARM NETWORK
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', height: 8, borderRadius: 1, overflow: 'hidden', background: '#1B283B' }}>
              {swarmSeg.map((s, idx) => (
                <div key={idx} style={{ width: s.w, background: s.c }} />
              ))}
            </div>
            {swarmCounts.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.c }} />
                <span style={{ color: '#8FA3B8', flex: 1 }}>{s.label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Event Timeline */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            MISSION EVENT TIMELINE
          </div>
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logShort.map((l, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 8, fontSize: 11.5, lineHeight: 1.4 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: logC[l.type] }}>
                  T+{l.step}h
                </span>
                <span style={{ color: '#C9D4E0' }}>{l.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GRRT Preview */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid #1B283B',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '.08em',
              color: '#8FA3B8'
            }}
          >
            GRRT PREVIEW
            <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1px solid rgba(255,181,71,.5)', color: '#FFB547', borderRadius: 2 }}>
              ILLUSTRATIVE
            </span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '100%', height: 150 }}>
              <CanvasView kind="grrt-mini" style={{ width: '100%', height: 150, borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#8FA3B8' }}>
              <span>RAW</span>
              <span>LENSED</span>
            </div>
            <div
              onClick={() => setScreen('grrt')}
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#55DDE0', cursor: 'pointer' }}
            >
              OPEN IMAGING LAB →
            </div>
          </div>
        </div>

        {/* Mission Telemetry Timeline Chart */}
        <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: '1px solid #1B283B',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '.08em',
              color: '#8FA3B8'
            }}
          >
            MISSION TELEMETRY TIMELINE
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '100%', height: 150 }}>
              <CanvasView kind="chart" chartSpec={telemetrySpec} style={{ width: '100%', height: 150 }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#8FA3B8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 2, background: '#FFB547' }} />
                Fuel
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 2, background: '#55DDE0' }} />
                Battery
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 2, background: '#38D996' }} />
                Shield
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 2, background: '#B7C3D1' }} />
                Chassis
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 2, background: '#E8F0FA' }} />
                Data
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

