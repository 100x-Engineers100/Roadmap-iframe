'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { JourneyAnalogy } from '@/types';
import { NodePanel } from './NodePanel';
import { DEPTH_STYLE, type RoadmapNodeItem } from './roadmapUtils';

interface RoadmapSidePanelProps {
  selected: RoadmapNodeItem | null;
  isMobile: boolean;
  journeyAnalogy?: JourneyAnalogy;
  onClose: () => void;
}

function ProjectPanel({ item }: { item: RoadmapNodeItem }) {
  const checkpoint = item.node.panel?.checkpoint;
  const depth = DEPTH_STYLE[item.node.depth];

  return (
    <div className="panel-body">
      <section className="panel-section panel-explanation">
        <div className="panel-section-header">
          <div>
            <div className="section-title">Project</div>
            <h3>{item.node.name_plain}</h3>
          </div>
          <span className="depth-pill" style={{ color: depth.color, background: depth.bg }}>
            {depth.label}
          </span>
        </div>
        <p className="panel-lede">{item.node.one_line_desc}</p>
      </section>

      {checkpoint && (
        <>
          <section className="panel-section">
            <div className="section-title">Scenario</div>
            <p className="panel-lede">{checkpoint.scenario}</p>
          </section>

          <section className="checkpoint-box">
            <div className="section-title">Tasks</div>
            <ul>
              {checkpoint.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </section>

          <section className="panel-section">
            <div className="section-title">Success criteria</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--color-muted)', fontSize: 13, lineHeight: 1.55 }}>
              {checkpoint.done_when.map((criterion, i) => (
                <li key={i}>{criterion}</li>
              ))}
            </ul>
          </section>

          <section className="panel-section">
            <div className="section-title">Deliverable</div>
            <p className="panel-lede">{checkpoint.artifact_to_create}</p>
          </section>

          {checkpoint.confidence_check && (
            <section className="panel-section">
              <div className="section-title">Confidence check</div>
              <p className="panel-lede">{checkpoint.confidence_check}</p>
            </section>
          )}

          {checkpoint.tools && checkpoint.tools.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div className="tool-pills">
                {checkpoint.tools.map(t => <span className="tool-pill" key={t}>{t}</span>)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function RoadmapSidePanel({ selected, isMobile, journeyAnalogy, onClose }: RoadmapSidePanelProps) {
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
            {selected.node.node_kind === 'project'
              ? <ProjectPanel item={selected} />
              : <NodePanel item={selected} journeyAnalogy={journeyAnalogy} />
            }
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
