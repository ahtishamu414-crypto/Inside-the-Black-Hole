import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { ROLES, PRIS } from '../../sim';
import { RoleKey, PriorityKey } from '../../types/simulation';

export const VoteModal: React.FC = () => {
  const voteOpen = useMissionStore(s => s.voteOpen);
  const closeVote = useMissionStore(s => s.closeVote);
  const confirmVote = useMissionStore(s => s.confirmVote);
  const crew = useMissionStore(s => s.sim.cfg.crew);
  const votes = useMissionStore(s => s.sim.cfg.votes);
  const castVote = useMissionStore(s => s.castVote);

  if (!voteOpen) return null;

  const actRoles = (Object.keys(ROLES) as RoleKey[]).filter(k => crew[k]);
  const cnt: Record<PriorityKey, number> = {
    data: 0,
    safety: 0,
    budget: 0,
    comms: 0
  };
  actRoles.forEach(k => cnt[votes[k]]++);
  const nA = actRoles.length || 1;
  const topShare = Math.max(...Object.values(cnt)) / nA;

  const voteEffect =
    actRoles.length < 2
      ? 'One crew member: no conflict, no team bonus.'
      : (topShare >= 0.5 ? 'Aligned crew: +50 points. ' : 'Split crew: −50 points. ') +
        'Each priority also adds points for how well it turns out: 1 vote for data adds ' +
        ((cnt.data / nA) * 3).toFixed(1) +
        ' points per 1% of data.';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,13,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60
      }}
    >
      <div
        style={{
          width: 680,
          maxWidth: '94vw',
          maxHeight: '92vh',
          overflow: 'auto',
          background: '#101A2A',
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
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '.1em',
            color: '#8FA3B8'
          }}
        >
          TEAM CONSENSUS · PRIORITY VOTE
        </div>
        <div style={{ fontSize: 13, color: '#C9D4E0', lineHeight: 1.5 }}>
          Each crew member backs one priority. When priorities compete, the final score
          rewards the ones the team agreed on.
        </div>

        {actRoles.map(k => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>
              {ROLES[k].name}
            </span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                border: '1px solid #2A3B52',
                borderRadius: 2
              }}
            >
              {(Object.keys(PRIS) as PriorityKey[]).map(q => {
                const on = votes[k] === q;
                return (
                  <button
                    key={q}
                    onClick={() => castVote(k, q)}
                    style={{
                      height: 30,
                      border: 'none',
                      background: on ? '#55DDE0' : 'transparent',
                      color: on ? '#080D17' : '#8FA3B8',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontWeight: on ? 600 : 400
                    }}
                  >
                    {PRIS[q]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div
          style={{
            background: '#0B1220',
            border: '1px solid #1B283B',
            borderRadius: 3,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 7
          }}
        >
          {(Object.keys(PRIS) as PriorityKey[]).map(q => {
            const count = cnt[q];
            const pct = (count / nA) * 100;
            return (
              <div
                key={q}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '190px 1fr 20px',
                  gap: 10,
                  alignItems: 'center',
                  fontSize: 11.5
                }}
              >
                <span style={{ color: '#8FA3B8' }}>{PRIS[q]}</span>
                <span style={{ height: 5, background: '#1B283B' }}>
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${pct}%`,
                      background: '#55DDE0'
                    }}
                  />
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {count}
                </span>
              </div>
            );
          })}
          <div style={{ fontSize: 12, lineHeight: 1.5, color: '#FFB547' }}>
            {voteEffect}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={closeVote}
            style={{
              height: 34,
              padding: '0 16px',
              border: '1px solid #2A3B52',
              background: 'transparent',
              color: '#E8F0FA',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '.05em',
              borderRadius: 2,
              cursor: 'pointer'
            }}
          >
            CLOSE
          </button>
          <button
            onClick={confirmVote}
            style={{
              height: 34,
              padding: '0 16px',
              border: '1px solid #55DDE0',
              background: '#55DDE0',
              color: '#080D17',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '.05em',
              borderRadius: 2,
              cursor: 'pointer'
            }}
          >
            {voteOpen === 'launch' ? 'CONFIRM & LAUNCH' : 'SAVE VOTE'}
          </button>
        </div>
      </div>
    </div>
  );
};

