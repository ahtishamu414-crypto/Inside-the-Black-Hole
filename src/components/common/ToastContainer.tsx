import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';

export const ToastContainer: React.FC = () => {
  const toasts = useMissionStore(s => s.toasts);
  const removeToast = useMissionStore(s => s.removeToast);

  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 44,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 90,
        width: 360
      }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: '#0B1220',
            border: '1px solid #2F4A63',
            borderTop: '2px solid #55DDE0',
            borderRadius: 3,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            boxShadow: '0 6px 20px rgba(0,0,0,0.45)'
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
                fontSize: 9.5,
                letterSpacing: '.1em',
                color: '#55DDE0'
              }}
            >
              WHY THIS MATTERS
            </span>
            <span
              onClick={() => removeToast(t.id)}
              style={{
                cursor: 'pointer',
                color: '#8FA3B8',
                fontSize: 14,
                lineHeight: 1
              }}
            >
              ×
            </span>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: '#E8F0FA' }}>
            {t.text}
          </div>
        </div>
      ))}
    </div>
  );
};

