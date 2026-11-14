import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { CC, phys } from '../../sim';

export const TopBar: React.FC = () => {
  const sim = useMissionStore(s => s.sim);
  const speed = useMissionStore(s => s.speed);
  const start = useMissionStore(s => s.start);
  const pause = useMissionStore(s => s.pause);
  const resume = useMissionStore(s => s.resume);
  const stepOnce = useMissionStore(s => s.stepOnce);
  const reset = useMissionStore(s => s.reset);
  const setSpeed = useMissionStore(s => s.setSpeed);

  const P = phys(sim);
  const opPct = (P.op / P.ext) * 100;
  const started = sim.status !== 'READY';

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

  const health = Math.min(
    sim.res.shield,
    sim.res.chassis,
    sim.res.battery,
    opPct
  );
  const healthText = health > 50 ? 'NOMINAL' : health > 25 ? 'CAUTION' : 'CRITICAL';
  const healthColor = health > 50 ? CC.green : health > 25 ? CC.amber : CC.red;

  const simDate =
    new Date(Date.UTC(2026, 10, 5, 0, 0, 0) + sim.step * 3600e3)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 16) + ' UTC';

  const s = Math.round(sim.step * 3600);
  const met =
    'T+ ' +
    String(Math.floor(s / 3600)).padStart(3, '0') +
    ':' +
    String(Math.floor((s % 3600) / 60)).padStart(2, '0') +
    ':' +
    String(s % 60).padStart(2, '0');

  const can = {
    start: sim.status === 'READY',
    pause: sim.status === 'RUNNING',
    resume: sim.status === 'PAUSED' && !sim.active,
    step: (sim.status === 'READY' || sim.status === 'PAUSED') && !sim.active,
    reset: started || sim.step > 0
  };

  const o = (b: boolean) => (b ? 1 : 0.35);

  return (
    <div
      style={{
        gridColumn: '1 / span 2',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 16px',
        borderBottom: '1px solid #1B283B',
        background: '#0B1220',
        minWidth: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          width: 200,
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#000',
            boxShadow: '0 0 0 2px #0B1220, 0 0 0 3.5px #FFB547',
            flexShrink: 0
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.07em'
            }}
          >
            BLACK HOLE MISSION CONTROL
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: '#8FA3B8',
              letterSpacing: '.06em'
            }}
          >
            MISSION ID · BH-5000
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '4px 10px',
          border: `1px solid ${statusColor}`,
          borderRadius: 2,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          letterSpacing: '.08em',
          color: statusColor,
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusColor
          }}
        />
        {statusText}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flexShrink: 0
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9.5,
            color: '#8FA3B8',
            letterSpacing: '.08em'
          }}
        >
          SIM CLOCK
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
          {simDate}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flexShrink: 0
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9.5,
            color: '#8FA3B8',
            letterSpacing: '.08em'
          }}
        >
          MISSION ELAPSED
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
          {met}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          flexShrink: 0
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9.5,
            color: '#8FA3B8',
            letterSpacing: '.08em'
          }}
        >
          SYSTEM HEALTH
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: healthColor
          }}
        >
          {healthText}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0
        }}
      >
        <button
          onClick={start}
          style={{
            height: 30,
            padding: '0 12px',
            border: '1px solid #55DDE0',
            background: '#55DDE0',
            color: '#080D17',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.06em',
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
            background: '#101A2A',
            color: '#E8F0FA',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '.06em',
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
            background: '#101A2A',
            color: '#E8F0FA',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '.06em',
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
            background: '#101A2A',
            color: '#E8F0FA',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '.06em',
            borderRadius: 2,
            cursor: can.step ? 'pointer' : 'default',
            opacity: o(can.step)
          }}
        >
          STEP +1h
        </button>
        <button
          onClick={reset}
          style={{
            height: 30,
            padding: '0 12px',
            border: '1px solid #2A3B52',
            background: '#101A2A',
            color: '#E8F0FA',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '.06em',
            borderRadius: 2,
            cursor: can.reset ? 'pointer' : 'default',
            opacity: o(can.reset)
          }}
        >
          RESET
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          border: '1px solid #2A3B52',
          borderRadius: 2,
          flexShrink: 0
        }}
      >
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

      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: '1px solid #2A3B52',
          background: '#101A2A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10.5,
          color: '#8FA3B8',
          flexShrink: 0
        }}
      >
        MD
      </div>
    </div>
  );
};

