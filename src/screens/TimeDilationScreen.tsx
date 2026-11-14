import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { CanvasView } from '../components/common/CanvasView';

import { phys, CC, MSUN } from '../sim';

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

export const TimeDilationScreen: React.FC = () => {
  const sim = useMissionStore(s => s.sim);
  const setP = useMissionStore(s => s.setP);
  const refT = useMissionStore(s => s.refT);
  const setRefT = useMissionStore(s => s.setRefT);

  const P = phys(sim);
  const p = sim.p;
  const started = sim.status !== 'READY';

  const f1 = (x: number) => x.toFixed(1);
  const f2 = (x: number) => x.toFixed(2);

  const massText = fmtE(p.mass) + ' M☉';
  const rsText = fmtE(P.RsKm) + ' km';
  const rText = f2(p.r) + ' Rs';
  const refTText = f1(refT) + ' h';

  const massLog = Math.log10(p.mass);
  const massLocked = started;
  const massNote = started
    ? 'Locked during an active mission. Reset to change.'
    : 'Log scale · 10 to 10¹⁰ M☉';

  const repoNote = started
    ? sim.res.fuel <= 0
      ? 'Propellant exhausted: repositioning unavailable.'
      : 'Repositioning costs 1.2% fuel per Rs during the mission.'
    : 'Free to set before mission start.';

  const tdProbe = refT * P.dil;
  const tdD = refT - tdProbe;

  const tdRows = [
    { k: 'Mass M', v: massText, c: CC.text },
    { k: 'Mass (kg)', v: fmtE(p.mass * MSUN) + ' kg', c: CC.text },
    { k: 'Rs = 2GM/c²', v: rsText, c: CC.text },
    { k: 'Rs (AU)', v: fmtE(P.RsKm / 1.496e8) + ' AU', c: CC.muted },
    { k: 'r (normalised)', v: f2(p.r) + ' Rs', c: CC.text },
    { k: 'r (physical)', v: fmtE(p.r * P.RsKm) + ' km', c: CC.text },
    { k: 'dτ/dt', v: P.dil.toFixed(8), c: CC.cyan },
    { k: 'Slowdown', v: ((1 - P.dil) * 100).toFixed(4) + '%', c: CC.amber }
  ];

  const tdExplain = `At r = ${f2(p.r)} Rs a stationary clock ticks at ${P.dil.toFixed(
    4
  )} of the distant reference rate. Over ${f1(
    refT
  )} h of reference time it records ${f2(
    tdProbe
  )} h. The ratio depends only on r/Rs; changing mass rescales Rs and the physical distance (${fmtE(
    p.r * P.RsKm
  )} km).`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>


      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '.03em' }}>
          Time Dilation Analysis
        </div>
        <div style={{ fontSize: 13, color: '#8FA3B8' }}>
          Stationary-observer clock rate outside a non-rotating (Schwarzschild) black hole.
        </div>
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '330px minmax(0,1fr)', gap: 12 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Parameters */}
          <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              PARAMETERS
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
                  <span>BLACK HOLE MASS</span>
                  <span style={{ color: '#E8F0FA' }}>{massText}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.01"
                  value={massLog}
                  onChange={e => setP('mass', Math.pow(10, +e.target.value))}
                  disabled={massLocked}
                  style={{ width: '100%', accentColor: '#55DDE0', opacity: massLocked ? 0.35 : 1 }}
                />
                <div style={{ fontSize: 10.5, color: '#8FA3B8' }}>{massNote}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
                  <span>PROBE DISTANCE r</span>
                  <span style={{ color: '#E8F0FA' }}>{rText}</span>
                </div>
                <input
                  type="range"
                  min="1.05"
                  max="20"
                  step="0.01"
                  value={p.r}
                  onChange={e => setP('r', +e.target.value)}
                  style={{ width: '100%', accentColor: '#55DDE0' }}
                />
                <div style={{ fontSize: 10.5, color: '#8FA3B8' }}>{repoNote}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
                  <span>REFERENCE ELAPSED TIME</span>
                  <span style={{ color: '#E8F0FA' }}>{refTText}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  step="1"
                  value={refT}
                  onChange={e => setRefT(+e.target.value)}
                  style={{ width: '100%', accentColor: '#55DDE0' }}
                />
              </div>
            </div>
          </div>

          {/* Live Calculation Table */}
          <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              LIVE CALCULATION
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
              {tdRows.map((row, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ color: '#8FA3B8' }}>{row.k}</span>
                  <span style={{ color: row.c, textAlign: 'right' }}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* Top: Geometry + Reference Clocks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 12 }}>
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
                OBSERVATION GEOMETRY
                <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1px solid rgba(255,181,71,.5)', color: '#FFB547', borderRadius: 2 }}>
                  ILLUSTRATIVE RENDER
                </span>
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <CanvasView kind="bh" mode="td" style={{ width: '100%', height: 320 }} />
              </div>
            </div>

            <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
                REFERENCE CLOCK COMPARISON
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8FA3B8' }}>Distant reference clock</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{hms(refT)}</span>
                  </div>
                  <div style={{ height: 10, background: '#1B283B' }}>
                    <div style={{ height: '100%', width: '100%', background: '#8FA3B8' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#8FA3B8' }}>Stationary probe clock</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#55DDE0' }}>
                      {hms(tdProbe)}
                    </span>
                  </div>
                  <div style={{ height: 10, background: '#1B283B' }}>
                    <div style={{ height: '100%', width: (P.dil * 100).toFixed(2) + '%', background: '#55DDE0' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#8FA3B8', letterSpacing: '.06em' }}>
                    PROBE CLOCK FALLS BEHIND BY
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, color: '#FFB547' }}>
                    {hms(tdD)}
                  </div>
                </div>

                <div style={{ fontSize: 12, lineHeight: 1.55, color: '#C9D4E0' }}>
                  {tdExplain}
                </div>
              </div>
            </div>
          </div>

          {/* Time Dilation Curve Chart */}
          <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              TIME DILATION VS DISTANCE · dτ/dt(r)
            </div>
            <div style={{ width: '100%', height: 240, margin: '8px 0' }}>
              <CanvasView kind="td" style={{ width: '100%', height: 240 }} />
            </div>
          </div>

          {/* Formula & Validity Warning */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
            <div style={{ background: '#101A2A', border: '1px solid #1B283B', borderRadius: 4, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
                FORMULA
                <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1px solid rgba(85,221,224,.5)', color: '#55DDE0', borderRadius: 2 }}>
                  ESTABLISHED PHYSICS
                </span>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18 }}>
                dτ/dt = √(1 − Rs/r)
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18 }}>
                Rs = 2GM / c²
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: '#8FA3B8' }}>
                G = 6.674×10⁻¹¹ m³ kg⁻¹ s⁻² · M = black hole mass · c = 2.998×10⁸ m/s · r = radial distance from the centre
              </div>
            </div>

            <div style={{ background: 'rgba(255,181,71,0.05)', border: '1px solid rgba(255,181,71,0.45)', borderRadius: 4, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#FFB547' }}>
                VALIDITY WARNING
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#E8F0FA' }}>
                A stationary observer cannot remain stationary at or inside the event horizon. This calculation is valid only for stationary observers outside a Schwarzschild black hole. It is not a complete free-fall trajectory model.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

