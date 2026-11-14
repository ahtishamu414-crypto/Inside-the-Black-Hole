import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { CanvasView } from '../components/common/CanvasView';
import { phys, setupCost } from '../sim/physics';
import { CC } from '../sim/constants';
import { SimulationState, Snapshot, ActiveEvent, LogEntry } from '../types/simulation';
import { ChartSpec } from '../types/viz';
import { SavedRun } from '../types/ui';

function getChartSpec(k: string, sim: SimulationState): ChartSpec | null {
  const H = sim.history;
  const xa = Math.max(1, H.length - 1);
  const m = (f: (h: Snapshot) => number) => H.map(f);

  switch (k) {
    case 'a-fuel':
      return {
        xmax: xa,
        series: [{ d: m((h: Snapshot) => h.fuel), c: CC.amber, fill: 'rgba(255,181,71,0.08)' }],
      };
    case 'a-bat':
      return {
        xmax: xa,
        th: [{ v: 15, c: 'rgba(255,92,100,0.6)' }],
        series: [{ d: m((h: Snapshot) => h.battery), c: CC.cyan, fill: 'rgba(85,221,224,0.08)' }],
      };
    case 'a-shield':
      return {
        xmax: xa,
        series: [{ d: m((h: Snapshot) => h.shield), c: CC.green, fill: 'rgba(56,217,150,0.08)' }],
      };
    case 'a-chassis':
      return {
        xmax: xa,
        series: [{ d: m((h: Snapshot) => h.chassis), c: '#B7C3D1', fill: 'rgba(183,195,209,0.08)' }],
      };
    case 'a-dil':
      return {
        xmax: xa,
        min: 0,
        max: 1,
        series: [{ d: m((h: Snapshot) => h.dil), c: CC.cyan }],
      };
    case 'a-r':
      return {
        xmax: xa,
        min: 0,
        max: 20,
        th: [{ v: 3, c: 'rgba(255,181,71,0.6)' }],
        series: [{ d: m((h: Snapshot) => h.r), c: CC.cyan }],
      };
    case 'a-rad':
      return {
        xmax: xa,
        max: 150,
        series: [
          { d: m((h: Snapshot) => h.lvl), c: 'rgba(255,92,100,0.7)' },
          { d: m((h: Snapshot) => h.rad), c: CC.amber },
        ],
      };
    case 'a-stress':
      return {
        xmax: xa,
        max: 100,
        th: [{ v: 25, c: 'rgba(255,181,71,0.6)' }],
        series: [{ d: m((h: Snapshot) => h.stress), c: CC.amber }],
      };
    default:
      return null;
  }
}

interface CompareCol {
  title: string;
  c: string;
  run: SavedRun;
}

