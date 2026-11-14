import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { DIFF, ROLES } from '../../sim';
import { DifficultyKey } from '../../types/simulation';

export const GameBar: React.FC = () => {
  const sim = useMissionStore(s => s.sim);
  const setCfg = useMissionStore(s => s.setCfg);
  const setTeam = useMissionStore(s => s.setTeam);
  const openVote = useMissionStore(s => s.openVote);
  const openGuide = useMissionStore(s => s.openGuide);

  const cf = sim.cfg;
  const started = sim.status !== 'READY';
  const actCrew = (Object.keys(ROLES) as (keyof typeof ROLES)[]).filter(
    k => cf.crew[k]
  );
  const crewText = cf.team
    ? `${actCrew.length} of 4 crew active`
    : 'Solo commander';

  const oCfg = !started ? 1 : 0.35;

  return (
    <div
      style={{
        gridColumn: '1 / span 2',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 16px',
        borderBottom: '1px solid #1B283B',
        background: '#0A101C',
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '.08em',
          color: '#4E6177'
        }}
      >
        DIFFICULTY
      </span>
      <div
        style={{
          display: 'flex',
          border: '1px solid #2A3B52',
          borderRadius: 2,
          opacity: oCfg
        }}
      >
        {(Object.keys(DIFF) as DifficultyKey[]).map(k => {
          const on = cf.diff === k;
          return (
            <button
              key={k}
              title={DIFF[k].tip}
              onClick={() => setCfg('diff', k)}
              disabled={started}
              style={{
                height: 26,
                padding: '0 12px',
                border: 'none',
                background: on ? '#55DDE0' : 'transparent',
                color: on ? '#080D17' : '#8FA3B8',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10.5,
                letterSpacing: '.04em',
                cursor: started ? 'default' : 'pointer'
              }}
            >
              {DIFF[k].label}
            </button>
          );
        })}
      </div>

      <button
        title="Sandbox: unlimited budget, fuel and rocket weight so you can experiment freely. Scores are not ranked."
        onClick={() => setCfg('sandbox', !cf.sandbox)}
        disabled={started}
        style={{
          height: 28,
          padding: '0 10px',
          border: `1px solid ${cf.sandbox ? 'rgba(255,181,71,0.6)' : '#2A3B52'}`,
          background: 'transparent',
          color: cf.sandbox ? '#FFB547' : '#8FA3B8',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10.5,
          letterSpacing: '.04em',
          borderRadius: 2,
          cursor: started ? 'default' : 'pointer',
          opacity: oCfg
        }}
      >
        SANDBOX MODE · {cf.sandbox ? 'ON' : 'OFF'}
      </button>

      <div style={{ width: 1, height: 20, background: '#1B283B' }} />

      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '.08em',
          color: '#4E6177'
        }}
      >
        CREW
      </span>

      <div
        style={{
          display: 'flex',
          border: '1px solid #2A3B52',
          borderRadius: 2,
          opacity: oCfg
        }}
      >
        {[
          { label: 'SOLO', val: false, tip: 'Play alone and make every decision yourself.' },
          {
            label: 'TEAM',
            val: true,
            tip: 'Up to 4 crew roles with competing priorities. The team votes before launch and during events.'
          }
        ].map(m => {
          const on = cf.team === m.val;
          return (
            <button
              key={m.label}
              title={m.tip}
              onClick={() => setTeam(m.val)}
              disabled={started}
              style={{
                height: 26,
                padding: '0 12px',
                border: 'none',
                background: on ? '#55DDE0' : 'transparent',
                color: on ? '#080D17' : '#8FA3B8',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10.5,
                cursor: started ? 'default' : 'pointer'
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <span
        onClick={() => cf.team && openVote('edit')}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10.5,
          color: cf.team ? '#55DDE0' : '#8FA3B8',
          whiteSpace: 'nowrap',
          cursor: cf.team ? 'pointer' : 'default',
          textDecoration: cf.team ? 'underline' : 'none'
        }}
      >
        {crewText}
      </span>

      <div style={{ flex: 1 }} />

      <button
        onClick={openGuide}
        style={{
          height: 28,
          padding: '0 12px',
          border: '1px solid #55DDE0',
          background: 'transparent',
          color: '#55DDE0',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10.5,
          letterSpacing: '.05em',
          borderRadius: 2,
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        ? HOW TO PLAY
      </button>
    </div>
  );
};

