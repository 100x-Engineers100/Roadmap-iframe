'use client';

import { useState, useEffect } from 'react';

export function useCountUp(target: number, duration = 2000, enabled = true): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || target === 0) return;

    let frameId: number;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, enabled]);

  return count;
}
