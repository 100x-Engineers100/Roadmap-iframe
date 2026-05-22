'use client';

import { motion } from 'framer-motion';

interface Props {
  total?: number;
  current: number; // 1-indexed: how many dots are filled
}

export function ProgressDots({ total = 5, current }: Props) {
  return (
    <div className="flex items-center justify-center gap-[6px]">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < current;
        return (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width: filled ? 8 : 6,
              height: filled ? 8 : 6,
              backgroundColor: filled ? '#b22c11' : '#e2e2e2',
            }}
            transition={{ duration: 0.2 }}
          />
        );
      })}
    </div>
  );
}
