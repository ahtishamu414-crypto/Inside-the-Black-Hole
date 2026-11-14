import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { CanvasView } from '../components/common/CanvasView';

import { phys, CC, TIPS } from '../sim';
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

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sgn = (x: number, d: number = 2) =>
  (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d);
const lvl = (v: number) => (v > 50 ? CC.green : v > 25 ? CC.amber : CC.red);

export const EnvironmentalScreen: React.FC = () => {
  const sim = useMissionStore(s => s.sim);
  const setP = useMissionStore(s => s.setP);

  const P = phys(sim);
  const p = sim.p;
  const res = sim.res;

  const f1 = (x: number) => x.toFixed(1);
  const f2 = (x: number) => x.toFixed(2);
  const rText = f2(p.r) + ' Rs';

  // Safe distance calculation
  const rSafeRad = 3 * Math.pow((p.radI * 2) / Math.max(1, P.lim), 1 / 1.2);
  const rSafeSt =
    4 *
    Math.pow(
      (p.tidalMult * 35 * Math.pow(4.3e6 / p.mass, 0.25)) / 25,
      1 / 3
    );
  const rSafe = clamp(Math.max(rSafeRad, rSafeSt, 3) + 0.1, 1.05, 20);
  const safe = {
    rad: 'r ≥ ' + f2(rSafeRad) + ' Rs',
    stress: 'r ≥ ' + f2(rSafeSt) + ' Rs',
    btn:
      p.r >= rSafe - 0.05
        ? 'CURRENT POSITION IS SAFE'
        : 'MOVE PROBE TO r = ' + f2(rSafe) + ' Rs',
    go: rSafe
  };

  const radC = P.excess > 20 ? CC.red : P.excess > 0 ? CC.amber : CC.green;
  const stC = P.stress > 45 ? CC.red : P.stress > 25 ? CC.amber : CC.green;

  // 5 Environmental circular gauges
  const gauges: {
    key: string;
    label: string;
    v: string;
    unit: string;
    sub: string;
    c: string;
    frac: number;
    th?: number;
  }[] = [
    {
      key: 'rad',
      label: 'RADIATION',
      v: f1(P.rad),
      unit: 'EXPOSURE IDX',
      sub: 'Limit ' + P.lim,
      c: radC,
      frac: P.rad / 150,
      th: P.lim / 150
    },
    {
      key: 'shield',
      label: 'SHIELD',
      v: f1(res.shield),
      unit: '% INTEGRITY',
      sub: sgn(P.shR) + ' %/step',
      c: lvl(res.shield),
      frac: res.shield / 100
    },
    {
      key: 'stress',
      label: 'STRUCTURAL',
      v: f1(P.stress),
      unit: 'STRESS IDX',
      sub: 'Tolerance 25',
      c: stC,
      frac: P.stress / 100,
      th: 0.25
    },
    {
      key: 'temp',
      label: 'TEMPERATURE',
      v: Math.round(P.tempK) + '',
      unit: 'K (MODELED)',
      sub: 'Shield limit 450 K',
      c: P.tempK > 450 ? CC.red : P.tempK > 380 ? CC.amber : CC.green,
      frac: P.tempK / 800,
      th: 450 / 800
    },
    {
      key: 'power',
      label: 'POWER',
      v: f1(res.battery),
      unit: '% BATTERY',
      sub: sgn(P.batR) + ' %/step',
      c: lvl(res.battery),
      frac: res.battery / 100,
      th: 0.15
    }
  ];

  // Sliders
  const envSliders = [
    {
      label: 'RADIATION INTENSITY I',
      txt: String(p.radI),
      min: 0,
      max: 100,
      step: 1,
      v: p.radI,
      key: 'radI',
      tip: TIPS['RADIATION INTENSITY I']
    },
    {
      label: 'TEMPERATURE PARAMETER',
      txt: String(p.temp),
      min: 0,
      max: 100,
      step: 1,
      v: p.temp,
      key: 'temp',
      tip: TIPS['TEMPERATURE PARAMETER']
    },
    {
      label: 'TIDAL STRESS MULTIPLIER k',
      txt: '×' + f2(p.tidalMult),
      min: 0.25,
      max: 3,
      step: 0.05,
      v: p.tidalMult,
      key: 'tidalMult',
      tip: TIPS['TIDAL STRESS MULTIPLIER k']
    },
    {
      label: 'SHIELDING LEVEL',
      txt: String(p.shieldLvl),
      min: 0,
      max: 100,
      step: 1,
      v: p.shieldLvl,
      key: 'shieldLvl',
      tip: TIPS['SHIELDING LEVEL']
    },
    {
      label: 'OBSERVATION DISTANCE',
      txt: rText,
      min: 1.05,
      max: 20,
      step: 0.05,
      v: p.r,
      key: 'r',
      tip: TIPS['OBSERVATION DISTANCE']
    }
  ];

  // Live Consequences warnings
  const envWarn: { sev: string; c: string; text: string }[] = [];
  if (P.excess > 0)
    envWarn.push({
      sev: P.excess > 20 ? 'CRITICAL' : 'WARNING',
      c: P.excess > 20 ? CC.red : CC.amber,
      text: `Exposure ${f1(P.rad)} exceeds protection limit ${P.lim} by ${f1(
        P.excess
      )}. Shield loses ${f2(-P.shR)}%/step; ${f1(
        P.excess * 0.5
      )} nodes damaged/step. RADIATION SPIKE event will trigger.`
    });
  else
    envWarn.push({
      sev: 'NOMINAL',
      c: CC.green,
      text: `Radiation within protection limit. Shield wear ${f2(
        -P.shR
      )}%/step from baseline exposure.`
    });

  if (P.stress > 25)
    envWarn.push({
      sev: P.stress > 45 ? 'CRITICAL' : 'WARNING',
      c: P.stress > 45 ? CC.red : CC.amber,
      text: `Stress index ${f1(
        P.stress
      )} above tolerance 25. Chassis loses ${f2(
        -P.chR
      )}%/step. Move to r ≥ ${f2(rSafeSt)} Rs to stop accelerated wear.`
    });
  else
    envWarn.push({
      sev: 'NOMINAL',
      c: CC.green,
      text: `Structural stress within tolerance. Chassis wear ${f2(
        -P.chR
      )}%/step.`
    });

  if (P.tempK > 450)
    envWarn.push({
      sev: 'WARNING',
      c: CC.amber,
      text: `Modeled temperature ${Math.round(
        P.tempK
      )} K above 450 K: extra shield wear ${f2(
        P.thX
      )}%/step and +0.10%/step thermal-control power.`
    });

  if (p.r < 3)
    envWarn.push({
      sev: 'WARNING',
      c: CC.amber,
      text: `Below 3 Rs no stable circular orbit exists. Station-keeping burns ${f2(
        P.keep
      )}% fuel/step on top of orbit correction.`
    });

  // 4 Environment Charts
  const H = sim.history;
  const xm = Math.max(p.duration, H.length - 1);
  const chartRad: ChartSpec = {
    xmax: xm,
    max: 150,
    th: [{ v: P.lim, c: 'rgba(255,92,100,0.75)' }],
    series: [
      { d: H.map(h => h.rad), c: CC.amber },
      { d: H.map(h => h.shield), c: CC.green }
    ]
  };

  const chartStress: ChartSpec = {
    xmax: xm,
    max: 100,
    th: [
      { v: 25, c: 'rgba(255,181,71,0.6)' },
      { v: 45, c: 'rgba(255,92,100,0.75)' }
    ],
    series: [
      { d: H.map(h => h.stress), c: CC.amber },
      { d: H.map(h => h.chassis), c: CC.green }
    ]
  };

  const chartTemp: ChartSpec = {
    xmax: xm,
    max: 800,
    th: [{ v: 450, c: 'rgba(255,92,100,0.75)' }],
    series: [{ d: H.map(h => h.temp), c: CC.amber }]
  };

  const chartPower: ChartSpec = {
    xmax: xm,
    th: [{ v: 15, c: 'rgba(255,92,100,0.75)' }],
    series: [
      { d: H.map(h => h.battery), c: CC.cyan },
      { d: H.map(h => h.comm), c: '#B7C3D1' }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '.03em' }}>
            Environmental Simulation
          </div>
          <div style={{ fontSize: 13, color: '#8FA3B8' }}>
            Modeled hazard indices for mission design. All values below are simulated assumptions, not measured black hole telemetry.
          </div>
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10.5,
            padding: '4px 9px',
            border: '1px solid rgba(255,181,71,.6)',
            color: '#FFB547',
            borderRadius: 2,
            letterSpacing: '.08em',
            flexShrink: 0
          }}
        >
          SIMULATED ASSUMPTIONS
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Gauges & Consequences & Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '310px minmax(0,1fr)', gap: 12 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Model Inputs */}
          <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              MODEL INPUTS
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {envSliders.map(s => (
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
                </div>
              ))}
            </div>
          </div>

          {/* Safe Observation Distance */}
          <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              SAFE OBSERVATION DISTANCE
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8FA3B8' }}>Radiation within limit</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{safe.rad}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8FA3B8' }}>Tidal stress below 25</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{safe.stress}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8FA3B8' }}>Stable circular orbit</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>≥ 3.00 Rs</span>
              </div>
              <button
                onClick={() => {
                  if (p.r < safe.go - 0.05) setP('r', +safe.go.toFixed(2));
                }}
                style={{
                  marginTop: 6,
                  height: 32,
                  border: '1px solid #55DDE0',
                  background: 'transparent',
                  color: '#55DDE0',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '.05em',
                  borderRadius: 2,
                  cursor: 'pointer'
                }}
              >
                {safe.btn}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* 5 Circular Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
            {gauges.map(g => (
              <div
                key={g.key}
                style={{
                  background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
                  border: '1px solid #1B283B',
                  borderRadius: 4,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.06em', color: '#8FA3B8', alignSelf: 'flex-start' }}>
                  {g.label}
                </div>
                <div style={{ position: 'relative', width: 120, height: 110 }}>
                  <CanvasView
                    kind="gauge"
                    gaugeSpec={[g.frac, g.c, g.th]}
                    style={{ width: 120, height: 110 }}
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
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 19, color: g.c }}>
                      {g.v}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: '#8FA3B8' }}>
                      {g.unit}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 10.5, color: '#8FA3B8', textAlign: 'center' }}>
                  {g.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Live Consequences Banner */}
          <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              LIVE CONSEQUENCES · PER SIMULATION STEP
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {envWarn.map((w, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: 10, alignItems: 'baseline', fontSize: 12 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: w.c, letterSpacing: '.06em' }}>
                    {w.sev}
                  </span>
                  <span style={{ color: '#C9D4E0' }}>{w.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Environment Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
            <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.06em', color: '#8FA3B8' }}>
                <span>RADIATION EXPOSURE · SHIELD</span>
                <span>amber exposure · green shield · red limit</span>
              </div>
              <div style={{ width: '100%', height: 120 }}>
                <CanvasView kind="chart" chartSpec={chartRad} style={{ width: '100%', height: 120 }} />
              </div>
            </div>

            <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.06em', color: '#8FA3B8' }}>
                <span>TIDAL STRESS · CHASSIS</span>
                <span>amber stress · green chassis</span>
              </div>
              <div style={{ width: '100%', height: 120 }}>
                <CanvasView kind="chart" chartSpec={chartStress} style={{ width: '100%', height: 120 }} />
              </div>
            </div>

            <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.06em', color: '#8FA3B8' }}>
                <span>TEMPERATURE (K)</span>
                <span>red = 450 K</span>
              </div>
              <div style={{ width: '100%', height: 120 }}>
                <CanvasView kind="chart" chartSpec={chartTemp} style={{ width: '100%', height: 120 }} />
              </div>
            </div>

            <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.06em', color: '#8FA3B8' }}>
                <span>POWER · COMMS</span>
                <span>cyan battery · grey comms</span>
              </div>
              <div style={{ width: '100%', height: 120 }}>
                <CanvasView kind="chart" chartSpec={chartPower} style={{ width: '100%', height: 120 }} />
              </div>
            </div>
          </div>

          {/* Formulas */}
          <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, padding: '14px 16px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
                TIDAL ACCELERATION
                <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1px solid rgba(85,221,224,.5)', color: '#55DDE0', borderRadius: 2 }}>
                  ESTABLISHED PHYSICS
                </span>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15 }}>
                Δa / L = 2GM / r³ = {fmtE(P.tidal)} s⁻²
              </div>
              <div style={{ fontSize: 11.5, color: '#8FA3B8' }}>
                Radial stretching per metre of spacecraft length at r = {rText}.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
                STRESS INDEX
                <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1px solid rgba(255,181,71,.5)', color: '#FFB547', borderRadius: 2 }}>
                  SIMULATED ASSUMPTION
                </span>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
                S = k · 35 · (4/r)³ · (4.3×10⁶ M☉ / M)^¼
              </div>
              <div style={{ fontSize: 11.5, color: '#8FA3B8' }}>
                Game-scaled index used for chassis wear. Radiation: E = 2·I·(3/r)^1.2.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

