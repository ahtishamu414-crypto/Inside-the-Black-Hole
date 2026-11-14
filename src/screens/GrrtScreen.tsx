import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { CanvasView } from '../components/common/CanvasView';

import { CC, TIPS } from '../sim';

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

export const GrrtScreen: React.FC = () => {
  const g = useMissionStore(s => s.g);
  const gr = useMissionStore(s => s.gr);
  const grProgress = useMissionStore(s => s.grProgress);
  const split = useMissionStore(s => s.split);
  const setG = useMissionStore(s => s.setG);
  const runViz = useMissionStore(s => s.runViz);
  const setSplit = useMissionStore(s => s.setSplit);

  const splitText = Math.round(split * 100) + '%';
  const grProgText =
    gr.status === 'TRACING'
      ? Math.round(grProgress * 100) + '%'
      : gr.status === 'COMPLETE'
      ? '100%'
      : '0%';

  const grMap: Record<string, [string, string]> = {
    IDLE: ['READY', CC.cyan],
    MODIFIED: ['PARAMETERS MODIFIED', CC.amber],
    TRACING: ['TRACING ' + Math.round(grProgress * 100) + '%', CC.cyan],
    COMPLETE: ['COMPLETE · ILLUSTRATIVE', CC.green]
  };

  const [grStatus, grStatusC] = grMap[gr.status];

  const gSliders = [
    {
      label: 'BLACK HOLE MASS',
      txt: fmtE(Math.pow(10, g.mass)) + ' M☉',
      min: 1,
      max: 10,
      step: 0.01,
      v: g.mass,
      key: 'mass',
      tip: TIPS['BLACK HOLE MASS']
    },
    {
      label: 'CAMERA ANGLE',
      txt: g.cam + '°',
      min: -180,
      max: 180,
      step: 1,
      v: g.cam,
      key: 'cam',
      tip: TIPS['CAMERA ANGLE']
    },
    {
      label: 'OBSERVER DISTANCE',
      txt: g.dist + ' Rs',
      min: 15,
      max: 120,
      step: 1,
      v: g.dist,
      key: 'dist',
      tip: TIPS['OBSERVER DISTANCE']
    },
    {
      label: 'INCLINATION',
      txt: g.inc + '°',
      min: 0,
      max: 89,
      step: 1,
      v: g.inc,
      key: 'inc',
      tip: TIPS['INCLINATION']
    },
    {
      label: 'RAY TRACING RESOLUTION',
      txt: 'L' + g.res + ' · ' + ['', '1/8', '1/5', '1/3', '1/2', 'full'][g.res] + ' px',
      min: 1,
      max: 5,
      step: 1,
      v: g.res,
      key: 'res',
      tip: TIPS['RAY TRACING RESOLUTION']
    },
    {
      label: 'VISUALIZATION RAYS',
      txt: String(g.rays),
      min: 4,
      max: 64,
      step: 2,
      v: g.rays,
      key: 'rays',
      tip: TIPS['VISUALIZATION RAYS']
    }
  ];

  const gScale = '1 Rs = ' + fmtE(2.953 * Math.pow(10, g.mass)) + ' km';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '.03em' }}>
            GRRT Imaging Laboratory
          </div>
          <div style={{ fontSize: 13, color: '#8FA3B8' }}>
            General Relativistic Ray Tracing workspace. No GRRT engine is integrated yet: the image viewer shows illustrative placeholder renders.
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
          ILLUSTRATIVE · NOT COMPUTED
        </div>
      </div>

      {/* Main Layout: Left = Image Viewer & Rays & Runs, Right = Parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 12 }}>
        {/* Left Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* Split Comparison Image Viewer */}
          <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
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
              <span>LEFT · ILLUSTRATIVE RAW SCENE</span>
              <span>RIGHT · ILLUSTRATIVE GRAVITATIONAL LENSING RESULT</span>
            </div>
            <div style={{ position: 'relative', height: 500 }}>
              <CanvasView
                kind="grrt"
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
                NO LENSING · opaque sphere r = Rs
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 10,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#8FA3B8',
                  lineHeight: 1.6,
                  textAlign: 'right'
                }}
              >
                SHADOW r ≈ 2.6 Rs · PHOTON RING · LENSED FAR DISK
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderTop: '1px solid #1B283B' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
                COMPARISON
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={split}
                onChange={e => setSplit(+e.target.value)}
                style={{ flex: 1, accentColor: '#55DDE0' }}
              />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, width: 44, textAlign: 'right' }}>
                {splitText}
              </span>
            </div>
          </div>

          {/* Bottom Row: Left = Photon Paths RK4, Right = Visualization Runs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 12 }}>
            <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
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
                PHOTON PATHS · EQUATORIAL PLANE
                <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1px solid rgba(85,221,224,.5)', color: '#55DDE0', borderRadius: 2 }}>
                  COMPUTED · RK4
                </span>
              </div>
              <div style={{ width: '100%', height: 250 }}>
                <CanvasView kind="rays" style={{ width: '100%', height: 250 }} />
              </div>
              <div style={{ padding: '8px 14px', fontSize: 11, color: '#8FA3B8', lineHeight: 1.5 }}>
                Null geodesics integrated from d²u/dφ² = −u + (3/2)Rs·u². Red rays (b below the critical value) are captured; amber rays are strongly deflected.
              </div>
            </div>

            <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
                VISUALIZATION RUNS
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {gr.runs.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 8, borderBottom: '1px solid #1B283B' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{r.title}</span>
                    <span style={{ fontSize: 11, color: '#8FA3B8' }}>{r.desc}</span>
                  </div>
                ))}
                {!gr.runs.length && (
                  <div style={{ fontSize: 11.5, color: '#4E6177' }}>
                    No runs yet. Adjust parameters and press RUN VISUALIZATION.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Render Parameters */}
        <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column', alignSelf: 'start' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            RENDER PARAMETERS
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {gSliders.map(s => (
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
                  onChange={e => setG(s.key as any, +e.target.value)}
                  style={{ width: '100%', accentColor: '#55DDE0' }}
                />
              </div>
            ))}

            <button
              onClick={runViz}
              disabled={gr.status === 'TRACING'}
              style={{
                height: 38,
                border: '1px solid #55DDE0',
                background: '#55DDE0',
                color: '#080D17',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '.08em',
                borderRadius: 2,
                cursor: gr.status === 'TRACING' ? 'default' : 'pointer',
                opacity: gr.status === 'TRACING' ? 0.35 : 1
              }}
            >
              RUN VISUALIZATION
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5 }}>
                <span style={{ color: '#8FA3B8' }}>STATUS</span>
                <span style={{ color: grStatusC }}>{grStatus}</span>
              </div>
              <div style={{ height: 4, background: '#1B283B' }}>
                <div style={{ height: '100%', width: grProgText, background: grStatusC }} />
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#8FA3B8', lineHeight: 1.5 }}>
              In Rs units the image geometry is mass-independent; mass sets the physical scale ({gScale}) and the illustrative disk colour.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

