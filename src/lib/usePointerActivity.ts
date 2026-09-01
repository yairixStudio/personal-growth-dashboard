/** True while the mouse has moved recently.
 *
 *  Content sliding under a stationary cursor also fires `mousemove`, so a small
 *  distance threshold separates real movement from the panel animating past. */
import { useEffect, useRef, useState } from 'react';

const MIN_DISTANCE_PX = 6;

export function usePointerActivity(enabled: boolean, idleMs = 2500): boolean {
  const [isActive, setIsActive] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsActive(false);
      last.current = null;
      return;
    }

    let timer = 0;

    const onMove = (event: MouseEvent) => {
      const previous = last.current;
      last.current = { x: event.clientX, y: event.clientY };
      if (previous) {
        const dx = event.clientX - previous.x;
        const dy = event.clientY - previous.y;
        if (Math.hypot(dx, dy) < MIN_DISTANCE_PX) return;
      }

      setIsActive(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIsActive(false), idleMs);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('wheel', onMove as EventListener, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('wheel', onMove as EventListener);
    };
  }, [enabled, idleMs]);

  return isActive;
}
