import React, { useRef, useEffect } from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import {
  drawBH,
  drawSwarm,
  drawGRRT,
  drawRays,
  chart,
  tdChart,
  gauge
} from '../../viz/bhViz';
import { ChartSpec } from '../../types/viz';

interface CanvasViewProps {
  kind: 'bh' | 'swarm' | 'grrt' | 'grrt-mini' | 'rays' | 'chart' | 'td' | 'gauge';
  mode?: string;
  chartSpec?: ChartSpec | null;
  gaugeSpec?: [number, string, number?];
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  kind,
  mode,
  chartSpec,
  gaugeSpec,
  className,
  style,
  onClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const cv = canvasRef.current;
      if (!cv) return;

      const store = useMissionStore.getState();
      const S = {
        r: store.sim.p.r,
        mass: store.sim.p.mass,
        markers: store.sim.p.markers,
        anchorR: Math.max(14, store.sim.p.r * 2),
        frac: {
          lost: store.sim.nodes.lost / (5000 - 160 - store.sim.p.markers),
          damaged: store.sim.nodes.damaged / (5000 - 160 - store.sim.p.markers),
          inactive: store.sim.nodes.inactive / (5000 - 160 - store.sim.p.markers)
        },
        vt: store.vt
      };

      const G = {
        mass: Math.pow(10, store.g.mass),
        cam: (store.g.cam * Math.PI) / 180,
        dist: store.g.dist,
        inc: store.g.inc,
        res: store.g.res
      };

      switch (kind) {
        case 'bh':
          drawBH(cv, S, mode);
          break;
        case 'swarm': {
          const out = { pts: [] };
          drawSwarm(
            cv,
            S,
            {
              zoom: store.zoom,
              filters: store.filters,
              layers: store.layers,
              sel: store.sel
            },
            out
          );
          store.setSwarmOut(out);
          break;
        }
        case 'grrt':
          drawGRRT(cv, G, store.split, store.grProgress, 'main');
          break;
        case 'grrt-mini':
          drawGRRT(cv, { ...G, res: 3 }, 0.5, 1, 'mini');
          break;
        case 'rays':
          drawRays(cv, store.g.rays, store.g.dist);
          break;
        case 'chart':
          if (chartSpec) chart(cv, chartSpec);
          break;
        case 'td':
          tdChart(cv, store.sim.p.r, 20);
          break;
        case 'gauge':
          if (gaugeSpec) gauge(cv, gaugeSpec[0], gaugeSpec[1], gaugeSpec[2]);
          break;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [kind, mode, chartSpec, gaugeSpec]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', ...style }}
      onClick={onClick}
    />
  );
};

