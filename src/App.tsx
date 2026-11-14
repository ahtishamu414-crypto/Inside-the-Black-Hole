import React, { useEffect } from 'react';
import { useMissionStore } from './store/useMissionStore';
import { soundManager } from './audio/soundManager';
import { useAnimationLoop } from './hooks/useAnimationLoop';
import { TopBar } from './components/layout/TopBar';
import { GameBar } from './components/layout/GameBar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { NasaInfoButton } from './components/common/NasaInfoButton';
import { ToastContainer } from './components/common/ToastContainer';
import { EventModal } from './components/modals/EventModal';
import { VoteModal } from './components/modals/VoteModal';
import { GuideModal } from './components/modals/GuideModal';
import { SourcesModal } from './components/modals/SourcesModal';
import { SpaceBackground } from './components/common/SpaceBackground';
import { LandingScreen } from './components/landing/LandingScreen';

import { OverviewScreen } from './screens/OverviewScreen';
import { SwarmScreen } from './screens/SwarmScreen';
import { TimeDilationScreen } from './screens/TimeDilationScreen';
import { EnvironmentalScreen } from './screens/EnvironmentalScreen';
import { GrrtScreen } from './screens/GrrtScreen';
import { SimulationScreen } from './screens/SimulationScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { OutcomeScreen } from './screens/OutcomeScreen';

import { ROLES, PRIS, CC } from './sim/constants';
import { RoleKey } from './types/simulation';

export const App: React.FC = () => {
  useAnimationLoop();

  useEffect(() => {
    (window as any).useMissionStore = useMissionStore;
    (window as any).soundManager = soundManager;

    const handleFirstGesture = () => {
      soundManager.init();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  const screen = useMissionStore((s) => s.screen);
  const sim = useMissionStore((s) => s.sim);
  const landingDone = useMissionStore((s) => s.landingDone);
  const toggleCrew = useMissionStore((s) => s.toggleCrew);
  const openVote = useMissionStore((s) => s.openVote);

  const showNasaIcon = ['overview', 'swarm', 'td', 'env', 'grrt', 'sim'].includes(screen);
  const started = sim.status !== 'READY';

  const renderScreen = () => {
    switch (screen) {
      case 'overview':
        return <OverviewScreen />;
      case 'swarm':
        return <SwarmScreen />;
      case 'td':
        return <TimeDilationScreen />;
      case 'env':
        return <EnvironmentalScreen />;
      case 'grrt':
        return <GrrtScreen />;
      case 'sim':
        return <SimulationScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'outcome':
        return <OutcomeScreen />;
      default:
        return <OverviewScreen />;
    }
  };

  return (
    <>
      {!landingDone && <LandingScreen />}
      <SpaceBackground />
      <div
        style={{
          display: 'grid',
          gridTemplateRows: '56px 40px minmax(0, 1fr) 30px',
          gridTemplateColumns: '216px minmax(0, 1fr)',
          height: '100vh',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          color: '#E8F0FA',
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: 13,
        }}
      >
        {/* Top Status Bar */}
        <TopBar />

        {/* Game Bar */}
        <GameBar />

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div
          style={{
            overflow: 'auto',
            minHeight: 0,
            backgroundColor: 'transparent',
            backgroundImage:
              'linear-gradient(rgba(85,221,224,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(85,221,224,0.022) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
        <div
          style={{
            padding: '20px 24px 40px',
            minWidth: 1180,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'relative',
          }}
        >
          {/* NASA Information Icon (screens 01-06) */}
          {showNasaIcon && <NasaInfoButton screenId={screen} />}

          {/* Team Mode Crew Banner */}
          {sim.cfg.team && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: '#101A2A',
                border: '1px solid #1B283B',
                borderRadius: 4,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10.5,
                  letterSpacing: '.08em',
                  color: '#8FA3B8',
                }}
              >
                CREW · TEAM MODE
              </span>
              {(Object.keys(ROLES) as RoleKey[]).map((k) => {
                const active = sim.cfg.crew[k];
                return (
                  <button
                    key={k}
                    title={
                      started
                        ? 'Crew locked after launch'
                        : 'Click to add or remove this crew member before launch.'
                    }
                    onClick={() => !started && toggleCrew(k)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 1,
                      padding: '5px 10px',
                      border: `1px solid ${active ? '#2F4A63' : '#1B283B'}`,
                      background: active ? 'rgba(85,221,224,0.08)' : 'transparent',
                      color: active ? CC.text : '#4E6177',
                      borderRadius: 2,
                      cursor: started ? 'default' : 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 11.5 }}>{ROLES[k].name}</span>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 9.5,
                        color: '#55DDE0',
                      }}
                    >
                      {PRIS[sim.cfg.votes[k]]}
                    </span>
                  </button>
                );
              })}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => openVote('edit')}
                style={{
                  height: 30,
                  padding: '0 12px',
                  border: '1px solid #55DDE0',
                  background: 'transparent',
                  color: '#55DDE0',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                TEAM PRIORITY VOTE
              </button>
            </div>
          )}

          {/* Active Screen */}
          {renderScreen()}
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Modals & Overlays */}
      <EventModal />
      <VoteModal />
      <GuideModal />
      <SourcesModal />
      <ToastContainer />
    </div>
    </>
  );
};
export default App;
