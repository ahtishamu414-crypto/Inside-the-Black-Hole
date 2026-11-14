import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { CanvasView } from '../components/common/CanvasView';

import { phys, CC } from '../../src/sim';
import { node, angle, COL } from '../viz/bhViz';
import { NodeCategory } from '../types/viz';

const pad4 = (n: number) => String(n).padStart(4, '0');
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const SwarmScreen: React.FC = () => {
  const sim = useMissionStore(s => s.sim);
  const zoom = useMissionStore(s => s.zoom);
  const setZoom = useMissionStore(s => s.setZoom);
  const search = useMissionStore(s => s.search);
  const searchMsg = useMissionStore(s => s.searchMsg);
  const setSearch = useMissionStore(s => s.setSearch);
  const doSearch = useMissionStore(s => s.doSearch);
  const sel = useMissionStore(s => s.sel);
  const selectNode = useMissionStore(s => s.selectNode);
  const filters = useMissionStore(s => s.filters);
  const toggleFilter = useMissionStore(s => s.toggleFilter);
  const layers = useMissionStore(s => s.layers);
  const toggleLayer = useMissionStore(s => s.toggleLayer);
  const vt = useMissionStore(s => s.vt);
  const swarmOut = useMissionStore(s => s.swarmOut);

  const P = phys(sim);
  const res = sim.res;
  const N = (x: number) => Math.round(x).toLocaleString('en-US');
  const f1 = (x: number) => x.toFixed(1);
  const f2 = (x: number) => x.toFixed(2);

  const swarmCards = [
    { label: 'TOTAL NODES', v: '5,000', c: CC.text },
    { label: 'ACTIVE EXTERIOR', v: N(P.op), c: CC.cyan },
    { label: 'INACTIVE', v: N(sim.nodes.inactive), c: '#5B6B7E' },
    { label: 'DAMAGED', v: N(sim.nodes.damaged), c: CC.amber },
    { label: 'LOST', v: N(sim.nodes.lost), c: CC.red },
    { label: 'INSIDE-HORIZON MARKERS', v: String(sim.p.markers), c: '#B7C3D1' }
  ];

  const zoomText = Math.round(zoom * 100) + '%';

  // Selected node details
  let selInfo = {
    id: '',
    cat: '',
    c: CC.muted as string,
    rows: [] as { k: string; v: string }[],
    note: ''
  };

  if (sel) {
    const S = {
      r: sim.p.r,
      mass: sim.p.mass,
      markers: sim.p.markers,
      anchorR: Math.max(14, sim.p.r * 2),
      frac: {
        lost: sim.nodes.lost / P.ext,
        damaged: sim.nodes.damaged / P.ext,
        inactive: sim.nodes.inactive / P.ext
      },
      vt
    };
    const n = node(sel, S);
    const a = angle(n, vt);
    const hv = (q: number) => {
      const t = Math.sin(sel * q) * 43758.5453;
      return t - Math.floor(t);
    };

    const catL: Record<NodeCategory, string> = {
      active: 'ACTIVE',
      anchor: 'ANCHOR',
      damaged: 'DAMAGED',
      lost: 'LOST',
      inactive: 'INACTIVE',
      marker: 'HYPOTHETICAL'
    };
    const mult = n.cat === 'lost' ? 0 : n.cat === 'damaged' ? 0.55 : 1;
    const pp = (v: number) =>
      n.cat === 'marker' ? '—' : f1(clamp(v, 0, 100)) + '%';
    const deg = (((a * 180) / Math.PI) % 360 + 360) % 360;

    const commMsg = {
      active: 'LINKED · anchor A-' + String((sel % 32) + 1).padStart(2, '0'),
      anchor: 'RELAY · uplink ' + f1(res.comm) + '%',
      damaged: 'DEGRADED LINK',
      lost: 'NO SIGNAL',
      inactive: 'STANDBY · power saving',
      marker: 'NONE · no causal link to exterior'
    }[n.cat];

    const dataGB =
      n.cat === 'marker'
        ? '—'
        : n.cat === 'anchor'
        ? f1(res.data * 0.24 * (0.8 + hv(3) * 0.4)) + ' GB relayed'
        : f2(
            (res.data / 100) *
              0.5 *
              (0.8 + hv(5) * 0.4) *
              (n.cat === 'lost' ? 0.5 : 1)
          ) + ' GB';

    selInfo = {
      id: 'BH-' + pad4(n.id),
      cat: catL[n.cat],
      c: COL[n.cat],
      rows: [
        {
          k: 'Position (x, y)',
          v: f2(n.r * Math.cos(a)) + ', ' + f2(n.r * Math.sin(a)) + ' Rs'
        },
        { k: 'Phase angle', v: f1(deg) + '°' },
        {
          k: 'Orbital distance',
          v: f2(n.r) + ' Rs · ' + (n.r * P.RsKm).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' km'
        },
        {
          k: 'Fuel',
          v: pp((res.fuel + (hv(7) - 0.5) * 8) * (n.cat === 'lost' ? 0 : 1))
        },
        {
          k: 'Power',
          v: pp((res.battery + (hv(11) - 0.5) * 6) * (n.cat === 'lost' ? 0 : 1))
        },
        {
          k: 'Structural integrity',
          v: pp(res.chassis * mult + (hv(13) - 0.5) * 4)
        },
        { k: 'Data collected', v: dataGB },
        { k: 'Communication', v: commMsg }
      ],
      note:
        n.cat === 'marker'
          ? 'Hypothetical scenario marker inside the event horizon. It is not a tracked spacecraft: no telemetry, commands or links are possible.'
          : n.r < 3 && n.cat !== 'anchor'
          ? 'Inside 3 Rs no stable circular orbit exists; this node holds position by continuous thrust.'
          : n.cat === 'anchor'
          ? 'External anchor relaying swarm data to the distant ground segment.'
          : 'Exterior node on a circular reference orbit.'
    };
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rc = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rc.left;
    const y = e.clientY - rc.top;
    let best: number | null = null;
    let bd = 196;
    for (const q of swarmOut.pts) {
      const d = (q.x - x) ** 2 + (q.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = q.id;
      }
    }
    if (best) selectNode(best);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>


      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '.03em' }}>
          Swarm Network Simulation
        </div>
        <div style={{ fontSize: 13, color: '#8FA3B8' }}>
          Face-on map of the swarm. Each drawn point samples the population; select any node or search IDs BH-0001 to BH-5000.
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10 }}>
        {swarmCards.map((s, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
              border: '1px solid #1B283B',
              borderRadius: 4,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 5
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '.06em',
                color: '#8FA3B8'
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.c }} />
              {s.label}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22 }}>
              {s.v}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Left = Canvas & Controls, Right = Inspector & Causality Note */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 12 }}>
        {/* Left Container */}
        <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top Control Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #1B283B', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', border: '1px solid #2A3B52', borderRadius: 2 }}>
              <button
                onClick={() => setZoom(z => z / 1.4)}
                style={{
                  width: 30,
                  height: 28,
                  border: 'none',
                  background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)',
                  color: '#E8F0FA',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono', monospace"
                }}
              >
                −
              </button>
              <div
                style={{
                  width: 56,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: '#8FA3B8',
                  borderLeft: '1px solid #2A3B52',
                  borderRight: '1px solid #2A3B52'
                }}
              >
                {zoomText}
              </div>
              <button
                onClick={() => setZoom(z => z * 1.4)}
                style={{
                  width: 30,
                  height: 28,
                  border: 'none',
                  background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)',
                  color: '#E8F0FA',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono', monospace"
                }}
              >
                +
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #2A3B52', borderRadius: 2 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Search probe ID · BH-1207"
                style={{
                  width: 190,
                  height: 28,
                  border: 'none',
                  background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)',
                  color: '#E8F0FA',
                  padding: '0 10px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11.5,
                  outline: 'none'
                }}
              />
              <button
                onClick={doSearch}
                style={{
                  height: 28,
                  padding: '0 10px',
                  border: 'none',
                  borderLeft: '1px solid #2A3B52',
                  background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
                  color: '#55DDE0',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11
                }}
              >
                FIND
              </button>
            </div>

            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
              {searchMsg}
            </span>

            <div style={{ flex: 1 }} />

            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#4E6177', letterSpacing: '.08em' }}>
              LAYERS
            </span>
            {(
              [
                ['disk', 'Disk'],
                ['orbits', 'Orbits'],
                ['links', 'Links'],
                ['traj', 'Trajectory'],
                ['grid', 'Grid']
              ] as const
            ).map(([k, label]) => {
              const on = layers[k];
              return (
                <button
                  key={k}
                  onClick={() => toggleLayer(k)}
                  style={{
                    height: 26,
                    padding: '0 9px',
                    border: `1px solid ${on ? '#2F4A63' : '#1B283B'}`,
                    background: on ? 'rgba(85,221,224,0.08)' : 'transparent',
                    color: on ? '#E8F0FA' : '#4E6177',
                    borderRadius: 2,
                    cursor: 'pointer',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10.5
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid #1B283B', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#4E6177', letterSpacing: '.08em', marginRight: 4 }}>
              FILTER
            </span>
            {(
              [
                ['active', 'Active', CC.cyan],
                ['anchor', 'Anchors', CC.green],
                ['damaged', 'Damaged', CC.amber],
                ['lost', 'Lost', CC.red],
                ['inactive', 'Inactive', '#5B6B7E'],
                ['marker', 'Hypothetical markers', '#B7C3D1']
              ] as const
            ).map(([k, label, dotCol]) => {
              const on = filters[k];
              return (
                <button
                  key={k}
                  onClick={() => toggleFilter(k)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 26,
                    padding: '0 10px',
                    border: `1px solid ${on ? '#2F4A63' : '#1B283B'}`,
                    background: on ? 'rgba(85,221,224,0.08)' : 'transparent',
                    color: on ? '#E8F0FA' : '#4E6177',
                    borderRadius: 2,
                    cursor: 'pointer',
                    fontSize: 11.5
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? dotCol : '#2A3B52' }} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Swarm Canvas */}
          <div style={{ position: 'relative', height: 640 }}>
            <CanvasView
              kind="swarm"
              onClick={handleCanvasClick}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
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
              FACE-ON VIEW · radii in Rs
              <br />
              Anchor ring at max(14 Rs, 2r)
            </div>
          </div>
        </div>

        {/* Right Sidebar: Selected Node & Guardrails */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              SELECTED NODE
            </div>
            {sel && (
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20 }}>
                    {selInfo.id}
                  </div>
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      padding: '2px 7px',
                      border: `1px solid ${selInfo.c}`,
                      color: selInfo.c,
                      borderRadius: 2
                    }}
                  >
                    {selInfo.cat}
                  </div>
                </div>

                {selInfo.rows.map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      fontSize: 12,
                      borderBottom: '1px solid #16223399',
                      paddingBottom: 7
                    }}
                  >
                    <span style={{ color: '#8FA3B8' }}>{row.k}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right' }}>
                      {row.v}
                    </span>
                  </div>
                ))}

                <div style={{ fontSize: 11.5, color: '#8FA3B8', lineHeight: 1.5 }}>
                  {selInfo.note}
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
              CAUSALITY CONSTRAINT
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.55, color: '#C9D4E0' }}>
              No signal can leave the event horizon. Inside-horizon nodes are hypothetical scenario markers, drawn as hollow rings, and never receive communication links. Links are drawn only between exterior nodes and external anchors.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

