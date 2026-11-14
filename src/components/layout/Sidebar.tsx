import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { ScreenId } from '../../types/ui';

export const Sidebar: React.FC = () => {
  const currentScreen = useMissionStore(s => s.screen);
  const setScreen = useMissionStore(s => s.setScreen);
  const outcome = useMissionStore(s => s.sim.outcome);
  const mission = useMissionStore(s => s.sim.mission);

  const opsNav: [ScreenId, string, string][] = [
    ['overview', '01', 'Mission Overview'],
    ['swarm', '02', 'Swarm Network'],
    ['td', '03', 'Time Dilation Monitoring'],
    ['env', '04', 'Environmental Analysis'],
    ['grrt', '05', 'GRRT Imaging Laboratory'],
    ['sim', '06', 'Mission Simulation']
  ];

  const postNav: [ScreenId, string, string][] = [
    ['analytics', '07', 'Mission Analytics']
  ];
  if (outcome) {
    postNav.push(['outcome', '08', 'Mission Outcome']);
  }

  const renderItem = ([id, n, label]: [ScreenId, string, string]) => {
    const on = currentScreen === id;
    return (
      <div
        key={id}
        data-nav={id}
        onClick={() => setScreen(id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 16px 9px 13px',
          borderLeft: `3px solid ${on ? '#55DDE0' : 'transparent'}`,
          background: on ? 'rgba(85,221,224,0.08)' : 'transparent',
          color: on ? '#E8F0FA' : '#8FA3B8',
          cursor: 'pointer',
          fontSize: 12.5
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: on ? '#55DDE0' : '#4E6177'
          }}
        >
          {n}
        </span>
        {label}
      </div>
    );
  };

  return (
    <div
      style={{
        borderRight: '1px solid #1B283B',
        background: '#0A101C',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 0',
        minHeight: 0,
        overflow: 'auto'
      }}
    >
      <div
        style={{
          padding: '0 16px 8px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9.5,
          letterSpacing: '.1em',
          color: '#4E6177'
        }}
      >
        OPERATIONS
      </div>
      {opsNav.map(renderItem)}

      <div
        style={{
          padding: '18px 16px 8px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9.5,
          letterSpacing: '.1em',
          color: '#4E6177'
        }}
      >
        POST-MISSION
      </div>
      {postNav.map(renderItem)}

      <div style={{ flex: 1 }} />

      <div
        style={{
          margin: '12px 14px 0',
          padding: 10,
          border: '1px solid #1B283B',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9.5,
            letterSpacing: '.08em',
            color: '#8FA3B8'
          }}
        >
          RUN {mission} · STEP = 1 h
        </div>
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.45,
            color: '#8FA3B8'
          }}
        >
          Educational mission-design simulator. Not a real spacecraft control system.
        </div>
      </div>
    </div>
  );
};

