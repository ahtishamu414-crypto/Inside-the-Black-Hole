import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { OutcomeAnalysisItem, OutcomeCriticalItem, OutcomeObjective, OutcomeStat } from '../types/simulation';

export const OutcomeScreen: React.FC = () => {
  const sim = useMissionStore((s) => s.sim);
  const setScreen = useMissionStore((s) => s.setScreen);
  const resetTo = useMissionStore((s) => s.resetTo);
  const outcome = sim.outcome;

  if (!outcome) {
    return (
      <div data-screen-label="08 Mission Outcome" style={{ padding: 40, textAlign: 'center', color: '#8FA3B8' }}>
        No mission outcome available yet. Complete a mission run to view results.
      </div>
    );
  }

  const goAnalytics = () => setScreen('analytics');
  const nextMission = () => resetTo(sim.mission + 1, 'sim');
  const restart = () => resetTo(sim.mission, 'sim');
  const mainMenu = () => resetTo(sim.mission, 'overview');

  return (
    <div data-screen-label="08 Mission Outcome" style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
      {outcome.success ? (
        <div
          style={{
            width: 760,
            background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56,217,150,0.5)',
            borderTop: '3px solid #38D996',
            borderRadius: 4,
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.1em', color: '#38D996' }}>
              RUN {sim.mission} · T+{outcome.step}h
            </div>
            <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '.06em', color: '#38D996' }}>
              MISSION ACCOMPLISHED
            </div>
            <div style={{ fontSize: 13.5, color: '#C9D4E0' }}>{outcome.reason}</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {outcome.stats.map((s: OutcomeStat, idx: number) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)',
                  border: '1px solid #1B283B',
                  borderRadius: 3,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#8FA3B8', letterSpacing: '.06em' }}>
                  {s.k}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20 }}>{s.v}</span>
              </div>
            ))}
          </div>

          {/* Objectives and Mission Score */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.08em', color: '#8FA3B8' }}>
                SCIENTIFIC OBJECTIVES
              </div>
              {outcome.objectives.map((o: OutcomeObjective, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: o.c }}>{o.mark}</span>
                  <span>{o.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.08em', color: '#8FA3B8' }}>
                MISSION SCORE
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 40, color: '#38D996' }}>
                {outcome.score}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                SCIENTIFIC RATING · {outcome.rating}
              </div>
            </div>
          </div>

          {/* Post-Mission Analysis */}
          <div
            style={{
              background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)',
              border: '1px solid #1B283B',
              borderRadius: 3,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.08em', color: '#8FA3B8' }}>
              POST-MISSION ANALYSIS
            </div>
            {outcome.analysis.map((a: OutcomeAnalysisItem, idx: number) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10, fontSize: 12.5, lineHeight: 1.5 }}>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '.06em',
                    color: a.c,
                    paddingTop: 2,
                  }}
                >
                  {a.k}
                </span>
                <span style={{ color: '#E8F0FA' }}>{a.v}</span>
              </div>
            ))}
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10.5,
                color: '#8FA3B8',
                borderTop: '1px solid #1B283B',
                paddingTop: 8,
              }}
            >
              {outcome.breakdown}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={goAnalytics}
              style={{
                height: 38,
                padding: '0 18px',
                border: '1px solid #38D996',
                background: '#38D996',
                color: '#080D17',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '.06em',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              VIEW ANALYTICS
            </button>
            <button
              onClick={nextMission}
              style={{
                height: 38,
                padding: '0 18px',
                border: '1px solid #38D996',
                background: 'transparent',
                color: '#38D996',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11.5,
                letterSpacing: '.06em',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              NEXT MISSION
            </button>
            <button
              onClick={mainMenu}
              style={{
                height: 38,
                padding: '0 18px',
                border: '1px solid #2A3B52',
                background: 'transparent',
                color: '#E8F0FA',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11.5,
                letterSpacing: '.06em',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              RETURN TO MAIN MENU
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            width: 760,
            background: 'rgba(16, 26, 42, 0.38)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,92,100,0.5)',
            borderTop: '3px solid #FF5C64',
            borderRadius: 4,
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.1em', color: '#FF5C64' }}>
              RUN {sim.mission} · T+{outcome.step}h
            </div>
            <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '.06em', color: '#FF5C64' }}>
              MISSION FAILED
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.08em', color: '#8FA3B8', marginTop: 6 }}>
              FAILURE REASON
            </div>
            <div style={{ fontSize: 14, color: '#E8F0FA' }}>{outcome.reason}</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {outcome.stats.map((s: OutcomeStat, idx: number) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)',
                  border: '1px solid #1B283B',
                  borderRadius: 3,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#8FA3B8', letterSpacing: '.06em' }}>
                  {s.k}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20 }}>{s.v}</span>
              </div>
            ))}
          </div>

          {/* Critical Events */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.08em', color: '#8FA3B8' }}>
              CRITICAL EVENT HISTORY
            </div>
            {outcome.critical.map((c: OutcomeCriticalItem, idx: number) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 10, fontSize: 12 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#FF5C64' }}>{c.t}</span>
                <span style={{ color: '#C9D4E0' }}>{c.text}</span>
              </div>
            ))}
            {outcome.critical.length === 0 && (
              <div style={{ fontSize: 12, color: '#4E6177' }}>No critical events recorded before termination.</div>
            )}
          </div>

          {/* Post-Mission Analysis */}
          <div
            style={{
              background: 'rgba(11, 18, 32, 0.32)', backdropFilter: 'blur(8px)',
              border: '1px solid #1B283B',
              borderRadius: 3,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.08em', color: '#8FA3B8' }}>
              POST-MISSION ANALYSIS
            </div>
            {outcome.analysis.map((a: OutcomeAnalysisItem, idx: number) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10, fontSize: 12.5, lineHeight: 1.5 }}>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '.06em',
                    color: a.c,
                    paddingTop: 2,
                  }}
                >
                  {a.k}
                </span>
                <span style={{ color: '#E8F0FA' }}>{a.v}</span>
              </div>
            ))}
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10.5,
                color: '#8FA3B8',
                borderTop: '1px solid #1B283B',
                paddingTop: 8,
              }}
            >
              {outcome.breakdown}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={goAnalytics}
              style={{
                height: 38,
                padding: '0 18px',
                border: '1px solid #FF5C64',
                background: '#FF5C64',
                color: '#080D17',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '.06em',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              REVIEW FAILURE
            </button>
            <button
              onClick={restart}
              style={{
                height: 38,
                padding: '0 18px',
                border: '1px solid #FF5C64',
                background: 'transparent',
                color: '#FF5C64',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11.5,
                letterSpacing: '.06em',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              RESTART SIMULATION
            </button>
            <button
              onClick={mainMenu}
              style={{
                height: 38,
                padding: '0 18px',
                border: '1px solid #2A3B52',
                background: 'transparent',
                color: '#E8F0FA',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11.5,
                letterSpacing: '.06em',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              RETURN TO MAIN MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
