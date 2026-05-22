'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

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
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: '#1a1c1c' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Progress ring */}
      <div className="relative mb-8" style={{ width: 72, height: 72 }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            stroke="#2f3131"
            strokeWidth="4"
          />
          {/* Fill — depletes over 5s. Skipped if user prefers reduced motion. */}
          <motion.circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            stroke="#ff6343"
            strokeWidth="4"
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
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              color: 'white',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {LINES[textIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
