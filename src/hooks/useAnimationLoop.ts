import { useEffect, useRef } from 'react';
import { useMissionStore } from '../store/useMissionStore';

export function useAnimationLoop() {
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    let animId: number;

    const frame = (ts: number) => {
      const lastTs = lastTsRef.current || ts;
      const dt = Math.min(0.1, (ts - lastTs) / 1000);
      lastTsRef.current = ts;

      const store = useMissionStore.getState();

      if (store.sim.status === 'RUNNING' && !store.sim.active) {
        store.updateVt(dt * Math.min(4, store.speed));
      }

      if (store.gr.status === 'TRACING') {
        store.updateGrProgress(dt);
      }

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);
}

