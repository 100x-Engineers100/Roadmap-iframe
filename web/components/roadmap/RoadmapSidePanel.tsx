'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { NodePanel } from './NodePanel';
import type { RoadmapNodeItem } from './roadmapUtils';

interface RoadmapSidePanelProps {
  selected: RoadmapNodeItem | null;
  total: number;
  isMobile: boolean;
  onClose: () => void;
}

export function RoadmapSidePanel({ selected, total, isMobile, onClose }: RoadmapSidePanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {selected && (
        <>
          <motion.div
            className="roadmap-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            className="roadmap-panel"
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            aria-modal="true"
            role="dialog"
          >
            <button className="panel-close" type="button" aria-label="Close panel" onClick={onClose}>
              <X size={17} />
            </button>
            <NodePanel item={selected} total={total} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
