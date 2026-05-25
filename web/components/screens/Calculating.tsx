'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FunnelShell } from '@/components/screens/FunnelShell';

const LINES = [
  'Analysing 847 task profiles...',
  'Applying 4-factor composite model...',
  'Comparing against AI capability benchmarks...',
  'Generating your risk profile...',
];

const RING_RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~226.2

interface Props {
  onComplete: () => void;
}

export function Calculating({ onComplete }: Props) {
  const [textIdx, setTextIdx] = useState(0);
  const calledRef = useRef(false);
  const prefersReduced = useReducedMotion();

  // Rotate through text lines every 1250ms
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIdx((i) => Math.min(i + 1, LINES.length - 1));
    }, 1250);
    return () => clearInterval(interval);
  }, []);

  // Fire onComplete after 5000ms minimum
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (calledRef.current) return;
      calledRef.current = true;
      await onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <FunnelShell
      current={3}
      stepLabel="Step 3 of 5"
      title="Building your AI exposure profile"
      subtitle="We are comparing your role tasks against automation, judgment, tool-use, and workflow-resilience signals."
      width="compact"
    >
      {/* Progress ring */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-8" style={{ width: 88, height: 88 }}>
          <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="#e2bfb7"
              strokeWidth="5"
            />
            {/* Fill — depletes over 5s. Skipped if user prefers reduced motion. */}
            <motion.circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="#ff6343"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: prefersReduced ? CIRCUMFERENCE : 0 }}
              animate={{ strokeDashoffset: CIRCUMFERENCE }}
              transition={prefersReduced ? { duration: 0 } : { duration: 5, ease: 'easeInOut' }}
            />
          </svg>
        </div>

        {/* Rotating text */}
        <div style={{ height: 32, overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={textIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 17,
                fontWeight: 800,
                color: '#1a1c1c',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {LINES[textIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </FunnelShell>
  );
}
