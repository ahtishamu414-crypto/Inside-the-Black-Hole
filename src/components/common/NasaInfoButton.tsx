import React, { useState } from 'react';
import { NASA_SOURCES } from '../../sim/sources';

interface NasaInfoButtonProps {
  screenId: string;
}

export const NasaInfoButton: React.FC<NasaInfoButtonProps> = ({ screenId }) => {
  const url = NASA_SOURCES[screenId];
  const [open, setOpen] = useState(false);

  if (!url) return null;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ position: 'absolute', top: 4, right: 4, zIndex: 20 }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '1px solid #2A3B52',
          background: '#0B1220',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: '#8FA3B8',
          cursor: 'pointer'
        }}
      >
        i
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 18, right: 0, paddingTop: 6 }}>
          <div
            style={{
              padding: '8px 10px',
              background: '#0B1220',
              border: '1px solid #2A3B52',
              borderRadius: 3,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
            }}
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: '#55DDE0',
                textDecoration: 'none'
              }}
            >
              {url}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

