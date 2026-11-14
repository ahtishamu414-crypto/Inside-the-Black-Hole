import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { NASA_SOURCES_LIST } from '../../sim/sources';

export const SourcesModal: React.FC = () => {
  const sourcesOpen = useMissionStore(s => s.sources);
  const closeSources = useMissionStore(s => s.closeSources);

  if (!sourcesOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,13,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 70
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth: '94vw',
          maxHeight: '92vh',
          overflow: 'auto',
          background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
          border: '1px solid #2A3B52',
          borderTop: '3px solid #55DDE0',
          borderRadius: 4,
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '.1em',
              color: '#8FA3B8'
            }}
          >
            NASA DATA SOURCES
          </span>
          <span
            onClick={closeSources}
            style={{ cursor: 'pointer', color: '#8FA3B8', fontSize: 18 }}
          >
            ×
          </span>
        </div>

        {NASA_SOURCES_LIST.map((s, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              paddingBottom: 10,
              borderBottom: '1px solid #1B283B'
            }}
          >
            <span style={{ fontSize: 11.5, color: '#8FA3B8' }}>{s.label}</span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: '#55DDE0',
                textDecoration: 'none'
              }}
            >
              {s.url}
            </a>
          </div>
        ))}

        <div style={{ fontSize: 11.5, color: '#8FA3B8' }}>
          Educational simulation. Values are modeled, not NASA telemetry.
        </div>
      </div>
    </div>
  );
};