export const AnalyticsScreen: React.FC = () => {
  const sim = useMissionStore((s) => s.sim);
  const runs = useMissionStore((s) => s.runs);
  const cmp = useMissionStore((s) => s.cmp);
  const saveMsg = useMissionStore((s) => s.saveMsg);
  const saveRun = useMissionStore((s) => s.saveRun);
  const exportReport = useMissionStore((s) => s.exportReport);
  const exportCSV = useMissionStore((s) => s.exportCSV);
  const resetTo = useMissionStore((s) => s.resetTo);
  const toggleCompare = useMissionStore((s) => s.toggleCompare);

  const P = phys(sim);
  const H = sim.history;
  const last = H[H.length - 1] || sim.history[0];
  const opPct = P.ext > 0 ? (P.op / P.ext) * 100 : 0;

  const f1 = (x: number) => x.toFixed(1);
  const f2 = (x: number) => x.toFixed(2);

  const perf = [
    {
      label: 'MISSION RESULT',
      v: sim.outcome ? (sim.outcome.success ? 'SUCCESS' : 'FAILURE') : 'IN PROGRESS',
      c: sim.outcome ? (sim.outcome.success ? CC.green : CC.red) : CC.amber,
    },
    { label: 'TOTAL DURATION', v: `${sim.step} h`, c: CC.text },
    { label: 'SCIENCE DATA', v: `${f1(sim.res.data)}%`, c: CC.cyan },
    { label: 'OPERATIONAL NODES', v: `${f1(opPct)}%`, c: CC.text },
    { label: 'MISSION SCORE', v: sim.outcome ? String(sim.outcome.score) : '—', c: CC.text },
  ];

  const aRes = [
    { key: 'a-fuel', title: 'FUEL CONSUMPTION', last: `${f1(last.fuel)}%` },
    { key: 'a-bat', title: 'BATTERY USAGE', last: `${f1(last.battery)}%` },
    { key: 'a-shield', title: 'SHIELD INTEGRITY', last: `${f1(last.shield)}%` },
    { key: 'a-chassis', title: 'STRUCTURAL INTEGRITY', last: `${f1(last.chassis)}%` },
  ];

  const aSci = [
    { key: 'a-dil', title: 'TIME DILATION dτ/dt', last: last.dil.toFixed(4) },
    { key: 'a-r', title: 'OBSERVATION DISTANCE (Rs)', last: f2(last.r) },
    { key: 'a-rad', title: 'RADIATION EXPOSURE', last: f1(last.rad) },
    { key: 'a-stress', title: 'TIDAL STRESS INDEX', last: f1(last.stress) },
  ];

  // Leaderboard and comparison
  const curRun: SavedRun = {
    id: 0,
    name: 'Current Run',
    diff: sim.cfg.diff.toUpperCase(),
    sandbox: sim.cfg.sandbox,
    team: sim.cfg.team,
    scen: sim.cfg.scen,
    veh: sim.cfg.veh,
    orbit: sim.cfg.orbit,
    budget: Math.round(setupCost(sim.cfg) + sim.spent),
    mass: P.mass,
    data: +sim.res.data.toFixed(1),
    score: sim.outcome ? sim.outcome.score : 0,
    result: sim.outcome ? (sim.outcome.success ? 'SUCCESS' : 'FAILURE') : 'IN PROGRESS',
    step: sim.step,
  };

  const ranked = runs.filter((r: SavedRun) => !r.sandbox).sort((a: SavedRun, b: SavedRun) => b.score - a.score);
  const board = ranked.concat(runs.filter((r: SavedRun) => r.sandbox)).map((r: SavedRun) => {
    const on = cmp.includes(r.id);
    return {
      id: r.id,
      rank: r.sandbox ? '—' : String(ranked.indexOf(r) + 1),
      name: r.name,
      mode: `${r.diff} · ${r.team ? 'Team' : 'Solo'}${r.sandbox ? ' · Sandbox' : ''}`,
      budget: r.sandbox ? '∞' : `$${r.budget}M`,
      mass: `${r.mass} kg`,
      data: `${r.data}%`,
      score: String(r.score),
      result: r.result,
      c: r.result === 'SUCCESS' ? CC.green : r.result === 'FAILURE' ? CC.red : CC.amber,
      on,
      label: on ? 'SELECTED' : 'COMPARE',
      bd: on ? CC.cyan : '#2A3B52',
      bg: on ? 'rgba(85,221,224,0.1)' : 'transparent',
      col: on ? CC.cyan : CC.muted,
    };
  });

  const sel = cmp.map((id: number) => runs.find((r: SavedRun) => r.id === id)).filter(Boolean) as SavedRun[];
  const curCol: CompareCol = { title: 'CURRENT RUN', c: CC.cyan, run: curRun };
  const otherCols: CompareCol[] = sel.map((r: SavedRun) => ({ title: r.name, c: CC.text, run: r }));
  const cols: CompareCol[] = [curCol, ...otherCols];

  const bst = {
    budget: Math.min(...cols.map((x) => (x.run.sandbox ? Infinity : x.run.budget))),
    mass: Math.min(...cols.map((x) => x.run.mass)),
    data: Math.max(...cols.map((x) => x.run.data)),
    score: Math.max(...cols.map((x) => x.run.score)),
  };

  const cell = (v: string, best: boolean) => ({
    v,
    c: best && cols.length > 1 ? CC.green : CC.text,
  });

  const cmpCols = cols.map((x) => {
    const r = x.run;
    return {
      title: x.title,
      c: x.c,
      cells: [
        { v: r.result, c: r.result === 'SUCCESS' ? CC.green : r.result === 'FAILURE' ? CC.red : CC.amber },
        cell(r.diff + (r.sandbox ? ' · Sandbox' : ''), false),
        cell(r.scen, false),
        cell(`${r.veh} · ${r.orbit}`, false),
        cell(r.sandbox ? '∞' : `$${r.budget}M`, !r.sandbox && r.budget === bst.budget),
        cell(`${r.mass} kg`, r.mass === bst.mass),
        cell(`${r.data}%`, r.data === bst.data),
        cell(String(r.score), r.score === bst.score),
      ],
    };
  });

  const cmpLabels = ['RESULT', 'DIFFICULTY', 'SCENARIO', 'ROCKET · ORBIT', 'BUDGET USED', 'MASS', 'DATA', 'SCORE'];

  // Event history
  interface HistRow {
    t: string;
    type: string;
    c: string;
    ev: string;
    dec: string;
    delta: string;
  }
  const histRows: HistRow[] = [];
  sim.events.forEach((e: ActiveEvent) =>
    histRows.push({
      t: `T+${e.step}h`,
      type: `${e.code} ${e.severity}`,
      c: e.severity === 'CRITICAL' ? CC.red : CC.amber,
      ev: e.title,
      dec: e.decision || 'Pending',
      delta: e.delta || '—',
    })
  );
  sim.log
    .filter((l: LogEntry) => l.type === 'crit')
    .forEach((l: LogEntry) =>
      histRows.push({
        t: `T+${l.step}h`,
        type: 'FAILURE',
        c: CC.red,
        ev: l.text,
        dec: '—',
        delta: '—',
      })
    );
  histRows.sort((a, b) => parseInt(a.t.slice(2)) - parseInt(b.t.slice(2)));

  return (
    <div data-screen-label="07 Mission Analytics" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '.03em' }}>Mission Analytics</div>
          <div style={{ fontSize: 13, color: '#8FA3B8' }}>
            Run {sim.mission} · {sim.history.length - 1} recorded steps
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={saveRun}
            style={{
              height: 32,
              padding: '0 14px',
              border: '1px solid #38D996',
              background: 'transparent',
              color: '#38D996',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            SAVE &amp; COMPARE DESIGN
          </button>
          <button
            onClick={exportReport}
            style={{
              height: 32,
              padding: '0 14px',
              border: '1px solid #55DDE0',
              background: 'transparent',
              color: '#55DDE0',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            EXPORT MISSION REPORT
          </button>
          <button
            onClick={exportCSV}
            style={{
              height: 32,
              padding: '0 14px',
              border: '1px solid #2A3B52',
              background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
              color: '#E8F0FA',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            DOWNLOAD CSV
          </button>
          <button
            onClick={() => resetTo(sim.mission, 'sim')}
            style={{
              height: 32,
              padding: '0 14px',
              border: '1px solid #2A3B52',
              background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
              color: '#E8F0FA',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            RESTART MISSION
          </button>
        </div>
      </div>

      {/* 5 Perf Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
        {perf.map((s, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
              border: '1px solid #1B283B',
              borderRadius: 4,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.06em', color: '#8FA3B8' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Saved Designs & Local Leaderboard */}
      <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1B283B' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
            SAVED DESIGNS &amp; LOCAL LEADERBOARD
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#38D996' }}>
            {saveMsg}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '46px minmax(0,1.3fr) minmax(0,1.3fr) 100px 80px 70px 70px 100px 70px',
            gap: 10,
            padding: '8px 14px',
            borderBottom: '1px solid #1B283B',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: '#4E6177',
            letterSpacing: '.06em',
          }}
        >
          <span>RANK</span>
          <span>DESIGN</span>
          <span>MODE</span>
          <span>BUDGET USED</span>
          <span>MASS</span>
          <span>DATA</span>
          <span>SCORE</span>
          <span>RESULT</span>
          <span>COMPARE</span>
        </div>
        {board.map((b) => (
          <div
            key={b.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '46px minmax(0,1.3fr) minmax(0,1.3fr) 100px 80px 70px 70px 100px 70px',
              gap: 10,
              padding: '8px 14px',
              borderBottom: '1px solid #16223a',
              fontSize: 12,
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#55DDE0' }}>{b.rank}</span>
            <span>{b.name}</span>
            <span style={{ color: '#8FA3B8' }}>{b.mode}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{b.budget}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{b.mass}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{b.data}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{b.score}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: b.c }}>{b.result}</span>
            <button
              onClick={() => toggleCompare(b.id)}
              style={{
                height: 24,
                border: `1px solid ${b.bd}`,
                background: b.bg,
                color: b.col,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              {b.label}
            </button>
          </div>
        ))}
        {board.length === 0 && (
          <div style={{ padding: 14, fontSize: 12, color: '#4E6177' }}>
            No saved designs yet. Press SAVE &amp; COMPARE DESIGN to store this run, then pick saved runs to compare side by side.
          </div>
        )}

        {/* Side by side comparison */}
        <div style={{ display: 'flex', padding: 14, gap: 10, borderTop: '1px solid #1B283B' }}>
          <div style={{ width: 140, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 28 }} />
            {cmpLabels.map((lbl, idx) => (
              <div
                key={idx}
                style={{
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#8FA3B8',
                  letterSpacing: '.05em',
                }}
              >
                {lbl}
              </div>
            ))}
          </div>
          {cmpCols.map((col, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)',
                border: '1px solid #1B283B',
                borderRadius: 3,
                padding: '0 10px',
              }}
            >
              <div
                style={{
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10.5,
                  color: col.c,
                  borderBottom: '1px solid #1B283B',
                }}
              >
                {col.title}
              </div>
              {col.cells.map((cellObj, cIdx) => (
                <div
                  key={cIdx}
                  style={{
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 12,
                    color: cellObj.c,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {cellObj.v}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Resource Analytics Charts */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
        RESOURCE ANALYTICS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {aRes.map((c) => (
          <div
            key={c.key}
            style={{
              background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
              border: '1px solid #1B283B',
              borderRadius: 4,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
              <span>{c.title}</span>
              <span style={{ color: '#E8F0FA' }}>{c.last}</span>
            </div>
            <CanvasView
              kind="chart"
              chartSpec={getChartSpec(c.key, sim)}
              style={{ width: '100%', height: 110, display: 'block' }}
            />
          </div>
        ))}
      </div>

      {/* Scientific Analytics Charts */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
        SCIENTIFIC ANALYTICS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {aSci.map((c) => (
          <div
            key={c.key}
            style={{
              background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
              border: '1px solid #1B283B',
              borderRadius: 4,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#8FA3B8' }}>
              <span>{c.title}</span>
              <span style={{ color: '#E8F0FA' }}>{c.last}</span>
            </div>
            <CanvasView
              kind="chart"
              chartSpec={getChartSpec(c.key, sim)}
              style={{ width: '100%', height: 110, display: 'block' }}
            />
          </div>
        ))}
      </div>

      {/* Event History Table */}
      <div style={{ background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)', border: '1px solid #1B283B', borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #1B283B', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.08em', color: '#8FA3B8' }}>
          EVENT HISTORY · DECISIONS · SYSTEM FAILURES
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '70px 110px minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.3fr)',
            gap: 12,
            padding: '8px 14px',
            borderBottom: '1px solid #1B283B',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: '#4E6177',
            letterSpacing: '.06em',
          }}
        >
          <span>TIME</span>
          <span>TYPE</span>
          <span>EVENT</span>
          <span>DECISION</span>
          <span>RESOURCE CHANGE</span>
        </div>
        {histRows.map((h: HistRow, idx: number) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 110px minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.3fr)',
              gap: 12,
              padding: '8px 14px',
              borderBottom: '1px solid #16223a',
              fontSize: 12,
            }}
          >
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8FA3B8' }}>{h.t}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: h.c }}>{h.type}</span>
            <span>{h.ev}</span>
            <span style={{ color: '#C9D4E0' }}>{h.dec}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#8FA3B8' }}>{h.delta}</span>
          </div>
        ))}
        {histRows.length === 0 && (
          <div style={{ padding: 14, fontSize: 12, color: '#4E6177' }}>No events or failures recorded yet.</div>
        )}
      </div>
    </div>
  );
};
