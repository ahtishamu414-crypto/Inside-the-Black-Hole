import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { DIFF, SCEN, CC } from '../../sim';

export const Footer: React.FC = () => {
  const sim = useMissionStore(s => s.sim);
  const openSources = useMissionStore(s => s.openSources);
  const setLandingDone = useMissionStore(s => s.setLandingDone);

  const cf = sim.cfg;
  const DF = DIFF[cf.diff];
  const footText = `BH-5000 · RUN ${sim.mission} · ${DF.label} · ${
    cf.team ? 'TEAM' : 'SOLO'
  }${cf.sandbox ? ' · SANDBOX' : ''} · ${SCEN[cf.scen].title}`;

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

  return (
    <div
      style={{
        gridColumn: '1 / span 2',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 16px',
        borderTop: '1px solid #1B283B',
        background: 'rgba(11, 18, 32, 0.45)',
        backdropFilter: 'blur(8px)',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10.5,
        color: '#8FA3B8'
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusColor
          }}
        />
        {statusText}
      </span>
      <span>{footText}</span>
      <div style={{ flex: 1 }} />
      <button
        onClick={() => setLandingDone(false)}
        style={{
          height: 22,
          padding: '0 10px',
          border: '1px solid #2A3B52',
          background: 'transparent',
          color: '#8FA3B8',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '.05em',
          borderRadius: 2,
          cursor: 'pointer'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#55DDE0';
          e.currentTarget.style.borderColor = '#55DDE0';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = '#8FA3B8';
          e.currentTarget.style.borderColor = '#2A3B52';
        }}
      >
        REPLAY LAUNCH
      </button>

      <button
        onClick={openSources}
        style={{
          height: 22,
          padding: '0 10px',
          border: '1px solid #2A3B52',
          background: 'transparent',
          color: '#55DDE0',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '.05em',
          borderRadius: 2,
          cursor: 'pointer'
        }}
      >
        NASA DATA SOURCES
      </button>
    </div>
  );
};

