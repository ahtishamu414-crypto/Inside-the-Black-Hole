import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { EV, EVX, CC, ROLES } from '../../sim';

export const EventModal: React.FC = () => {
  const active = useMissionStore(s => s.sim.active);
  const team = useMissionStore(s => s.sim.cfg.team);
  const crew = useMissionStore(s => s.sim.cfg.crew);
  const decide = useMissionStore(s => s.decide);

  if (!active) return null;

  const def = EV[active.code];
  const X = (EVX as any)[active.code];
  const color = active.severity === 'CRITICAL' ? CC.red : CC.amber;

  const actRoles = (Object.keys(ROLES) as (keyof typeof ROLES)[]).filter(
    k => crew[k]
  );

  return (
    <div
      data-event-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,13,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
    >
      <div
        style={{
          width: 600,
          background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
          border: `1px solid ${color}`,
          borderTop: `3px solid ${color}`,
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
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '.1em',
              color: '#8FA3B8'
            }}
          >
            {active.code} · T+{active.step}h · SIMULATION HELD
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10.5,
              padding: '3px 8px',
              border: `1px solid ${color}`,
              color,
              borderRadius: 2,
              letterSpacing: '.08em'
            }}
          >
            {active.severity}
          </div>
        </div>

        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '.05em' }}>
          {active.title}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: '8px 14px',
            fontSize: 12.5
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10.5,
              color: '#8FA3B8',
              paddingTop: 2
            }}
          >
            CAUSE
          </span>
          <span>{active.cause}</span>

          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10.5,
              color: '#8FA3B8',
              paddingTop: 2
            }}
          >
            AFFECTED
          </span>
          <span>{active.affected}</span>

          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10.5,
              color: '#8FA3B8',
              paddingTop: 2
            }}
          >
            IN PLAIN WORDS
          </span>
          <span>{X?.plain || ''}</span>

          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10.5,
              color: '#8FA3B8',
              paddingTop: 2
            }}
          >
            CREW
          </span>
          <span style={{ color: '#55DDE0' }}>
            {team
              ? 'Team mode: each crew role has a favourite option (shown below).'
              : 'Solo mode: you decide.'}
          </span>

          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10.5,
              color: '#8FA3B8',
              paddingTop: 2
            }}
          >
            STATUS
          </span>
          <span style={{ color }}>AWAITING MISSION DIRECTOR DECISION</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {def.choices.map((ch, i) => {
            const whyText = X?.why ? X.why[i] : '';
            const backers = team
              ? actRoles
                  .filter(k => X.by[i].includes(k))
                  .map(k => ROLES[k].short)
                  .join(', ') || 'none'
              : '';

            return (
              <button
                key={i}
                data-choice={i}
                onClick={() => decide(i)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  padding: '12px 14px',
                  border: '1px solid #2A3B52',
                  background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)',
                  color: '#E8F0FA',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 13
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{ch.label}</span>
                  <span style={{ fontSize: 11, color: '#8FA3B8' }}>{whyText}</span>
                  {team && (
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        color: '#55DDE0'
                      }}
                    >
                      Crew backing: {backers}
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10.5,
                    color: '#FFB547',
                    textAlign: 'right',
                    flexShrink: 0
                  }}
                >
                  {ch.fx}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

