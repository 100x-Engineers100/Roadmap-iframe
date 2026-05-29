'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { RoadmapGlossaryTerm } from '@/types';

function GlossaryDefinition({ text }: { text: string }) {
  const trimmed = text.trim();
  const isBulletList = /^[-•]\s/.test(trimmed) || /\n\s*[-•]\s/.test(trimmed);
  if (isBulletList) {
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    return (
      <ul className="glossary-def-list">
        {lines.map((line, i) => (
          <li key={i}>{line.replace(/^[-•]\s+/, '')}</li>
        ))}
      </ul>
    );
  }
  return <p>{text}</p>;
}

interface RoadmapGlossaryPanelProps {
  terms: RoadmapGlossaryTerm[];
  open: boolean;
  onClose: () => void;
}

export function RoadmapGlossaryPanel({ terms, open, onClose }: RoadmapGlossaryPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="glossary-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            onClick={onClose}
          />
          <motion.aside
            className="glossary-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
            aria-labelledby="roadmap-glossary-title"
            aria-modal="true"
            role="dialog"
          >
            <button className="panel-close" type="button" aria-label="Close glossary" onClick={onClose}>
              <X size={17} />
            </button>
            <div className="glossary-body">
              <div className="glossary-heading">
                <span>Key terms</span>
                <h3 id="roadmap-glossary-title">Roadmap glossary</h3>
                <p>Short definitions for the AI workflow language used across this roadmap.</p>
              </div>
              <div className="glossary-list">
                {terms.map((term) => (
                  <article className="glossary-term" key={`${term.term}-${term.source_node_id ?? 'global'}`}>
                    <div>
                      <h4>{term.term}</h4>
                    </div>
                    <GlossaryDefinition text={term.definition} />
                  </article>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
