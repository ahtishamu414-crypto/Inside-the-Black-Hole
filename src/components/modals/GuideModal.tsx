import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { GUIDE } from '../../sim';

export const GuideModal: React.FC = () => {
  const guideOpen = useMissionStore(s => s.guide);
  const gstep = useMissionStore(s => s.gstep);
  const closeGuide = useMissionStore(s => s.closeGuide);
  const setGuideStep = useMissionStore(s => s.setGuideStep);

  if (!guideOpen) return null;

  const gTitle = GUIDE[gstep][0];
  const gText = GUIDE[gstep][1];
  const gNext = gstep === 2 ? 'START PLAYING' : 'NEXT';

  const handleNext = () => {
    if (gstep < 2) {
      setGuideStep(gstep + 1);
    } else {
      closeGuide();
    }
  };

  const handleBack = () => {
    if (gstep > 0) {
      setGuideStep(gstep - 1);
    }
  };

  return (
    <div
      data-guide-modal="true"
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
          width: 720,
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
            HOW TO PLAY · STEP {gstep + 1} OF 3
          </span>
          <span
            onClick={closeGuide}
            style={{ cursor: 'pointer', color: '#8FA3B8', fontSize: 18 }}
          >
            ×
          </span>
        </div>

        <div style={{ fontSize: 24, fontWeight: 600 }}>{gTitle}</div>

        {gstep === 0 && (
          <div
            style={{
              height: 130,
              background: '#0B1220',
              border: '1px solid #1B283B',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 12
            }}
          >
            <div
              style={{
                flex: 1,
                border: '1px solid #2A3B52',
                borderRadius: 3,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#55DDE0'
                }}
              >
                SCENARIO
              </span>
              <span style={{ height: 4, background: '#1B283B' }} />
              <span style={{ fontSize: 11, color: '#8FA3B8' }}>Pick a goal</span>
            </div>
            <div
              style={{
                flex: 1,
                border: '1px solid #2A3B52',
                borderRadius: 3,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#55DDE0'
                }}
              >
                ROCKET
              </span>
              <span style={{ height: 4, background: '#1B283B' }} />
              <span style={{ fontSize: 11, color: '#8FA3B8' }}>
                Weight limit
              </span>
            </div>
            <div
              style={{
                flex: 1,
                border: '1px solid #2A3B52',
                borderRadius: 3,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#55DDE0'
                }}
              >
                PARTS
              </span>
              <span style={{ height: 4, background: '#1B283B' }} />
              <span style={{ fontSize: 11, color: '#8FA3B8' }}>Trade-offs</span>
            </div>
          </div>
        )}

        {gstep === 1 && (
          <div
            style={{
              height: 130,
              background: '#0B1220',
              border: '1px solid #1B283B',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 12
            }}
          >
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#000',
                border: '3px solid #FFB547'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#8FA3B8'
                }}
              >
                <span style={{ width: 50 }}>FUEL</span>
                <span style={{ width: 110, height: 5, background: '#1B283B' }}>
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: '70%',
                      background: '#FFB547'
                    }}
                  />
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#8FA3B8'
                }}
              >
                <span style={{ width: 50 }}>POWER</span>
                <span style={{ width: 110, height: 5, background: '#1B283B' }}>
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: '85%',
                      background: '#55DDE0'
                    }}
                  />
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#8FA3B8'
                }}
              >
                <span style={{ width: 50 }}>DATA</span>
                <span style={{ width: 110, height: 5, background: '#1B283B' }}>
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: '35%',
                      background: '#E8F0FA'
                    }}
                  />
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#8FA3B8'
                }}
              >
                <span style={{ width: 50 }}>SIGNAL</span>
                <span style={{ width: 110, height: 5, background: '#1B283B' }}>
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: '60%',
                      background: '#38D996'
                    }}
                  />
                </span>
              </div>
            </div>
          </div>
        )}

        {gstep === 2 && (
          <div
            style={{
              height: 130,
              background: '#0B1220',
              border: '1px solid #1B283B',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 12
            }}
          >
            <div
              style={{
                width: 210,
                border: '1px solid #FFB547',
                borderRadius: 3,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#FFB547'
                }}
              >
                EVENT · CHOOSE ONE
              </span>
              <span style={{ height: 14, border: '1px solid #2A3B52' }} />
              <span style={{ height: 14, border: '1px solid #2A3B52' }} />
              <span style={{ height: 14, border: '1px solid #2A3B52' }} />
            </div>
            <div
              style={{
                width: 190,
                border: '1px solid #2F4A63',
                borderTop: '2px solid #55DDE0',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 5
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#55DDE0'
                }}
              >
                WHY THIS MATTERS
              </span>
              <span style={{ fontSize: 11, color: '#8FA3B8' }}>
                Moving away cut radiation but used fuel.
              </span>
            </div>
          </div>
        )}

        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#C9D4E0' }}>
          {gText}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i === gstep ? '#55DDE0' : '#2A3B52'
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleBack}
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
              BACK
            </button>
            <button
              onClick={handleNext}
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
              {gNext}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

